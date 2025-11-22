import { useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Sparkles } from "lucide-react";

export default function SubscriptionSuccess() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Optional: Track conversion event
    console.log("Subscription successful");
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full shadow-2xl">
        <CardHeader className="text-center pb-6">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-3xl mb-3">
            Welcome to Pro! 🎉
          </CardTitle>
          <CardDescription className="text-lg">
            Your subscription is now active. You have full access to all premium features.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="bg-primary/5 border-l-4 border-primary p-6 rounded-r-lg">
            <h3 className="font-semibold text-lg mb-3">What's unlocked:</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <Sparkles className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <span>Unlimited content generation with no monthly limits</span>
              </li>
              <li className="flex items-start gap-2">
                <Sparkles className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <span>A.I. Brand Specialist chat for personalized guidance</span>
              </li>
              <li className="flex items-start gap-2">
                <Sparkles className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <span>Visual asset analysis with Google Gemini</span>
              </li>
              <li className="flex items-start gap-2">
                <Sparkles className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <span>Priority email support with faster response times</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              size="lg"
              className="flex-1"
              onClick={() => setLocation("/generate")}
            >
              Start Generating Content
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="flex-1"
              onClick={() => setLocation("/account")}
            >
              View My Account
            </Button>
          </div>

          <div className="text-center text-sm text-muted-foreground pt-4 border-t">
            <p>
              Need help getting started?{" "}
              <a href="mailto:support@longevity.com.ai" className="text-primary underline">
                Contact our support team
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
