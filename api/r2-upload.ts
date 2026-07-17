import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import Busboy from 'busboy';

const R2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

export const config = { api: { bodyParser: false } };

export default function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const busboy = Busboy({ headers: req.headers });
  let uploadPromise: Promise<any> | null = null;

  busboy.on('file', (name, file, info) => {
    const { filename, mimeType } = info;
    const key = `uploads/${Date.now()}-${filename}`;
    const chunks: Buffer[] = [];

    file.on('data', (chunk) => chunks.push(chunk));

    uploadPromise = new Promise(async (resolve, reject) => {
      file.on('end', async () => {
        try {
          const buffer = Buffer.concat(chunks);
          await R2.send(new PutObjectCommand({
            Bucket: process.env.R2_BUCKET,
            Key: key,
            Body: buffer,
            ContentType: mimeType,
          }));
          const baseUrl = process.env.VITE_R2_PUBLIC_URL || `https://${process.env.R2_BUCKET}.r2.dev`;
          resolve({ url: `${baseUrl}/${key}`, key });
        } catch (err) { reject(err); }
      });
    });
  });

  busboy.on('finish', async () => {
    try {
      if (!uploadPromise) return res.status(400).json({ error: "لم يتم ارسال ملف باسم 'file'" });
      const result = await uploadPromise;
      return res.status(200).json(result);
    } catch (err: any) {
      console.error("UPLOAD ERROR:", err);
      return res.status(500).json({ error: err.message });
    }
  });

  req.pipe(busboy);
}
