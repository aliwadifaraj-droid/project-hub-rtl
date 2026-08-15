import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { submitAddProjectOffer } from "@/lib/offers.functions";
import { uploadPublicFile } from "@/lib/files.functions";
import { Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";

type BidFormAddProjectProps = {
  projectId: string;
};

export function BidFormAddProject({ projectId }: BidFormAddProjectProps) {
  const submitAddOffer = useServerFn(submitAddProjectOffer);
  const upload = useServerFn(uploadPublicFile);
  const navigate = useNavigate();

  const [companyName, setCompanyName] = useState("");
  const [facilityLocation, setFacilityLocation] = useState("");
  const [email, setEmail] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!companyName.trim() || !facilityLocation.trim() || !email.trim() || !pdfFile) {
      toast.error("جميع الحقول إجبارية");
      return;
    }
    if (!emailRegex.test(email.trim())) {
      toast.error("يرجى إدخال بريد إلكتروني صحيح");
      return;
    }
    if (pdfFile.size > 10 * 1024 * 1024) {
      toast.error("حجم الملف يجب أن يكون أقل من 10 ميغابايت");
      return;
    }
    setSubmitting(true);
    try {
      const buf = await pdfFile.arrayBuffer();
      let binary = "";
      const bytes = new Uint8Array(buf);
      const chunk = 0x8000;
      for (let i = 0; i < bytes.length; i += chunk) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
      }
      const file_base64 = btoa(binary);

      const uploadRes = await upload({
        data: {
          filename: pdfFile.name,
          mime: pdfFile.type || "application/pdf",
          purpose: "bid-pdf",
          data: file_base64,
        },
      });
      if (!uploadRes?.key) throw new Error("فشل رفع الملف");

      await submitAddOffer({
        data: {
          project_id: projectId,
          company_name: companyName.trim().slice(0, 200),
          facility_location: facilityLocation.trim().slice(0, 300),
          email: email.trim().slice(0, 255),
          pdf_key: uploadRes.key,
          pdf_filename: pdfFile.name,
        },
      });

      navigate({ to: "/thank-you" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "حدث خطأ أثناء إرسال الطلب";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-5">
      <Field label="اسم الشركة / المؤسسة">
        <input
          type="text"
          required
          maxLength={200}
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          placeholder="مثال: شركة البناء الحديث للمقاولات"
        />
      </Field>
      <Field label="موقع المنشأة">
        <input
          type="text"
          required
          maxLength={300}
          value={facilityLocation}
          onChange={(e) => setFacilityLocation(e.target.value)}
          className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          placeholder="مثال: الرياض - حي العليا - شارع الملك فهد"
        />
      </Field>
      <Field label="البريد الإلكتروني">
        <input
          type="email"
          required
          maxLength={255}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          placeholder="example@company.com"
        />
      </Field>
      <Field label="ملف PDF لعرض السعر">
        <label className="flex cursor-pointer items-center gap-3 rounded-lg border-2 border-dashed border-border bg-secondary/40 px-4 py-5 text-sm hover:bg-secondary transition">
          <Upload className="h-5 w-5 text-accent" />
          <span className="flex-1 text-muted-foreground">
            {pdfFile ? pdfFile.name : "اضغط لاختيار ملف PDF (الحد الأقصى 10 ميغابايت)"}
          </span>
          <input
            type="file"
            accept="application/pdf"
            required
            onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)}
            className="hidden"
          />
        </label>
      </Field>
      <button
        type="submit"
        disabled={submitting}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[image:var(--gradient-accent)] px-6 py-3 text-base font-bold text-accent-foreground transition hover:opacity-90 disabled:opacity-60"
      >
        {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : null} تقديم الطلب
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold">
        {label} <span className="text-destructive">*</span>
      </label>
      {children}
    </div>
  );
}
