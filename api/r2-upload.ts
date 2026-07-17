import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import Busboy from 'busboy';

const R2 = new S3Client({
  region: "auto",
  endpoint: process.env.VITE_R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.VITE_R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.VITE_R2_SECRET_ACCESS_KEY,
  },
});

export const config = { api: { bodyParser: false } };

export default async (req,res)=>{
  res.setHeader('Access-Control-Allow-Origin', '*');
  if(req.method==='OPTIONS'){res.status(200).end();return}
  
  const busboy = Busboy({headers:req.headers});
  let uploadPromise;
  
  busboy.on('file',(fieldname,file,info)=>{
    const key=`uploads/${Date.now()}-${info.filename}`;
    const chunks=[];
    file.on('data',(d)=>chunks.push(d));
    uploadPromise = new Promise(async(resolve)=>{
      file.on('end',async()=>{
        try{
          await R2.send(new PutObjectCommand({
            Bucket:process.env.VITE_R2_BUCKET,
            Key:key,
            Body:Buffer.concat(chunks),
            ContentType:info.mimeType
          }));
          const url = `${process.env.VITE_R2_PUBLIC_URL}/${key}`
          resolve({success: true, data: {url}}) // هنا التعديل المهم
        }catch(e){
          resolve({success: false, error: e.message})
        }
      })
    })
  });
  
  busboy.on('finish',async()=>{
    const result = await uploadPromise;
    res.status(200).json(result)
  });
  
  req.pipe(busboy)
}
