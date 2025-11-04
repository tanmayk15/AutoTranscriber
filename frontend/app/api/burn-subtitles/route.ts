import { NextRequest, NextResponse } from "next/server"
import { join } from "path"
import { existsSync } from "fs"
import {
  getFFmpegPath,
  getBaseFilename,
  log,
  logError,
  executeCommand,
} from "@/lib/api-utils"

export async function POST(request: NextRequest) {
  try {
    const { videoFilename, srtPath, outputSuffix = "" } = await request.json()

    if (!videoFilename || !srtPath) {
      return NextResponse.json(
        { error: "Missing video filename or SRT path" },
        { status: 400 }
      )
    }

    log(`Burning subtitles into video: ${videoFilename}`)
    log(`SRT path: ${srtPath}`)
    log(`Output suffix: ${outputSuffix}`)

    const ffmpegPath = getFFmpegPath()
    const uploadsDir = join(process.cwd(), "public", "uploads")
    const outputsDir = join(process.cwd(), "public", "outputs")

    const videoPath = join(uploadsDir, videoFilename)
    const fullSrtPath = join(process.cwd(), "public", srtPath)

    // Verify files exist
    if (!existsSync(videoPath)) {
      return NextResponse.json({ error: "Video file not found" }, { status: 404 })
    }

    if (!existsSync(fullSrtPath)) {
      return NextResponse.json({ error: "Subtitle file not found" }, { status: 404 })
    }

    const baseFilename = getBaseFilename(videoFilename)
    const outputFilename = `${baseFilename}${outputSuffix}_subtitled.mp4`
    const outputPath = join(outputsDir, outputFilename)

    log(`Input video: ${videoPath}`)
    log(`Input SRT: ${fullSrtPath}`)
    log(`Output video: ${outputPath}`)

    // For Windows paths with spaces, use Windows-style escaping for FFmpeg
    // Convert to forward slashes and escape special characters for the subtitle filter
    const escapedSrtPath = fullSrtPath
      .replace(/\\/g, "/")
      .replace(/:/g, "\\\\:")
      .replace(/ /g, "\\ ")
      .replace(/!/g, "\\!")
      .replace(/\[/g, "\\[")
      .replace(/\]/g, "\\]")

    log(`Escaped SRT path for FFmpeg: ${escapedSrtPath}`)

    try {
      await executeCommand(
        ffmpegPath,
        [
          "-i", videoPath,
          "-vf", `subtitles=${escapedSrtPath}:force_style='FontSize=24,PrimaryColour=&HFFFFFF,OutlineColour=&H000000,BorderStyle=3'`,
          "-c:a", "copy",
          "-y", // Overwrite output
          outputPath,
        ],
        (data) => log(`FFmpeg: ${data}`)
      )

      log(`Successfully burned subtitles: ${outputPath}`)

      return NextResponse.json({
        success: true,
        burnedVideoPath: `/outputs/${outputFilename}`,
      })
    } catch (ffmpegError: any) {
      logError("FFmpeg burn failed", ffmpegError)
      return NextResponse.json(
        { error: `Failed to burn subtitles: ${ffmpegError.message}` },
        { status: 500 }
      )
    }
  } catch (error: any) {
    logError("Error burning subtitles", error)
    return NextResponse.json(
      { error: `Failed to burn subtitles: ${error.message}` },
      { status: 500 }
    )
  }
}
