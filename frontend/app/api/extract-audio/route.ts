import { NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"
import { getFFmpegPath, sanitizeFilename, log, logError, executeCommand } from "@/lib/api-utils"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("video") as File

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
    }

    log(`Processing video upload: ${file.name} (${file.size} bytes)`)

    // Create uploads directory
    const uploadsDir = join(process.cwd(), "public", "uploads")
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
      log(`Created uploads directory: ${uploadsDir}`)
    }

    // Sanitize filename and save the file
    const safeFilename = sanitizeFilename(file.name)
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const filePath = join(uploadsDir, safeFilename)
    await writeFile(filePath, buffer)
    log(`Saved video file: ${filePath}`)

    // Extract audio using FFmpeg
    const audioPath = filePath.replace(/\.[^/.]+$/, ".wav")
    const ffmpegPath = getFFmpegPath()

    log(`Extracting audio with FFmpeg...`)
    log(`FFmpeg path: ${ffmpegPath}`)
    log(`Input: ${filePath}`)
    log(`Output: ${audioPath}`)

    try {
      await executeCommand(
        ffmpegPath,
        [
          "-i", filePath,
          "-vn",
          "-acodec", "pcm_s16le",
          "-ar", "16000",
          "-ac", "1",
          "-y", // Overwrite output file
          audioPath,
        ],
        (data) => log(`FFmpeg: ${data}`)
      )

      log(`Audio extraction complete: ${audioPath}`)

      return NextResponse.json({
        success: true,
        audioPath: `/uploads/${safeFilename.replace(/\.[^/.]+$/, ".wav")}`,
        videoPath: `/uploads/${safeFilename}`,
        videoFilename: safeFilename,
      })
    } catch (ffmpegError: any) {
      logError("FFmpeg extraction failed", ffmpegError)
      return NextResponse.json(
        { error: `FFmpeg failed: ${ffmpegError.message}` },
        { status: 500 }
      )
    }
  } catch (error: any) {
    logError("Error extracting audio", error)
    return NextResponse.json(
      { error: `Failed to extract audio: ${error.message}` },
      { status: 500 }
    )
  }
}
