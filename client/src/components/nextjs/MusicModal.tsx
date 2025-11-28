"use client";

import React, { useState, useRef } from "react";
import type { MusicConfig } from "@/types/video";

interface MusicModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (config: MusicConfig | null) => void;
}

const PRESET_TRACKS = [
  { label: "Ambient Flow", url: "/audio/ambient1.mp3" },
  { label: "Uplifting Beat", url: "/audio/uplift1.mp3" },
  { label: "Soft Piano", url: "/audio/piano1.mp3" },
];

export default function MusicModal({ isOpen, onClose, onApply }: MusicModalProps) {
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [volume, setVolume] = useState(0.35);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleTrackChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedTrack(value || null);
    setUploadedFile(null);
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = value || "";
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      setUploadedFile(file);
      setSelectedTrack(null);
      setIsPlaying(false);
      if (audioRef.current) {
        audioRef.current.src = URL.createObjectURL(file);
      }
    }
  };

  const handlePreview = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.volume = volume;
        audioRef.current.play().catch(console.error);
        setIsPlaying(true);
      }
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const handleApply = () => {
    const config: MusicConfig = {
      enabled: true,
      trackUrl: uploadedFile ? null : selectedTrack,
      uploadedFileName: uploadedFile ? uploadedFile.name : null,
      volume,
    };
    onApply(config);
    resetAndClose();
  };

  const handleCancel = () => {
    resetAndClose();
  };

  const resetAndClose = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
    onClose();
  };

  const handleRemoveMusic = () => {
    onApply(null);
    resetAndClose();
  };

  const hasSelection = selectedTrack || uploadedFile;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="max-w-md w-full mx-4 p-6 rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Add Background Music</h2>
          <button
            onClick={handleCancel}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Preset Tracks */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Preset Track
          </label>
          <select
            value={selectedTrack || ""}
            onChange={handleTrackChange}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          >
            <option value="">-- Choose a track --</option>
            {PRESET_TRACKS.map((track) => (
              <option key={track.url} value={track.url}>
                {track.label}
              </option>
            ))}
          </select>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-sm text-gray-400">or</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* File Upload */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload Custom Audio
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-purple-400 hover:text-purple-600 transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            {uploadedFile ? uploadedFile.name : "Click to upload audio file"}
          </button>
        </div>

        {/* Preview Button */}
        {hasSelection && (
          <div className="mb-5">
            <button
              type="button"
              onClick={handlePreview}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition-colors"
            >
              {isPlaying ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6" />
                  </svg>
                  Pause Preview
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  </svg>
                  Preview
                </>
              )}
            </button>
          </div>
        )}

        {/* Volume Slider */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Volume: {Math.round(volume * 100)}%
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolumeChange}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleRemoveMusic}
            className="px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-colors text-sm font-medium"
          >
            Remove Music
          </button>
          <div className="flex-1" />
          <button
            type="button"
            onClick={handleCancel}
            className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={!hasSelection}
            className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Apply Music
          </button>
        </div>

        {/* Hidden Audio Element */}
        <audio
          ref={audioRef}
          onEnded={() => setIsPlaying(false)}
          className="hidden"
        />
      </div>
    </div>
  );
}
