import { NextRequest, NextResponse } from "next/server";
import { EXPENSE_CATEGORIES, SAMPLE_RECEIPTS } from "@/lib/constants";
import { isGeminiConfigured } from "@/lib/server/storage";
import type { ExpenseCategory } from "@/lib/types";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

const MAX_BYTES = 5 * 1024 * 1024; // 5MB

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Handle Preset Sample Receipt Demonstration
    if (body.sampleId) {
      const sample = SAMPLE_RECEIPTS.find((s) => s.id === body.sampleId);
      if (!sample) {
        return NextResponse.json(
          { error: "Unknown sample receipt ID." },
          { status: 400 }
        );
      }
      const today = new Date().toISOString().slice(0, 10);
      return NextResponse.json({
        sourceMode: "preset_sample",
        readable: true,
        merchantName: sample.merchantName,
        totalAmount: sample.totalAmount,
        transactionDate: today,
        category: sample.category,
        paymentMethod: sample.paymentMethod,
        items: sample.items,
        note: "Preset demonstration extraction from fictional sample receipt.",
      });
    }

    // 2. Real Uploaded Image Receipt Extraction
    const imageBase64 = String(body.imageBase64 ?? "").trim();
    const mimeType = String(body.mimeType ?? "").toLowerCase();

    if (!imageBase64 || !mimeType) {
      return NextResponse.json(
        { error: "Please upload a receipt image file." },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      return NextResponse.json(
        {
          error:
            "Unsupported image format. Please upload a JPG, PNG, or WebP receipt image.",
        },
        { status: 400 }
      );
    }

    const approxBytes = Math.ceil((imageBase64.length * 3) / 4);
    if (approxBytes > MAX_BYTES) {
      return NextResponse.json(
        { error: "Image exceeds 5 MB limit. Please upload a smaller image." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!isGeminiConfigured() || !apiKey) {
      return NextResponse.json(
        {
          error:
            "Live AI receipt scanning requires GEMINI_API_KEY on the server. PocketWise AI will never invent receipt data. Configure GEMINI_API_KEY in .env.local or test one of the 3 preset sample receipts.",
          code: "GEMINI_NOT_CONFIGURED",
        },
        { status: 503 }
      );
    }

    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      model
    )}:generateContent`;

    const prompt = `Analyze this uploaded receipt/bill/invoice image carefully.
Return ONLY valid JSON matching this schema:
{
  "readable": boolean,
  "unreadableReason": string | null,
  "merchantName": string | null,
  "totalAmount": number | null,
  "transactionDate": "YYYY-MM-DD" | null,
  "category": one of ${JSON.stringify(EXPENSE_CATEGORIES)},
  "items": [{"name": string, "qty": number, "price": number}]
}

STRICT RULES:
- If the image is NOT a receipt/bill, or is too blurry/cropped to read a total amount or merchant, set "readable": false and explain why in "unreadableReason".
- NEVER invent, guess, or fabricate amounts, dates, or items not visible on the image.
- If a date is missing on the receipt, set "transactionDate": null.`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: mimeType === "image/jpg" ? "image/jpeg" : mimeType,
                  data: imageBase64,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          error: `AI extraction service returned HTTP ${response.status}. Please verify GEMINI_API_KEY and try again.`,
        },
        { status: 502 }
      );
    }

    const json = await response.json();
    const rawText: string | undefined =
      json?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      return NextResponse.json(
        {
          error:
            "The AI model returned an empty response. Please try a clearer image.",
        },
        { status: 422 }
      );
    }

    let parsed: {
      readable?: boolean;
      unreadableReason?: string | null;
      merchantName?: string | null;
      totalAmount?: number | null;
      transactionDate?: string | null;
      category?: string;
      items?: Array<{ name: string; qty?: number; price?: number }>;
    };

    try {
      parsed = JSON.parse(rawText);
    } catch {
      return NextResponse.json(
        {
          error:
            "Could not parse structured receipt fields from the image. Please enter the expense manually.",
        },
        { status: 422 }
      );
    }

    if (!parsed.readable || !parsed.totalAmount || parsed.totalAmount <= 0) {
      return NextResponse.json(
        {
          readable: false,
          error:
            parsed.unreadableReason ||
            "The uploaded image could not be read reliably as a receipt. Please upload a clearer photo of the bill.",
        },
        { status: 422 }
      );
    }

    const safeCategory: ExpenseCategory = EXPENSE_CATEGORIES.includes(
      parsed.category as ExpenseCategory
    )
      ? (parsed.category as ExpenseCategory)
      : "Other";

    return NextResponse.json({
      sourceMode: "ai_live",
      model,
      readable: true,
      merchantName: parsed.merchantName || "Scanned Receipt",
      totalAmount: Number(parsed.totalAmount),
      transactionDate:
        parsed.transactionDate && /^\d{4}-\d{2}-\d{2}$/.test(parsed.transactionDate)
          ? parsed.transactionDate
          : new Date().toISOString().slice(0, 10),
      category: safeCategory,
      paymentMethod: "UPI",
      items: Array.isArray(parsed.items) ? parsed.items : [],
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Receipt extraction failed unexpectedly.",
      },
      { status: 500 }
    );
  }
}
