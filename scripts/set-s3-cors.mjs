/**
 * Set CORS configuration on the Monetura S3 bucket.
 *
 * Run from the repo root (resolves @aws-sdk/client-s3 from apps/platform):
 *
 *   cd apps/platform && node ../../scripts/set-s3-cors.mjs
 *
 * Reads credentials from environment variables. You can prefix inline:
 *
 *   AWS_ACCESS_KEY_ID=xxx \
 *   AWS_SECRET_ACCESS_KEY=yyy \
 *   AWS_REGION=us-east-1 \
 *   AWS_S3_BUCKET=monetura-platform-media \
 *   node ../../scripts/set-s3-cors.mjs
 *
 * Or load from .env.local first:
 *
 *   set -a && source .env.local && set +a
 *   node ../../scripts/set-s3-cors.mjs
 */

import { S3Client, PutBucketCorsCommand, GetBucketCorsCommand } from "@aws-sdk/client-s3";

const bucket    = process.env.AWS_S3_BUCKET;
const region    = process.env.AWS_REGION;
const accessKey = process.env.AWS_ACCESS_KEY_ID;
const secretKey = process.env.AWS_SECRET_ACCESS_KEY;

if (!bucket || !region || !accessKey || !secretKey) {
  console.error(
    "Missing required env vars: AWS_S3_BUCKET, AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY"
  );
  process.exit(1);
}

const client = new S3Client({
  region,
  credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
});

const corsConfig = {
  CORSRules: [
    {
      AllowedHeaders: ["*"],
      AllowedMethods: ["GET", "PUT", "POST", "DELETE", "HEAD"],
      AllowedOrigins: [
        "https://app.monetura.com",
        "https://monetura-platform-app.vercel.app",
        "http://localhost:3001",
        "http://localhost:3000",
      ],
      ExposeHeaders: ["ETag"],
      MaxAgeSeconds: 3000,
    },
  ],
};

async function run() {
  console.log(`Setting CORS on bucket: ${bucket} (region: ${region})`);

  try {
    await client.send(
      new PutBucketCorsCommand({
        Bucket: bucket,
        CORSConfiguration: corsConfig,
      })
    );
    console.log("✓ CORS configuration applied successfully.");
  } catch (err) {
    console.error("✗ Failed to set CORS:", err.message ?? err);
    process.exit(1);
  }

  // Verify
  try {
    const result = await client.send(new GetBucketCorsCommand({ Bucket: bucket }));
    console.log("\nVerified CORS rules on bucket:");
    console.log(JSON.stringify(result.CORSRules, null, 2));
  } catch (err) {
    console.warn("Could not verify CORS (set may still have succeeded):", err.message ?? err);
  }
}

run();
