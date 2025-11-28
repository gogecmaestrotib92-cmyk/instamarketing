"use client";

import React from "react";

interface TextButtonProps {
  onOpen: () => void;
}

export default function TextButton({ onOpen }: TextButtonProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-blue-500/25"
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
          d="M4 6h16M4 12h16m-7 6h7"
        />
      </svg>
      Add Text
    </button>
  );
}
