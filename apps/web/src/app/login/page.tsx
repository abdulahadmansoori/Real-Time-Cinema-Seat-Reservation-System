"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/AuthProvider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { useTheme } from "@/features/theme/ThemeProvider";

export default function LoginPage() {
  const { login, register } = useAuth();
  const { theme, toggle } = useTheme();
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("user@cinema.local");
  const [password, setPassword] = useState("User1234!");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (mode === "login") await login(email, password);
      else await register(email, password);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Auth failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <button type="button" className="theme" onClick={toggle}>
        {theme === "light" ? "☾" : "☀"}
      </button>
      <Card title="Cinema" subtitle="Sign in to reserve seats in real time">
        <form onSubmit={onSubmit} className="form">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error ? <p className="err">{error}</p> : null}
          <Button type="submit" loading={loading}>
            {mode === "login" ? "Login" : "Create account"}
          </Button>
          <button
            type="button"
            className="switch"
            onClick={() =>
              setMode((m) => (m === "login" ? "register" : "login"))
            }
          >
            {mode === "login"
              ? "Need an account? Register"
              : "Have an account? Login"}
          </button>
          <p className="hint">
            Demo: user@cinema.local / User1234! · admin@cinema.local / Admin123!
          </p>
        </form>
      </Card>
      <style jsx>{`
        .page {
          min-height: 100vh;
          display: grid;
          place-items: center;
          padding: 1.5rem;
          background:
            radial-gradient(
              circle at top right,
              var(--accent-soft),
              transparent 40%
            ),
            var(--bg);
        }
        .theme {
          position: fixed;
          top: 1rem;
          right: 1rem;
          border: 1px solid var(--border);
          background: var(--bg-elevated);
          border-radius: 999px;
          width: 40px;
          height: 40px;
          cursor: pointer;
        }
        .form {
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
          min-width: min(100%, 360px);
        }
        .err {
          color: var(--danger);
          margin: 0;
        }
        .switch {
          background: none;
          border: none;
          color: var(--accent);
          cursor: pointer;
          text-align: left;
          padding: 0;
        }
        .hint {
          font-size: 0.8rem;
          color: var(--text-muted);
          margin: 0;
        }
      `}</style>
    </div>
  );
}
