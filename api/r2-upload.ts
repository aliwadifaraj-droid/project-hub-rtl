import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import Busboy from 'busboy';

const R2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.VITE_R2_ENDPOINT}`,
  credentials: {
    accessKeyId: process.env.VITE_R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.VITE_R2_SECRET_ACCESS_KEY,
  },
});

export const config = { api: { bodyParser: false } };

export default (req,res)=>{const b=Busboy({headers:req.headers});let p; b.on('file',(n,f,i)=>{const k=`uploads/${Date.now()}-${i.filename}`,c=[];f.on('data',d=>c.push(d));p=new Promise(async(rv,rj)=>{f.on('end',async()=>{try{await R2.send(new PutObjectCommand({Bucket:process.env.VITE_R2_BUCKET,Key:k,Body:Buffer.concat(c),ContentType:i.mimeType}));rv({url:`${process.env.VITE_R2_PUBLIC_URL}/${k}`})}catch(e){rj(e.message)}})})});b.on('finish',async()=>{try{res.json(await p)}catch(e){res.status(500).json({error:e})}});req.pipe(b)}
