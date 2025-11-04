import { NextRequest, NextResponse } from "next/server"
import { join } from "path"
import { readFile, mkdir, writeFile } from "fs/promises"
import { existsSync } from "fs"
import {
  getPythonCommand,
  parseSRT,
  convertSRTtoVTT,
  getBaseFilename,
  log,
  logError,
  executeCommand,
} from "@/lib/api-utils"

export async function POST(request: NextRequest) {
  try {
    const { videoFilename, model = "small" } = await request.json()

    if (!videoFilename) {
      return NextResponse.json({ error: "No video filename provided" }, { status: 400 })
    }

    log(`Generating subtitles for: ${videoFilename}`)

    // Setup paths
    const uploadsDir = join(process.cwd(), "public", "uploads")
    const outputsDir = join(process.cwd(), "public", "outputs")
    if (!existsSync(outputsDir)) {
      await mkdir(outputsDir, { recursive: true })
      log(`Created outputs directory: ${outputsDir}`)
    }

    const videoPath = join(uploadsDir, videoFilename)
    const baseFilename = getBaseFilename(videoFilename)

    // Check if video file exists
    if (!existsSync(videoPath)) {
      return NextResponse.json({ error: "Video file not found" }, { status: 404 })
    }

    log(`Video path: ${videoPath}`)
    log(`Using Whisper model: ${model}`)
    log(`Output directory: ${outputsDir}`)

    // Run auto_subtitle CLI using Python module
    // We'll call it directly: python -m auto_subtitle.cli
    const pythonCmd = getPythonCommand()
    
    try {
      log(`Running Whisper transcription...`)
      await executeCommand(
        pythonCmd,
        [
          "-m",
          "auto_subtitle.cli",
          videoPath,
          "--output_dir",
          outputsDir,
          "--srt_only",
          "True",
          "--output_srt",
          "True",
          "--model",
          model,
        ],
        (data) => log(`Python: ${data}`)
      )

      log(`Whisper transcription complete`)
    } catch (pythonError: any) {
      logError("Python transcription failed", pythonError)
      return NextResponse.json(
        { error: `Transcription failed: ${pythonError.message}` },
        { status: 500 }
      )
    }

    // Read the generated SRT
    const srtPath = join(outputsDir, `${baseFilename}.srt`)
    
    if (!existsSync(srtPath)) {
      logError("SRT file not found after transcription", { srtPath })
      return NextResponse.json(
        { error: "Subtitle file was not generated" },
        { status: 500 }
      )
    }

    const srtContent = await readFile(srtPath, "utf-8")
    log(`Read SRT file: ${srtContent.length} characters`)

    // Parse SRT to JSON
    const subtitles = parseSRT(srtContent)
    log(`Parsed ${subtitles.length} subtitle blocks`)

    // Generate VTT
    const vttContent = convertSRTtoVTT(srtContent)
    const vttPath = join(outputsDir, `${baseFilename}.vtt`)
    await writeFile(vttPath, vttContent, "utf-8")
    log(`Generated VTT file: ${vttPath}`)

    return NextResponse.json({
      success: true,
      subtitles,
      srtPath: `/outputs/${baseFilename}.srt`,
      vttPath: `/outputs/${baseFilename}.vtt`,
    })
  } catch (error: any) {
    logError("Error generating subtitles", error)
    return NextResponse.json(
      { error: `Failed to generate subtitles: ${error.message}` },
      { status: 500 }
    )
  }
}
