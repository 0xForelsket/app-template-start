
import { db } from "@/db";
import { users } from "@/db/schema";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const userCount = await db.select().from(users).limit(1);
    return NextResponse.json({ status: "ok", userCount: userCount.length });
  } catch (error) {
    console.error("Debug DB Error:", error);
    return NextResponse.json({ status: "error", message: String(error) }, { status: 500 });
  }
}
