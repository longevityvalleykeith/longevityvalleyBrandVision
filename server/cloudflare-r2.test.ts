import { describe, expect, it } from "vitest";
import { S3Client, ListBucketsCommand, PutObjectCommand } from "@aws-sdk/client-s3";

describe("Cloudflare R2 Credentials Validation", () => {
  it("should successfully connect to Cloudflare R2 and list buckets", async () => {
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
    const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME;

    expect(accountId).toBeDefined();
    expect(accessKeyId).toBeDefined();
    expect(secretAccessKey).toBeDefined();
    expect(bucketName).toBeDefined();

    // Create S3 client configured for Cloudflare R2
    const r2Client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: accessKeyId!,
        secretAccessKey: secretAccessKey!,
      },
    });

    // Test 1: List buckets to verify credentials
    const listCommand = new ListBucketsCommand({});
    const listResponse = await r2Client.send(listCommand);

    expect(listResponse.Buckets).toBeDefined();
    expect(Array.isArray(listResponse.Buckets)).toBe(true);

    // Verify the specified bucket exists
    const bucketExists = listResponse.Buckets?.some(
      (bucket) => bucket.Name === bucketName
    );
    expect(bucketExists).toBe(true);

    console.log("✅ Cloudflare R2 credentials are valid");
    console.log(`✅ Bucket "${bucketName}" exists and is accessible`);
  }, 30000);

  it("should upload a test file to R2 bucket", async () => {
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
    const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME;

    const r2Client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: accessKeyId!,
        secretAccessKey: secretAccessKey!,
      },
    });

    // Upload a small test file
    const testKey = `test-uploads/validation-${Date.now()}.txt`;
    const testContent = "Cloudflare R2 integration test";

    const putCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: testKey,
      Body: testContent,
      ContentType: "text/plain",
    });

    const putResponse = await r2Client.send(putCommand);

    expect(putResponse.$metadata.httpStatusCode).toBe(200);

    console.log("✅ Successfully uploaded test file to R2");
    console.log(`   Key: ${testKey}`);
    
    const publicDomain = process.env.CLOUDFLARE_R2_PUBLIC_DOMAIN;
    if (publicDomain) {
      console.log(`   Public URL: https://${publicDomain}/${testKey}`);
    } else {
      console.log(`   Note: No public domain configured. File uploaded but not publicly accessible.`);
    }
  }, 30000);
});
