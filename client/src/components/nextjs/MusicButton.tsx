"use client";

import React from "react";

interface MusicButtonProps {
  onOpen: () => void;
}

export default function MusicButton({ onOpen }: MusicButtonProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex items-center gap-2 px-5 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-purple-500/25"
    >
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
        />
      </svg>
      Add Music
    </button>
  );
}
