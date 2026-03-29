"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError(error.message);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      });
      if (error) {
        setError(error.message);
      } else {
        setMessage(
          "Account created — check your email to confirm, then sign in."
        );
      }
    }

    setLoading(false);
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ backgroundColor: "#fafaf9" }}
    >
      {/* Logo */}
      <a
        href="/"
        className="text-base font-semibold tracking-tight mb-10"
        style={{ color: "#1c1c1a" }}
      >
        Olvar
      </a>

      {/* Card */}
      <div
        className="w-full max-w-sm rounded-xl p-8"
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid #e5e5e4",
        }}
      >
        <h1
          className="text-lg font-semibold mb-1"
          style={{ color: "#1c1c1a" }}
        >
          {mode === "signin" ? "Sign in to Olvar" : "Create your account"}
        </h1>
        <p className="text-sm mb-6" style={{ color: "#6b6b67" }}>
          {mode === "signin"
            ? "Welcome back."
            : "Start turning marking into minutes."}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {mode === "signup" && (
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="fullName"
                className="text-xs font-medium"
                style={{ color: "#1c1c1a" }}
              >
                Full name
              </label>
              <input
                id="fullName"
                type="text"
                required
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none transition-colors"
                style={{
                  border: "1px solid #e5e5e4",
                  color: "#1c1c1a",
                  backgroundColor: "#ffffff",
                }}
                onFocus={(e) =>
                  (e.target.style.borderColor = "#0d9488")
                }
                onBlur={(e) =>
                  (e.target.style.borderColor = "#e5e5e4")
                }
                placeholder="Jane Smith"
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="email"
              className="text-xs font-medium"
              style={{ color: "#1c1c1a" }}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm outline-none transition-colors"
              style={{
                border: "1px solid #e5e5e4",
                color: "#1c1c1a",
                backgroundColor: "#ffffff",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#0d9488")}
              onBlur={(e) => (e.target.style.borderColor = "#e5e5e4")}
              placeholder="you@school.ac.uk"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="password"
              className="text-xs font-medium"
              style={{ color: "#1c1c1a" }}
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete={
                mode === "signin" ? "current-password" : "new-password"
              }
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm outline-none transition-colors"
              style={{
                border: "1px solid #e5e5e4",
                color: "#1c1c1a",
                backgroundColor: "#ffffff",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#0d9488")}
              onBlur={(e) => (e.target.style.borderColor = "#e5e5e4")}
              placeholder={mode === "signup" ? "At least 8 characters" : ""}
            />
          </div>

          {error && (
            <p
              className="text-xs rounded-lg px-3 py-2"
              style={{
                color: "#dc2626",
                backgroundColor: "#fef2f2",
                border: "1px solid #fecaca",
              }}
            >
              {error}
            </p>
          )}

          {message && (
            <p
              className="text-xs rounded-lg px-3 py-2"
              style={{
                color: "#16a34a",
                backgroundColor: "#f0fdf4",
                border: "1px solid #bbf7d0",
              }}
            >
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg text-sm font-medium transition-opacity"
            style={{
              backgroundColor: "#0d9488",
              color: "#ffffff",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading
              ? "Please wait…"
              : mode === "signin"
              ? "Sign in"
              : "Create account"}
          </button>
        </form>

        <p className="mt-5 text-center text-xs" style={{ color: "#6b6b67" }}>
          {mode === "signin" ? (
            <>
              Don&rsquo;t have an account?{" "}
              <button
                onClick={() => {
                  setMode("signup");
                  setError(null);
                  setMessage(null);
                }}
                className="font-medium"
                style={{ color: "#0d9488" }}
              >
                Create one
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                onClick={() => {
                  setMode("signin");
                  setError(null);
                  setMessage(null);
                }}
                className="font-medium"
                style={{ color: "#0d9488" }}
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
