import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME;
const publicDomain = process.env.CLOUDFLARE_R2_PUBLIC_DOMAIN;

if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
  throw new Error(
    "Missing Cloudflare R2 credentials. Please configure CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_R2_ACCESS_KEY_ID, CLOUDFLARE_R2_SECRET_ACCESS_KEY, and CLOUDFLARE_R2_BUCKET_NAME environment variables."
  );
}

// Create S3 client configured for Cloudflare R2
const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

/**
 * Upload a file to Cloudflare R2 storage
 * @param relKey - Relative key/path for the file in the bucket (e.g., "brand-assets/user-123/logo.png")
 * @param data - File data as Buffer, Uint8Array, or string
 * @param contentType - MIME type of the file (e.g., "image/png")
 * @returns Object containing the file key and public URL
 */
export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType?: string
): Promise<{ key: string; url: string }> {
  try {
    const putCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: relKey,
      Body: data,
      ContentType: contentType,
    });

    await r2Client.send(putCommand);

    // Construct public URL
    const url = publicDomain
      ? `https://${publicDomain}/${relKey}`
      : `https://${bucketName}.${accountId}.r2.cloudflarestorage.com/${relKey}`;

    return { key: relKey, url };
  } catch (error) {
    console.error("[Cloudflare R2] Upload failed:", error);
    throw new Error(`Failed to upload file to R2: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Generate a public URL for a file in R2 storage
 * @param relKey - Relative key/path of the file
 * @param expiresIn - (Not used for R2 public buckets, kept for API compatibility)
 * @returns Object containing the file key and public URL
 */
export async function storageGet(
  relKey: string,
  expiresIn?: number
): Promise<{ key: string; url: string }> {
  // For R2 with public domain, we can directly construct the URL
  const url = publicDomain
    ? `https://${publicDomain}/${relKey}`
    : `https://${bucketName}.${accountId}.r2.cloudflarestorage.com/${relKey}`;

  return { key: relKey, url };
}
