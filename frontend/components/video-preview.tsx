"use client"

import { useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Play } from "lucide-react"

interface VideoPreviewProps {
  videoUrl: string
  subtitles: any[]
}

export default function VideoPreview({ videoUrl, subtitles }: VideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Play className="h-5 w-5" />
          Video Preview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <video
          ref={videoRef}
          src={videoUrl}
          controls
          className="w-full rounded-lg bg-black"
        />
      </CardContent>
    </Card>
  )
}
