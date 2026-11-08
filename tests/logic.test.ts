// Run with: node --test tests/   (Node 22.18+ runs .ts files directly)
import test from "node:test";
import assert from "node:assert/strict";
import { computeMood } from "../src/lib/moodRules.ts";
import { normalizeAnalysis as clientNormalize, parseTriggerInput } from "../src/lib/analysis.ts";

// ---------- colour rule ----------
test("picked up early is always red", () => {
  assert.equal(computeMood({ picked_up_early: true, had_incident: false, had_meltdown: false }), "red");
  assert.equal(computeMood({ picked_up_early: true, had_incident: true, had_meltdown: true }), "red");
});
test("incident or meltdown without pick-up is yellow", () => {
  assert.equal(computeMood({ picked_up_early: false, had_incident: true, had_meltdown: false }), "yellow");
  assert.equal(computeMood({ picked_up_early: false, had_incident: false, had_meltdown: true }), "yellow");
});
test("nothing happened is green", () => {
  assert.equal(computeMood({ picked_up_early: false, had_incident: false, had_meltdown: false }), "green");
});

// ---------- client-side validation ----------
const good = {
  transcript_en: "He cried after lunch but stayed all day.",
  picked_up_early: false,
  had_incident: true,
  had_meltdown: false,
  incident_details_en: "Cried after lunch.",
  triggers: ["Lunch Time", "lunch time", " noise ", 5, ""],
  teacher_feedback_en: "",
  summary_en: "Upset after lunch, stayed all day.",
};

test("client normalize: accepts good output and cleans triggers", () => {
  const a = clientNormalize(good);
  assert.deepEqual(a.triggers, ["lunch time", "noise"]);
  assert.equal(a.had_incident, true);
});
test("client normalize: meltdown forces incident, pickup forces incident", () => {
  assert.equal(clientNormalize({ ...good, had_incident: false, had_meltdown: true }).had_incident, true);
  assert.equal(clientNormalize({ ...good, had_incident: false, picked_up_early: true }).had_incident, true);
});
test("client normalize: rejects missing or wrongly typed required fields", () => {
  assert.throws(() => clientNormalize(null));
  assert.throws(() => clientNormalize([]));
  assert.throws(() => clientNormalize({ ...good, picked_up_early: "true" }));
  const { transcript_en: _t, ...missing } = good;
  assert.throws(() => clientNormalize(missing));
});
test("trigger input parsing", () => {
  assert.deepEqual(parseTriggerInput("noise, lunch time ,Noise;tiredness\n"), ["noise", "lunch time", "tiredness"]);
  assert.deepEqual(parseTriggerInput(""), []);
  assert.equal(parseTriggerInput("a,b,c,d,e,f,g,h,i,j").length, 8);
});

// ---------- Edge Function (Deno stubbed so the same file can be loaded in Node) ----------
const env: Record<string, string> = {
  SUPABASE_URL: "https://proj.supabase.co",
  ANTHROPIC_API_KEY: "test-key",
};
(globalThis as any).Deno = { serve: () => undefined, env: { get: (k: string) => env[k] } };
const edge = await import("../supabase/functions/analyze-entry/index.ts");

type Call = { url: string; init: RequestInit };
let calls: Call[] = [];
let parentAnswer: unknown = true;
let claudeQueue: Array<{ status: number; body: unknown }> = [];

(globalThis as any).fetch = async (url: string, init: RequestInit) => {
  calls.push({ url, init });
  if (url.includes("/rest/v1/rpc/is_parent")) {
    return new Response(JSON.stringify(parentAnswer), { status: 200 });
  }
  if (url === "https://api.anthropic.com/v1/messages") {
    const next = claudeQueue.shift();
    if (!next) throw new Error("unexpected Claude call");
    return new Response(JSON.stringify(next.body), { status: next.status });
  }
  throw new Error("unexpected fetch " + url);
};

function claudeOk(textOut: string, extra: Record<string, unknown> = {}) {
  return {
    status: 200,
    body: {
      stop_reason: "end_turn",
      content: [
        { type: "thinking", thinking: "", signature: "sig" },
        { type: "text", text: textOut },
      ],
      ...extra,
    },
  };
}

function request(body: unknown, headers: Record<string, string> = { Authorization: "Bearer jwt", apikey: "pub" }) {
  return new Request("https://proj.supabase.co/functions/v1/analyze-entry", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

function reset() {
  calls = [];
  parentAnswer = true;
  claudeQueue = [];
}

test("edge: extractJson handles fences and preamble", () => {
  assert.deepEqual(edge.extractJson('```json\n{"a":1}\n```'), { a: 1 });
  assert.deepEqual(edge.extractJson('Here you go: {"a":{"b":2}} thanks'), { a: { b: 2 } });
  assert.throws(() => edge.extractJson("no json here"));
});

test("edge: happy path returns validated analysis and sends a correct Haiku 5.5 request", async () => {
  reset();
  claudeQueue.push(claudeOk("```json\n" + JSON.stringify(good) + "\n```"));
  const res = await edge.handle(request({ text: "今天他午饭后哭了", language: "zh" }));
  assert.equal(res.status, 200);
  const json = (await res.json()) as { analysis: { triggers: string[] } };
  assert.deepEqual(json.analysis.triggers, ["lunch time", "noise"]);

  const claude = calls.find((c) => c.url.includes("anthropic.com"))!;
  const sent = JSON.parse(String(claude.init.body));
  assert.equal(sent.model, "claude-haiku-5-5");
  assert.ok(!("temperature" in sent) && !("top_p" in sent) && !("top_k" in sent), "sampling params must be absent");
  assert.equal(sent.messages.at(-1).role, "user", "must end with a user turn (no prefill)");
  assert.ok(sent.max_tokens >= 2000);
  const headers = claude.init.headers as Record<string, string>;
  assert.equal(headers["x-api-key"], "test-key");
  assert.equal(headers["anthropic-version"], "2023-06-01");
  assert.match(sent.messages[0].content, /今天他午饭后哭了/);
  // the role check was done with the caller's own credentials
  const rpc = calls.find((c) => c.url.includes("is_parent"))!;
  assert.equal((rpc.init.headers as Record<string, string>).Authorization, "Bearer jwt");
});

test("edge: non-parent is refused and Claude is never called", async () => {
  reset();
  parentAnswer = false;
  const res = await edge.handle(request({ text: "hi" }));
  assert.equal(res.status, 403);
  assert.ok(!calls.some((c) => c.url.includes("anthropic.com")));
});

test("edge: missing credentials, empty text, long text, bad JSON", async () => {
  reset();
  assert.equal((await edge.handle(request({ text: "x" }, {}))).status, 401);
  assert.equal((await edge.handle(request({ text: "   " }))).status, 400);
  assert.equal((await edge.handle(request({ text: "x".repeat(6001) }))).status, 400);
  assert.equal((await edge.handle(request("{not json"))).status, 400);
  assert.ok(!calls.some((c) => c.url.includes("anthropic.com")));
});

test("edge: CORS preflight and wrong method", async () => {
  reset();
  const pre = await edge.handle(new Request("https://x/y", { method: "OPTIONS" }));
  assert.equal(pre.status, 204);
  assert.ok(pre.headers.get("Access-Control-Allow-Headers")!.includes("apikey"));
  assert.equal((await edge.handle(new Request("https://x/y", { method: "GET" }))).status, 405);
});

test("edge: refusal, garbage output and upstream errors become clear errors", async () => {
  reset();
  claudeQueue.push({ status: 200, body: { stop_reason: "refusal", content: [] } });
  assert.equal((await edge.handle(request({ text: "hi" }))).status, 422);

  claudeQueue.push(claudeOk("Sorry, I cannot do that."));
  assert.equal((await edge.handle(request({ text: "hi" }))).status, 502);

  claudeQueue.push(claudeOk(JSON.stringify({ ...good, picked_up_early: "yes" })));
  assert.equal((await edge.handle(request({ text: "hi" }))).status, 502);

  claudeQueue.push({ status: 529, body: { error: { message: "Overloaded" } } });
  const res = await edge.handle(request({ text: "hi" }));
  assert.equal(res.status, 502);
  assert.match(((await res.json()) as { message: string }).message, /Overloaded/);
});

test("edge: retries once without output_config if effort is rejected", async () => {
  reset();
  claudeQueue.push({ status: 400, body: { error: { message: "output_config.effort: invalid value" } } });
  claudeQueue.push(claudeOk(JSON.stringify(good)));
  const res = await edge.handle(request({ text: "hi" }));
  assert.equal(res.status, 200);
  const claudeCalls = calls.filter((c) => c.url.includes("anthropic.com"));
  assert.equal(claudeCalls.length, 2);
  assert.ok("output_config" in JSON.parse(String(claudeCalls[0].init.body)));
  assert.ok(!("output_config" in JSON.parse(String(claudeCalls[1].init.body))));
});

test("edge: a 400 unrelated to effort is not retried", async () => {
  reset();
  claudeQueue.push({ status: 400, body: { error: { message: "messages: invalid" } } });
  const res = await edge.handle(request({ text: "hi" }));
  assert.equal(res.status, 502);
  assert.equal(calls.filter((c) => c.url.includes("anthropic.com")).length, 1);
});

test("edge: missing server secret is reported", async () => {
  reset();
  const saved = env.ANTHROPIC_API_KEY;
  delete env.ANTHROPIC_API_KEY;
  assert.equal((await edge.handle(request({ text: "hi" }))).status, 500);
  env.ANTHROPIC_API_KEY = saved;
});
