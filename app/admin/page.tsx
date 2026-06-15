import { createClient } from '@supabase/supabase-js';

export default async function Admin() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data } = await supabase.from('project_submissions').select('*').order('created_at', { ascending: false });
  return <div style={{padding:20}}><h1>الرسائل</h1><table border={1}>{data?.map(c=><tr key={c.id}><td>{c.name}</td><td>{c.email}</td><td>{c.message}</td></tr>)}</table></div>
}
