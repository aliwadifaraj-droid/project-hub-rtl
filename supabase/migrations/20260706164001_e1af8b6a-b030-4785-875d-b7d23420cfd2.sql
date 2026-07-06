
-- Bot Q&A knowledge base
CREATE TABLE public.bot_qa (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  keywords TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.bot_qa TO service_role;
ALTER TABLE public.bot_qa ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER bot_qa_updated_at BEFORE UPDATE ON public.bot_qa FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Support chat sessions (anonymous visitors)
CREATE TABLE public.support_chats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_token UUID NOT NULL UNIQUE,
  visitor_name TEXT,
  status TEXT NOT NULL DEFAULT 'bot', -- 'bot' | 'escalated' | 'closed'
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.support_chats TO service_role;
ALTER TABLE public.support_chats ENABLE ROW LEVEL SECURITY;

-- Support chat messages
CREATE TABLE public.support_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID NOT NULL REFERENCES public.support_chats(id) ON DELETE CASCADE,
  sender TEXT NOT NULL, -- 'visitor' | 'bot' | 'admin' | 'system'
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.support_messages TO service_role;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
CREATE INDEX support_messages_chat_created_idx ON public.support_messages(chat_id, created_at);

-- Seed 5 default Q&As (Arabic)
INSERT INTO public.bot_qa (question, answer, keywords, sort_order) VALUES
('كيف أضيف مشروعًا جديدًا؟', 'يمكنك إضافة مشروع جديد عبر صفحة "إضافة مشروع" بعد تسجيل الدخول. املأ البيانات وارفع الصور وسيتم مراجعة المشروع من قِبل الإدارة.', ARRAY['اضافة','إضافة','مشروع','جديد','رفع'], 1),
('كيف أقدّم عرض سعر على مشروع؟', 'ادخل صفحة المشروع، اضغط "قدّم عرضك"، ثم ارفع ملف PDF بعرضك وسيتم إرساله لصاحب المشروع.', ARRAY['عرض','سعر','تقديم','قدّم','بيد'], 2),
('كيف أصبح عضوًا مميزًا VIP؟', 'من صفحة VIP يمكنك الاطلاع على المزايا وطلب الاشتراك، وسيتم تفعيل عضويتك بعد التحقق من الدفع.', ARRAY['vip','مميز','اشتراك','عضوية'], 3),
('كيف أتواصل مع الدعم؟', 'يمكنك مراسلتنا مباشرة من صفحة "تواصل بنا" أو استخدام هذا الشات، ويمكنك طلب التحويل لموظف في أي وقت.', ARRAY['تواصل','دعم','مساعدة','اتصال'], 4),
('ما هي مدة مراجعة المشاريع والطلبات؟', 'عادةً تتم المراجعة خلال 24 إلى 48 ساعة عمل، وسيصلك إشعار وبريد إلكتروني عند تحديث حالة طلبك.', ARRAY['مدة','مراجعة','وقت','متى','حالة'], 5);
