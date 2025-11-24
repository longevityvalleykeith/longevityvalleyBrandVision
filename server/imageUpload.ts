/**
 * Image Upload Service
 * Handles uploading brand assets to S3 storage
 */

import { storagePut } from "./storage";
import { randomBytes } from "crypto";

interface UploadImageInput {
  fileName: string;
  fileData: string; // base64 encoded image data
  mimeType: string;
}

/**
 * Upload a single image to S3
 * Returns the public URL of the uploaded image
 */
export async function uploadImage(input: UploadImageInput, userId: number): Promise<string> {
  // Generate a unique file key to prevent enumeration
  const randomSuffix = randomBytes(8).toString('hex');
  const sanitizedFileName = input.fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const fileKey = `brand-assets/${userId}/${Date.now()}-${randomSuffix}-${sanitizedFileName}`;

  // Convert base64 to buffer
  const base64Data = input.fileData.split(',')[1] || input.fileData;
  const buffer = Buffer.from(base64Data, 'base64');

  // Upload to S3
  const { url } = await storagePut(fileKey, buffer, input.mimeType);

  return url;
}

/**
 * Upload multiple images to S3
 * Returns an array of public URLs
 */
export async function uploadMultipleImages(
  images: UploadImageInput[],
  userId: number
): Promise<string[]> {
  const uploadPromises = images.map(image => uploadImage(image, userId));
  return await Promise.all(uploadPromises);
}
