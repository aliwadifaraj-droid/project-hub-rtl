import { createClient } from '@supabase/supabase-js';

export default async function ProjectsAdmin() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  
  const { data: vips } = await supabase.from('vip_subscribers').select('name, created_at').order('created_at', { ascending: false });

  return <div style={{padding:20}}>
    <h2>VIP المشتركين: {vips?.length || 0}</h2>
    <table border={1} style={{width:'100%', marginTop:10}}>
      <thead><tr><th>#</th><th>الاسم</th><th>التاريخ</th></tr></thead>
      <tbody>{vips?.map((v,i)=><tr key={i}><td>{i+1}</td><td>{v.name}</td><td>{new Date(v.created_at).toLocaleDateString('ar-SA')}</td></tr>)}</tbody>
    </table>
  </div>
}
