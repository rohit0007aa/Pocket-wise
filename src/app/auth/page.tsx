"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  User,
  Wallet,
} from "lucide-react";
import { useAppData } from "@/components/AppDataProvider";
import { BrandLogo } from "@/components/BrandLogo";
import { useToast } from "@/components/ToastProvider";

function AuthFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode =
    searchParams.get("mode") === "signup" ? "signup" : "login";

  const [authMode, setAuthMode] = useState<"login" | "signup">(initialMode);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [monthlyPocketMoney, setMonthlyPocketMoney] = useState("5000");
  const [savingsTarget, setSavingsTarget] = useState("1000");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const { setMode, refreshUserSession, capabilities } = useAppData();
  const { showToast } = useToast();

  useEffect(() => {
    const m = searchParams.get("mode");
    if (m === "signup" || m === "login") {
      setAuthMode(m);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const endpoint =
        authMode === "signup" ? "/api/auth/signup" : "/api/auth/login";
      const payload =
        authMode === "signup"
          ? {
              fullName,
              email,
              password,
              monthlyPocketMoney: Number(monthlyPocketMoney) || 0,
              savingsTarget: Number(savingsTarget) || 0,
            }
          : { email, password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Authentication failed.");
        setSubmitting(false);
        return;
      }

      setMode("authenticated");
      await refreshUserSession();
      showToast(
        authMode === "signup"
          ? "Welcome to PocketWise AI! Let's personalize your workspace."
          : "Welcome back!",
        "success"
      );
      router.push("/dashboard");
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#071510] text-[#F4F8F5] flex flex-col justify-between relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 overflow-hidden"
      >
        <div className="absolute -top-32 left-1/3 h-96 w-96 rounded-full bg-[#40E8A1]/10 blur-[130px]" />
      </div>

      <header className="relative z-10 mx-auto w-full max-w-6xl px-4 py-5 flex items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-3 group">
          <BrandLogo size={36} showText />
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-xs text-[#91A99B] hover:text-[#F4F8F5] inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Home
          </Link>
          <Link href="/demo" className="pw-btn-secondary py-2 px-3.5 text-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#D5FA72]" />
            Try Live Demo
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-5xl px-4 py-8 grid gap-8 lg:grid-cols-12 items-center">
        {/* Left Info Panel */}
        <div className="lg:col-span-5 space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#40E8A1]/25 bg-[#14291E]/75 px-3 py-1 text-xs font-medium text-[#40E8A1]">
            <ShieldCheck className="w-3.5 h-3.5" />
            Privacy-First Student Accounts
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold leading-tight">
            {authMode === "signup"
              ? "Start managing your pocket money smarter"
              : "Welcome back to your budget command center"}
          </h1>
          <p className="text-sm text-[#91A99B] leading-relaxed">
            No bank credentials, credit cards, UPI PINs, or university SSO
            required. Track expenses manually or via receipt scans with full
            control over your data.
          </p>

          <div className="pw-card rounded-2xl p-4 space-y-2.5 text-xs text-[#91A99B]">
            <div className="font-semibold text-[#F4F8F5] flex items-center justify-between">
              <span>Active Storage Backend</span>
              <span className="rounded-full bg-[#40E8A1]/15 text-[#40E8A1] px-2.5 py-0.5 text-[11px] font-semibold">
                {capabilities.storageMode === "supabase"
                  ? "Supabase Cloud (RLS)"
                  : "Local Persistent Server DB"}
              </span>
            </div>
            <p>
              Your records are isolated to your account and persisted securely
              across sessions. Want to test without registering?{" "}
              <Link href="/demo" className="text-[#D5FA72] underline">
                Open Instant Live Demo
              </Link>
              .
            </p>
          </div>
        </div>

        {/* Right Form Card */}
        <div className="lg:col-span-7">
          <div className="pw-card rounded-3xl p-6 sm:p-8">
            <div className="flex rounded-xl bg-[#071510] p-1 border border-[#40E8A1]/15 mb-6">
              <button
                type="button"
                onClick={() => {
                  setAuthMode("login");
                  setError("");
                }}
                className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
                  authMode === "login"
                    ? "bg-[#40E8A1] text-[#071510]"
                    : "text-[#91A99B] hover:text-[#F4F8F5]"
                }`}
              >
                Student Login
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode("signup");
                  setError("");
                }}
                className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
                  authMode === "signup"
                    ? "bg-[#40E8A1] text-[#071510]"
                    : "text-[#91A99B] hover:text-[#F4F8F5]"
                }`}
              >
                Create Account
              </button>
            </div>

            {error && (
              <div
                role="alert"
                className="mb-4 rounded-xl border border-red-400/35 bg-red-500/10 px-4 py-3 text-xs text-red-200"
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {authMode === "signup" && (
                <div>
                  <label className="block text-xs font-medium text-[#91A99B] mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#91A99B] absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g., Priya Verma"
                      className="pw-input pl-10"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-[#91A99B] mb-1.5">
                  Student Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#91A99B] absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@example.com"
                    className="pw-input pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#91A99B] mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#91A99B] absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="pw-input pl-10"
                  />
                </div>
              </div>

              {authMode === "signup" && (
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#91A99B] mb-1.5">
                      Monthly Pocket Money (₹)
                    </label>
                    <div className="relative">
                      <Wallet className="w-4 h-4 text-[#91A99B] absolute left-3.5 top-3" />
                      <input
                        type="number"
                        min={0}
                        required
                        value={monthlyPocketMoney}
                        onChange={(e) => setMonthlyPocketMoney(e.target.value)}
                        className="pw-input pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#91A99B] mb-1.5">
                      Optional Savings Target (₹)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={savingsTarget}
                      onChange={(e) => setSavingsTarget(e.target.value)}
                      placeholder="1000"
                      className="pw-input"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="pw-btn-primary w-full py-3 mt-2"
              >
                {submitting
                  ? "Please wait..."
                  : authMode === "signup"
                  ? "Create Student Account"
                  : "Sign In to Dashboard"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </main>

      <footer className="relative z-10 py-4 text-center text-xs text-[#91A99B]">
        PocketWise AI — JECRC University Digital Data & AI Literacy Project
      </footer>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#071510] flex items-center justify-center text-sm text-[#91A99B]">
          Loading authentication...
        </div>
      }
    >
      <AuthFormContent />
    </Suspense>
  );
}
