import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const R2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

export const config = { api: { bodyParser: true, sizeLimit: '10mb' } }; // شغلنا bodyParser

export default async function handler(req: any, res: any) {
  console.log("METHOD:", req.method);
  console.log("ENV CHECK:", {
    has_account:!!process.env.R2_ACCOUNT_ID,
    has_key:!!process.env.R2_ACCESS_KEY_ID,
    has_bucket:!!process.env.R2_BUCKET
  });

  if (req.method!== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const file = req.body; // دام bodyParser شغال
    if(!file) return res.status(400).json({error: "body فاضي"})
    
    const buffer = Buffer.from(file);
    const key = `uploads/${Date.now()}-debug.jpg`;

    await R2.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: key,
      Body: buffer,
    }));

    const baseUrl = process.env.VITE_R2_PUBLIC_URL;
    return res.status(200).json({ url: `${baseUrl}/${key}`, success: true });

  } catch (err: any) {
    console.error("FULL ERROR:", err);
    return res.status(500).json({ error: err.message, stack: err.stack });
  }
}
