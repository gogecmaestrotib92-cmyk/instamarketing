"use client";

import React, { useState } from "react";
import type { TextConfig, CaptionSegment } from "@/types/video";

interface TextModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (config: TextConfig | null) => void;
}

export default function TextModal({ isOpen, onClose, onApply }: TextModalProps) {
  const [overlayText, setOverlayText] = useState("");
  const [captions, setCaptions] = useState<CaptionSegment[]>([]);
  const [newText, setNewText] = useState("");
  const [newStart, setNewStart] = useState("");
  const [newEnd, setNewEnd] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddCaption = () => {
    setError(null);

    if (!newText.trim()) {
      setError("Caption text is required");
      return;
    }

    const startNum = parseFloat(newStart);
    const endNum = parseFloat(newEnd);

    if (isNaN(startNum) || startNum < 0) {
      setError("Start time must be a valid positive number");
      return;
    }

    if (isNaN(endNum) || endNum <= startNum) {
      setError("End time must be greater than start time");
      return;
    }

    const newCaption: CaptionSegment = {
      text: newText.trim(),
      start: startNum,
      end: endNum,
    };

    setCaptions([...captions, newCaption]);
    setNewText("");
    setNewStart("");
    setNewEnd("");
  };

  const handleDeleteCaption = (index: number) => {
    setCaptions(captions.filter((_, i) => i !== index));
  };

  const handleApply = () => {
    const config: TextConfig = {
      overlayText: overlayText.trim(),
      captions,
    };
    onApply(config);
    resetAndClose();
  };

  const handleCancel = () => {
    resetAndClose();
  };

  const resetAndClose = () => {
    onClose();
  };

  const handleRemoveText = () => {
    onApply(null);
    resetAndClose();
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(1);
    return `${mins}:${secs.padStart(4, "0")}`;
  };

  const hasContent = overlayText.trim() || captions.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="max-w-lg w-full mx-4 p-6 rounded-2xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Add Text & Captions</h2>
          <button
            onClick={handleCancel}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Overlay Text */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Overlay Text (displayed throughout video)
          </label>
          <textarea
            value={overlayText}
            onChange={(e) => setOverlayText(e.target.value)}
            placeholder="Enter text to display on video..."
            rows={2}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
          />
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-sm text-gray-400">Timed Captions</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Add Caption Form */}
        <div className="mb-4 p-4 bg-gray-50 rounded-xl">
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Caption Text
            </label>
            <input
              type="text"
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="Enter caption text..."
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start (seconds)
              </label>
              <input
                type="number"
                value={newStart}
                onChange={(e) => setNewStart(e.target.value)}
                placeholder="0"
                min="0"
                step="0.1"
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End (seconds)
              </label>
              <input
                type="number"
                value={newEnd}
                onChange={(e) => setNewEnd(e.target.value)}
                placeholder="3"
                min="0"
                step="0.1"
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-sm mb-3">{error}</p>
          )}

          <button
            type="button"
            onClick={handleAddCaption}
            className="w-full px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors font-medium text-sm flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Caption
          </button>
        </div>

        {/* Caption List */}
        {captions.length > 0 && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Captions ({captions.length})
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {captions.map((caption, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 text-sm truncate">{caption.text}</p>
                    <p className="text-gray-500 text-xs">
                      {formatTime(caption.start)} → {formatTime(caption.end)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteCaption(index)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {captions.length === 0 && (
          <div className="mb-6 text-center py-6 text-gray-400 text-sm">
            <svg className="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
            No captions added yet
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleRemoveText}
            className="px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-colors text-sm font-medium"
          >
            Remove Text
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
            disabled={!hasContent}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Apply Text
          </button>
        </div>
      </div>
    </div>
  );
}
