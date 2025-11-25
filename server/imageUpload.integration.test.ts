import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as fs from "fs";
import * as path from "path";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
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

describe("Image Upload Integration Test", () => {
  it("should upload a real image file to S3 and return URL", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a test image file
    const testImagePath = path.join(__dirname, "../test-upload.jpg");
    
    // Check if test image exists
    if (!fs.existsSync(testImagePath)) {
      console.log("Test image not found, skipping integration test");
      return;
    }

    // Read the image file
    const imageBuffer = fs.readFileSync(testImagePath);
    const base64Image = imageBuffer.toString("base64");
    const dataUri = `data:image/jpeg;base64,${base64Image}`;

    // Call the upload mutation
    const result = await caller.imageUpload.uploadImages({
      images: [
        {
          fileName: "test-upload.jpg",
          fileData: dataUri,
          mimeType: "image/jpeg",
        },
      ],
    });

    // Verify the result
    expect(result).toHaveProperty("urls");
    expect(Array.isArray(result.urls)).toBe(true);
    expect(result.urls.length).toBe(1);
    expect(result.urls[0]).toMatch(/^https?:\/\//);
    
    console.log("✅ Image uploaded successfully to:", result.urls[0]);
  }, 30000); // 30 second timeout for S3 upload

  it("should handle multiple image uploads", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create simple base64 images (1x1 pixel red and blue)
    const redPixel = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==";
    const bluePixel = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAEBgIApD5fRAAAAABJRU5ErkJggg==";

    const result = await caller.imageUpload.uploadImages({
      images: [
        {
          fileName: "red.png",
          fileData: redPixel,
          mimeType: "image/png",
        },
        {
          fileName: "blue.png",
          fileData: bluePixel,
          mimeType: "image/png",
        },
      ],
    });

    expect(result.urls.length).toBe(2);
    expect(result.urls[0]).toMatch(/^https?:\/\//);
    expect(result.urls[1]).toMatch(/^https?:\/\//);
    expect(result.urls[0]).not.toBe(result.urls[1]);
    
    console.log("✅ Multiple images uploaded successfully");
    console.log("  - Image 1:", result.urls[0]);
    console.log("  - Image 2:", result.urls[1]);
  }, 30000);

  it("should reject images that are too large", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a large base64 string (>10MB when decoded)
    const largeData = "A".repeat(15 * 1024 * 1024); // 15MB of 'A' characters
    const largeImage = `data:image/jpeg;base64,${largeData}`;

    await expect(
      caller.imageUpload.uploadImages({
        images: [
          {
            fileName: "large.jpg",
            fileData: largeImage,
            mimeType: "image/jpeg",
          },
        ],
      })
    ).rejects.toThrow();
  }, 30000);

  it("should reject invalid image formats", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.imageUpload.uploadImages({
        images: [
          {
            fileName: "test.txt",
            fileData: "data:text/plain;base64,SGVsbG8gV29ybGQ=",
            mimeType: "text/plain",
          },
        ],
      })
    ).rejects.toThrow();
  });
});
