import { NextResponse } from "next/server";

// Public registration is disabled — admin-only product.
export async function POST() {
  return NextResponse.json(
    { error: "Account registration is disabled. Contact your administrator." },
    { status: 403 }
  );
}

export async function GET() {
  return NextResponse.json(
    { error: "Account registration is disabled." },
    { status: 403 }
  );
}
