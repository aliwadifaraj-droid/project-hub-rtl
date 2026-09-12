import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  listTeachers,
  updateTeacherStatus,
  sendTeacherNotification,
  getAdminTeacherChatMessages,
  sendAdminTeacherChatMessage,
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, GraduationCap, Bell, X, MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";

type TeacherRow = {
  id: number;
  name: string;
  email: string;
  city: string;
  phone: string;
  profession: string;
  cv: string | null;
  entry_date: string;
  exit_date: string | null;
  status: string;
};

type ChatMessage = {
  id: number;
  teacher_email: string;
  sender: "teacher" | "admin";
  body: string;
  read: boolean;
  created_at: string;
};

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
  const getChatFn = useServerFn(getAdminTeacherChatMessages);
  const sendChatFn = useServerFn(sendAdminTeacherChatMessage);
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

  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [chatTeacher, setChatTeacher] = useState<{
    id: number;
    name: string;
    email: string;
  } | null>(null);
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const {
    data: chatMessages = [],
    isLoading: chatLoading,
    refetch: refetchChat,
  } = useQuery<ChatMessage[]>({
    queryKey: ["admin-teacher-chat", chatTeacher?.email],
    queryFn: () =>
      getChatFn({ data: { email: chatTeacher!.email } }),
    enabled: !!chatTeacher?.email && chatModalOpen,
    refetchInterval: chatModalOpen ? 5000 : false,
  });

  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, scrollToBottom]);

  const sendChatMut = useMutation({
    mutationFn: (body: string) =>
      sendChatFn({ data: { email: chatTeacher!.email, body } }),
    onSuccess: () => {
      setChatInput("");
      refetchChat();
    },
    onError: (err: Error) => {
      toast.error(err.message || "تعذر إرسال الرسالة");
    },
  });

  function handleSendChat(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = chatInput.trim();
    if (!trimmed || !chatTeacher) return;
    sendChatMut.mutate(trimmed);
  }

  function openChatModal(t: TeacherRow) {
    setChatTeacher({ id: t.id, name: t.name, email: t.email });
    setChatInput("");
    setChatModalOpen(true);
  }

  function closeChatModal() {
    setChatModalOpen(false);
    setChatTeacher(null);
    setChatInput("");
  }

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
                <TableHead>المهنة</TableHead>
                <TableHead>السيرة الذاتية</TableHead>
                <TableHead>تاريخ التسجيل</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>تاريخ الخروج</TableHead>
                <TableHead>إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teachers.map((t: TeacherRow) => (
                <TableRow key={t.id}>
                  <TableCell className="font-mono text-xs">{t.id}</TableCell>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell className="text-sm">{t.email}</TableCell>
                  <TableCell className="text-sm">{t.city}</TableCell>
                  <TableCell className="text-sm" dir="ltr">
                    {t.phone}
                  </TableCell>
                  <TableCell className="text-sm">
                    {t.profession || "-"}
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
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => openChatModal(t)}
                        >
                          <MessageCircle className="h-3 w-3 ml-1" />
                          محادثة
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

      {/* Chat Modal */}
      {chatModalOpen && chatTeacher && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={closeChatModal}
        >
          <div
            className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-lg border border-border bg-background shadow-lg"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            <div className="flex items-center justify-between border-b border-border p-4">
              <div className="flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10">
                  <MessageCircle className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">محادثة مع المعلم</h2>
                  <p className="text-xs text-muted-foreground">
                    {chatTeacher.name} — {chatTeacher.email}
                  </p>
                </div>
              </div>
              <button
                onClick={closeChatModal}
                className="rounded-md p-1 text-muted-foreground hover:bg-secondary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-1 flex-col overflow-hidden">
              {chatLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <ScrollArea className="flex-1" style={{ height: "400px" }}>
                  <div className="space-y-3 p-4">
                    {chatMessages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <MessageCircle className="h-10 w-10 text-muted-foreground/40" />
                        <p className="mt-3 text-sm text-muted-foreground">
                          لا توجد رسائل بعد. ابدأ المحادثة مع المعلم.
                        </p>
                      </div>
                    ) : (
                      chatMessages.map((m: ChatMessage) => (
                        <div
                          key={m.id}
                          className={`flex ${
                            m.sender === "admin"
                              ? "justify-end"
                              : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                              m.sender === "admin"
                                ? "rounded-br-sm bg-primary text-primary-foreground"
                                : "rounded-bl-sm bg-secondary text-secondary-foreground"
                            }`}
                          >
                            <p className="whitespace-pre-line">{m.body}</p>
                            <p
                              className="mt-1 text-[10px] opacity-60"
                              dir="ltr"
                            >
                              {m.created_at}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={chatEndRef} />
                  </div>
                </ScrollArea>
              )}
            </div>

            <form
              onSubmit={handleSendChat}
              className="flex items-center gap-2 border-t border-border p-3"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="اكتب رسالتك..."
                maxLength={2000}
                className="flex-1 rounded-full border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Button
                type="submit"
                size="icon"
                disabled={sendChatMut.isPending || !chatInput.trim()}
                className="rounded-full"
              >
                {sendChatMut.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
