import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  listTeachers,
  updateTeacherStatus,
  sendTeacherNotification,
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
import { Loader2, GraduationCap, Bell, X } from "lucide-react";
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
  const sendNotifFn = useServerFn(sendTeacherNotification);
  const qc = useQueryClient();

  const { data: teachers = [], isLoading } = useQuery({
    queryKey: ["teachers-market"],
    queryFn: () => listFn(),
  });

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editStatus, setEditStatus] = useState("");
  const [editExitDate, setEditExitDate] = useState("");

  const [notifModalOpen, setNotifModalOpen] = useState(false);
  const [notifTeacher, setNotifTeacher] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [notifTitle, setNotifTitle] = useState("");
  const [notifBody, setNotifBody] = useState("");

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

  const sendNotifMut = useMutation({
    mutationFn: async (input: {
      id: number;
      title: string;
      body: string;
    }) => {
      return await sendNotifFn({ data: input });
    },
    onSuccess: () => {
      toast.success("تم إرسال الإشعار بنجاح");
      setNotifModalOpen(false);
      setNotifTeacher(null);
      setNotifTitle("");
      setNotifBody("");
    },
    onError: (err: Error) => {
      toast.error(err.message || "حدث خطأ أثناء الإرسال");
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

  function openNotifModal(id: number, name: string) {
    setNotifTeacher({ id, name });
    setNotifTitle("");
    setNotifBody("");
    setNotifModalOpen(true);
  }

  function sendNotif() {
    if (!notifTeacher) return;
    if (!notifTitle.trim() || !notifBody.trim()) {
      toast.error("يرجى تعبئة العنوان والنص");
      return;
    }
    sendNotifMut.mutate({
      id: notifTeacher.id,
      title: notifTitle.trim(),
      body: notifBody.trim(),
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
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            startEdit(t.id, t.status, t.exit_date)
                          }
                        >
                          تعديل
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => openNotifModal(t.id, t.name)}
                        >
                          <Bell className="h-3 w-3 ml-1" />
                          إشعار
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Notification Modal */}
      {notifModalOpen && notifTeacher && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setNotifModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-lg border border-border bg-background p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10">
                  <Bell className="h-4 w-4 text-primary" />
                </div>
                <h2 className="text-lg font-bold">إرسال إشعار</h2>
              </div>
              <button
                onClick={() => setNotifModalOpen(false)}
                className="rounded-md p-1 text-muted-foreground hover:bg-secondary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mb-4 text-sm text-muted-foreground">
              إلى: <span className="font-medium">{notifTeacher.name}</span>
            </p>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  العنوان
                </label>
                <Input
                  value={notifTitle}
                  onChange={(e) => setNotifTitle(e.target.value)}
                  placeholder="عنوان الإشعار"
                  maxLength={200}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  النص
                </label>
                <textarea
                  value={notifBody}
                  onChange={(e) => setNotifBody(e.target.value)}
                  placeholder="نص الإشعار..."
                  maxLength={2000}
                  rows={5}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => setNotifModalOpen(false)}
              >
                إلغاء
              </Button>
              <Button
                onClick={sendNotif}
                disabled={sendNotifMut.isPending}
              >
                {sendNotifMut.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "إرسال"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
