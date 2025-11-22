import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Sparkles } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function ContentGenerator() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  
  const [formData, setFormData] = useState({
    productInfo: "",
    sellingPoints: "",
    targetAudience: "",
    painPoints: "",
    scenarios: "",
    ctaOffer: "",
  });

  const generateMutation = trpc.contentGeneration.generate.useMutation({
    onSuccess: (data) => {
      toast.success("Content generated successfully!");
      setLocation(`/results/${data.inputId}`);
    },
    onError: (error) => {
      toast.error(`Failed to generate content: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.productInfo.trim() || !formData.sellingPoints.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    generateMutation.mutate(formData);
  };

  const handleChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              Please log in to access the content generator
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation("/")} className="w-full">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container max-w-4xl py-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Sparkles className="h-4 w-4" />
            Free A.I. Content Generator
          </div>
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Transform Your Brand for the Chinese Market
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Generate 5 culturally-aware Mandarin content pieces in minutes. 
            No language barriers, no cultural missteps.
          </p>
        </div>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle>Tell Us About Your Product</CardTitle>
            <CardDescription>
              Fill in the details below in English or Bahasa Melayu. 
              Our A.I. will create authentic Mandarin content optimized for WeChat, Douyin, and Xiaohongshu.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="productInfo" className="text-base font-semibold">
                  Product Information <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="productInfo"
                  placeholder="Describe your wellness product or service. What is it? What does it do?"
                  value={formData.productInfo}
                  onChange={handleChange("productInfo")}
                  rows={4}
                  required
                  className="resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sellingPoints" className="text-base font-semibold">
                  Key Selling Points <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="sellingPoints"
                  placeholder="What makes your product unique? Why should customers choose you?"
                  value={formData.sellingPoints}
                  onChange={handleChange("sellingPoints")}
                  rows={4}
                  required
                  className="resize-none"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="targetAudience" className="text-base font-semibold">
                    Target Audience
                  </Label>
                  <Textarea
                    id="targetAudience"
                    placeholder="Who is your ideal customer? Age, lifestyle, interests..."
                    value={formData.targetAudience}
                    onChange={handleChange("targetAudience")}
                    rows={3}
                    className="resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="painPoints" className="text-base font-semibold">
                    User Pain Points
                  </Label>
                  <Textarea
                    id="painPoints"
                    placeholder="What problems does your product solve?"
                    value={formData.painPoints}
                    onChange={handleChange("painPoints")}
                    rows={3}
                    className="resize-none"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="scenarios" className="text-base font-semibold">
                    Applicable Scenarios
                  </Label>
                  <Textarea
                    id="scenarios"
                    placeholder="When and where would customers use your product?"
                    value={formData.scenarios}
                    onChange={handleChange("scenarios")}
                    rows={3}
                    className="resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ctaOffer" className="text-base font-semibold">
                    Promo Offer / Call to Action
                  </Label>
                  <Textarea
                    id="ctaOffer"
                    placeholder="Any special offers or promotions? What action should customers take?"
                    value={formData.ctaOffer}
                    onChange={handleChange("ctaOffer")}
                    rows={3}
                    className="resize-none"
                  />
                </div>
              </div>

              <div className="pt-4">
                <Button
                  type="submit"
                  size="lg"
                  className="w-full text-lg h-14"
                  disabled={generateMutation.isPending}
                >
                  {generateMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Generating Your Content...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      Generate My 5 Free Content Ideas
                    </>
                  )}
                </Button>
                <p className="text-sm text-muted-foreground text-center mt-3">
                  This usually takes 15-30 seconds. Your content will be saved to your account.
                </p>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            🔒 Your data is secure and private. We use it only to generate your content.
          </p>
        </div>
      </div>
    </div>
  );
}
