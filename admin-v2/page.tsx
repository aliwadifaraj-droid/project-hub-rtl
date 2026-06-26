import { createClient } from '@supabase/supabase-js';

export default async function AdminDashboard() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // جلب جميع الجداول دفعة واحدة
  const tables = {
    العملاء المميزون: 'vip_subscribers',
    المشاريع: 'projects',
    الرسائل: 'contact_messages',
    المزايدات: 'bids',
    المستخدمين: 'profiles',
    الإشعارات: 'notifications',
    طلبات المشاريع: 'project_requests',
    الأدوار: 'roles',
    الإعلانات: 'ads',
  };

  const data = {};
  for (const [key, table] of Object.entries(tables)) {
    const { data: result } = await supabase.from(table).select('*').order('created_at', { ascending: false });
    data[key] = result || [];
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1 style={{ textAlign: 'center' }}>📊 لوحة تحكم الأدمن الشاملة</h1>
      
      {/* بطاقات إحصائية */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', marginBottom: '30px' }}>
        {Object.entries(data).map(([name, rows]) => (
          <div key={name} style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
            <h4>{name}</h4>
            <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>{rows.length}</p>
          </div>
        ))}
      </div>

      {/* عرض جميع الجداول */}
      {Object.entries(data).map(([name, rows]) => (
        <div key={name} style={{ marginBottom: '30px' }}>
          <h2>{name} ({rows.length})</h2>
          <table border="1" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: '#333', color: 'white' }}>
                {rows.length > 0 && Object.keys(rows[0]).map(col => (
                  <th key={col} style={{ padding: '8px' }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={index}>
                  {Object.values(row).map((val, i) => (
                    <td key={i} style={{ padding: '8px' }}>
                      {typeof val === 'string' && val.length > 50 ? val.substring(0, 50) + '...' : String(val)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
