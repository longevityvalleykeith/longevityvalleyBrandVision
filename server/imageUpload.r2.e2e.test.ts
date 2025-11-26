import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as fs from "fs";
import * as path from "path";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-r2",
    email: "test@longevityvalley.ai",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("Image Upload to Cloudflare R2 E2E Test", () => {
  it("should upload a real brand logo to R2 and return CDN URL", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Read the test image we created
    const testImagePath = path.join(__dirname, "../test-brand-logo.png");
    
    if (!fs.existsSync(testImagePath)) {
      console.log("Test image not found, skipping E2E test");
      return;
    }

    // Read and convert to base64
    const imageBuffer = fs.readFileSync(testImagePath);
    const base64Image = imageBuffer.toString("base64");
    const dataUri = `data:image/png;base64,${base64Image}`;

    console.log(`📤 Uploading test image (${(imageBuffer.length / 1024).toFixed(2)} KB)...`);

    // Call the upload mutation
    const result = await caller.imageUpload.uploadImages({
      images: [
        {
          fileName: "test-brand-logo.png",
          fileData: dataUri,
          mimeType: "image/png",
        },
      ],
    });

    // Verify the result
    expect(result).toHaveProperty("urls");
    expect(Array.isArray(result.urls)).toBe(true);
    expect(result.urls.length).toBe(1);
    
    const uploadedUrl = result.urls[0];
    expect(uploadedUrl).toMatch(/^https?:\/\//);
    expect(uploadedUrl).toContain("longevityvalley.ai");

    console.log("✅ Image uploaded successfully to Cloudflare R2");
    console.log(`   URL: ${uploadedUrl}`);
    console.log(`   Domain: ${new URL(uploadedUrl).hostname}`);

    // Verify the URL is accessible
    console.log("🔍 Verifying image is accessible via CDN...");
    const response = await fetch(uploadedUrl);
    expect(response.ok).toBe(true);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("image");

    const downloadedSize = parseInt(response.headers.get("content-length") || "0");
    console.log(`✅ Image is publicly accessible via CDN (${(downloadedSize / 1024).toFixed(2)} KB)`);

  }, 60000); // 60 second timeout for upload + CDN verification

  it("should handle multiple image uploads in a single request", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create two small test images
    const redPixel = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==";
    const bluePixel = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAEBgIApD5fRAAAAABJRU5ErkJggg==";

    console.log("📤 Uploading multiple images...");

    const result = await caller.imageUpload.uploadImages({
      images: [
        {
          fileName: "brand-color-1.png",
          fileData: redPixel,
          mimeType: "image/png",
        },
        {
          fileName: "brand-color-2.png",
          fileData: bluePixel,
          mimeType: "image/png",
        },
      ],
    });

    expect(result.urls.length).toBe(2);
    expect(result.urls[0]).not.toBe(result.urls[1]);
    expect(result.urls[0]).toContain("longevityvalley.ai");
    expect(result.urls[1]).toContain("longevityvalley.ai");

    console.log("✅ Multiple images uploaded successfully");
    console.log(`   Image 1: ${result.urls[0]}`);
    console.log(`   Image 2: ${result.urls[1]}`);

    // Verify both are accessible
    const [response1, response2] = await Promise.all([
      fetch(result.urls[0]),
      fetch(result.urls[1]),
    ]);

    expect(response1.ok).toBe(true);
    expect(response2.ok).toBe(true);

    console.log("✅ Both images are publicly accessible via CDN");
  }, 60000);
});
