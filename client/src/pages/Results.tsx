import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, ThumbsUp, ThumbsDown, Copy, Check, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function Results() {
  const params = useParams<{ inputId: string }>();
  const [, setLocation] = useLocation();
  const inputId = parseInt(params.inputId || "0");

  const { data: content, isLoading } = trpc.contentGeneration.getByInputId.useQuery(
    { inputId },
    { enabled: inputId > 0 }
  );

  const feedbackMutation = trpc.contentGeneration.submitFeedback.useMutation({
    onSuccess: () => {
      toast.success("Thank you for your feedback!");
    },
  });

  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [expandedExplanations, setExpandedExplanations] = useState<Set<number>>(new Set());
  const [feedbackTexts, setFeedbackTexts] = useState<Record<number, string>>({});

  const handleCopy = async (text: string, id: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFeedback = (contentId: number, score: number) => {
    feedbackMutation.mutate({
      contentId,
      score,
      text: feedbackTexts[contentId] || undefined,
    });
  };

  const toggleExplanation = (id: number) => {
    setExpandedExplanations(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your content...</p>
        </div>
      </div>
    );
  }

  if (!content || content.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>No Content Found</CardTitle>
            <CardDescription>
              We couldn't find the content you're looking for.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation("/generate")} className="w-full">
              Generate New Content
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container max-w-6xl py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Check className="h-4 w-4" />
            Content Generated Successfully
          </div>
          <h1 className="text-4xl font-bold mb-3">
            Your 5 Mandarin Content Pieces
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Each piece includes a visual storyboard concept and a ready-to-use Mandarin caption. 
            Click to copy and use them on WeChat, Douyin, or Xiaohongshu.
          </p>
        </div>

        {/* Content Cards */}
        <div className="space-y-6 mb-8">
          {content.map((item, index) => (
            <Card key={item.id} className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="text-lg px-3 py-1">
                      #{index + 1}
                    </Badge>
                    <CardTitle className="text-xl">Content Piece {index + 1}</CardTitle>
                  </div>
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Storyboard */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-base">📹 Visual Storyboard (Mandarin)</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(item.storyboardMandarin, item.id * 10)}
                    >
                      {copiedId === item.id * 10 ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <p className="text-base leading-relaxed whitespace-pre-wrap">
                      {item.storyboardMandarin}
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Caption */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-base">✍️ Caption (Mandarin)</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(item.captionMandarin, item.id * 10 + 1)}
                    >
                      {copiedId === item.id * 10 + 1 ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <div className="bg-primary/5 border-l-4 border-primary p-4 rounded-r-lg">
                    <p className="text-lg font-medium leading-relaxed">
                      {item.captionMandarin}
                    </p>
                  </div>
                </div>

                {/* English Explanation (Collapsible) */}
                <div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExplanation(item.id)}
                    className="w-full justify-between hover:bg-muted/50"
                  >
                    <span className="font-semibold">💡 Strategy Explanation (English)</span>
                    {expandedExplanations.has(item.id) ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                  {expandedExplanations.has(item.id) && (
                    <div className="mt-3 bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {item.explanationEnglish}
                      </p>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Feedback Section */}
                <div className="bg-muted/30 p-4 rounded-lg">
                  <h4 className="font-semibold mb-3 text-sm">Was this content helpful?</h4>
                  <div className="flex gap-3 mb-3">
                    <Button
                      variant={item.userFeedbackScore === 1 ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleFeedback(item.id, 1)}
                      disabled={feedbackMutation.isPending}
                      className={cn(
                        item.userFeedbackScore === 1 && "bg-green-600 hover:bg-green-700"
                      )}
                    >
                      <ThumbsUp className="h-4 w-4 mr-1" />
                      Helpful
                    </Button>
                    <Button
                      variant={item.userFeedbackScore === -1 ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleFeedback(item.id, -1)}
                      disabled={feedbackMutation.isPending}
                      className={cn(
                        item.userFeedbackScore === -1 && "bg-red-600 hover:bg-red-700"
                      )}
                    >
                      <ThumbsDown className="h-4 w-4 mr-1" />
                      Not Helpful
                    </Button>
                  </div>
                  <Textarea
                    placeholder="Optional: Tell us how we can improve..."
                    value={feedbackTexts[item.id] || ""}
                    onChange={(e) =>
                      setFeedbackTexts(prev => ({ ...prev, [item.id]: e.target.value }))
                    }
                    rows={2}
                    className="text-sm"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA Section */}
        <Card className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0 shadow-2xl">
          <CardContent className="py-8 text-center">
            <h2 className="text-2xl font-bold mb-3">
              Want More Personalized Content?
            </h2>
            <p className="text-white/90 mb-6 max-w-2xl mx-auto">
              Unlock the A.I. Brand Specialist: Upload your brand visuals, have a conversation with our A.I., 
              and get unlimited, deeply customized content tailored to your exact brand identity.
            </p>
            <Button
              size="lg"
              variant="secondary"
              className="text-lg h-12"
              onClick={() => toast.info("Premium feature coming soon!")}
            >
              <Sparkles className="mr-2 h-5 w-5" />
              Upgrade to Pro
            </Button>
          </CardContent>
        </Card>

        {/* Bottom Actions */}
        <div className="mt-8 flex justify-center gap-4">
          <Button variant="outline" onClick={() => setLocation("/generate")}>
            Generate More Content
          </Button>
          <Button variant="outline" onClick={() => setLocation("/")}>
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
