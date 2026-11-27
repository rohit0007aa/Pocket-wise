import { NextResponse } from "next/server";
import {
  isGeminiConfigured,
  isSupabaseConfigured,
} from "@/lib/server/storage";

export async function GET() {
  return NextResponse.json({
    ok: true,
    storageMode: isSupabaseConfigured() ? "supabase" : "local",
    aiConfigured: isGeminiConfigured(),
    aiModel: isGeminiConfigured()
      ? process.env.GEMINI_MODEL || "gemini-2.5-flash"
      : "rule-based-fallback",
  });
}
