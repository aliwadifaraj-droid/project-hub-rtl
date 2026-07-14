import { db } from '~/lib/turso.server';

export default async function Admin() {
  const { rows: data } = await db.execute('SELECT * FROM contacts ORDER BY created_at DESC');
  return <div style={{padding:20}}><h1>الرسائل</h1><table border={1}>{data?.map(c=><tr key={c.id}><td>{c.name}</td><td>{c.email}</td><td>{c.message}</td></tr>)}</table></div>
}
