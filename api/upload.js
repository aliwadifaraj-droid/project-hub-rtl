import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-presigned-url";

const R2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY,
    secretAccessKey: process.env.R2_SECRET,
  },
});

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  
  const { filename, contentType } = req.body;
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET,
    Key: filename,
    ContentType: contentType,
  });
  
  const url = await getSignedUrl(R2, command, { expiresIn: 60 });
  res.json({ url });
}
