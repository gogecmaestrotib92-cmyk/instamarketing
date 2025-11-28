"use client";

import React, { useState } from "react";
import MusicButton from "@/components/nextjs/MusicButton";
import MusicModal from "@/components/nextjs/MusicModal";
import TextButton from "@/components/nextjs/TextButton";
import TextModal from "@/components/nextjs/TextModal";
import type { MusicConfig, TextConfig, GenerateVideoResponse } from "@/types/video";

export default function CreateVideoPage() {
  // Form state
  const [script, setScript] = useState("");
  const [musicConfig, setMusicConfig] = useState<MusicConfig | null>(null);
  const [textConfig, setTextConfig] = useState<TextConfig | null>(null);

  // Modal state
  const [isMusicOpen, setIsMusicOpen] = useState(false);
  const [isTextOpen, setIsTextOpen] = useState(false);

  // Submission state
  const [loading, setLoading] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleMusicApply = (config: MusicConfig | null) => {
    setMusicConfig(config);
  };

  const handleTextApply = (config: TextConfig | null) => {
    setTextConfig(config);
  };

  const handleGenerate = async () => {
    // Validate script
    if (!script.trim()) {
      setError("Please enter a script for your video");
      return;
    }

    setError(null);
    setResultUrl(null);
    setLoading(true);

    try {
      const response = await fetch("/api/generate-video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          script: script.trim(),
          musicConfig,
          textConfig,
        }),
      });

      const data: GenerateVideoResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to generate video");
      }

      setResultUrl(data.url || null);
    } catch (err: any) {
      setError(err.message || "An error occurred while generating the video");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl mb-4 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Create AI Video</h1>
          <p className="text-gray-400">Enter your script and customize music & text overlays</p>
        </div>

        {/* Main Card */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6 shadow-xl">
          {/* Script Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Video Script (Voiceover Text)
            </label>
            <textarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              placeholder="Enter the script for your AI video. This will be used as the voiceover narration..."
              rows={6}
              className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
            />
            <p className="mt-2 text-xs text-gray-500">
              {script.length} characters
            </p>
          </div>

          {/* Music & Text Buttons */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <MusicButton onOpen={() => setIsMusicOpen(true)} />
            <TextButton onOpen={() => setIsTextOpen(true)} />
          </div>

          {/* Config Summary */}
          {(musicConfig || textConfig) && (
            <div className="mb-6 p-4 bg-gray-900/50 rounded-xl border border-gray-700/50">
              <h3 className="text-sm font-medium text-gray-400 mb-3">Configuration</h3>
              <div className="space-y-2">
                {musicConfig && (
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                    <span className="text-gray-300">
                      Music: {musicConfig.uploadedFileName || musicConfig.trackUrl?.split("/").pop() || "Selected"}
                    </span>
                    <span className="text-gray-500">
                      ({Math.round(musicConfig.volume * 100)}% volume)
                    </span>
                  </div>
                )}
                {textConfig && (
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-gray-300">
                      Text: {textConfig.overlayText ? `"${textConfig.overlayText.substring(0, 30)}${textConfig.overlayText.length > 30 ? "..." : ""}"` : ""}
                      {textConfig.captions.length > 0 && ` + ${textConfig.captions.length} caption${textConfig.captions.length !== 1 ? "s" : ""}`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Generate Button */}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Generating Video...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Generate Video
              </>
            )}
          </button>

          {/* Result */}
          {resultUrl && (
            <div className="mt-6 p-4 bg-green-500/10 border border-green-500/50 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-green-400 font-medium">Video Generated Successfully!</span>
              </div>
              <a
                href={resultUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                {resultUrl}
              </a>
            </div>
          )}
        </div>

        {/* Debug: Show Payload */}
        <details className="mt-6">
          <summary className="text-gray-500 text-sm cursor-pointer hover:text-gray-400">
            View API Payload
          </summary>
          <pre className="mt-2 p-4 bg-gray-900 rounded-xl text-xs text-gray-400 overflow-auto max-h-64">
            {JSON.stringify(
              {
                script: script.trim(),
                musicConfig,
                textConfig,
              },
              null,
              2
            )}
          </pre>
        </details>
      </div>

      {/* Modals */}
      <MusicModal
        isOpen={isMusicOpen}
        onClose={() => setIsMusicOpen(false)}
        onApply={handleMusicApply}
      />

      <TextModal
        isOpen={isTextOpen}
        onClose={() => setIsTextOpen(false)}
        onApply={handleTextApply}
      />
    </div>
  );
}
