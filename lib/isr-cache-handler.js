/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * ISR cache handler backed by S3.
 * Lambda filesystems are read-only and instances share nothing, so the
 * default file-system cache cannot work there. Outside Lambda every method
 * returns null and Next.js falls back to its default behavior.
 */
const { S3Client, GetObjectCommand, PutObjectCommand } = require("@aws-sdk/client-s3");

const isLambda = !!process.env.AWS_LAMBDA_FUNCTION_NAME;

// Tracks tag revalidation timestamps within a warm Lambda instance.
const tagsManifest = new Map();

class S3CacheHandler {
  constructor(options) {
    this.s3Client = null;
    this.bucketName = "";
    this.cachePrefix = "_cache";
    this.revalidatedTags = options?.revalidatedTags || [];

    if (isLambda) {
      this.s3Client = new S3Client({ region: process.env.AWS_REGION || "us-east-1" });
      this.bucketName = process.env.S3_CACHE_BUCKET_NAME || "";
      if (!this.bucketName) {
        console.warn("S3_CACHE_BUCKET_NAME not set, ISR cache disabled");
      }
    }
  }

  isStale(tags, timestamp) {
    for (const tag of tags) {
      const revalidatedAt = tagsManifest.get(tag);
      if (typeof revalidatedAt === "number" && revalidatedAt >= timestamp) {
        return true;
      }
    }
    return false;
  }

  getS3Key(key) {
    const cleanKey = key.startsWith("/") ? key.slice(1) : key;
    return `${this.cachePrefix}/${cleanKey}.json`;
  }

  async get(key, ctx) {
    if (!isLambda || !this.s3Client || !this.bucketName) {
      return null;
    }

    try {
      const response = await this.s3Client.send(
        new GetObjectCommand({ Bucket: this.bucketName, Key: this.getS3Key(key) })
      );
      if (!response.Body) {
        return null;
      }

      const cacheData = JSON.parse(await this.streamToString(response.Body));
      const data = {
        lastModified: response.LastModified?.getTime(),
        value: cacheData.value,
      };

      if (data.value?.kind === "FETCH" && ctx && "tags" in ctx && ctx.tags) {
        const combinedTags = [...(ctx.tags || []), ...(ctx.softTags || [])];
        const wasRevalidated = combinedTags.some((tag) => {
          if (this.revalidatedTags.includes(tag)) {
            return true;
          }
          return this.isStale([tag], data.lastModified || Date.now());
        });
        if (wasRevalidated) {
          return null;
        }
      }

      if (data.value && "headers" in data.value) {
        const cacheTags =
          data.value.headers?.[process.env.NEXT_CACHE_TAGS_HEADER || "x-next-cache-tags"];
        if (typeof cacheTags === "string") {
          const tags = cacheTags.split(",");
          if (tags.length && this.isStale(tags, data.lastModified || Date.now())) {
            return null;
          }
        }
      }

      return data;
    } catch (error) {
      if (error && typeof error === "object" && "name" in error && error.name === "NoSuchKey") {
        return null;
      }
      console.error("Error getting cache from S3:", error);
      return null;
    }
  }

  async set(key, data, ctx) {
    if (!isLambda || !this.s3Client || !this.bucketName || !data) {
      return;
    }

    try {
      if (ctx && "fetchCache" in ctx && ctx.fetchCache && ctx.tags && data.kind === "FETCH") {
        data.tags = ctx.tags;
      }

      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: this.getS3Key(key),
          Body: JSON.stringify({ value: data, lastModified: Date.now() }),
          ContentType: "application/json",
        })
      );
    } catch (error) {
      console.error("Error setting cache in S3:", error);
    }
  }

  async revalidateTag(...args) {
    let tags = args[0];
    tags = typeof tags === "string" ? [tags] : tags;
    for (const tag of tags || []) {
      tagsManifest.set(tag, Date.now());
    }
  }

  async streamToString(stream) {
    return new Promise((resolve, reject) => {
      const chunks = [];
      stream.on("data", (chunk) => chunks.push(chunk));
      stream.on("error", reject);
      stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
    });
  }
}

module.exports = S3CacheHandler;
