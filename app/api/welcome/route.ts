import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    message: "Welcome to FYY-AI",
    status: "online",
    developer: "RapXCode",
    version: "1.0.0"
  })
}
