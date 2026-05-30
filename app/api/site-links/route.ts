import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

async function exists(p: string) {
  try {
    await fs.stat(p)
    return true
  } catch (e) {
    return false
  }
}

export async function GET() {
  const root = process.cwd()
  const checks = {
    docs: await exists(path.join(root, 'app', 'docs')),
    api: await exists(path.join(root, 'app', 'api')),
    privacy: await exists(path.join(root, 'app', 'privacy')) || await exists(path.join(root, 'app', 'privacy.tsx')),
    terms: await exists(path.join(root, 'app', 'terms')) || await exists(path.join(root, 'app', 'terms.tsx')),
  }

  return NextResponse.json(checks)
}
