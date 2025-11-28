import React, { useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { DESIGN_TOKENS } from "@/const";
import { GranularProgressBar } from "@/components/GranularProgressBar";
import { VisionResultCard } from "@/components/VisionResultCard";
import { trpc } from "@/lib/trpc";
import { Loader } from "lucide-react";

interface JobDetailPageProps {
  jobId: string;
}

export function JobDetailPage() {
  const [, params] = useRoute("/jobs/:id");
  const [, navigate] = useLocation();
  const jobId = params?.id;

  // Parse job data from URL or database
  const { data: jobData, isLoading, refetch } = trpc.visionPipeline.getJobStatus.useQuery(
    { jobId: Number(jobId) },
    {
      enabled: !!jobId,
      refetchInterval: 2000, // Poll every 2 seconds
    }
  );

  if (!jobId) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: DESIGN_TOKENS.lvSoftMint }}>
        <p style={{ color: DESIGN_TOKENS.lvNavy }}>Invalid job ID</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: DESIGN_TOKENS.lvSoftMint }}>
        <div className="text-center">
          <Loader className="animate-spin mx-auto mb-4" style={{ color: DESIGN_TOKENS.lvTeal }} />
          <p style={{ color: DESIGN_TOKENS.lvNavy }}>Loading job details...</p>
        </div>
      </div>
    );
  }

  if (!jobData) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: DESIGN_TOKENS.lvSoftMint }}>
        <p style={{ color: DESIGN_TOKENS.lvNavy }}>Job not found</p>
      </div>
    );
  }

  // Parse outputs
  let geminOutput: any = null;
  let contentPieces: any[] = [];

  try {
    if (jobData.geminOutput) {
      geminOutput = JSON.parse(jobData.geminOutput);
    }
    if (jobData.deepseekOutput) {
      const deepseekData = JSON.parse(jobData.deepseekOutput);
      contentPieces = Array.isArray(deepseekData) ? deepseekData : [];
    }
  } catch (e) {
    console.error("Failed to parse outputs:", e);
  }

  return (
    <div style={{ backgroundColor: DESIGN_TOKENS.lvSoftMint }} className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1
            className="text-3xl font-bold mb-2"
            style={{ color: DESIGN_TOKENS.lvNavy }}
          >
            Brand Vision Pipeline
          </h1>
          <p style={{ color: DESIGN_TOKENS.lvNavy }} className="opacity-70">
            Job ID: {jobId}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8 p-6 rounded-lg bg-white shadow-sm">
          <GranularProgressBar
            status={jobData.status as any}
            progress={jobData.progress || 0}
            errorMessage={jobData.errorMessage || undefined}
          />
        </div>

        {/* Results */}
        {jobData.status === "complete" && (
          <div className="space-y-6">
            <VisionResultCard
              colors={geminOutput?.colors}
              contentPieces={contentPieces || []}
            />

            {/* Back Button */}
            <div className="flex justify-center">
              <button
                onClick={() => navigate("/vision-pipeline")}
                className="px-6 py-2 rounded-lg font-medium transition-colors"
                style={{
                  backgroundColor: DESIGN_TOKENS.lvNavy,
                  color: "white",
                }}
              >
                Create Another Job
              </button>
            </div>
          </div>
        )}

        {/* Processing State */}
        {jobData.status !== "complete" && jobData.status !== "error" && (
          <div className="text-center py-12">
            <Loader className="animate-spin mx-auto mb-4" style={{ color: DESIGN_TOKENS.lvTeal }} size={32} />
            <p style={{ color: DESIGN_TOKENS.lvNavy }} className="text-lg">
              Processing your brand analysis...
            </p>
            <p style={{ color: DESIGN_TOKENS.lvNavy }} className="text-sm opacity-70 mt-2">
              This may take 30-60 seconds
            </p>
          </div>
        )}

        {/* Error State */}
        {jobData.status === "error" && (
          <div
            className="p-6 rounded-lg text-center"
            style={{ backgroundColor: `${DESIGN_TOKENS.errorRed}20` }}
          >
            <p
              className="text-lg font-semibold mb-2"
              style={{ color: DESIGN_TOKENS.errorRed }}
            >
              Processing Failed
            </p>
            <p style={{ color: DESIGN_TOKENS.lvNavy }} className="mb-4">
              {jobData.errorMessage || "An error occurred during processing"}
            </p>
            <button
              onClick={() => navigate("/vision-pipeline")}
              className="px-6 py-2 rounded-lg font-medium transition-colors"
              style={{
                backgroundColor: DESIGN_TOKENS.lvNavy,
                color: "white",
              }}
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
