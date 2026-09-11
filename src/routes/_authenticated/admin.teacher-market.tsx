import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  listTeachers,
  updateTeacherStatus,
} from "@/lib/teacher-market.functions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, GraduationCap } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/teacher-market")({
  component: AdminTeacherMarketPage,
});

function statusBadge(s: string) {
  const map: Record<string, string> = {
    active: "bg-green-100 text-green-800",
    inactive: "bg-red-100 text-red-800",
    suspended: "bg-yellow-100 text-yellow-800",
  };
  const labels: Record<string, string> = {
    active: "نشط",
    inactive: "غير نشط",
    suspended: "موقوف",
  };
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${map[s] ?? "bg-secondary"}`}
    >
      {labels[s] ?? s}
    </span>
  );
}

function AdminTeacherMarketPage() {
  const listFn = useServerFn(listTeachers);
  const updateFn = useServerFn(updateTeacherStatus);
  const qc = useQueryClient();

  const { data: teachers = [], isLoading } = useQuery({
    queryKey: ["teachers-market"],
    queryFn: () => listFn(),
  });

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editStatus, setEditStatus] = useState("");
  const [editExitDate, setEditExitDate] = useState("");

  const updateMut = useMutation({
    mutationFn: async (input: {
      id: number;
      status: string;
      exit_date: string | null;
    }) => {
      return await updateFn({ data: input });
    },
    onSuccess: () => {
      toast.success("تم تحديث الحالة بنجاح");
      setEditingId(null);
      qc.invalidateQueries({ queryKey: ["teachers-market"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "حدث خطأ أثناء التحديث");
    },
  });

  function startEdit(
    id: number,
    currentStatus: string,
    currentExitDate: string | null,
  ) {
    setEditingId(id);
    setEditStatus(currentStatus);
    setEditExitDate(currentExitDate ?? "");
  }

  function saveEdit(id: number) {
    updateMut.mutate({
      id,
      status: editStatus,
      exit_date: editExitDate || null,
    });
  }

  return (
    <div className="container mx-auto px-4 py-8" dir="rtl">
      <div className="mb-6 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-[image:var(--gradient-accent)] text-accent-foreground">
          <GraduationCap className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">حراج المعلمين</h1>
          <p className="text-sm text-muted-foreground">
            إدارة المعلمين المسجلين في حراج المعلمين
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : teachers.length === 0 ? (
        <div className="rounded-lg border border-border bg-background p-8 text-center">
          <p className="text-muted-foreground">لا يوجد معلمون مسجلون بعد</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>الاسم</TableHead>
                <TableHead>البريد الإلكتروني</TableHead>
                <TableHead>المدينة</TableHead>
                <TableHead>الجوال</TableHead>
                <TableHead>السيرة الذاتية</TableHead>
                <TableHead>تاريخ التسجيل</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>تاريخ الخروج</TableHead>
                <TableHead>إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teachers.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-mono text-xs">{t.id}</TableCell>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell className="text-sm">{t.email}</TableCell>
                  <TableCell className="text-sm">{t.city}</TableCell>
                  <TableCell className="text-sm" dir="ltr">
                    {t.phone}
                  </TableCell>
                  <TableCell className="text-sm">
                    {t.cv ? (
                      <a
                        href={t.cv}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        عرض
                      </a>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {t.entry_date}
                  </TableCell>
                  <TableCell>
                    {editingId === t.id ? (
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value)}
                        className="rounded-md border border-border bg-background px-2 py-1 text-xs"
                      >
                        <option value="active">نشط</option>
                        <option value="inactive">غير نشط</option>
                        <option value="suspended">موقوف</option>
                      </select>
                    ) : (
                      statusBadge(t.status)
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === t.id ? (
                      <Input
                        type="datetime-local"
                        value={editExitDate}
                        onChange={(e) => setEditExitDate(e.target.value)}
                        className="w-40 text-xs"
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {t.exit_date ?? "—"}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === t.id ? (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          onClick={() => saveEdit(t.id)}
                          disabled={updateMut.isPending}
                        >
                          {updateMut.isPending ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            "حفظ"
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setEditingId(null)}
                        >
                          إلغاء
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          startEdit(t.id, t.status, t.exit_date)
                        }
                      >
                        تعديل
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
