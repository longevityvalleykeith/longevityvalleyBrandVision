import { describe, expect, it, vi, beforeEach } from "vitest";
import { uploadImage, uploadMultipleImages } from "./imageUpload";
import * as storage from "./storage";

// Mock the storage module
vi.mock("./storage", () => ({
  storagePut: vi.fn(),
}));

describe("Image Upload Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("uploadImage", () => {
    it("should upload a single image to S3 and return URL", async () => {
      const mockUrl = "https://s3.example.com/brand-assets/123/image.jpg";
      vi.mocked(storage.storagePut).mockResolvedValue({
        key: "brand-assets/123/image.jpg",
        url: mockUrl,
      });

      const input = {
        fileName: "test-image.jpg",
        fileData: "data:image/jpeg;base64,/9j/4AAQSkZJRg==",
        mimeType: "image/jpeg",
      };

      const result = await uploadImage(input, 123);

      expect(result).toBe(mockUrl);
      expect(storage.storagePut).toHaveBeenCalledTimes(1);
      
      const callArgs = vi.mocked(storage.storagePut).mock.calls[0];
      expect(callArgs[0]).toMatch(/^brand-assets\/123\/\d+-[a-f0-9]+-test-image\.jpg$/);
      expect(callArgs[1]).toBeInstanceOf(Buffer);
      expect(callArgs[2]).toBe("image/jpeg");
    });

    it("should sanitize file names with special characters", async () => {
      const mockUrl = "https://s3.example.com/brand-assets/123/image.jpg";
      vi.mocked(storage.storagePut).mockResolvedValue({
        key: "brand-assets/123/image.jpg",
        url: mockUrl,
      });

      const input = {
        fileName: "test image@#$%.jpg",
        fileData: "data:image/jpeg;base64,/9j/4AAQSkZJRg==",
        mimeType: "image/jpeg",
      };

      await uploadImage(input, 123);

      const callArgs = vi.mocked(storage.storagePut).mock.calls[0];
      expect(callArgs[0]).toMatch(/test_image____\.jpg$/);
    });

    it("should handle base64 data with or without data URI prefix", async () => {
      const mockUrl = "https://s3.example.com/brand-assets/123/image.jpg";
      vi.mocked(storage.storagePut).mockResolvedValue({
        key: "brand-assets/123/image.jpg",
        url: mockUrl,
      });

      // Test with data URI prefix
      const inputWithPrefix = {
        fileName: "test.jpg",
        fileData: "data:image/jpeg;base64,SGVsbG8gV29ybGQ=",
        mimeType: "image/jpeg",
      };

      await uploadImage(inputWithPrefix, 123);

      const buffer1 = vi.mocked(storage.storagePut).mock.calls[0][1] as Buffer;
      expect(buffer1.toString()).toBe("Hello World");

      vi.clearAllMocks();

      // Test without data URI prefix
      const inputWithoutPrefix = {
        fileName: "test.jpg",
        fileData: "SGVsbG8gV29ybGQ=",
        mimeType: "image/jpeg",
      };

      await uploadImage(inputWithoutPrefix, 123);

      const buffer2 = vi.mocked(storage.storagePut).mock.calls[0][1] as Buffer;
      expect(buffer2.toString()).toBe("Hello World");
    });
  });

  describe("uploadMultipleImages", () => {
    it("should upload multiple images and return array of URLs", async () => {
      const mockUrls = [
        "https://s3.example.com/brand-assets/123/image1.jpg",
        "https://s3.example.com/brand-assets/123/image2.jpg",
        "https://s3.example.com/brand-assets/123/image3.jpg",
      ];

      vi.mocked(storage.storagePut)
        .mockResolvedValueOnce({ key: "key1", url: mockUrls[0] })
        .mockResolvedValueOnce({ key: "key2", url: mockUrls[1] })
        .mockResolvedValueOnce({ key: "key3", url: mockUrls[2] });

      const images = [
        {
          fileName: "image1.jpg",
          fileData: "data:image/jpeg;base64,/9j/4AAQSkZJRg==",
          mimeType: "image/jpeg",
        },
        {
          fileName: "image2.png",
          fileData: "data:image/png;base64,iVBORw0KGgo=",
          mimeType: "image/png",
        },
        {
          fileName: "image3.webp",
          fileData: "data:image/webp;base64,UklGRiQAAABXRUJQ",
          mimeType: "image/webp",
        },
      ];

      const results = await uploadMultipleImages(images, 123);

      expect(results).toEqual(mockUrls);
      expect(storage.storagePut).toHaveBeenCalledTimes(3);
    });

    it("should handle empty array", async () => {
      const results = await uploadMultipleImages([], 123);

      expect(results).toEqual([]);
      expect(storage.storagePut).not.toHaveBeenCalled();
    });

    it("should propagate errors from S3 upload", async () => {
      vi.mocked(storage.storagePut).mockRejectedValue(new Error("S3 upload failed"));

      const images = [
        {
          fileName: "image1.jpg",
          fileData: "data:image/jpeg;base64,/9j/4AAQSkZJRg==",
          mimeType: "image/jpeg",
        },
      ];

      await expect(uploadMultipleImages(images, 123)).rejects.toThrow("S3 upload failed");
    });
  });

  describe("File key generation", () => {
    it("should generate unique keys for the same file uploaded multiple times", async () => {
      const mockUrl = "https://s3.example.com/brand-assets/123/image.jpg";
      vi.mocked(storage.storagePut).mockResolvedValue({
        key: "brand-assets/123/image.jpg",
        url: mockUrl,
      });

      const input = {
        fileName: "test.jpg",
        fileData: "data:image/jpeg;base64,/9j/4AAQSkZJRg==",
        mimeType: "image/jpeg",
      };

      await uploadImage(input, 123);
      const key1 = vi.mocked(storage.storagePut).mock.calls[0][0];

      vi.clearAllMocks();

      await uploadImage(input, 123);
      const key2 = vi.mocked(storage.storagePut).mock.calls[0][0];

      // Keys should be different due to timestamp and random suffix
      expect(key1).not.toBe(key2);
    });

    it("should include user ID in the file key", async () => {
      const mockUrl = "https://s3.example.com/brand-assets/456/image.jpg";
      vi.mocked(storage.storagePut).mockResolvedValue({
        key: "brand-assets/456/image.jpg",
        url: mockUrl,
      });

      const input = {
        fileName: "test.jpg",
        fileData: "data:image/jpeg;base64,/9j/4AAQSkZJRg==",
        mimeType: "image/jpeg",
      };

      await uploadImage(input, 456);

      const callArgs = vi.mocked(storage.storagePut).mock.calls[0];
      expect(callArgs[0]).toMatch(/^brand-assets\/456\//);
    });
  });
});
