"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, FileText, Video, Volume2 } from "lucide-react"

interface DownloadSectionProps {
  outputs: {
    srtPath?: string
    vttPath?: string
    burnedVideoPath?: string
    translatedSrtPath?: string
    translatedBurnedVideoPath?: string
    ttsAudioPath?: string
    ttsVideoPath?: string
  }
}

export default function DownloadSection({ outputs }: DownloadSectionProps) {
  const handleDownload = (path: string, filename: string) => {
    const link = document.createElement("a")
    link.href = `/api/download?path=${encodeURIComponent(path)}`
    link.download = filename
    link.click()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Downloads
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {outputs.srtPath && (
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => handleDownload(outputs.srtPath!, "subtitles.srt")}
          >
            <FileText className="h-4 w-4 mr-2" />
            Download Original SRT
          </Button>
        )}

        {outputs.vttPath && (
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => handleDownload(outputs.vttPath!, "subtitles.vtt")}
          >
            <FileText className="h-4 w-4 mr-2" />
            Download Original VTT
          </Button>
        )}

        {outputs.burnedVideoPath && (
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => handleDownload(outputs.burnedVideoPath!, "video_with_subtitles.mp4")}
          >
            <Video className="h-4 w-4 mr-2" />
            Download Video with Original Subtitles
          </Button>
        )}

        {outputs.translatedSrtPath && (
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => handleDownload(outputs.translatedSrtPath!, "subtitles_translated.srt")}
          >
            <FileText className="h-4 w-4 mr-2" />
            Download Translated SRT
          </Button>
        )}

        {outputs.translatedBurnedVideoPath && (
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => handleDownload(outputs.translatedBurnedVideoPath!, "video_with_translated_subtitles.mp4")}
          >
            <Video className="h-4 w-4 mr-2" />
            Download Video with Translated Subtitles
          </Button>
        )}

        {outputs.ttsAudioPath && (
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => handleDownload(outputs.ttsAudioPath!, "tts_audio.wav")}
          >
            <Volume2 className="h-4 w-4 mr-2" />
            Download TTS Audio
          </Button>
        )}

        {outputs.ttsVideoPath && (
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => handleDownload(outputs.ttsVideoPath!, "video_with_tts_audio.mp4")}
          >
            <Video className="h-4 w-4 mr-2" />
            Download Video with TTS Audio
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
