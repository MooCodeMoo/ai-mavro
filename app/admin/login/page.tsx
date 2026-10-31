"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { jsonRequest } from "@/lib/client";
export default function Login() {
  const router = useRouter();
  const [password, setPassword] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <main className="login-page">
      <form
        className="card"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          try {
            await jsonRequest("/api/session", { password });
            router.push("/admin");
          } catch (e) {
            setError(e instanceof Error ? e.message : "Prijava ni uspela");
          } finally {
            setBusy(false);
          }
        }}
      >
        <span className="eyebrow">MAVRO AI</span>
        <h1>Administracija</h1>
        <p>Zaseben pregled primerov in strokovnih pravil.</p>
        <label htmlFor="password">Geslo</label>
        <input
          id="password"
          name="password"
          autoComplete="current-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          maxLength={256}
          required
        />
        <button className="primary" disabled={busy}>
          {busy ? "Prijava…" : "Prijava"}
        </button>
        {error && (
          <p role="alert" className="notice">
            {error}
          </p>
        )}
        <Link href="/">Nazaj na svetovalca</Link>
      </form>
    </main>
  );
}
