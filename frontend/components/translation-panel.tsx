"use client"

import { useState } from "react"
import axios from "axios"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Languages, Wand2, Volume2 } from "lucide-react"

interface TranslationPanelProps {
  videoFile: File | null
  subtitles: any[]
  translatedSubtitles?: any[]
  onProcessingChange: (processing: boolean) => void
  onStepChange: (step: string) => void
  onProgressChange: (progress: number) => void
  onSubtitlesGenerated: (subtitles: any[]) => void
  onTranslatedSubtitlesGenerated: (subtitles: any[]) => void
  onOutputsUpdate: (outputs: any) => void
}

const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "it", name: "Italian" },
  { code: "pt", name: "Portuguese" },
  { code: "hi", name: "Hindi" },
  { code: "zh", name: "Chinese" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "ar", name: "Arabic" },
  { code: "ru", name: "Russian" },
]

export default function TranslationPanel({
  videoFile,
  subtitles,
  translatedSubtitles,
  onProcessingChange,
  onStepChange,
  onProgressChange,
  onSubtitlesGenerated,
  onTranslatedSubtitlesGenerated,
  onOutputsUpdate,
}: TranslationPanelProps) {
  const [targetLanguage, setTargetLanguage] = useState<string>("")
  const [enableTTS, setEnableTTS] = useState(false)
  const [burnedVideoPath, setBurnedVideoPath] = useState<string>("")
  const [translatedBurnedVideoPath, setTranslatedBurnedVideoPath] = useState<string>("")

  const handleGenerateSubtitles = async () => {
    if (!videoFile) return

    onProcessingChange(true)
    onStepChange("Extracting audio from video...")
    onProgressChange(10)

    const formData = new FormData()
    formData.append("video", videoFile)

    try {
      // Step 1: Extract audio
      const audioResponse = await axios.post("/api/extract-audio", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      
      const { videoFilename } = audioResponse.data
      
      onProgressChange(30)
      onStepChange("Transcribing audio with Whisper AI...")

      // Step 2: Generate subtitles - pass videoFilename instead of audioPath
      const subtitleResponse = await axios.post("/api/generate-subtitles", {
        videoFilename: videoFilename,
        model: "small"
      })
      
      onProgressChange(70)
      onStepChange("Creating subtitle files...")

      onSubtitlesGenerated(subtitleResponse.data.subtitles)
      onOutputsUpdate((prev: any) => ({
        ...prev,
        srtPath: subtitleResponse.data.srtPath,
        vttPath: subtitleResponse.data.vttPath,
      }))

      onProgressChange(100)
      onStepChange("Subtitles generated successfully!")
    } catch (error) {
      console.error("Error generating subtitles:", error)
      onStepChange("Error generating subtitles")
    } finally {
      setTimeout(() => onProcessingChange(false), 1000)
    }
  }

  const handleBurnSubtitles = async () => {
    if (!videoFile || subtitles.length === 0) return

    onProcessingChange(true)
    onStepChange("Burning subtitles into video...")
    onProgressChange(10)

    try {
      const response = await axios.post("/api/burn-subtitles", {
        videoFilename: videoFile.name,
        srtPath: "outputs/" + videoFile.name.replace(/\.[^/.]+$/, ".srt"),
      })

      onProgressChange(100)
      onStepChange("Video with subtitles created!")
      setBurnedVideoPath(response.data.burnedVideoPath)
      onOutputsUpdate((prev: any) => ({
        ...prev,
        burnedVideoPath: response.data.burnedVideoPath,
      }))
    } catch (error) {
      console.error("Error burning subtitles:", error)
      onStepChange("Error burning subtitles")
    } finally {
      setTimeout(() => onProcessingChange(false), 1000)
    }
  }

  const handleTranslate = async () => {
    if (!targetLanguage || subtitles.length === 0) return

    onProcessingChange(true)
    onStepChange(`Translating to ${LANGUAGES.find((l) => l.code === targetLanguage)?.name}...`)
    onProgressChange(20)

    try {
      const response = await axios.post("/api/translate-subtitles", {
        subtitles,
        targetLanguage,
        videoFilename: videoFile?.name,
      })

      onProgressChange(70)
      onTranslatedSubtitlesGenerated(response.data.translatedSubtitles)
      onOutputsUpdate((prev: any) => ({
        ...prev,
        translatedSrtPath: response.data.translatedSrtPath,
      }))

      onProgressChange(100)
      onStepChange("Translation complete!")
    } catch (error) {
      console.error("Error translating subtitles:", error)
      onStepChange("Error translating subtitles")
    } finally {
      setTimeout(() => onProcessingChange(false), 1000)
    }
  }

  const handleBurnTranslated = async () => {
    if (!videoFile || !targetLanguage) return

    onProcessingChange(true)
    onStepChange("Burning translated subtitles into video...")
    onProgressChange(10)

    try {
      const response = await axios.post("/api/burn-subtitles", {
        videoFilename: videoFile.name,
        srtPath: "outputs/" + videoFile.name.replace(/\.[^/.]+$/, `.${targetLanguage}.srt`),
        outputSuffix: `_${targetLanguage}`,
      })

      onProgressChange(100)
      onStepChange("Translated video created!")
      setTranslatedBurnedVideoPath(response.data.burnedVideoPath)
      onOutputsUpdate((prev: any) => ({
        ...prev,
        translatedBurnedVideoPath: response.data.burnedVideoPath,
      }))
    } catch (error) {
      console.error("Error burning translated subtitles:", error)
    } finally {
      setTimeout(() => onProcessingChange(false), 1000)
    }
  }

  const handleGenerateTTS = async () => {
    if (!targetLanguage) return

    onProcessingChange(true)
    onStepChange("Generating TTS audio...")
    onProgressChange(30)

    try {
      // Use translated subtitles if available, otherwise fall back to original
      const subtitlesToUse = translatedSubtitles && translatedSubtitles.length > 0 
        ? translatedSubtitles 
        : subtitles

      const response = await axios.post("/api/generate-tts", {
        subtitles: subtitlesToUse,
        targetLanguage,
        videoFilename: videoFile?.name,
      })

      onProgressChange(100)
      onStepChange("TTS audio generated and merged with video!")
      onOutputsUpdate((prev: any) => ({
        ...prev,
        ttsAudioPath: response.data.ttsAudioPath,
        ttsVideoPath: response.data.ttsVideoPath,
      }))
    } catch (error) {
      console.error("Error generating TTS:", error)
      onStepChange("Error generating TTS")
    } finally {
      setTimeout(() => onProcessingChange(false), 1000)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="h-5 w-5" />
          Process & Translate
        </CardTitle>
        <CardDescription>
          Generate subtitles, translate, and create final outputs
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Generate Original Subtitles */}
        <div className="space-y-2">
          <h3 className="font-medium text-sm">Step 1: Generate Subtitles</h3>
          <Button onClick={handleGenerateSubtitles} className="w-full" disabled={!videoFile}>
            Generate Original Subtitles
          </Button>
        </div>

        {/* Burn Original Subtitles */}
        {subtitles.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-medium text-sm">Step 2: Burn Subtitles (Optional)</h3>
            <Button onClick={handleBurnSubtitles} variant="outline" className="w-full">
              Burn Original Subtitles to Video
            </Button>
          </div>
        )}

        {/* Translation Section */}
        {subtitles.length > 0 && (
          <>
            <div className="border-t pt-4 space-y-3">
              <div className="flex items-center gap-2">
                <Languages className="h-4 w-4" />
                <h3 className="font-medium text-sm">Step 3: Translation</h3>
              </div>

              <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                <SelectTrigger>
                  <SelectValue placeholder="Select target language" />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button onClick={handleTranslate} className="w-full" disabled={!targetLanguage}>
                Translate Subtitles
              </Button>
            </div>

            {/* Burn Translated Subtitles */}
            {targetLanguage && (
              <div className="space-y-2">
                <h3 className="font-medium text-sm">Step 4: Burn Translated Subtitles</h3>
                <Button onClick={handleBurnTranslated} variant="outline" className="w-full">
                  Burn Translated Subtitles to Video
                </Button>
              </div>
            )}

            {/* TTS Section */}
            {targetLanguage && (
              <div className="border-t pt-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4" />
                  <h3 className="font-medium text-sm">Step 5: Text-to-Speech (Optional)</h3>
                </div>

                <Button onClick={handleGenerateTTS} variant="secondary" className="w-full">
                  Generate TTS Audio
                </Button>
              </div>
            )}
          </>
        )}

        {/* Display Burned Videos */}
        {(burnedVideoPath || translatedBurnedVideoPath) && (
          <div className="border-t pt-4 space-y-4">
            <h3 className="font-medium text-sm">Generated Videos</h3>
            
            {burnedVideoPath && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Original Subtitles:</p>
                <video 
                  controls 
                  className="w-full rounded-lg border"
                  src={burnedVideoPath}
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            )}

            {translatedBurnedVideoPath && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Translated Subtitles ({LANGUAGES.find((l) => l.code === targetLanguage)?.name}):
                </p>
                <video 
                  controls 
                  className="w-full rounded-lg border"
                  src={translatedBurnedVideoPath}
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
