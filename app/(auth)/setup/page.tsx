"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bot, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

export default function SetupPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [done, setDone]         = useState(false);

  useEffect(() => {
    fetch("/api/auth/setup")
      .then((r) => r.json())
      .then((data) => {
        if (!data.needsSetup) router.replace("/login");
        else setChecking(false);
      })
      .catch(() => setChecking(false));
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Setup failed");
      setDone(true);
      setTimeout(() => router.push("/login"), 1800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Setup failed");
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-background)" }}>
        <Loader2 size={24} className="animate-spin" style={{ color: "var(--color-text-secondary)" }} />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "var(--color-background)" }}
    >
      <div className="w-full max-w-sm px-4">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="flex items-center justify-center mb-3"
            style={{
              background: "linear-gradient(135deg, var(--color-accent), var(--color-text-secondary))",
              borderRadius: "16px",
              width: "52px",
              height: "52px",
            }}
          >
            <Bot size={24} color="white" />
          </div>
          <h1 className="text-xl font-semibold" style={{ color: "var(--color-text)" }}>
            Welcome to Playground
          </h1>
          <p className="text-sm mt-1 text-center" style={{ color: "var(--color-muted)", maxWidth: "260px" }}>
            Create your admin account to get started. This screen appears only once.
          </p>
        </div>

        {done ? (
          <div
            className="glass-card p-6 flex flex-col items-center gap-3 animate-fade-in"
            style={{ borderColor: "rgba(52,211,153,0.3)" }}
          >
            <CheckCircle2 size={32} style={{ color: "var(--color-green)" }} />
            <p className="font-semibold" style={{ color: "var(--color-text)" }}>Admin account created!</p>
            <p className="text-sm" style={{ color: "var(--color-muted)" }}>Redirecting to login…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="glass-card p-6 flex flex-col gap-4">
            {error && (
              <div
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg"
                style={{ background: "var(--color-red-dim)", border: "1px solid rgba(248,113,113,0.2)" }}
              >
                <AlertCircle size={14} style={{ color: "var(--color-red)" }} />
                <p className="text-[13px]" style={{ color: "var(--color-red)" }}>{error}</p>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium" style={{ color: "var(--color-muted)" }}>
                Name <span style={{ color: "var(--color-muted)", fontWeight: 400 }}>(optional)</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="glass-input px-3 py-2.5 text-sm w-full"
                style={{ color: "var(--color-text)" }}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium" style={{ color: "var(--color-muted)" }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@company.com"
                required
                autoFocus
                className="glass-input px-3 py-2.5 text-sm w-full"
                style={{ color: "var(--color-text)" }}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium" style={{ color: "var(--color-muted)" }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                required
                className="glass-input px-3 py-2.5 text-sm w-full"
                style={{ color: "var(--color-text)" }}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium" style={{ color: "var(--color-muted)" }}>
                Confirm password
              </label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repeat password"
                required
                className="glass-input px-3 py-2.5 text-sm w-full"
                style={{ color: "var(--color-text)" }}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !email || !password || !confirm}
              className="btn-primary flex items-center justify-center gap-2 py-2.5 mt-1"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : null}
              {loading ? "Creating account..." : "Create Admin Account"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
