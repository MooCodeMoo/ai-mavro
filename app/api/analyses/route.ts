import { NextRequest, NextResponse } from "next/server";
import { getAnalyses, getAnalysesCount, getStatistics, exportAnalysesJSON } from "@/lib/database";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');
    
    if (action === 'export') {
      const data = exportAnalysesJSON();
      return NextResponse.json({ analyses: data });
    }

    if (action === 'stats') {
      const stats = getStatistics();
      return NextResponse.json({ statistics: stats });
    }

    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const analyses = getAnalyses(limit, offset);
    const total = getAnalysesCount();

    return NextResponse.json({ 
      analyses,
      total,
      limit,
      offset,
      hasMore: offset + limit < total
    });
  } catch (error) {
    console.error("Error fetching analyses:", error);
    return NextResponse.json({ error: "Failed to fetch analyses" }, { status: 500 });
  }
}