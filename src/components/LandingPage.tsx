"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Calculator,
  Camera,
  ChevronRight,
  Menu,
  PiggyBank,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { ACADEMIC_PROJECT_INFO } from "@/lib/constants";
import { BrandLogo } from "./BrandLogo";

const PREVIEW_CATEGORIES = [
  { name: "Food & Dining", value: 1500, color: "#40E8A1" },
  { name: "Shopping", value: 800, color: "#F472B6" },
  { name: "Transport", value: 600, color: "#D5FA72" },
  { name: "Entertainment", value: 500, color: "#A78BFA" },
  { name: "Education", value: 400, color: "#38BDF8" },
];

const BENTO_FEATURES = [
  {
    id: "scanner",
    title: "AI Receipt Scanner",
    desc: "Snap or upload any canteen, metro, or bookstore bill. Multimodal AI extracts merchant, total, date, and category into an editable confirmation form.",
    badge: "Vision AI",
    icon: Camera,
    span: "lg:col-span-2",
    highlight: "Auto-extracts items & totals — saved only after your review.",
    href: "/demo?tab=scanner",
  },
  {
    id: "copilot",
    title: "AI Financial Copilot",
    desc: "Ask PocketWise Copilot if you can afford a movie, where your money went, or how to save ₹500 this month.",
    badge: "Conversational",
    icon: Bot,
    span: "lg:col-span-1",
    highlight: "Deterministic math + clear student-friendly explanations.",
    href: "/demo?tab=copilot",
  },
  {
    id: "budget",
    title: "Budget Intelligence",
    desc: "Real-time Safe-to-Spend daily limits, category caps, and instant Green/Amber/Red budget health indicators.",
    badge: "Smart Rules",
    icon: ShieldCheck,
    span: "lg:col-span-1",
    highlight: "Adapts daily allowance to remaining days in the month.",
    href: "/demo?tab=budget",
  },
  {
    id: "goals",
    title: "Savings Goals",
    desc: "Save for a laptop, college trip, or emergency fund with milestone tracking and student challenges like No-Spend Day.",
    badge: "Habit Builder",
    icon: PiggyBank,
    span: "lg:col-span-1",
    highlight: "Track contributions without unrealistic financial claims.",
    href: "/demo?tab=goals",
  },
  {
    id: "splitter",
    title: "Expense Splitter",
    desc: "Split hostel pizza, cab rides, or group outings equally or by custom shares—kept cleanly separate from personal totals.",
    badge: "Roommate Ready",
    icon: Users,
    span: "lg:col-span-1",
    highlight: "Copy WhatsApp-ready split summaries in one tap.",
    href: "/demo?tab=splitter",
  },
  {
    id: "analytics",
    title: "Predictive Analytics",
    desc: "Estimate month-end spending based on your daily pace, compare months, and test What-If reductions with live sliders.",
    badge: "Forecasting",
    icon: TrendingUp,
    span: "lg:col-span-3",
    highlight:
      "Transparent estimates + interactive What-If Savings Simulator.",
    href: "/demo?tab=analytics",
  },
];

const AI_PREVIEW_PROMPTS = [
  {
    q: "Where is most of my money going?",
    a: "In your fictional demo budget (₹5,000), ₹3,800 is spent (76%). Food & Dining leads at ₹1,500 (39%), followed by Shopping at ₹800 (21%) and Transport at ₹600 (16%).",
  },
  {
    q: "Can I afford a ₹300 movie ticket?",
    a: "You have ₹1,200 remaining overall, leaving ₹900 after a ₹300 ticket. If you keep non-essential spending light for 2 days, it fits comfortably without breaking your monthly budget.",
  },
  {
    q: "How can I save ₹500 this month?",
    a: "Trimming ₹250 from Shopping (₹800), swapping 2 café orders for hostel tiffin (₹150), and capping Entertainment (₹100) reaches ₹500 in monthly savings—₹6,000 annualized.",
  },
];

export function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedPromptIdx, setSelectedPromptIdx] = useState(0);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const navLinks = [
    { label: "Home", href: "#home" },
    { label: "Features", href: "#features" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "AI Assistant", href: "#ai-assistant" },
  ];

  return (
    <div className="min-h-screen bg-[#071510] text-[#F4F8F5] relative overflow-x-hidden">
      {/* Subtle Ambient Background Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 overflow-hidden"
      >
        <div className="absolute -top-40 -left-32 h-[480px] w-[480px] rounded-full bg-[#40E8A1]/10 blur-[130px]" />
        <div className="absolute top-[30%] -right-40 h-[440px] w-[440px] rounded-full bg-[#D5FA72]/8 blur-[140px]" />
      </div>

      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-[#40E8A1]/12 bg-[#071510]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
          <Link href="/" aria-label="PocketWise AI Home">
            <BrandLogo size={38} showText showTagline />
          </Link>

          <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-[#91A99B]">
            {navLinks.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="hover:text-[#F4F8F5] transition"
              >
                {item.label}
              </a>
            ))}
            <Link
              href="/demo"
              className="text-[#D5FA72] hover:text-[#e3fc9d] transition inline-flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Live Demo
            </Link>
          </nav>

          <div className="hidden lg:flex items-center gap-3">
            <Link href="/auth?mode=login" className="pw-btn-secondary py-2 px-4">
              Student Login
            </Link>
            <Link href="/demo" className="pw-btn-primary py-2 px-4">
              Try Live Demo
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <button
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="lg:hidden rounded-xl border border-[#40E8A1]/20 p-2 text-[#F4F8F5] hover:bg-[#14291E]"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-[#40E8A1]/12 bg-[#0D2017]/98 px-4 py-4 space-y-3">
            {navLinks.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm text-[#91A99B] hover:bg-[#14291E] hover:text-[#F4F8F5]"
              >
                {item.label}
              </a>
            ))}
            <Link
              href="/demo"
              onClick={() => setMobileMenuOpen(false)}
              className="block rounded-lg px-3 py-2 text-sm font-medium text-[#D5FA72] hover:bg-[#14291E]"
            >
              Live Demo
            </Link>
            <div className="pt-2 flex flex-col gap-2">
              <Link
                href="/auth?mode=login"
                className="pw-btn-secondary w-full justify-center"
              >
                Student Login
              </Link>
              <Link
                href="/demo"
                className="pw-btn-primary w-full justify-center"
              >
                Try Live Demo
              </Link>
            </div>
          </div>
        )}
      </header>

      <main className="relative z-10">
        {/* Hero Section */}
        <section
          id="home"
          className="mx-auto max-w-7xl px-4 pt-12 pb-16 sm:px-6 lg:px-8 lg:pt-20 lg:pb-24"
        >
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            {/* Left Copy */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#40E8A1]/30 bg-[#14291E]/80 px-3.5 py-1.5 text-xs font-medium text-[#40E8A1]">
                <Sparkles className="w-3.5 h-3.5 text-[#D5FA72]" />
                <span>AI-Powered Student Finance</span>
                <span className="text-[#91A99B]">•</span>
                <span className="text-[#D5FA72]">Small Budget. Big Dreams.</span>
              </div>

              <h1 className="font-heading text-4xl font-bold tracking-tight text-[#F4F8F5] sm:text-5xl lg:text-6xl leading-[1.08]">
                Stop Guessing.{" "}
                <span className="bg-gradient-to-r from-[#40E8A1] to-[#D5FA72] bg-clip-text text-transparent">
                  Start Saving.
                </span>
              </h1>

              <p className="max-w-xl text-base sm:text-lg text-[#91A99B] leading-relaxed">
                Take control of your pocket money with intelligent expense
                tracking, personalized AI insights, and smarter daily spending
                decisions.
              </p>

              <div className="flex flex-wrap items-center gap-3.5 pt-2">
                <Link
                  href="/auth?mode=signup"
                  className="pw-btn-primary px-6 py-3.5 text-base"
                >
                  Start Managing Money
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/demo"
                  className="pw-btn-secondary px-6 py-3.5 text-base border-[#D5FA72]/35 text-[#D5FA72] hover:bg-[#14291E]"
                >
                  Explore Live Demo
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Trust / Academic Fact Row (No fake user metrics!) */}
              <div className="grid grid-cols-3 gap-3 pt-4 max-w-lg">
                <div className="rounded-xl border border-[#40E8A1]/12 bg-[#0D2017]/75 p-3">
                  <div className="text-xs text-[#91A99B]">Safe-to-Spend</div>
                  <div className="font-heading text-sm font-semibold text-[#F4F8F5] mt-0.5">
                    Daily Budget Cap
                  </div>
                </div>
                <div className="rounded-xl border border-[#40E8A1]/12 bg-[#0D2017]/75 p-3">
                  <div className="text-xs text-[#91A99B]">AI Vision</div>
                  <div className="font-heading text-sm font-semibold text-[#40E8A1] mt-0.5">
                    Receipt Scanner
                  </div>
                </div>
                <div className="rounded-xl border border-[#40E8A1]/12 bg-[#0D2017]/75 p-3">
                  <div className="text-xs text-[#91A99B]">Privacy First</div>
                  <div className="font-heading text-sm font-semibold text-[#D5FA72] mt-0.5">
                    No Bank Login
                  </div>
                </div>
              </div>
            </div>

            {/* Right Interactive Preview */}
            <div className="lg:col-span-6">
              <div className="pw-card rounded-3xl p-5 sm:p-6 relative overflow-hidden">
                {/* Explicit Fictional Label */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-[#40E8A1]/12">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#40E8A1] animate-pulse" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#40E8A1]">
                      Fictional Demonstration Preview
                    </span>
                  </div>
                  <span className="rounded-full bg-[#071510] border border-[#91A99B]/25 px-2.5 py-0.5 text-[11px] text-[#91A99B]">
                    Sample Student Profile: ₹5,000/mo
                  </span>
                </div>

                {/* Mini Metric Bento */}
                <div className="grid grid-cols-3 gap-3 mt-4">
                  <div className="rounded-2xl bg-[#071510]/80 border border-[#40E8A1]/15 p-3.5">
                    <div className="text-[11px] text-[#91A99B]">Pocket Money</div>
                    <div className="font-heading text-lg sm:text-xl font-bold text-[#F4F8F5] mt-1">
                      ₹5,000
                    </div>
                  </div>
                  <div className="rounded-2xl bg-[#071510]/80 border border-[#40E8A1]/15 p-3.5">
                    <div className="text-[11px] text-[#91A99B]">Spent (76%)</div>
                    <div className="font-heading text-lg sm:text-xl font-bold text-[#D5FA72] mt-1">
                      ₹3,800
                    </div>
                  </div>
                  <div className="rounded-2xl bg-[#071510]/80 border border-[#40E8A1]/25 p-3.5">
                    <div className="text-[11px] text-[#91A99B]">Remaining</div>
                    <div className="font-heading text-lg sm:text-xl font-bold text-[#40E8A1] mt-1">
                      ₹1,200
                    </div>
                  </div>
                </div>

                {/* Donut + Category List */}
                <div className="grid sm:grid-cols-5 gap-4 items-center mt-4 rounded-2xl bg-[#071510]/65 border border-[#40E8A1]/10 p-4">
                  <div className="sm:col-span-2 h-44 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={PREVIEW_CATEGORIES}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={44}
                          outerRadius={68}
                          paddingAngle={3}
                          stroke="none"
                          onMouseEnter={(_, idx) =>
                            setActiveCategory(PREVIEW_CATEGORIES[idx].name)
                          }
                          onMouseLeave={() => setActiveCategory(null)}
                        >
                          {PREVIEW_CATEGORIES.map((entry) => (
                            <Cell
                              key={entry.name}
                              fill={entry.color}
                              opacity={
                                activeCategory && activeCategory !== entry.name
                                  ? 0.45
                                  : 1
                              }
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(val: number) => [`₹${val}`, "Demo Spend"]}
                          contentStyle={{
                            backgroundColor: "#0D2017",
                            borderColor: "rgba(64,232,161,0.3)",
                            borderRadius: "12px",
                            color: "#F4F8F5",
                            fontSize: "12px",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="sm:col-span-3 space-y-2">
                    <div className="text-xs font-medium text-[#91A99B] mb-1">
                      Category Mix (Fictional Demo Data)
                    </div>
                    {PREVIEW_CATEGORIES.map((cat) => (
                      <div
                        key={cat.name}
                        onMouseEnter={() => setActiveCategory(cat.name)}
                        onMouseLeave={() => setActiveCategory(null)}
                        className="flex items-center justify-between text-xs rounded-lg px-2 py-1 hover:bg-[#14291E] transition cursor-default"
                      >
                        <span className="flex items-center gap-2 text-[#F4F8F5]">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: cat.color }}
                          />
                          {cat.name}
                        </span>
                        <span className="font-semibold text-[#F4F8F5]">
                          ₹{cat.value.toLocaleString("en-IN")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI Insight Strip */}
                <div className="mt-4 rounded-2xl border border-[#40E8A1]/25 bg-gradient-to-r from-[#40E8A1]/10 to-[#D5FA72]/5 p-4 flex items-start gap-3">
                  <div className="rounded-xl bg-[#40E8A1]/15 p-2 text-[#40E8A1] shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="text-xs leading-relaxed">
                    <div className="font-semibold text-[#40E8A1]">
                      PocketWise Copilot Insight (Demo)
                    </div>
                    <p className="text-[#F4F8F5]/90 mt-0.5">
                      Food (₹1,500) and Shopping (₹800) represent 60% of your
                      demo expenses. Cutting ₹250 from Shopping keeps you on
                      track for your ₹1,000 savings target.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Student Finance Problem Section (3 Visual Cards) */}
        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-10">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#40E8A1]">
              The Student Money Challenge
            </span>
            <h2 className="font-heading text-3xl font-bold mt-2 sm:text-4xl">
              Three questions every college student asks mid-month
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Wallet,
                question: "Where did my money go?",
                detail:
                  "Small UPI payments for chai, canteen snacks, autos, and printouts vanish without notice. PocketWise categorizes every rupee automatically.",
                accent: "#40E8A1",
                tag: "Impulse Leakage",
              },
              {
                icon: Calculator,
                question: "Will my budget last this month?",
                detail:
                  "Running out of pocket money on the 22nd is stressful. Our Safe-to-Spend limit and Month-End Predictor show your exact daily runway.",
                accent: "#D5FA72",
                tag: "Runway Clarity",
              },
              {
                icon: PiggyBank,
                question: "How can I save more?",
                detail:
                  "Test realistic reductions with the What-If Simulator, join No-Spend Day challenges, and track goals for laptops, trips, or emergencies.",
                accent: "#38BDF8",
                tag: "Goal Momentum",
              },
            ].map((card) => (
              <div
                key={card.question}
                className="pw-card pw-card-hover rounded-3xl p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div
                      className="rounded-2xl p-3 border"
                      style={{
                        backgroundColor: `${card.accent}15`,
                        borderColor: `${card.accent}35`,
                        color: card.accent,
                      }}
                    >
                      <card.icon className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-medium rounded-full px-3 py-1 bg-[#071510] border border-[#91A99B]/20 text-[#91A99B]">
                      {card.tag}
                    </span>
                  </div>
                  <h3 className="font-heading text-xl font-bold text-[#F4F8F5]">
                    {card.question}
                  </h3>
                  <p className="text-sm text-[#91A99B] mt-2.5 leading-relaxed">
                    {card.detail}
                  </p>
                </div>
                <Link
                  href="/demo"
                  className="mt-6 inline-flex items-center gap-1.5 text-xs font-semibold text-[#40E8A1] hover:text-[#D5FA72] transition"
                >
                  Explore in Live Demo <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* Bento-Grid Interactive Feature Showcase */}
        <section
          id="features"
          className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest text-[#D5FA72]">
                Built for Campus Life
              </span>
              <h2 className="font-heading text-3xl font-bold mt-2 sm:text-4xl">
                Everything a student needs in one financial command center
              </h2>
            </div>
            <Link href="/demo" className="pw-btn-secondary shrink-0">
              Try All Features Free
            </Link>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {BENTO_FEATURES.map((feat) => (
              <Link
                key={feat.id}
                href={feat.href}
                className={`pw-card pw-card-hover rounded-3xl p-6 flex flex-col justify-between group ${feat.span}`}
              >
                <div>
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="rounded-2xl bg-[#40E8A1]/12 border border-[#40E8A1]/25 p-3 text-[#40E8A1] group-hover:scale-105 transition">
                      <feat.icon className="w-5 h-5" />
                    </div>
                    <span className="rounded-full bg-[#071510] border border-[#40E8A1]/20 px-3 py-1 text-[11px] font-medium text-[#D5FA72]">
                      {feat.badge}
                    </span>
                  </div>
                  <h3 className="font-heading text-xl font-bold text-[#F4F8F5] group-hover:text-[#40E8A1] transition">
                    {feat.title}
                  </h3>
                  <p className="text-sm text-[#91A99B] mt-2 leading-relaxed">
                    {feat.desc}
                  </p>
                </div>
                <div className="mt-5 pt-4 border-t border-[#40E8A1]/10 flex items-center justify-between gap-2 text-xs text-[#F4F8F5]/80">
                  <span>{feat.highlight}</span>
                  <ArrowRight className="w-4 h-4 text-[#40E8A1] shrink-0 group-hover:translate-x-1 transition" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* AI Assistant Interactive Preview */}
        <section
          id="ai-assistant"
          className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8"
        >
          <div className="pw-card rounded-3xl p-6 sm:p-10 grid gap-8 lg:grid-cols-12 items-center">
            <div className="lg:col-span-5 space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#40E8A1]/12 border border-[#40E8A1]/25 px-3 py-1 text-xs font-semibold text-[#40E8A1]">
                <Bot className="w-3.5 h-3.5" />
                Meet PocketWise Copilot
              </div>
              <h2 className="font-heading text-3xl font-bold">
                Ask real questions about your pocket money
              </h2>
              <p className="text-sm text-[#91A99B] leading-relaxed">
                PocketWise Copilot combines deterministic INR calculations with
                secure server-side Gemini AI explanations—giving practical
                guidance without fabricating numbers or requiring bank logins.
              </p>
              <div className="pt-2">
                <Link href="/demo?tab=copilot" className="pw-btn-primary">
                  Chat with Copilot in Demo
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-3">
              <div className="flex flex-wrap gap-2">
                {AI_PREVIEW_PROMPTS.map((item, idx) => (
                  <button
                    key={item.q}
                    onClick={() => setSelectedPromptIdx(idx)}
                    className={`rounded-full px-3.5 py-2 text-xs font-medium border transition ${
                      selectedPromptIdx === idx
                        ? "bg-[#40E8A1] text-[#071510] border-[#40E8A1]"
                        : "bg-[#071510]/80 text-[#91A99B] border-[#40E8A1]/20 hover:text-[#F4F8F5]"
                    }`}
                  >
                    {item.q}
                  </button>
                ))}
              </div>
              <div className="rounded-2xl bg-[#071510]/85 border border-[#40E8A1]/20 p-5 space-y-3">
                <div className="text-xs text-[#91A99B]">
                  Sample Demo Question
                </div>
                <div className="text-sm font-semibold text-[#F4F8F5]">
                  “{AI_PREVIEW_PROMPTS[selectedPromptIdx].q}”
                </div>
                <div className="border-t border-[#40E8A1]/12 pt-3 text-sm text-[#D5FA72]/95 leading-relaxed">
                  {AI_PREVIEW_PROMPTS[selectedPromptIdx].a}
                </div>
                <div className="text-[11px] text-[#91A99B]">
                  Educational budgeting tool • Based on fictional ₹5,000 demo
                  data
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Three-Step How It Works */}
        <section
          id="how-it-works"
          className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"
        >
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#40E8A1]">
              How It Works
            </span>
            <h2 className="font-heading text-3xl font-bold mt-2 sm:text-4xl">
              Three simple steps to financial clarity
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Record your expenses.",
                desc: "Log canteen snacks, metro tickets, or hostel bills in seconds—or scan receipts with AI Vision.",
              },
              {
                step: "02",
                title: "Let AI analyze spending.",
                desc: "PocketWise computes your Safe-to-Spend limit, Financial Health Score, and month-end trajectory.",
              },
              {
                step: "03",
                title: "Make smarter money decisions.",
                desc: "Use Copilot advice, What-If savings sliders, and Smart Alerts to hit your student savings goals.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="pw-card rounded-3xl p-6 relative overflow-hidden"
              >
                <div className="font-heading text-5xl font-bold text-[#40E8A1]/18 mb-4">
                  {item.step}
                </div>
                <h3 className="font-heading text-xl font-bold text-[#F4F8F5]">
                  {item.step} – {item.title}
                </h3>
                <p className="text-sm text-[#91A99B] mt-2.5 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Final Call to Action */}
        <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-[#40E8A1]/30 bg-gradient-to-br from-[#14291E] via-[#0D2017] to-[#071510] p-8 sm:p-12 text-center shadow-glow">
            <h2 className="font-heading text-3xl sm:text-4xl font-bold">
              Ready to master your pocket money?
            </h2>
            <p className="mx-auto max-w-xl text-sm sm:text-base text-[#91A99B] mt-3">
              Jump straight into the interactive ₹5,000 student demo without
              signing up, or create your personal student workspace in 30
              seconds.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-4">
              <Link
                href="/demo"
                className="pw-btn-primary px-7 py-3.5 text-base"
              >
                Try Live Demo
                <Sparkles className="w-4 h-4" />
              </Link>
              <Link
                href="/auth?mode=signup"
                className="pw-btn-secondary px-7 py-3.5 text-base"
              >
                Create Student Account
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Academic Project Footer */}
      <footer className="border-t border-[#40E8A1]/12 bg-[#071510] py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid gap-8 md:grid-cols-3">
          <div className="space-y-3">
            <BrandLogo size={34} showText showTagline />
            <p className="text-xs text-[#91A99B] leading-relaxed max-w-sm">
              {ACADEMIC_PROJECT_INFO.disclaimer}
            </p>
          </div>
          <div className="text-xs space-y-1.5 text-[#91A99B]">
            <div className="font-semibold text-[#F4F8F5] text-sm mb-2">
              Academic Project Details
            </div>
            <p>
              <span className="text-[#F4F8F5]">Subject:</span>{" "}
              {ACADEMIC_PROJECT_INFO.subject}
            </p>
            <p>
              <span className="text-[#F4F8F5]">Department:</span>{" "}
              {ACADEMIC_PROJECT_INFO.department}
            </p>
            <p>
              <span className="text-[#F4F8F5]">University:</span>{" "}
              {ACADEMIC_PROJECT_INFO.university}
            </p>
            <p>
              <span className="text-[#F4F8F5]">Session:</span>{" "}
              {ACADEMIC_PROJECT_INFO.session} •{" "}
              <span className="text-[#F4F8F5]">Guide:</span>{" "}
              {ACADEMIC_PROJECT_INFO.guide}
            </p>
          </div>
          <div className="text-xs space-y-2 text-[#91A99B] md:text-right">
            <div className="font-semibold text-[#F4F8F5] text-sm mb-2">
              Quick Access
            </div>
            <div className="flex flex-col md:items-end gap-1.5">
              <Link href="/demo" className="hover:text-[#40E8A1] transition">
                Interactive Live Demo
              </Link>
              <Link
                href="/auth?mode=login"
                className="hover:text-[#40E8A1] transition"
              >
                Student Login
              </Link>
              <Link
                href="/auth?mode=signup"
                className="hover:text-[#40E8A1] transition"
              >
                Create Account
              </Link>
              <Link
                href="/demo?tab=settings"
                className="hover:text-[#40E8A1] transition"
              >
                About Project & Team
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
