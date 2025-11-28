import React from "react";
import { DESIGN_TOKENS } from "@/const";

interface GranularProgressBarProps {
  status:
    | "pending"
    | "gemini_analyzing"
    | "deepseek_generating"
    | "complete"
    | "error";
  progress: number; // 0-100
  errorMessage?: string;
}

const statusConfig = {
  pending: {
    label: "Preparing Analysis...",
    color: DESIGN_TOKENS.lvTeal,
    progress: 0,
  },
  gemini_analyzing: {
    label: "Analyzing Visual Aesthetics...",
    color: DESIGN_TOKENS.lvTeal,
    progress: 25,
  },
  deepseek_generating: {
    label: "Detecting Brand Mood & Narrative...",
    color: DESIGN_TOKENS.lvTeal,
    progress: 60,
  },
  complete: {
    label: "Drafting Mandarin Social Copy...",
    color: DESIGN_TOKENS.lvTeal,
    progress: 100,
  },
  error: {
    label: "Processing Failed",
    color: DESIGN_TOKENS.errorRed,
    progress: 0,
  },
};

export function GranularProgressBar({
  status,
  progress,
  errorMessage,
}: GranularProgressBarProps) {
  const config = statusConfig[status];
  const displayProgress = status === "error" ? 0 : Math.max(progress, config.progress);

  return (
    <div className="w-full space-y-2">
      {/* Label */}
      <div className="flex items-center justify-between">
        <p
          className="text-sm font-medium"
          style={{ color: DESIGN_TOKENS.lvNavy }}
        >
          {config.label}
        </p>
        <span
          className="text-xs font-semibold"
          style={{ color: DESIGN_TOKENS.lvTeal }}
        >
          {displayProgress}%
        </span>
      </div>

      {/* Progress Bar */}
      <div
        className="w-full h-3 rounded-full overflow-hidden"
        style={{ backgroundColor: DESIGN_TOKENS.lvSoftMint }}
      >
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${displayProgress}%`,
            backgroundColor: config.color,
          }}
        />
      </div>

      {/* Error Message */}
      {errorMessage && (
        <p className="text-xs mt-2" style={{ color: DESIGN_TOKENS.errorRed }}>
          {errorMessage}
        </p>
      )}
    </div>
  );
}
