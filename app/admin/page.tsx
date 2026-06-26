import { createClient } from '@supabase/supabase-js';

export default async function Admin() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  
  const { data: contacts } = await supabase.from('contacts').select('*').order('created_at', { ascending: false });
  const { data: vips } = await supabase.from('vip_subscribers').select('name, created_at').order('created_at', { ascending: false });

  return <div style={{padding:20}}>
    <h1>الرسائل</h1>
    <table border={1}>{contacts?.map(c=><tr key={c.id}><td>{c.name}</td><td>{c.email}</td><td>{c.message}</td></tr>)}</table>
    
    <h1 style={{marginTop:40}}>VIP المشتركين</h1>
    <table border={1}>{vips?.map((v,i)=><tr key={i}><td>{i+1}</td><td>{v.name}</td><td>{new Date(v.created_at).toLocaleDateString('ar-SA')}</td></tr>)}</table>
  </div>
}
