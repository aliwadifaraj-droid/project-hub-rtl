import { useState } from "react";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const R2 = new S3Client({
  region: "auto",
  endpoint: "https://<accountid>.r2.cloudflarestorage.com",
  credentials: {
    accessKeyId: import.meta.env.VITE_R2_ACCESS_KEY,
    secretAccessKey: import.meta.env.VITE_R2_SECRET_KEY,
  },
});

export default function UploadR2() {
  const [file, setFile] = useState<File | null>(null);
  const upload = async () => {
    if (!file) return;
    await R2.send(new PutObjectCommand({Bucket: "your-bucket-name", Key: file.name, Body: file}));
    alert("تم الرفع");
  };
  return <div><input type="file" onChange={e => setFile(e.target.files?.[0] || null)} /><button onClick={upload}>رفع</button></div>;
}
