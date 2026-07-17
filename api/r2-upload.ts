import { uploadToR2, makeKey } from '../lib/r2.server';

export const config = {
  api: {
    bodyParser: false, // مهم جدا عشان Vercel ما يخرب الملف
  },
};

export default async function handler(req: any, res: any) {
  // 1. نسمح POST بس
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // 2. نقرا الملف من الـ request
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    // 3. نجيب اسم الملف من الهيدر
    const filename = req.headers['x-filename'] || 'file.bin';
    const contentType = req.headers['content-type'] || 'application/octet-stream';
    
    // 4. نسوي key ونرفع
    const key = makeKey('uploads', filename);
    await uploadToR2({ key, body: buffer, contentType });

    // 5. نرجع الرابط العام - التعديل هنا
    const baseUrl = process.env.VITE_R2_PUBLIC_URL || `https://${process.env.R2_BUCKET}.r2.dev`;
    const publicUrl = `${baseUrl}/${key}`;
    
    return res.status(200).json({ url: publicUrl, key });

  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
