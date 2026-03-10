import { NextRequest, NextResponse } from "next/server";
import { saveAnalysis } from "@/lib/database";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    console.log("📩 New diagnosis received:", body);

    // Save to database
    const analysisId = saveAnalysis({
      detectedSubstrate: body.aiAnalysis?.surfaceSuggestion,
      detectedContamination: body.aiAnalysis?.detectedContamination,
      aiConfidence: body.aiAnalysis?.confidence,
      aiNotes: body.aiAnalysis?.notes,
      selectedSubstrate: body.substrate,
      selectedContamination: body.contamination,
      recommendedProduct: body.recommendedProduct,
      userSaved: true,
    });

    console.log("✅ Saved to database with ID:", analysisId);

    return NextResponse.json({
      status: "ok",
      id: analysisId,
      received: body,
      at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Error saving diagnosis:", error);
    return NextResponse.json({
      status: "error",
      error: "Failed to save diagnosis"
    }, { status: 500 });
  }
}