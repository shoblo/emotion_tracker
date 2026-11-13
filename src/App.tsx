import { useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import Scene from "./components/Scene";
import { configError, supabase } from "./lib/supabase";
import type { EntryDraft, Role } from "./lib/types";
import History from "./pages/History";
import Insights from "./pages/Insights";
import Login from "./pages/Login";
import RecordPage from "./pages/Record";
import Review from "./pages/Review";
import { useEntries } from "./lib/useEntries";

type Tab = "record" | "history" | "insights";

/** Loads the history fresh each time a tab is opened, then renders it. */
function Browse({ tab }: { tab: "history" | "insights" }) {
  const { entries, error, reload } = useEntries();
  if (error) {
    return (
      <div className="card stack">
        <p className="note note--err" role="alert">{error}</p>
        <button type="button" className="btn btn--blue" onClick={reload}>Try again</button>
      </div>
    );
  }
  if (!entries) return <Notice>Loading…</Notice>;
  return tab === "history" ? <History entries={entries} /> : <Insights entries={entries} />;
}

function Tabs({ tabs, tab, onChange }: { tabs: Array<[Tab, string]>; tab: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav className="tabs" aria-label="Sections">
      {tabs.map(([id, label]) => (
        <button key={id} type="button" aria-current={tab === id ? "page" : undefined} onClick={() => onChange(id)}>
          {label}
        </button>
      ))}
    </nav>
  );
}

type Screen =
  | { name: "record" }
  | { name: "review"; draft: EntryDraft; replaces: boolean };

function Shell({ children, onSignOut }: { children: ReactNode; onSignOut?: () => void }) {
  return (
    <>
      <Scene />
      <div className="page">
        <div className="topbar">
          {onSignOut && (
            <button type="button" onClick={onSignOut} className="pill-link">
              Sign out
            </button>
          )}
        </div>
        <div className="sign-wrap">
          <h1 className="sign">
            Daily Check-in <span className="heart" aria-hidden="true">♥</span>
          </h1>
        </div>
        {children}
      </div>
    </>
  );
}

function Notice({ children }: { children: ReactNode }) {
  return <div className="card lead">{children}</div>;
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [role, setRole] = useState<Role | null>(null);
  const [roleLoaded, setRoleLoaded] = useState(false);
  const [screen, setScreen] = useState<Screen>({ name: "record" });
  const [tab, setTab] = useState<Tab>("record");

  const userId = session?.user.id ?? null;

  useEffect(() => {
    if (configError) {
      setReady(true);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) {
      setRole(null);
      setRoleLoaded(false);
      return;
    }
    let cancelled = false;
    supabase
      .from("profiles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        const r = data?.role;
        setRole(r === "parent" || r === "teacher" ? r : null);
        setRoleLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const signOut = () => {
    setScreen({ name: "record" });
    setTab("record");
    void supabase.auth.signOut();
  };

  if (configError) {
    return (
      <Shell>
        <Notice>{configError}</Notice>
      </Shell>
    );
  }
  if (!ready) {
    return (
      <Shell>
        <Notice>Loading…</Notice>
      </Shell>
    );
  }
  if (!session) {
    return (
      <Shell>
        <Login />
      </Shell>
    );
  }
  if (!roleLoaded) {
    return (
      <Shell onSignOut={signOut}>
        <Notice>Loading…</Notice>
      </Shell>
    );
  }
  if (role === null) {
    return (
      <Shell onSignOut={signOut}>
        <Notice>This account has no role yet. Please ask the parent to check your account.</Notice>
      </Shell>
    );
  }
  if (role === "teacher") {
    const t: Tab = tab === "insights" ? "insights" : "history";
    return (
      <Shell onSignOut={signOut}>
        <Tabs tabs={[["history", "History"], ["insights", "Insights"]]} tab={t} onChange={setTab} />
        <Browse key={t} tab={t} />
      </Shell>
    );
  }

  return (
    <Shell onSignOut={signOut}>
      <Tabs tabs={[["record", "Record"], ["history", "History"], ["insights", "Insights"]]} tab={tab} onChange={setTab} />
      {/* Kept mounted (just hidden) so a half-written report isn't lost when you peek at History. */}
      <div hidden={tab !== "record"}>
        {screen.name === "record" ? (
          <RecordPage
            onAnalyzed={(draft, replaces) => setScreen({ name: "review", draft, replaces })}
            onOpenExisting={(draft) => setScreen({ name: "review", draft, replaces: true })}
          />
        ) : (
          <Review
            key={screen.draft.entry_date + screen.draft.transcript_original.length}
            draft={screen.draft}
            replacesExisting={screen.replaces}
            onSaved={() => setScreen({ name: "record" })}
            onBack={() => setScreen({ name: "record" })}
          />
        )}
      </div>
      {tab !== "record" && <Browse key={tab} tab={tab} />}
    </Shell>
  );
}
