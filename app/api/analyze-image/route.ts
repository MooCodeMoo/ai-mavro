import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const image = formData.get("image") as File;

    if (!image) {
      return NextResponse.json(
        { error: "No image provided" },
        { status: 400 }
      );
    }

    console.log("📸 Image received:", image.name, image.type, image.size);

    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString("base64");
    const mediaType = image.type || "image/jpeg";

    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    console.log("🔑 API Key present:", !!apiKey);
    
    if (!apiKey) {
      console.warn("⚠️ ANTHROPIC_API_KEY not set. Using mock analysis.");
      return NextResponse.json({
        analysis: getMockAnalysis(),
      });
    }

    console.log("🚀 Calling Claude API...");

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: mediaType,
                  data: base64Image,
                },
              },
              {
                type: "text",
                text: `You are analyzing a building surface for contamination detection. 

Please analyze this image and identify:

1. Surface Type - Choose ONE from:
   - Concrete
   - Brick
   - Render / mineral plaster
   - Natural stone (soft)
   - Natural stone (hard)
   - Roof tiles
   - Paving stones

2. Contamination Type - Choose the MOST PROMINENT ONE from:
   - Green deposits (algae/moss/lichen)
   - Black mould
   - General dirt / traffic film
   - Efflorescence / cement veil
   - Rust / oxide
   - Oil / grease
   - Graffiti

3. Confidence: Rate 0.0 to 1.0

4. Notes: Brief description

Respond ONLY in this exact JSON format (no markdown):
{
  "surfaceSuggestion": "surface type or null",
  "detectedContamination": "contamination type or null",
  "confidence": 0.85,
  "notes": "brief description"
}`,
              },
            ],
          },
        ],
      }),
    });

    console.log("📡 API response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ API error:", response.status, errorText);
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const analysisText = data.content[0].text;

    let analysis;
    try {
      const cleanText = analysisText
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      analysis = JSON.parse(cleanText);
    } catch (parseError) {
      console.error("❌ Parse error:", analysisText);
      throw new Error("Failed to parse AI response");
    }

    console.log("✅ Analysis complete:", analysis);

    return NextResponse.json({
      analysis,
    });
  } catch (error) {
    console.error("❌ Error:", error);
    return NextResponse.json(
      {
        error: "Failed to analyze image",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

function getMockAnalysis() {
  const contaminations = [
    "Green deposits (algae/moss/lichen)",
    "General dirt / traffic film",
    "Black mould",
  ];
  
  const surfaces = [
    "Concrete",
    "Brick",
    "Render / mineral plaster",
  ];

  return {
    surfaceSuggestion: surfaces[Math.floor(Math.random() * surfaces.length)],
    detectedContamination: contaminations[Math.floor(Math.random() * contaminations.length)],
    confidence: 0.75 + Math.random() * 0.2,
    notes: "Mock analysis - set ANTHROPIC_API_KEY for real AI detection",
  };
}