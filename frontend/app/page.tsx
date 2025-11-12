"use client"

import { useState } from "react"
import Link from "next/link"
import VideoUpload from "@/components/video-upload"
import ProcessingStatus from "@/components/processing-status"
import SubtitleViewer from "@/components/subtitle-viewer"
import TranslationPanel from "@/components/translation-panel"
import VideoPreview from "@/components/video-preview"
import DownloadSection from "@/components/download-section"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Info } from "lucide-react"

export default function Home() {
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoUrl, setVideoUrl] = useState<string>("")
  const [processing, setProcessing] = useState(false)
  const [currentStep, setCurrentStep] = useState<string>("")
  const [progress, setProgress] = useState(0)
  const [subtitles, setSubtitles] = useState<any[]>([])
  const [translatedSubtitles, setTranslatedSubtitles] = useState<any[]>([])
  const [outputs, setOutputs] = useState<{
    srtPath?: string
    vttPath?: string
    burnedVideoPath?: string
    translatedSrtPath?: string
    translatedBurnedVideoPath?: string
    ttsAudioPath?: string
  }>({})

  const handleVideoUpload = (file: File) => {
    setVideoFile(file)
    const url = URL.createObjectURL(file)
    setVideoUrl(url)
    setSubtitles([])
    setTranslatedSubtitles([])
    setOutputs({})
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            AutoTranscriber
          </h1>
          <p className="text-muted-foreground text-lg">
            AI-Powered Video Subtitling & Translation
          </p>
          <Link href="/showcase">
            <Button variant="outline" className="gap-2">
              <Info className="h-4 w-4" />
              View Features & Documentation
            </Button>
          </Link>
        </div>

        {/* Upload Section */}
        {!videoFile && (
          <VideoUpload onUpload={handleVideoUpload} />
        )}

        {/* Processing View */}
        {videoFile && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Video Preview */}
              <VideoPreview
                videoUrl={videoUrl}
                subtitles={translatedSubtitles.length > 0 ? translatedSubtitles : subtitles}
              />

              {/* Processing Status */}
              {processing && (
                <ProcessingStatus
                  currentStep={currentStep}
                  progress={progress}
                />
              )}

              {/* Subtitle Viewer */}
              {subtitles.length > 0 && (
                <SubtitleViewer
                  subtitles={subtitles}
                  title="Original Subtitles"
                />
              )}

              {/* Translated Subtitles */}
              {translatedSubtitles.length > 0 && (
                <SubtitleViewer
                  subtitles={translatedSubtitles}
                  title="Translated Subtitles"
                />
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Translation Panel */}
              <TranslationPanel
                videoFile={videoFile}
                subtitles={subtitles}
                translatedSubtitles={translatedSubtitles}
                onProcessingChange={setProcessing}
                onStepChange={setCurrentStep}
                onProgressChange={setProgress}
                onSubtitlesGenerated={setSubtitles}
                onTranslatedSubtitlesGenerated={setTranslatedSubtitles}
                onOutputsUpdate={setOutputs}
              />

              {/* Download Section */}
              {Object.keys(outputs).length > 0 && (
                <DownloadSection outputs={outputs} />
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
