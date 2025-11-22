import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2, Sparkles, Crown, Building2 } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";
import { SUBSCRIPTION_PLANS, formatPrice } from "@shared/products";

export default function Pricing() {
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const createCheckoutMutation = trpc.subscription.createCheckout.useMutation({
    onSuccess: (data) => {
      // Open Stripe Checkout in new tab
      window.open(data.checkoutUrl, "_blank");
      toast.success("Redirecting to checkout...");
      setLoadingPlan(null);
    },
    onError: (error) => {
      toast.error(`Failed to create checkout: ${error.message}`);
      setLoadingPlan(null);
    },
  });

  const handleSubscribe = (planId: "pro" | "enterprise") => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }

    setLoadingPlan(planId);
    createCheckoutMutation.mutate({ planId });
  };

  const currentPlan = user?.subscriptionPlan || "free";

  const plans = [
    {
      planId: "free",
      icon: Sparkles,
      ...SUBSCRIPTION_PLANS.FREE,
      cta: "Current Plan",
      highlighted: false,
    },
    {
      planId: "pro",
      icon: Crown,
      ...SUBSCRIPTION_PLANS.PRO,
      cta: "Upgrade to Pro",
      highlighted: true,
    },
    {
      planId: "enterprise",
      icon: Building2,
      ...SUBSCRIPTION_PLANS.ENTERPRISE,
      cta: "Upgrade to Enterprise",
      highlighted: false,
    },
  ];

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <div className="border-b bg-white/50 backdrop-blur-sm">
        <div className="container flex items-center justify-between h-16">
          <Button variant="ghost" onClick={() => setLocation("/")}>
            ← Back to Home
          </Button>
          {isAuthenticated && (
            <Button variant="outline" onClick={() => setLocation("/account")}>
              My Account
            </Button>
          )}
        </div>
      </div>

      <div className="container py-16">
        {/* Title Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Start free and upgrade as you grow. All plans include our core A.I. content generation.
          </p>
          {isAuthenticated && (
            <div className="mt-4">
              <Badge variant="secondary" className="text-sm px-4 py-2">
                Current Plan: {currentPlan.toUpperCase()}
              </Badge>
            </div>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isCurrentPlan = currentPlan === plan.planId;
            const canUpgrade = plan.planId !== "free" && !isCurrentPlan;

            return (
              <Card
                key={plan.planId}
                className={`relative ${
                  plan.highlighted
                    ? "border-primary border-2 shadow-2xl scale-105"
                    : "border-2"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-4 py-1">
                      Most Popular
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-8">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription className="text-base mt-2">
                    {plan.description}
                  </CardDescription>
                  <div className="mt-6">
                    {plan.price === 0 ? (
                      <div className="text-4xl font-bold">Free</div>
                    ) : (
                      <>
                        <div className="text-5xl font-bold">
                          {formatPrice(plan.price)}
                        </div>
                        <div className="text-muted-foreground mt-1">
                          per {plan.interval}
                        </div>
                      </>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Features List */}
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <Button
                    className="w-full h-12 text-base"
                    variant={plan.highlighted ? "default" : "outline"}
                    disabled={
                      isCurrentPlan ||
                      !canUpgrade ||
                      loadingPlan === plan.planId
                    }
                    onClick={() => {
                      if (canUpgrade) {
                        handleSubscribe(plan.planId as "pro" | "enterprise");
                      }
                    }}
                  >
                    {loadingPlan === plan.planId ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Processing...
                      </>
                    ) : isCurrentPlan ? (
                      "Current Plan"
                    ) : canUpgrade ? (
                      plan.cta
                    ) : (
                      "Get Started"
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* FAQ or Additional Info */}
        <div className="mt-16 text-center">
          <p className="text-muted-foreground mb-4">
            All plans include a 7-day money-back guarantee. Cancel anytime.
          </p>
          <p className="text-sm text-muted-foreground">
            Need a custom plan for your agency?{" "}
            <a href="mailto:support@longevity.com.ai" className="text-primary underline">
              Contact us
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
