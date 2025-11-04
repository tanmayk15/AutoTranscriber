import { NextRequest, NextResponse } from "next/server"
import { readFile } from "fs/promises"
import { join } from "path"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const path = searchParams.get("path")

    if (!path) {
      return NextResponse.json({ error: "No path provided" }, { status: 400 })
    }

    const filePath = join(process.cwd(), "public", path)
    const file = await readFile(filePath)

    const ext = path.split(".").pop()
    const contentTypes: { [key: string]: string } = {
      srt: "text/plain",
      vtt: "text/vtt",
      mp4: "video/mp4",
      mp3: "audio/mpeg",
    }

    return new NextResponse(file, {
      headers: {
        "Content-Type": contentTypes[ext || ""] || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${path.split("/").pop()}"`,
      },
    })
  } catch (error) {
    console.error("Error downloading file:", error)
    return NextResponse.json({ error: "File not found" }, { status: 404 })
  }
}
