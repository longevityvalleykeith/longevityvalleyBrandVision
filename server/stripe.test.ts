import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(subscriptionPlan: "free" | "pro" | "enterprise" = "free"): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    stripeCustomerId: subscriptionPlan !== "free" ? "cus_test123" : null,
    stripeSubscriptionId: subscriptionPlan !== "free" ? "sub_test123" : null,
    subscriptionPlan,
    subscriptionStatus: subscriptionPlan !== "free" ? "active" : null,
    subscriptionEndsAt: null,
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {
        origin: "https://test.example.com",
      },
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return ctx;
}

describe("Stripe Subscription Integration", () => {
  it("should return subscription status for free user", async () => {
    const ctx = createAuthContext("free");
    const caller = appRouter.createCaller(ctx);

    const status = await caller.subscription.getStatus();

    expect(status).toEqual({
      plan: "free",
      status: null,
      endsAt: null,
    });
  });

  it("should return subscription status for pro user", async () => {
    const ctx = createAuthContext("pro");
    const caller = appRouter.createCaller(ctx);

    const status = await caller.subscription.getStatus();

    expect(status).toEqual({
      plan: "pro",
      status: "active",
      endsAt: null,
    });
  });

  it("should create checkout session for pro plan", async () => {
    const ctx = createAuthContext("free");
    const caller = appRouter.createCaller(ctx);

    const result = await caller.subscription.createCheckout({
      planId: "pro",
    });

    expect(result).toHaveProperty("checkoutUrl");
    expect(result).toHaveProperty("sessionId");
    expect(result.checkoutUrl).toContain("checkout.stripe.com");
  });

  it("should create checkout session for enterprise plan", async () => {
    const ctx = createAuthContext("free");
    const caller = appRouter.createCaller(ctx);

    const result = await caller.subscription.createCheckout({
      planId: "enterprise",
    });

    expect(result).toHaveProperty("checkoutUrl");
    expect(result).toHaveProperty("sessionId");
    expect(result.checkoutUrl).toContain("checkout.stripe.com");
  });

  it("should create portal session for existing customer", async () => {
    const ctx = createAuthContext("pro");
    const caller = appRouter.createCaller(ctx);

    const result = await caller.subscription.createPortal();

    expect(result).toHaveProperty("portalUrl");
    expect(result.portalUrl).toContain("billing.stripe.com");
  });

  it("should throw error when creating portal without customer ID", async () => {
    const ctx = createAuthContext("free");
    const caller = appRouter.createCaller(ctx);

    await expect(caller.subscription.createPortal()).rejects.toThrow(
      "No Stripe customer ID found"
    );
  });
});
