import { NextResponse } from "next/server"
import { globalSettings, updateSettings } from "@/lib/settings"

export async function GET() {
  return NextResponse.json(globalSettings)
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const newSettings = updateSettings(body)
    return NextResponse.json({ success: true, settings: newSettings })
  } catch (error) {
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
  }
}
