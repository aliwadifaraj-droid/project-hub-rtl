import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

export const Route = createFileRoute('/unsubscribe')({
  component: UnsubscribePage,
})

function UnsubscribePage() {
  const [token, setToken] = useState<string | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'done' | 'error' | 'invalid'>('loading')
  const [email, setEmail] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const t = params.get('token')
    if (!t) {
      setState('invalid')
      return
    }
    setToken(t)
    fetch(`/email/unsubscribe?token=${encodeURIComponent(t)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d?.valid) {
          setEmail(d.email ?? null)
          setState('ready')
        } else {
          setState('invalid')
        }
      })
      .catch(() => setState('error'))
  }, [])

  async function confirm() {
    if (!token) return
    try {
      const res = await fetch('/email/unsubscribe', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const d = await res.json()
      if (d?.success) setState('done')
      else {
        setError(d?.error ?? 'فشل الإلغاء')
        setState('error')
      }
    } catch (e: any) {
      setError(e?.message ?? 'خطأ')
      setState('error')
    }
  }

  return (
    <div dir="rtl" className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-md w-full rounded-lg border bg-card p-6 text-center space-y-4">
        <h1 className="text-xl font-semibold">إلغاء الاشتراك من الرسائل</h1>
        {state === 'loading' && <p className="text-muted-foreground">جارٍ التحقق…</p>}
        {state === 'invalid' && <p className="text-destructive">الرابط غير صالح أو منتهي.</p>}
        {state === 'ready' && (
          <>
            {email && <p className="text-sm text-muted-foreground">{email}</p>}
            <button
              onClick={confirm}
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              تأكيد إلغاء الاشتراك
            </button>
          </>
        )}
        {state === 'done' && <p className="text-green-600">تم إلغاء اشتراكك بنجاح.</p>}
        {state === 'error' && <p className="text-destructive">{error ?? 'حدث خطأ.'}</p>}
      </div>
    </div>
  )
}
