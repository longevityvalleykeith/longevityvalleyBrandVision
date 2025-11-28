import React, { useState } from "react";
import { Copy, Info } from "lucide-react";
import { DESIGN_TOKENS } from "@/const";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ContentPiece {
  storyboardMandarin: string;
  captionMandarin: string;
  explanationEnglish: string;
}

interface VisionResultCardProps {
  colors?: {
    primary: string[];
    secondary: string[];
    accent?: string[];
    description?: string;
  };
  contentPieces?: ContentPiece[];
  isLoading?: boolean;
}

export function VisionResultCard({
  colors,
  contentPieces = [],
  isLoading = false,
}: VisionResultCardProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Parse color hex codes from strings like "White (Purity, Modernity)"
  const extractHexColor = (colorStr: string): string | null => {
    // Try to find hex color in the string
    const hexMatch = colorStr.match(/#[0-9A-F]{6}/i);
    if (hexMatch) return hexMatch[0];

    // Fallback: map common color names to hex
    const colorMap: Record<string, string> = {
      white: "#FFFFFF",
      black: "#000000",
      gray: "#808080",
      red: "#FF0000",
      blue: "#0000FF",
      green: "#00FF00",
      yellow: "#FFFF00",
      orange: "#FFA500",
      purple: "#800080",
      pink: "#FFC0CB",
      brown: "#A52A2A",
      navy: "#000080",
      teal: "#008080",
      mint: "#98FF98",
      beige: "#F5F5DC",
      cream: "#FFFDD0",
    };

    const lowerStr = colorStr.toLowerCase();
    for (const [name, hex] of Object.entries(colorMap)) {
      if (lowerStr.includes(name)) return hex;
    }

    return null;
  };

  if (isLoading) {
    return (
      <div
        className="p-6 rounded-lg border"
        style={{
          borderColor: `${DESIGN_TOKENS.lvTeal}33`,
          backgroundColor: DESIGN_TOKENS.lvSoftMint,
        }}
      >
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-300 rounded w-1/4"></div>
          <div className="h-12 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-lg border shadow-sm overflow-hidden"
      style={{
        borderColor: `${DESIGN_TOKENS.lvTeal}33`,
        backgroundColor: DESIGN_TOKENS.lvSoftMint,
      }}
    >
      {/* Section 1: Color Palette */}
      {colors && (
        <div className="p-6 border-b" style={{ borderColor: `${DESIGN_TOKENS.lvTeal}20` }}>
          <h3
            className="text-lg font-semibold mb-4"
            style={{ color: DESIGN_TOKENS.lvNavy }}
          >
            Brand Color Palette
          </h3>

          <div className="space-y-4">
            {/* Primary Colors */}
            {colors.primary && colors.primary.length > 0 && (
              <div>
                <p
                  className="text-sm font-medium mb-2"
                  style={{ color: DESIGN_TOKENS.lvNavy }}
                >
                  Primary Colors
                </p>
                <div className="flex gap-3 flex-wrap">
                  {colors.primary.map((color, idx) => {
                    const hexColor = extractHexColor(color);
                    return (
                      <div key={idx} className="flex flex-col items-center gap-2">
                        <div
                          className="w-12 h-12 rounded-full border-2 shadow-sm"
                          style={{
                            backgroundColor: hexColor || "#CCCCCC",
                            borderColor: DESIGN_TOKENS.lvTeal,
                          }}
                          title={color}
                        />
                        <span className="text-xs text-center max-w-[60px]">
                          {color.split("(")[0].trim()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Secondary Colors */}
            {colors.secondary && colors.secondary.length > 0 && (
              <div>
                <p
                  className="text-sm font-medium mb-2"
                  style={{ color: DESIGN_TOKENS.lvNavy }}
                >
                  Secondary Colors
                </p>
                <div className="flex gap-3 flex-wrap">
                  {colors.secondary.map((color, idx) => {
                    const hexColor = extractHexColor(color);
                    return (
                      <div key={idx} className="flex flex-col items-center gap-2">
                        <div
                          className="w-10 h-10 rounded-full border-2 shadow-sm"
                          style={{
                            backgroundColor: hexColor || "#CCCCCC",
                            borderColor: DESIGN_TOKENS.lvTeal,
                          }}
                          title={color}
                        />
                        <span className="text-xs text-center max-w-[50px]">
                          {color.split("(")[0].trim()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Color Description */}
            {colors.description && (
              <p
                className="text-sm mt-4 p-3 rounded"
                style={{
                  backgroundColor: "rgba(255,255,255,0.5)",
                  color: DESIGN_TOKENS.lvNavy,
                }}
              >
                {colors.description}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Section 2: Mandarin Content Scripts */}
      {contentPieces.length > 0 && (
        <div className="p-6 border-b" style={{ borderColor: `${DESIGN_TOKENS.lvTeal}20` }}>
          <h3
            className="text-lg font-semibold mb-4"
            style={{ color: DESIGN_TOKENS.lvNavy }}
          >
            Mandarin Social Copy (5 Variations)
          </h3>

          <div className="space-y-4">
            {contentPieces.map((piece, idx) => (
              <div
                key={idx}
                className="p-4 rounded-lg border-l-4"
                style={{
                  backgroundColor: "rgba(255,255,255,0.7)",
                  borderLeftColor: DESIGN_TOKENS.lvTeal,
                }}
              >
                {/* Header with Info Tooltip */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h4
                      className="font-semibold text-sm"
                      style={{ color: DESIGN_TOKENS.lvNavy }}
                    >
                      Variation {idx + 1}
                    </h4>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info
                            size={16}
                            style={{ color: DESIGN_TOKENS.lvTeal }}
                            className="cursor-help"
                          />
                        </TooltipTrigger>
                        <TooltipContent
                          style={{
                            backgroundColor: DESIGN_TOKENS.lvNavy,
                            color: "white",
                            borderColor: DESIGN_TOKENS.lvTeal,
                          }}
                        >
                          <p className="max-w-xs text-sm">
                            {piece.explanationEnglish}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>

                {/* Storyboard */}
                <div className="mb-3">
                  <p className="text-xs font-medium mb-1" style={{ color: DESIGN_TOKENS.lvTeal }}>
                    Storyboard (Mandarin):
                  </p>
                  <p className="text-sm" style={{ color: DESIGN_TOKENS.lvNavy }}>
                    {piece.storyboardMandarin}
                  </p>
                </div>

                {/* Caption with Copy Button */}
                <div className="mb-3">
                  <p className="text-xs font-medium mb-1" style={{ color: DESIGN_TOKENS.lvTeal }}>
                    Caption (Mandarin):
                  </p>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium" style={{ color: DESIGN_TOKENS.lvNavy }}>
                      {piece.captionMandarin}
                    </p>
                    <button
                      onClick={() =>
                        copyToClipboard(piece.captionMandarin, idx)
                      }
                      className="p-1 rounded hover:opacity-70 transition-opacity flex-shrink-0"
                      style={{
                        backgroundColor: `${DESIGN_TOKENS.lvTeal}20`,
                        color: DESIGN_TOKENS.lvTeal,
                      }}
                      title="Copy to clipboard"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                  {copiedIndex === idx && (
                    <p className="text-xs mt-1" style={{ color: DESIGN_TOKENS.success }}>
                      ✓ Copied!
                    </p>
                  )}
                </div>

                {/* Strategy Explanation */}
                <div
                  className="p-2 rounded text-xs"
                  style={{
                    backgroundColor: `${DESIGN_TOKENS.lvTeal}10`,
                    color: DESIGN_TOKENS.lvNavy,
                  }}
                >
                  <p className="font-medium mb-1">Strategy:</p>
                  <p>{piece.explanationEnglish}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!colors && contentPieces.length === 0 && (
        <div className="p-8 text-center">
          <p style={{ color: DESIGN_TOKENS.lvNavy }} className="text-sm">
            No results yet. Create a job to see brand analysis and content.
          </p>
        </div>
      )}
    </div>
  );
}
