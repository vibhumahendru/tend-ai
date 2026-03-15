"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

type Tab = "signin" | "signup";

export default function LoginPage() {
  const { session, loading, signIn, signUp } = useAuth();
  const router = useRouter();

  const [tab, setTab] = useState<Tab>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Redirect if already signed in
  useEffect(() => {
    if (!loading && session) router.push("/notes");
  }, [loading, session, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setSubmitting(true);

    if (tab === "signin") {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error.message);
      } else {
        router.push("/notes");
      }
    } else {
      const { error } = await signUp(email, password);
      if (error) {
        setError(error.message);
      } else {
        setMessage("Account created! Check your email to confirm, or sign in if email confirmation is disabled.");
      }
    }

    setSubmitting(false);
  };

  if (loading) return null;

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo / wordmark */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-gray-100 tracking-tight">Tend AI</h1>
          <p className="text-sm text-gray-500 mt-1">Your emotionally intelligent relationship memory</p>
        </div>

        {/* Card */}
        <div className="bg-gray-900 border border-gray-800/60 rounded-2xl p-6">
          {/* Tabs */}
          <div className="flex bg-gray-800/50 rounded-lg p-1 mb-6">
            {(["signin", "signup"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(null); setMessage(null); }}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  tab === t
                    ? "bg-gray-700 text-gray-100 shadow-sm"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {t === "signin" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full bg-gray-800/60 border border-gray-700/50 rounded-lg px-3 py-2.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-violet-500/60 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                minLength={6}
                className="w-full bg-gray-800/60 border border-gray-700/50 rounded-lg px-3 py-2.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-violet-500/60 transition-colors"
              />
            </div>

            {error && (
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            {message && (
              <p className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium text-white transition-colors mt-1"
            >
              {submitting
                ? tab === "signin" ? "Signing in…" : "Creating account…"
                : tab === "signin" ? "Sign In" : "Create Account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
