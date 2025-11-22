/**
 * Stripe Integration Module
 * Handles checkout sessions, subscriptions, and webhook processing
 */

import Stripe from "stripe";
import { SUBSCRIPTION_PLANS } from "../shared/products";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-11-17.clover",
});

/**
 * Create a checkout session for subscription purchase
 */
export async function createCheckoutSession(params: {
  userId: number;
  userEmail: string;
  userName?: string;
  planId: string;
  origin: string;
}): Promise<{ url: string; sessionId: string }> {
  const planKey = params.planId.toUpperCase() as "PRO" | "ENTERPRISE";
  const plan = SUBSCRIPTION_PLANS[planKey];

  if (!plan || !plan.stripePriceId) {
    throw new Error(`Invalid plan ID: ${params.planId}`);
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: plan.stripePriceId,
        quantity: 1,
      },
    ],
    customer_email: params.userEmail,
    client_reference_id: params.userId.toString(),
    metadata: {
      user_id: params.userId.toString(),
      customer_email: params.userEmail,
      customer_name: params.userName || "",
      plan_id: params.planId,
    },
    allow_promotion_codes: true,
    success_url: `${params.origin}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${params.origin}/pricing`,
  });

  if (!session.url) {
    throw new Error("Failed to create checkout session URL");
  }

  return {
    url: session.url,
    sessionId: session.id,
  };
}

/**
 * Create a Stripe customer portal session for subscription management
 */
export async function createPortalSession(params: {
  customerId: string;
  origin: string;
}): Promise<{ url: string }> {
  const session = await stripe.billingPortal.sessions.create({
    customer: params.customerId,
    return_url: `${params.origin}/account`,
  });

  return {
    url: session.url,
  };
}

/**
 * Get subscription details from Stripe
 */
export async function getSubscription(subscriptionId: string): Promise<Stripe.Subscription | null> {
  try {
    return await stripe.subscriptions.retrieve(subscriptionId);
  } catch (error) {
    console.error("Error retrieving subscription:", error);
    return null;
  }
}

/**
 * Get customer details from Stripe
 */
export async function getCustomer(customerId: string): Promise<Stripe.Customer | null> {
  try {
    const customer = await stripe.customers.retrieve(customerId);
    if (customer.deleted) {
      return null;
    }
    return customer as Stripe.Customer;
  } catch (error) {
    console.error("Error retrieving customer:", error);
    return null;
  }
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
  return await stripe.subscriptions.cancel(subscriptionId);
}

/**
 * Process webhook events
 */
export async function processWebhookEvent(
  payload: Buffer,
  signature: string
): Promise<{
  event: Stripe.Event;
  isTestEvent: boolean;
}> {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
  }

  const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);

  // Detect test events
  const isTestEvent = event.id.startsWith("evt_test_");

  return { event, isTestEvent };
}

/**
 * Extract subscription data from checkout session completed event
 */
export function extractCheckoutData(session: Stripe.Checkout.Session): {
  userId: number;
  customerId: string;
  subscriptionId: string;
  planId: string;
} | null {
  const userId = session.metadata?.user_id || session.client_reference_id;
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;
  const planId = session.metadata?.plan_id;

  if (!userId || !customerId || !subscriptionId || !planId) {
    console.error("Missing required data in checkout session:", {
      userId,
      customerId,
      subscriptionId,
      planId,
    });
    return null;
  }

  return {
    userId: parseInt(userId),
    customerId,
    subscriptionId,
    planId,
  };
}

export { stripe };
