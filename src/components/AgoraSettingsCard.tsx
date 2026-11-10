import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, CheckCircle2, KeyRound, Save } from "lucide-react";
import { toast } from "sonner";
import { getAgoraSettings, setAgoraSettings } from "@/lib/site-settings.functions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AgoraSettingsCard() {
  const queryClient = useQueryClient();
  const fetchSettings = useServerFn(getAgoraSettings);
  const saveSettings = useServerFn(setAgoraSettings);
  const [appId, setAppId] = useState("");
  const [appCertificate, setAppCertificate] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["agora-settings-admin"],
    queryFn: () => fetchSettings(),
  });

  useEffect(() => {
    if (data) setAppId(data.appId);
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: () => saveSettings({ data: { appId, appCertificate } }),
    onSuccess: (saved) => {
      setAppCertificate("");
      queryClient.setQueryData(["agora-settings-admin"], saved);
      toast.success("تم حفظ إعدادات غرفة الاجتماع");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const missingAppId = !appId.trim();
  const missingCertificate = !data?.certificateConfigured && !appCertificate.trim();

  return (
    <div className="rounded-lg border border-border bg-card p-6 space-y-5">
      <div className="flex items-start gap-3">
        <KeyRound className="mt-0.5 h-5 w-5" />
        <div>
          <h2 className="text-base font-semibold">إعدادات غرفة الاجتماع Agora</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            تُحفظ هذه القيم في Turso ويستخدمها الخادم عند دخول أي مشارك.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="agora-app-id">Agora App ID</Label>
          <Input
            id="agora-app-id"
            value={appId}
            onChange={(event) => setAppId(event.target.value)}
            placeholder="أدخل App ID"
            disabled={isLoading || saveMutation.isPending}
          />
          {!isLoading && missingAppId && (
            <p className="text-xs font-medium text-destructive">الحقل الناقص: App ID</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="agora-certificate">Agora Certificate</Label>
          <Input
            id="agora-certificate"
            type="password"
            value={appCertificate}
            onChange={(event) => setAppCertificate(event.target.value)}
            placeholder={data?.certificateConfigured ? "مضبوط مسبقاً — اتركه فارغاً" : "أدخل Certificate"}
            disabled={isLoading || saveMutation.isPending}
          />
          {!isLoading && data?.certificateConfigured ? (
            <p className="flex items-center gap-1 text-xs text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" /> Certificate مضبوط
            </p>
          ) : !isLoading && missingCertificate ? (
            <p className="flex items-center gap-1 text-xs font-medium text-amber-700">
              <AlertTriangle className="h-3.5 w-3.5" /> الحقل الناقص: Certificate — سيُستخدم دخول بدون token
            </p>
          ) : null}
        </div>
      </div>

      <button
        type="button"
        onClick={() => saveMutation.mutate()}
        disabled={isLoading || saveMutation.isPending || missingAppId}
        className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        <Save className="h-4 w-4" />
        {saveMutation.isPending ? "جارٍ الحفظ..." : "حفظ إعدادات Agora"}
      </button>
    </div>
  );
}
