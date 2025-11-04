import { NextRequest, NextResponse } from "next/server"
import { join } from "path"
import { writeFile, readFile } from "fs/promises"
import { existsSync } from "fs"
import {
  getPythonCommand,
  parseSRT,
  getBaseFilename,
  log,
  logError,
  executeCommand,
} from "@/lib/api-utils"

export async function POST(request: NextRequest) {
  try {
    const { subtitles, targetLanguage, videoFilename } = await request.json()

    if (!targetLanguage || !videoFilename) {
      return NextResponse.json(
        { error: "Missing target language or video filename" },
        { status: 400 }
      )
    }

    log(`Translating subtitles to: ${targetLanguage}`)

    const uploadsDir = join(process.cwd(), "public", "uploads")
    const outputsDir = join(process.cwd(), "public", "outputs")
    const videoPath = join(uploadsDir, videoFilename)
    const baseFilename = getBaseFilename(videoFilename)

    // Check if video exists
    if (!existsSync(videoPath)) {
      return NextResponse.json({ error: "Video file not found" }, { status: 404 })
    }

    log(`Video path: ${videoPath}`)
    log(`Target language: ${targetLanguage}`)

    // Run auto_subtitle with translation
    const pythonCmd = getPythonCommand()

    try {
      log(`Running translation with auto_subtitle CLI...`)
      await executeCommand(
        pythonCmd,
        [
          "-m",
          "auto_subtitle.cli",
          videoPath,
          "--output_dir",
          outputsDir,
          "--target_language",
          targetLanguage,
          "--srt_only",
          "True",
          "--output_srt",
          "True",
          "--model",
          "small",
        ],
        (data) => log(`Python: ${data}`)
      )

      log(`Translation complete`)
    } catch (pythonError: any) {
      logError("Translation failed", pythonError)
      return NextResponse.json(
        { error: `Translation failed: ${pythonError.message}` },
        { status: 500 }
      )
    }

    // Read the translated SRT file
    const translatedFilename = `${baseFilename}.${targetLanguage}.srt`
    const translatedSrtPath = join(outputsDir, translatedFilename)

    if (!existsSync(translatedSrtPath)) {
      logError("Translated SRT not found", { translatedSrtPath })
      return NextResponse.json(
        { error: "Translation file was not generated" },
        { status: 500 }
      )
    }

    const translatedContent = await readFile(translatedSrtPath, "utf-8")
    log(`Read translated SRT: ${translatedContent.length} characters`)

    const translatedSubtitles = parseSRT(translatedContent)
    log(`Parsed ${translatedSubtitles.length} translated subtitle blocks`)

    return NextResponse.json({
      success: true,
      translatedSubtitles,
      translatedSrtPath: `/outputs/${translatedFilename}`,
    })
  } catch (error: any) {
    logError("Error translating subtitles", error)
    return NextResponse.json(
      { error: `Failed to translate subtitles: ${error.message}` },
      { status: 500 }
    )
  }
}
