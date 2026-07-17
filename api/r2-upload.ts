import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import formidable from 'formidable';
import fs from 'fs';

const R2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

export const config = {
  api: { bodyParser: false }, // لازم نطفيه عشان formidable
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const form = formidable({ multiples: false });

  form.parse(req, async (err, fields, files: any) => {
    if (err) return res.status(500).json({ error: err.message });

    try {
      const file = files.file[0]; // اسم الحقل لازم يكون 'file'
      const buffer = fs.readFileSync(file.filepath);
      const key = `uploads/${Date.now()}-${file.originalFilename}`;

      await R2.send(new PutObjectCommand({
        Bucket: process.env.R2_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: file.mimetype,
      }));

      const baseUrl = process.env.VITE_R2_PUBLIC_URL || `https://${process.env.R2_BUCKET}.r2.dev`;
      const publicUrl = `${baseUrl}/${key}`;
      
      fs.unlinkSync(file.filepath); // امسح الملف المؤقت
      return res.status(200).json({ url: publicUrl, key });

    } catch (e: any) {
      console.error("R2 UPLOAD ERROR:", e);
      return res.status(500).json({ error: e.message });
    }
  });
}
