"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
      const { error } = await supabase.auth.signInWithPassword({ email, password });
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
        options: { data: { full_name: fullName } },
      });
      if (error) {
        setError(error.message);
      } else {
        setMessage("Account created — check your email to confirm, then sign in.");
      }
    }

    setLoading(false);
  }

  const inputStyle = {
    border: "1px solid var(--border)",
    color: "var(--text-primary)",
    backgroundColor: "var(--surface)",
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ backgroundColor: "var(--bg)" }}>
      <Link href="/" className="flex items-center gap-2 mb-10" style={{ textDecoration: "none" }}>
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
          style={{ backgroundColor: "#0d9488", color: "#ffffff" }}
        >
          O
        </div>
      </Link>

      <div
        className="w-full max-w-sm rounded-2xl p-8"
        style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
      >
        <h1 className="text-[20px] font-extrabold mb-1" style={{ color: "var(--text-primary)" }}>
          {mode === "signin" ? "Sign in to Olvar" : "Create your account"}
        </h1>
        <p className="text-[13px] mb-6" style={{ color: "var(--text-secondary)" }}>
          {mode === "signin" ? "Welcome back." : "Start turning marking into minutes."}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {mode === "signup" && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="fullName" className="text-[13px] font-bold" style={{ color: "var(--text-primary)" }}>Full name</label>
              <input
                id="fullName" type="text" required autoComplete="name"
                value={fullName} onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-xl px-3 py-2.5 text-[15px] outline-none transition-colors"
                style={inputStyle} placeholder="Jane Smith"
                onFocus={(e) => { e.target.style.borderColor = "#0d9488"; e.target.style.boxShadow = "0 0 0 3px rgba(13, 148, 136, 0.1)"; }}
                onBlur={(e) => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none"; }}
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-[13px] font-bold" style={{ color: "var(--text-primary)" }}>Email</label>
            <input
              id="email" type="email" required autoComplete="email"
              value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl px-3 py-2.5 text-[15px] outline-none transition-colors"
              style={inputStyle} placeholder="you@school.ac.uk"
              onFocus={(e) => { e.target.style.borderColor = "#0d9488"; e.target.style.boxShadow = "0 0 0 3px rgba(13, 148, 136, 0.1)"; }}
              onBlur={(e) => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none"; }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-[13px] font-bold" style={{ color: "var(--text-primary)" }}>Password</label>
            <input
              id="password" type="password" required
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl px-3 py-2.5 text-[15px] outline-none transition-colors"
              style={inputStyle}
              placeholder={mode === "signup" ? "At least 8 characters" : ""}
              onFocus={(e) => { e.target.style.borderColor = "#0d9488"; e.target.style.boxShadow = "0 0 0 3px rgba(13, 148, 136, 0.1)"; }}
              onBlur={(e) => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none"; }}
            />
          </div>

          {error && (
            <p className="text-[13px] rounded-xl px-3 py-2.5" style={{ color: "#dc2626", backgroundColor: "var(--rag-red-bg)", border: "1px solid #fecaca" }}>
              {error}
            </p>
          )}

          {message && (
            <p className="text-[13px] rounded-xl px-3 py-2.5" style={{ color: "#16a34a", backgroundColor: "var(--rag-green-bg)", border: "1px solid #bbf7d0" }}>
              {message}
            </p>
          )}

          <button
            type="submit" disabled={loading}
            className="btn-primary w-full py-2.5 rounded-full text-[15px] font-bold transition-opacity"
            style={{ backgroundColor: "#0d9488", color: "#ffffff", opacity: loading ? 0.6 : 1 }}
          >
            {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <p className="mt-5 text-center text-[13px]" style={{ color: "var(--text-secondary)" }}>
          {mode === "signin" ? (
            <>
              Don&rsquo;t have an account?{" "}
              <button onClick={() => { setMode("signup"); setError(null); setMessage(null); }} className="font-bold" style={{ color: "#0d9488" }}>
                Create one
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button onClick={() => { setMode("signin"); setError(null); setMessage(null); }} className="font-bold" style={{ color: "#0d9488" }}>
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
