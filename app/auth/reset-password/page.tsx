'use client'
import { useState } from 'react'
import { supabase } from '@/integrations/supabase/auth'

export default function Reset() {
  const [pass, setPass] = useState('')

  const save = async () => {
    const { error } = await supabase.auth.updateUser({ password: pass })
    if (error) alert('خطأ: ' + error.message)
    else alert('تم تغيير كلمة السر بنجاح')
  }

  return (
    <div style={{padding: 50, textAlign: 'center'}}>
      <h3>كلمة سر جديدة</h3>
      <input 
        type="password" 
        value={pass}
        onChange={e => setPass(e.target.value)}
        placeholder="اكتب كلمة السر"
        style={{padding: 10, width: 250}}
      />
      <br/><br/>
      <button onClick={save} style={{padding: 10}}>حفظ</button>
    </div>
  )
}
