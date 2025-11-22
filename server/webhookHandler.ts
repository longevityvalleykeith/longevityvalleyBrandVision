/**
 * Stripe Webhook Handler
 * Processes Stripe events and updates database accordingly
 */

import { Request, Response } from "express";
import { processWebhookEvent, extractCheckoutData } from "./stripe";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export async function handleStripeWebhook(req: Request, res: Response) {
  const signature = req.headers["stripe-signature"];

  if (!signature || typeof signature !== "string") {
    console.error("[Webhook] Missing stripe-signature header");
    return res.status(400).json({ error: "Missing signature" });
  }

  try {
    const { event, isTestEvent } = await processWebhookEvent(req.body, signature);

    console.log(`[Webhook] Received event: ${event.type} (${event.id})`);

    // Test events must return verification response
    if (isTestEvent) {
      console.log("[Webhook] Test event detected, returning verification response");
      return res.json({ verified: true });
    }

    // Process real events
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event);
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event);
        break;

      case "invoice.paid":
        console.log(`[Webhook] Invoice paid: ${event.data.object.id}`);
        break;

      case "invoice.payment_failed":
        await handlePaymentFailed(event);
        break;

      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error("[Webhook] Error processing webhook:", error);
    res.status(400).json({ error: "Webhook processing failed" });
  }
}

async function handleCheckoutCompleted(event: any) {
  const session = event.data.object;
  const checkoutData = extractCheckoutData(session);

  if (!checkoutData) {
    console.error("[Webhook] Failed to extract checkout data");
    return;
  }

  const { userId, customerId, subscriptionId, planId } = checkoutData;

  console.log(`[Webhook] Checkout completed for user ${userId}, plan: ${planId}`);

  const db = await getDb();
  if (!db) {
    console.error("[Webhook] Database not available");
    return;
  }

  try {
    await db
      .update(users)
      .set({
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        subscriptionPlan: planId as "free" | "pro" | "enterprise",
        subscriptionStatus: "active",
      })
      .where(eq(users.id, userId));

    console.log(`[Webhook] Updated user ${userId} subscription to ${planId}`);
  } catch (error) {
    console.error("[Webhook] Error updating user subscription:", error);
  }
}

async function handleSubscriptionUpdated(event: any) {
  const subscription = event.data.object;
  const customerId = subscription.customer;
  const status = subscription.status;

  console.log(`[Webhook] Subscription updated: ${subscription.id}, status: ${status}`);

  const db = await getDb();
  if (!db) {
    console.error("[Webhook] Database not available");
    return;
  }

  try {
    await db
      .update(users)
      .set({
        subscriptionStatus: status as "active" | "canceled" | "past_due" | "trialing" | "incomplete",
        subscriptionEndsAt: subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000)
          : null,
      })
      .where(eq(users.stripeCustomerId, customerId));

    console.log(`[Webhook] Updated subscription status for customer ${customerId}`);
  } catch (error) {
    console.error("[Webhook] Error updating subscription:", error);
  }
}

async function handleSubscriptionDeleted(event: any) {
  const subscription = event.data.object;
  const customerId = subscription.customer;

  console.log(`[Webhook] Subscription deleted: ${subscription.id}`);

  const db = await getDb();
  if (!db) {
    console.error("[Webhook] Database not available");
    return;
  }

  try {
    await db
      .update(users)
      .set({
        subscriptionPlan: "free",
        subscriptionStatus: "canceled",
        subscriptionEndsAt: new Date(),
      })
      .where(eq(users.stripeCustomerId, customerId));

    console.log(`[Webhook] Downgraded user to free plan for customer ${customerId}`);
  } catch (error) {
    console.error("[Webhook] Error handling subscription deletion:", error);
  }
}

async function handlePaymentFailed(event: any) {
  const invoice = event.data.object;
  const customerId = invoice.customer;

  console.log(`[Webhook] Payment failed for invoice: ${invoice.id}`);

  const db = await getDb();
  if (!db) {
    console.error("[Webhook] Database not available");
    return;
  }

  try {
    await db
      .update(users)
      .set({
        subscriptionStatus: "past_due",
      })
      .where(eq(users.stripeCustomerId, customerId));

    console.log(`[Webhook] Marked subscription as past_due for customer ${customerId}`);
  } catch (error) {
    console.error("[Webhook] Error handling payment failure:", error);
  }
}
