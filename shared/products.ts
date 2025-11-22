/**
 * Stripe Products and Pricing Configuration
 * Centralized product definitions for subscription plans
 */

export const SUBSCRIPTION_PLANS = {
  FREE: {
    id: "free",
    name: "Free",
    description: "Perfect for trying out the platform",
    price: 0,
    currency: "usd",
    interval: null,
    features: [
      "5 content pieces per generation",
      "Basic Mandarin content generation",
      "English explanations included",
      "Community support",
    ],
    limits: {
      generationsPerMonth: 10,
      contentPiecesPerGeneration: 5,
      brandAssetUploads: 0,
      aiChatAccess: false,
    },
  },
  PRO: {
    id: "pro",
    name: "Pro",
    description: "For serious brands entering the Chinese market",
    price: 2900, // $29.00 in cents
    currency: "usd",
    interval: "month",
    stripePriceId: process.env.STRIPE_PRICE_ID_PRO || "price_pro_monthly", // To be created in Stripe
    features: [
      "Unlimited content generation",
      "A.I. Brand Specialist chat",
      "Visual asset analysis with Gemini",
      "Upload brand logos and photos",
      "Priority email support",
      "Content history and analytics",
    ],
    limits: {
      generationsPerMonth: -1, // unlimited
      contentPiecesPerGeneration: 10,
      brandAssetUploads: 50,
      aiChatAccess: true,
    },
  },
  ENTERPRISE: {
    id: "enterprise",
    name: "Enterprise",
    description: "For agencies and large brands",
    price: 9900, // $99.00 in cents
    currency: "usd",
    interval: "month",
    stripePriceId: process.env.STRIPE_PRICE_ID_ENTERPRISE || "price_enterprise_monthly",
    features: [
      "Everything in Pro",
      "Custom brand voice training",
      "API access for automation",
      "Dedicated account manager",
      "White-label options",
      "Custom integrations",
      "SLA guarantee",
    ],
    limits: {
      generationsPerMonth: -1,
      contentPiecesPerGeneration: 20,
      brandAssetUploads: -1, // unlimited
      aiChatAccess: true,
    },
  },
} as const;

export type SubscriptionPlanId = keyof typeof SUBSCRIPTION_PLANS;

/**
 * Get plan details by ID
 */
export function getPlanById(planId: string): typeof SUBSCRIPTION_PLANS[SubscriptionPlanId] | null {
  const plan = SUBSCRIPTION_PLANS[planId.toUpperCase() as SubscriptionPlanId];
  return plan || null;
}

/**
 * Check if a plan ID is valid
 */
export function isValidPlanId(planId: string): planId is SubscriptionPlanId {
  return planId.toUpperCase() in SUBSCRIPTION_PLANS;
}

/**
 * Get all paid plans (excludes FREE)
 */
export function getPaidPlans() {
  return [SUBSCRIPTION_PLANS.PRO, SUBSCRIPTION_PLANS.ENTERPRISE];
}

/**
 * Format price for display
 */
export function formatPrice(cents: number, currency: string = "usd"): string {
  const amount = cents / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount);
}
