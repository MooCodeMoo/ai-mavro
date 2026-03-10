import { NextRequest, NextResponse } from "next/server";
import { getAllRules, addRule, updateRule, deleteRule, getRule } from "@/lib/database";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (id) {
      const rule = getRule(parseInt(id));
      if (!rule) {
        return NextResponse.json({ error: "Rule not found" }, { status: 404 });
      }
      return NextResponse.json({ 
        rule: {
          ...rule,
          application_steps: JSON.parse((rule as any).application_steps),
        }
      });
    }

    const rules = getAllRules();
    const parsedRules = (rules as any[]).map(rule => ({
      ...rule,
      application_steps: JSON.parse(rule.application_steps),
    }));

    return NextResponse.json({ rules: parsedRules });
  } catch (error) {
    console.error("Error fetching rules:", error);
    return NextResponse.json({ error: "Failed to fetch rules" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { substrate, contamination, productName, dilution, applicationSteps, safetyGuidelines } = body;

    if (!substrate || !contamination || !productName || !dilution || !applicationSteps || !safetyGuidelines) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const id = addRule({
      substrate,
      contamination,
      productName,
      dilution,
      applicationSteps,
      safetyGuidelines,
    });

    return NextResponse.json({ success: true, id, message: "Rule created successfully" });
  } catch (error) {
    console.error("Error creating rule:", error);
    return NextResponse.json({ error: "Failed to create rule" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: "Rule ID is required" }, { status: 400 });
    }

    updateRule(id, updateData);
    return NextResponse.json({ success: true, message: "Rule updated successfully" });
  } catch (error) {
    console.error("Error updating rule:", error);
    return NextResponse.json({ error: "Failed to update rule" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: "Rule ID is required" }, { status: 400 });
    }

    deleteRule(parseInt(id));
    return NextResponse.json({ success: true, message: "Rule deleted successfully" });
  } catch (error) {
    console.error("Error deleting rule:", error);
    return NextResponse.json({ error: "Failed to delete rule" }, { status: 500 });
  }
}
