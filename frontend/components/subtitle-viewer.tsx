"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText } from "lucide-react"

interface Subtitle {
  index: number
  start: string
  end: string
  text: string
}

interface SubtitleViewerProps {
  subtitles: Subtitle[]
  title: string
}

export default function SubtitleViewer({ subtitles, title }: SubtitleViewerProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="max-h-96 overflow-y-auto space-y-3 pr-2">
          {subtitles.map((subtitle) => (
            <div key={subtitle.index} className="border-l-2 border-primary/30 pl-3 py-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <span>{subtitle.start}</span>
                <span>→</span>
                <span>{subtitle.end}</span>
              </div>
              <p className="text-sm">{subtitle.text}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
