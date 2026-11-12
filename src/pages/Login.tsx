import { useState, type FormEvent } from "react";
import { supabase } from "../lib/supabase";
import Pets from "../components/Pets";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (err) setError("Sign-in failed. Check your email and password.");
    setBusy(false);
  }

  return (
    <>
      <Pets className="pets pets--perch bob" />
      <form onSubmit={submit} className="card card--wood stack">
        <p className="lead">Sign in with the email and password you were given.</p>
        <label className="label">
          Email
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
          />
        </label>
        <label className="label">
          Password
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
          />
        </label>
        {error && (
          <p className="note note--err" role="alert">
            {error}
          </p>
        )}
        <button type="submit" disabled={busy} className="btn btn--blue">
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </>
  );
}
