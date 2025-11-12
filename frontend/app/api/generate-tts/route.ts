import { NextRequest, NextResponse } from "next/server"
import { join } from "path"
import { mkdir, unlink } from "fs/promises"
import { existsSync } from "fs"
import { exec } from "child_process"
import { promisify } from "util"
import {
  getBaseFilename,
  log,
  logError,
  executeCommand,
} from "@/lib/api-utils"

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    const { subtitles, targetLanguage, videoFilename } = await request.json()

    if (!subtitles || !targetLanguage || !videoFilename) {
      return NextResponse.json(
        { error: "Missing subtitles, target language, or video filename" },
        { status: 400 }
      )
    }

    log(`Generating TTS audio with IndexTTS2 for language: ${targetLanguage}`)

    const publicDir = join(process.cwd(), "public")
    const outputsDir = join(publicDir, "outputs")
    const uploadsDir = join(publicDir, "uploads")
    
    if (!existsSync(outputsDir)) {
      await mkdir(outputsDir, { recursive: true })
    }

    const baseFilename = getBaseFilename(videoFilename)
    const ttsFilename = `${baseFilename}_${targetLanguage}_tts.wav`
    const ttsPath = join(outputsDir, ttsFilename)

    // Extract only the text content from subtitle objects and clean it thoroughly
    // Remove timestamps, numbers, and other SRT formatting
    const cleanText = subtitles
      .map((sub: any) => {
        // Handle both string and object formats
        if (typeof sub === 'string') {
          // If it's a string, it might be raw SRT content - extract text only
          return sub.replace(/^\d+\s*$/gm, '')  // Remove subtitle numbers
                    .replace(/\d{2}:\d{2}:\d{2},\d{3}\s*-->\s*\d{2}:\d{2}:\d{2},\d{3}/g, '')  // Remove timestamps
                    .replace(/^\s*$/gm, '')  // Remove empty lines
                    .trim()
        }
        // If it's an object, extract the text field
        return sub.text || ''
      })
      .filter((text: string) => text.trim().length > 0)
      .join(" ")  // Join with spaces
      .replace(/\s+/g, ' ')  // Normalize whitespace
      .replace(/\d+\s*\d{2}:\d{2}:\d{2},\d{3}\s*-->\s*\d{2}:\d{2}:\d{2},\d{3}/g, '')  // Remove any remaining timestamps
      .trim()
      // NO character limit - process full text

    log(`Generating TTS for cleaned text (${cleanText.length} chars)`)
    log(`Text preview: ${cleanText.substring(0, 100)}...`)

    if (!cleanText || cleanText.length < 10) {
      throw new Error('Insufficient text for TTS generation after cleaning')
    }

    // Get voice prompt from uploaded video (extract first 5 seconds)
    const videoPath = join(uploadsDir, videoFilename)
    const voicePromptPath = join(outputsDir, `${baseFilename}_voice_prompt.wav`)
    
    // Extract audio from video as voice reference
    const ffmpegPath = join(process.cwd(), '..', 'auto-subtitle-main', 'ffmpeg-8.0-full_build', 'bin', 'ffmpeg.exe')
    
    try {
      log(`Extracting voice prompt from video...`)
      await execAsync(
        `"${ffmpegPath}" -i "${videoPath}" -t 5 -ar 16000 -ac 1 "${voicePromptPath}" -y`,
        { maxBuffer: 10 * 1024 * 1024 }
      )
      log(`Voice prompt extracted: ${voicePromptPath}`)
    } catch (err: any) {
      logError("Failed to extract voice prompt, using default", err)
      // Use a default voice prompt from index-tts examples
      const defaultPrompt = join(process.cwd(), '..', 'index-tts', 'examples', 'voice_01.wav')
      if (existsSync(defaultPrompt)) {
        log(`Using default voice prompt: ${defaultPrompt}`)
        // Copy to voice prompt path
        await execAsync(`copy "${defaultPrompt}" "${voicePromptPath}"`)
      } else {
        throw new Error('No voice prompt available')
      }
    }

    // Use IndexTTS2 for high-quality TTS
    const indexttsPython = join(process.cwd(), '..', 'index-tts', '.venv', 'Scripts', 'python.exe')
    const helperScript = join(process.cwd(), 'lib', 'indextts-helper.py')
    
    if (!existsSync(indexttsPython)) {
      throw new Error('IndexTTS2 Python not found. Please ensure index-tts is properly installed.')
    }

    log(`Running IndexTTS2...`)
    
    try {
      // Escape text for command line - remove newlines and escape quotes
      const escapedText = cleanText
        .replace(/\r?\n/g, ' ')  // Replace newlines with spaces
        .replace(/"/g, '\\"')     // Escape double quotes
        .trim()
      
      const { stdout, stderr } = await execAsync(
        `"${indexttsPython}" "${helperScript}" "${escapedText}" "${voicePromptPath}" "${ttsPath}" "${targetLanguage}" "0.6"`,
        { maxBuffer: 10 * 1024 * 1024 }
      )
      
      log(`TTS output: ${stdout}`)
      if (stderr) logError('TTS stderr:', stderr)

      // Parse the JSON result from the Python script
      const lines = stdout.trim().split('\n')
      const lastLine = lines[lines.length - 1]
      const result = JSON.parse(lastLine)
      
      if (!result.success) {
        throw new Error(result.message || 'TTS generation failed')
      }

      log(`TTS generation complete: ${ttsPath}`)

      // Merge TTS audio with original video
      log(`Merging TTS audio with video...`)
      const mergedVideoFilename = `${baseFilename}_${targetLanguage}_tts_video.mp4`
      const mergedVideoPath = join(outputsDir, mergedVideoFilename)
      
      try {
        // Replace video's audio track with TTS audio
        await execAsync(
          `"${ffmpegPath}" -i "${videoPath}" -i "${ttsPath}" -c:v copy -map 0:v:0 -map 1:a:0 -shortest "${mergedVideoPath}" -y`,
          { maxBuffer: 50 * 1024 * 1024 }
        )
        log(`Video merged with TTS audio: ${mergedVideoPath}`)
        
        return NextResponse.json({
          success: true,
          ttsAudioPath: `/outputs/${ttsFilename}`,
          ttsVideoPath: `/outputs/${mergedVideoFilename}`,
          message: 'TTS generated and merged with video'
        })
      } catch (mergeError: any) {
        logError("Video merging failed, returning audio only", mergeError)
        // Return audio even if merging fails
        return NextResponse.json({
          success: true,
          ttsAudioPath: `/outputs/${ttsFilename}`,
          message: 'TTS generated (video merge failed)'
        })
      }
    } catch (pythonError: any) {
      logError("IndexTTS2 generation failed", pythonError)
      throw pythonError
    }
  } catch (error: any) {
    logError("Error generating TTS", error)
    return NextResponse.json(
      { error: `Failed to generate TTS audio: ${error.message}` },
      { status: 500 }
    )
  }
}
