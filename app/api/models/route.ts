import { NextResponse } from "next/server"
import { OFFICIAL_MODELS } from "@/lib/models"

export async function GET() {
  return NextResponse.json(OFFICIAL_MODELS)
}
