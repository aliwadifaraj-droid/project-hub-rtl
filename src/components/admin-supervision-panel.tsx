import { useEffect, useRef, useState, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import {
  Mic,
  MicOff,
  PhoneOff,
  Loader2,
  Users,
  Clock,
  X,
  Volume2,
  ShieldCheck,
  LogIn,
  LogOut,
  AlertTriangle,
} from "lucide-react";
import {
  listMyUpcomingMeetings,
  joinMeeting,
  closeMeeting,
} from "@/lib/meetings.functions";
import { meetingStartTimestamp } from "@/lib/meeting-time";
import type { IAgoraRTCRemoteUser } from "agora-rtc-sdk-ng";

type MeetingRow = {
  id: string;
  owner_email: string;
  owner_name: string;
  client_email: string;
  client_name: string;
  meeting_date: string;
  meeting_time: string;
  status: string;
  joined_at: string | null;
  closed_at: string | null;
  created_at: string;
};

type AgoraConnection = {
  appId: string;
  token: string | null;
  channelName: string;
};

const AGORA_APP_ID = import.meta.env.VITE_AGORA_APP_ID?.trim() ?? "";
const MISSING_APP_ID_MESSAGE =
  "إعدادات غرفة الاجتماع غير مكتملة. الحقل الناقص: VITE_AGORA_APP_ID.";

function formatCountdown(ms: number): string {
  if (ms <= 0) return "00:00:00";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

type ParticipantStatus = "waiting" | "inside" | "left";

type ParticipantState = {
  status: ParticipantStatus;
  micOn: boolean;
  joinedAt: string | null;
};

export function AdminSupervisionButton() {
  const [showPanel, setShowPanel] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const listMeetings = useServerFn(listMyUpcomingMeetings);

  const { data: meetings = [] } = useQuery({
    queryKey: ["my-upcoming-meetings"],
    queryFn: () => listMeetings(),
    refetchInterval: 15000,
    refetchOnMount: "always",
    refetchOnWindowFocus: "always",
  });

  const activeMeeting = (meetings as MeetingRow[]).find(
    (m) => m.status === "scheduled" || m.status === "active",
  );

  useEffect(() => {
    if (!activeMeeting) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [activeMeeting]);

  const remainingMs = activeMeeting
    ? meetingStartTimestamp(activeMeeting.meeting_date, activeMeeting.meeting_time) - now
    : 0;

  const countdownBadge =
    remainingMs > 0 ? (
      <span dir="ltr" className="font-mono text-xs font-bold tabular-nums">
        {formatCountdown(remainingMs)}
      </span>
    ) : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setShowPanel(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold hover:bg-secondary transition"
      >
        <ShieldCheck className="h-4 w-4" />
        لوحة الإشراف
        {activeMeeting && (
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
          </span>
        )}
        {countdownBadge}
      </button>
      {showPanel && (
        <AdminSupervisionPanel
          meeting={activeMeeting ?? null}
          onClose={() => setShowPanel(false)}
        />
      )}
    </>
  );
}

function AdminSupervisionPanel({
  meeting,
  onClose,
}: {
  meeting: MeetingRow | null;
  onClose: () => void;
}) {
  const joinFn = useServerFn(joinMeeting);
  const closeFn = useServerFn(closeMeeting);
  const [phase, setPhase] = useState<
    "idle" | "listening" | "ended" | "no_meeting"
  >(meeting ? "idle" : "no_meeting");
  const [countdownMs, setCountdownMs] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [supervisorMicOn, setSupervisorMicOn] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(true);
  const [participantStates, setParticipantStates] = useState<
    Record<"owner" | "client", ParticipantState>
  >({
    owner: { status: "waiting", micOn: false, joinedAt: null },
    client: { status: "waiting", micOn: false, joinedAt: null },
  });

  const agoraClientRef = useRef<unknown>(null);
  const localAudioTrackRef = useRef<unknown>(null);
  const joinedRef = useRef(false);
  const remoteUsersRef = useRef<Map<number, IAgoraRTCRemoteUser>>(new Map());
  const speakerOnRef = useRef(true);
  const supervisorUidRef = useRef<number>(9999);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const meetingStartTs = meeting
    ? meetingStartTimestamp(meeting.meeting_date, meeting.meeting_time)
    : 0;

  const clearTimers = useCallback(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  const cleanupAgora = useCallback(async () => {
    try {
      const client = agoraClientRef.current as
        | { leave?: () => Promise<void>; removeAllListeners?: () => void }
        | null;
      const track = localAudioTrackRef.current as
        | { stop?: () => void; close?: () => void }
        | null;
      if (track?.stop) track.stop();
      if (track?.close) track.close();
      if (client?.leave) await client.leave();
      if (client?.removeAllListeners) client.removeAllListeners();
    } catch {
      // ignore
    }
    agoraClientRef.current = null;
    localAudioTrackRef.current = null;
    joinedRef.current = false;
    remoteUsersRef.current.clear();
  }, []);

  const handleEndMeeting = useCallback(async () => {
    await cleanupAgora();
    clearTimers();
    if (meeting) {
      try {
        await closeFn({ data: { id: meeting.id } });
      } catch {
        // ignore
      }
    }
    setPhase("ended");
  }, [meeting, closeFn, cleanupAgora, clearTimers]);

  const joinAgoraAsListener = useCallback(
    async (conn: AgoraConnection) => {
      try {
        const agoraSdk = await import("agora-rtc-sdk-ng");
        const AgoraRTC = agoraSdk.default;

        const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
        agoraClientRef.current = client;

        client.on("user-joined", (remoteUser: IAgoraRTCRemoteUser) => {
          remoteUsersRef.current.set(remoteUser.uid as number, remoteUser);
          updateParticipantFromUid(remoteUser.uid as number, "inside");
        });

        client.on("user-left", (remoteUser: IAgoraRTCRemoteUser) => {
          remoteUsersRef.current.delete(remoteUser.uid as number);
          updateParticipantFromUid(remoteUser.uid as number, "left");
        });

        client.on("user-published", async (remoteUser: IAgoraRTCRemoteUser, mediaType: "audio" | "video") => {
          if (mediaType === "audio") {
            await client.subscribe(remoteUser, mediaType);
            remoteUser.audioTrack?.setVolume(speakerOnRef.current ? 100 : 0);
            remoteUser.audioTrack?.play();
          }
        });

        client.on("user-unpublished", (remoteUser: IAgoraRTCRemoteUser, mediaType: "audio" | "video") => {
          if (mediaType === "audio") {
            updateParticipantMicFromUid(remoteUser.uid as number, false);
          }
        });

        const supervisorUid = supervisorUidRef.current;
        await client.join(conn.appId, conn.channelName, conn.token ?? null, supervisorUid);

        const localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        localAudioTrackRef.current = localAudioTrack;
        localAudioTrack.setEnabled(false);
        await client.publish([localAudioTrack]);

        joinedRef.current = true;
        setPhase("listening");
      } catch (err) {
        console.error("Agora join failed", err);
        setError(
          err instanceof Error ? err.message : "تعذر الاتصال بغرفة الاجتماع",
        );
        setPhase("idle");
      }
    },
    [],
  );

  function updateParticipantFromUid(uid: number, status: ParticipantStatus) {
    const role: "owner" | "client" | null = uid === 1 ? "owner" : uid === 2 ? "client" : null;
    if (!role) return;
    setParticipantStates((prev) => ({
      ...prev,
      [role]: {
        ...prev[role],
        status,
        joinedAt: status === "inside" ? new Date().toISOString() : prev[role].joinedAt,
      },
    }));
  }

  function updateParticipantMicFromUid(uid: number, micOn: boolean) {
    const role: "owner" | "client" | null = uid === 1 ? "owner" : uid === 2 ? "client" : null;
    if (!role) return;
    setParticipantStates((prev) => ({
      ...prev,
      [role]: { ...prev[role], micOn },
    }));
  }

  const handleJoin = useCallback(async () => {
    if (!meeting || joining) return;
    if (!AGORA_APP_ID) {
      setError(MISSING_APP_ID_MESSAGE);
      return;
    }
    setJoining(true);
    setError(null);
    try {
      const conn = await joinFn({ data: { id: meeting.id, appId: AGORA_APP_ID } });
      await joinAgoraAsListener({ appId: AGORA_APP_ID, token: conn.token, channelName: conn.channelName });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "تعذر الانضمام للاجتماع",
      );
    } finally {
      setJoining(false);
    }
  }, [meeting, joining, joinFn, joinAgoraAsListener]);

  useEffect(() => {
    if (!meeting) {
      setPhase("no_meeting");
      return;
    }
    setNow(Date.now());
    const id = setInterval(() => {
      setNow(Date.now());
      setCountdownMs(Math.max(0, meetingStartTs - Date.now()));
    }, 1000);
    setCountdownMs(Math.max(0, meetingStartTs - Date.now()));
    countdownRef.current = id;
    return () => clearTimers();
  }, [meeting, meetingStartTs, clearTimers]);

  useEffect(() => {
    return () => {
      void cleanupAgora();
      clearTimers();
    };
  }, [cleanupAgora, clearTimers]);

  const toggleSupervisorMic = useCallback(() => {
    const track = localAudioTrackRef.current as
      | { setEnabled?: (enabled: boolean) => void }
      | null;
    const next = !supervisorMicOn;
    if (track?.setEnabled) {
      track.setEnabled(next);
    }
    setSupervisorMicOn(next);
  }, [supervisorMicOn]);

  const toggleSpeaker = useCallback(() => {
    const next = !speakerOnRef.current;
    speakerOnRef.current = next;
    setSpeakerOn(next);
    remoteUsersRef.current.forEach((remoteUser) => {
      remoteUser.audioTrack?.setVolume(next ? 100 : 0);
    });
  }, []);

  const canJoin = countdownMs <= 0 && phase === "idle";

  if (phase === "no_meeting") {
    return (
      <SupervisionModal onClose={onClose}>
        <div className="flex flex-col items-center gap-4 py-8">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-slate-100 text-slate-700">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-extrabold">لا يوجد اجتماع مجدول</h2>
          <p className="text-center text-sm text-muted-foreground">
            لا توجد اجتماعات قادمة حالياً. ستظهر لوحة الإشراف هنا عند جدولة اجتماع.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="mt-2 inline-flex items-center justify-center rounded-xl bg-slate-600 px-6 py-2.5 font-bold text-white transition hover:bg-slate-700"
          >
            إغلاق
          </button>
        </div>
      </SupervisionModal>
    );
  }

  if (phase === "ended") {
    return (
      <SupervisionModal onClose={onClose}>
        <div className="flex flex-col items-center gap-4 py-8">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
            <PhoneOff className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-extrabold">تم إنهاء الاجتماع</h2>
          <p className="text-center text-sm text-muted-foreground">
            تم إنهاء الجلسة للجميع بنجاح.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="mt-2 inline-flex items-center justify-center rounded-xl bg-emerald-600 px-6 py-2.5 font-bold text-white transition hover:bg-emerald-700"
          >
            إغلاق
          </button>
        </div>
      </SupervisionModal>
    );
  }

  return (
    <SupervisionModal onClose={onClose} fullscreen>
      <div className="flex items-center justify-center gap-2 bg-red-600 px-4 py-2.5 text-white">
        <span className="relative flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-white" />
        </span>
        <span className="text-sm font-bold">
          هذه المحادثة مسجلة — يتم تسجيل جميع الأصوات في هذه الجلسة
        </span>
      </div>

      <div className="flex flex-col gap-5 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-100 text-amber-700">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-600 px-3 py-1 text-xs font-bold text-white">
                <ShieldCheck className="h-3.5 w-3.5" />
                مشرف الاجتماع
              </div>
              {meeting && (
                <p className="mt-1.5 text-xs text-muted-foreground" dir="ltr">
                  {meeting.meeting_date} — {meeting.meeting_time}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            <div
              className={`flex items-center gap-2 rounded-2xl px-5 py-2.5 font-mono text-2xl font-extrabold tabular-nums ${
                canJoin || phase === "listening"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-blue-100 text-blue-700"
              }`}
              dir="ltr"
            >
              <Clock className="h-5 w-5" />
              {canJoin || phase === "listening"
                ? formatCountdown(Math.max(0, now - meetingStartTs))
                : formatCountdown(countdownMs)}
            </div>
            <span className="text-xs font-semibold text-muted-foreground">
              {canJoin || phase === "listening" ? "مدة الاجتماع" : "يبدأ خلال"}
            </span>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-bold">
            <Users className="h-4 w-4" />
            قائمة المدعوين
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <ParticipantCard
              name={meeting?.owner_name || "صاحب المشروع"}
              email={meeting?.owner_email || ""}
              state={participantStates.owner}
            />
            <ParticipantCard
              name={meeting?.client_name || "العميل"}
              email={meeting?.client_email || ""}
              state={participantStates.client}
            />
          </div>
        </div>

        <div className="flex flex-col items-center gap-4 border-t border-border pt-5">
          {phase === "idle" ? (
            <>
              <button
                type="button"
                onClick={handleJoin}
                disabled={!canJoin || joining}
                className={`inline-flex items-center justify-center gap-2 rounded-xl px-8 py-3.5 font-bold text-white transition ${
                  canJoin
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "cursor-not-allowed bg-slate-300"
                }`}
              >
                {joining ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <LogIn className="h-5 w-5" />
                )}
                {joining ? "جارٍ الدخول..." : "دخول كمراقب"}
              </button>
              {!canJoin && (
                <p className="text-xs text-muted-foreground">
                  سيتم تفعيل زر الدخول عند حلول وقت الاجتماع
                </p>
              )}
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={toggleSupervisorMic}
                className={`inline-flex items-center justify-center gap-3 rounded-2xl px-10 py-4 text-lg font-extrabold text-white shadow-lg transition ${
                  supervisorMicOn
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-slate-600 hover:bg-slate-700"
                }`}
              >
                {supervisorMicOn ? (
                  <Mic className="h-6 w-6" />
                ) : (
                  <MicOff className="h-6 w-6" />
                )}
                {supervisorMicOn ? "تكلم" : "اكتم"}
              </button>
              <p className="text-xs text-muted-foreground">
                {supervisorMicOn
                  ? "مايكك مفتوح — يتحدث الجميع معك"
                  : "مايكك مقفول — تستمع للحوار فقط"}
              </p>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={toggleSpeaker}
                  className={`inline-flex h-12 w-12 items-center justify-center rounded-full transition ${
                    speakerOn
                      ? "bg-secondary text-foreground hover:bg-secondary/80"
                      : "bg-slate-200 text-slate-500 hover:bg-slate-300"
                  }`}
                  aria-label={speakerOn ? "كتم السماعة" : "تشغيل السماعة"}
                >
                  {speakerOn ? (
                    <Volume2 className="h-5 w-5" />
                  ) : (
                    <Volume2 className="h-5 w-5 opacity-40" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleEndMeeting}
                  className="inline-flex h-12 items-center gap-2 rounded-full bg-red-600 px-6 font-bold text-white transition hover:bg-red-700"
                  aria-label="إنهاء الاجتماع للجميع"
                >
                  <PhoneOff className="h-5 w-5" />
                  إنهاء الاجتماع للجميع
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </SupervisionModal>
  );
}

function ParticipantCard({
  name,
  email,
  state,
}: {
  name: string;
  email: string;
  state: ParticipantState;
}) {
  const statusConfig: Record<
    ParticipantStatus,
    { label: string; className: string; icon: typeof LogIn }
  > = {
    waiting: {
      label: "بانتظار",
      className: "bg-amber-100 text-amber-700",
      icon: Clock,
    },
    inside: {
      label: "داخل",
      className: "bg-emerald-100 text-emerald-700",
      icon: LogIn,
    },
    left: {
      label: "غادر",
      className: "bg-slate-200 text-slate-600",
      icon: LogOut,
    },
  };

  const cfg = statusConfig[state.status];
  const StatusIcon = cfg.icon;

  return (
    <div className="rounded-xl border border-border bg-card p-3 space-y-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-sm font-bold">{name}</div>
          <div className="truncate text-xs text-muted-foreground" dir="ltr">
            {email}
          </div>
        </div>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${cfg.className}`}
        >
          <StatusIcon className="h-3 w-3" />
          {cfg.label}
        </span>
      </div>

      <div className="flex items-center gap-2 text-xs">
        <span className="inline-flex items-center gap-1 text-muted-foreground">
          {state.micOn ? (
            <Mic className="h-3.5 w-3.5 text-emerald-600" />
          ) : (
            <MicOff className="h-3.5 w-3.5 text-red-500" />
          )}
          {state.micOn ? "مايك مفتوح" : "مايك مقفول"}
        </span>
        {state.joinedAt && (
          <span className="text-muted-foreground" dir="ltr">
            • دخل {new Date(state.joinedAt).toLocaleTimeString("ar", { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
      </div>
    </div>
  );
}

function SupervisionModal({
  children,
  onClose,
  fullscreen,
}: {
  children: React.ReactNode;
  onClose: () => void;
  fullscreen?: boolean;
}) {
  return (
    <div
      className="pointer-events-auto fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="supervision-panel-title"
      onClick={onClose}
    >
      <div
        className={`relative w-full rounded-3xl border border-border bg-card shadow-2xl ${
          fullscreen ? "max-w-2xl" : "max-w-md"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="إغلاق"
          className="absolute left-4 top-4 z-10 rounded-full p-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>
        <div id="supervision-panel-title" className="sr-only">
          لوحة إشراف الاجتماع
        </div>
        {children}
      </div>
    </div>
  );
}
