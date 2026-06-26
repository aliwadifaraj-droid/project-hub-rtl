import { createClient } from '@supabase/supabase-js';

console.log("✅ اللوحة الجديدة تعمل!");

export default async function AdminDashboard() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // جميع جداولك
  const tables = [
    'ad_comments',
    'ads',
    'bid_requests',
    'bids',
    'contact_messages',
    'messages',
    'notifications',
    'profiles',
    'project_requests',
    'project_submissions',
    'projects',
    'roles',
    'team_messages',
    'user_roles',
    'vip_subscribers'
  ];

  const data = {};
  for (const table of tables) {
    const { data: result, error } = await supabase
      .from(table)
      .select('*')
      .order('created_at', { ascending: false });
    data[table] = error ? [] : result || [];
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial', direction: 'rtl' }}>
      <h1 style={{ textAlign: 'center' }}>📊 لوحة تحكم الأدمن الشاملة</h1>
      
      {/* إحصائيات سريعة */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', marginBottom: '30px' }}>
        {tables.map(table => (
          <div key={table} style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
            <h4>{table}</h4>
            <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{data[table]?.length || 0}</p>
          </div>
        ))}
      </div>

      {/* عرض جميع الجداول مع بياناتها */}
      {tables.map(table => (
        <div key={table} style={{ marginBottom: '30px' }}>
          <h2 style={{ background: '#333', color: 'white', padding: '10px', borderRadius: '5px' }}>
            📋 {table} ({data[table]?.length || 0})
          </h2>
          {data[table]?.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table border="1" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ background: '#555', color: 'white' }}>
                    {Object.keys(data[table][0]).map(col => (
                      <th key={col} style={{ padding: '8px', textAlign: 'right' }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data[table].map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #ddd' }}>
                      {Object.values(row).map((val, j) => (
                        <td key={j} style={{ padding: '8px' }}>
                          {typeof val === 'string' && val.length > 100 
                            ? val.substring(0, 100) + '...' 
                            : String(val)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ color: '#666', fontStyle: 'italic' }}>لا توجد بيانات في هذا الجدول</p>
          )}
        </div>
      ))}
    </div>
  );
}
