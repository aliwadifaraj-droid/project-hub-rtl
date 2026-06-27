import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listVipSubscribers } from "@/lib/vip.functions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/admin/vip")({
  component: AdminVipPage,
});

function AdminVipPage() {
  const fn = useServerFn(listVipSubscribers);
  const { data, isLoading, error } = useQuery({
    queryKey: ["vip-subscribers"],
    queryFn: () => fn(),
  });

  return (
    <div className="space-y-4" dir="rtl">
      <h1 className="text-2xl font-bold">العملاء المميزون</h1>
      {isLoading ? (
        <p className="text-muted-foreground">جارٍ التحميل...</p>
      ) : error ? (
        <p className="text-destructive">حصل خطأ: {(error as Error).message}</p>
      ) : (data ?? []).length === 0 ? (
        <p className="text-muted-foreground">لا يوجد مشتركون.</p>
      ) : (
        <div className="rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الاسم</TableHead>
                <TableHead>البريد الإلكتروني</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>تاريخ الاشتراك</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data ?? []).map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>{s.email}</TableCell>
                  <TableCell>{s.status}</TableCell>
                  <TableCell>{new Date(s.created_at).toLocaleString("ar")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
