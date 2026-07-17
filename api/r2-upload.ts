import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const R2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

export const config = {
  api: { bodyParser: false },
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(chunk);
    const buffer = Buffer.concat(chunks);

    const filename = req.headers['x-filename'] || `file-${Date.now()}.bin`;
    const contentType = req.headers['content-type'] || 'application/octet-stream';
    const key = `uploads/${Date.now()}-${filename}`;

    await R2.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }));

    const baseUrl = process.env.VITE_R2_PUBLIC_URL || `https://${process.env.R2_BUCKET}.r2.dev`;
    const publicUrl = `${baseUrl}/${key}`;
    
    return res.status(200).json({ url: publicUrl, key });

  } catch (err: any) {
    console.error("R2 UPLOAD ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
}
