import { useEffect, useRef, useState, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Loader2,
  Users,
  AlertTriangle,
  Clock,
  X,
  Volume2,
} from "lucide-react";
import {
  listMyUpcomingMeetings,
  joinMeeting,
  closeMeeting,
  reportMeetingNoShow,
} from "@/lib/meetings.functions";
import { getMyRoles } from "@/lib/admin.functions";
import { hasAdminRole } from "@/lib/role-label";
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

const MEETING_DURATION_MS = 60 * 60 * 1000;
const NO_SHOW_TIMEOUT_MS = 10 * 60 * 1000;
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

export function MeetingRoomButton({
  userRole,
  variant,
  canReportNoShow = false,
}: {
  userRole: "client" | "owner";
  variant: "floating" | "header";
  canReportNoShow?: boolean;
}) {
  const [showRoom, setShowRoom] = useState(false);
  const [now, setNow] = useState(() => Date.now());
 
  const listMeetings = useServerFn(listMyUpcomingMeetings);

  const { data: meetings = [] } = useQuery({
    queryKey: ["my-upcoming-meetings"],
    queryFn: () => listMeetings(),
    refetchInterval: 15000,
    refetchOnMount: "always",
    refetchOnWindowFocus: "always",
  });

  const activeMeeting = meetings.find(
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

  const handleClick = useCallback(() => {
    setShowRoom(true);
  }, []);

  const countdownBadge =
    remainingMs > 0 ? (
      <span dir="ltr" className="font-mono text-xs font-bold tabular-nums">
        {formatCountdown(remainingMs)}
      </span>
    ) : null;

  if (variant === "header") {
    return (
      <>
        <button
          type="button"
          onClick={handleClick}
          className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold hover:bg-secondary transition"
        >
          <Video className="h-4 w-4" />
          غرفة الاجتماع
          {activeMeeting && (
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
            </span>
          )}
          {countdownBadge}
        </button>
        {showRoom && (
          <MeetingRoom
            meeting={activeMeeting ?? null}
            userRole={userRole}
            canReportNoShow={canReportNoShow}
            onClose={() => setShowRoom(false)}
          />
        )}
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className="pointer-events-auto inline-flex items-center gap-2 rounded-xl border border-blue-300 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-800 shadow-lg transition hover:bg-blue-100"
      >
        <Video className="h-4 w-4" />
        غرفة الاجتماع
        {activeMeeting && (
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
          </span>
        )}
        {countdownBadge}
      </button>
      {showRoom && (
        <MeetingRoom
          meeting={activeMeeting ?? null}
          userRole={userRole}
          canReportNoShow={canReportNoShow}
          onClose={() => setShowRoom(false)}
        />
      )}
    </>
  );
}

function MeetingRoom({
  meeting,
  userRole,
  canReportNoShow,
  onClose,
}: {
  meeting: MeetingRow | null;
  userRole: "client" | "owner";
  canReportNoShow: boolean;
  onClose: () => void;
}) {
  const joinFn = useServerFn(joinMeeting);
  const closeFn = useServerFn(closeMeeting);
  const noShowFn = useServerFn(reportMeetingNoShow);
  const getRolesFn = useServerFn(getMyRoles);

  const { data: roles } = useQuery({
    queryKey: ["my-roles"],
    queryFn: () => getRolesFn(),
  });
  const isAdmin = hasAdminRole(roles);

  const [phase, setPhase] = useState<
    "waiting" | "countdown" | "active" | "ended" | "no_show" | "closed" | "no_meeting"
  >(meeting ? "countdown" : "no_meeting");
  const [countdownMs, setCountdownMs] = useState(0);
  const [callDurationMs, setCallDurationMs] = useState(0);
  const [muted, setMuted] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(true);
  const [participants, setParticipants] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const callTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const noShowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const agoraClientRef = useRef<unknown>(null);
  const localAudioTrackRef = useRef<unknown>(null);
  const joinedRef = useRef(false);
  const remoteUsersRef = useRef<Map<IAgoraRTCRemoteUser["uid"], IAgoraRTCRemoteUser>>(new Map());
  const speakerOnRef = useRef(true);

  const meetingStartTs = meeting
    ? meetingStartTimestamp(meeting.meeting_date, meeting.meeting_time)
    : 0;

  const clearAllTimers = useCallback(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
    if (noShowTimerRef.current) {
      clearTimeout(noShowTimerRef.current);
      noShowTimerRef.current = null;
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

  const handleEndCall = useCallback(async () => {
    await cleanupAgora();
    clearAllTimers();
    if (meeting) {
      try {
        await closeFn({ data: { id: meeting.id } });
      } catch {
        // ignore
      }
    }
    setPhase("ended");
  }, [meeting, closeFn, cleanupAgora, clearAllTimers]);

  const handleNoShow = useCallback(async () => {
    if (!meeting) return;
    await cleanupAgora();
    clearAllTimers();
    try {
      await noShowFn({ data: { id: meeting.id } });
    } catch {
      // ignore
    }
    setPhase("no_show");
  }, [meeting, noShowFn, cleanupAgora, clearAllTimers]);

  const joinAgoraCall = useCallback(
    async (conn: AgoraConnection) => {
      try {
        const agoraSdk = await import("agora-rtc-sdk-ng");
        const AgoraRTC = agoraSdk.default;

        const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
        agoraClientRef.current = client;

        client.on("user-joined", (remoteUser) => {
          remoteUsersRef.current.set(remoteUser.uid, remoteUser);
          setParticipants(remoteUsersRef.current.size + 1);
        });

        client.on("user-left", (remoteUser) => {
          remoteUsersRef.current.delete(remoteUser.uid);
          setParticipants(remoteUsersRef.current.size + 1);
        });

        client.on("user-published", async (remoteUser, mediaType) => {
          await client.subscribe(remoteUser, mediaType);
          if (mediaType === "audio") {
            remoteUser.audioTrack?.setVolume(speakerOnRef.current ? 100 : 0);
            remoteUser.audioTrack?.play();
          }
        });

        await client.join(conn.appId, conn.channelName, conn.token ?? null, 0);

        const localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        localAudioTrackRef.current = localAudioTrack;
        await client.publish([localAudioTrack]);

        joinedRef.current = true;
        setPhase("active");
        setCallDurationMs(0);

        callTimerRef.current = setInterval(() => {
          setCallDurationMs((prev) => {
            const next = prev + 1000;
            if (next >= MEETING_DURATION_MS) {
              void handleEndCall();
              return prev;
            }
            return next;
          });
        }, 1000);

        noShowTimerRef.current = setTimeout(() => {
          setParticipants((cur) => {
            if (cur < 2 && canReportNoShow) {
              void handleNoShow();
            }
            return cur;
          });
        }, NO_SHOW_TIMEOUT_MS);
      } catch (err) {
        console.error("Agora join failed", err);
        setError(
          err instanceof Error ? err.message : "تعذر الاتصال بغرفة الاجتماع",
        );
        setPhase("countdown");
      }
    },
    [handleEndCall, handleNoShow, canReportNoShow],
  );

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
      await joinAgoraCall({ appId: AGORA_APP_ID, token: conn.token, channelName: conn.channelName });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "تعذر الانضمام للاجتماع",
      );
    } finally {
      setJoining(false);
    }
  }, [meeting, joining, joinFn, joinAgoraCall]);

  useEffect(() => {
    if (!meeting) {
      setPhase("no_meeting");
      return;
    }

    const now = Date.now();
    const startTs = meetingStartTs;

    if (meeting.status === "active") {
      setPhase("countdown");
    }

    countdownRef.current = setInterval(() => {
      const currentNow = Date.now();
      const remaining = startTs - currentNow;

      if (remaining <= 0) {
        setCountdownMs(0);
      } else {
        setCountdownMs(remaining);
      }
    }, 1000);

    setCountdownMs(Math.max(0, startTs - now));

    return () => {
      clearAllTimers();
    };
  }, [meeting, meetingStartTs, clearAllTimers]);

  useEffect(() => {
    return () => {
      void cleanupAgora();
      clearAllTimers();
    };
  }, [cleanupAgora, clearAllTimers]);

  const toggleMute = useCallback(() => {
    const track = localAudioTrackRef.current as
      | { setEnabled?: (enabled: boolean) => void }
      | null;
    if (track?.setEnabled) {
      track.setEnabled(muted);
    }
    setMuted((prev) => !prev);
  }, [muted]);

  const toggleSpeaker = useCallback(() => {
    const next = !speakerOnRef.current;
    speakerOnRef.current = next;
    setSpeakerOn(next);
    remoteUsersRef.current.forEach((remoteUser) => {
      remoteUser.audioTrack?.setVolume(next ? 100 : 0);
    });
  }, []);

  if (phase === "no_meeting") {
    return (
      <MeetingRoomModal onClose={onClose}>
        <div className="flex flex-col items-center gap-4 py-8">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-blue-100 text-blue-700">
            <VideoOff className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-extrabold">لا يوجد اجتماع مجدول</h2>
          <p className="text-center text-sm text-muted-foreground">
            لا توجد اجتماعات قادمة مجدولة لك حالياً. سيظهر عداد التنازلي هنا
            عند جدولة اجتماع.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="mt-2 inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-2.5 font-bold text-white transition hover:bg-blue-700"
          >
            إغلاق
          </button>
        </div>
      </MeetingRoomModal>
    );
  }

  if (phase === "ended") {
    return (
      <MeetingRoomModal onClose={onClose}>
        <div className="flex flex-col items-center gap-4 py-8">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
            <PhoneOff className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-extrabold">انتهى الاجتماع</h2>
          <p className="text-center text-sm text-muted-foreground">
            تم إنهاء الجلسة بنجاح. شكراً لحضورك.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="mt-2 inline-flex items-center justify-center rounded-xl bg-emerald-600 px-6 py-2.5 font-bold text-white transition hover:bg-emerald-700"
          >
            إغلاق
          </button>
        </div>
      </MeetingRoomModal>
    );
  }

  if (phase === "no_show") {
    return (
      <MeetingRoomModal onClose={onClose}>
        <div className="flex flex-col items-center gap-4 py-8">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-red-100 text-red-700">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-extrabold">تم إغلاق الغرفة</h2>
          <p className="text-center text-sm text-muted-foreground">
            لم يحضر أي مشارك خلال 10 دقائق من بدء الجلسة. تم إغلاق الغرفة
            وإرسال إشعار بالبريد الإلكتروني لتنسيق موعد آخر. يرجى التواصل مع
            الإدارة لإعادة الجدولة.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="mt-2 inline-flex items-center justify-center rounded-xl bg-red-600 px-6 py-2.5 font-bold text-white transition hover:bg-red-700"
          >
            إغلاق
          </button>
        </div>
      </MeetingRoomModal>
    );
  }

  if (phase === "closed") {
    return (
      <MeetingRoomModal onClose={onClose}>
        <div className="flex flex-col items-center gap-4 py-8">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-slate-100 text-slate-700">
            <VideoOff className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-extrabold">الاجتماع منتهي</h2>
          <p className="text-center text-sm text-muted-foreground">
            هذه الجلسة مغلقة بالفعل.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="mt-2 inline-flex items-center justify-center rounded-xl bg-slate-600 px-6 py-2.5 font-bold text-white transition hover:bg-slate-700"
          >
            إغلاق
          </button>
        </div>
      </MeetingRoomModal>
    );
  }

  if (phase === "countdown") {
    const canJoin = countdownMs <= 0;
    return (
      <MeetingRoomModal onClose={onClose}>
        <div className="flex flex-col items-center gap-4 py-6">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-blue-100 text-blue-700">
            <Video className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-extrabold">غرفة الاجتماع</h2>
          {meeting && (
            <div className="rounded-xl border border-border bg-secondary/40 px-5 py-3 text-center">
              <p className="text-xs font-semibold text-muted-foreground">
                {userRole === "client" ? "صاحب المشروع" : "العميل"}
              </p>
              <p className="mt-1 text-sm font-bold">
                {userRole === "client"
                  ? meeting.owner_name
                  : meeting.client_name}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                {meeting.meeting_date} — {meeting.meeting_time}
              </p>
            </div>
          )}

          <div className="flex flex-col items-center gap-2">
            <p className="text-xs font-semibold text-muted-foreground">
              {canJoin ? "حان وقت الاجتماع" : "يبدأ الاجتماع خلال"}
            </p>
            <div
              className={`flex items-center gap-2 rounded-2xl px-6 py-3 font-mono text-3xl font-extrabold tabular-nums ${
                canJoin
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-blue-100 text-blue-700"
              }`}
              dir="ltr"
            >
              <Clock className="h-5 w-5" />
              {canJoin ? "00:00:00" : formatCountdown(countdownMs)}
            </div>
          </div>

          {error && isAdmin && (
            <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleJoin}
            disabled={!canJoin || joining}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-8 py-3 font-bold text-white transition ${
              canJoin
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "cursor-not-allowed bg-slate-300"
            }`}
          >
            {joining ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Video className="h-5 w-5" />
            )}
            {joining ? "جارٍ الاتصال..." : "دخول الغرفة"}
          </button>

          {!canJoin && (
            <p className="text-xs text-muted-foreground">
              سيتم تفعيل زر الدخول عند حلول وقت الاجتماع
            </p>
          )}
        </div>
      </MeetingRoomModal>
    );
  }

  // phase === "active"
  return (
    <MeetingRoomModal onClose={onClose} fullscreen>
      {/* Recording notification banner */}
      <div className="flex items-center justify-center gap-2 bg-red-600 px-4 py-2.5 text-white">
        <span className="relative flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-white" />
        </span>
        <span className="text-sm font-bold">
          هذه المحادثة مسجلة — يتم تسجيل جميع الأصوات في هذه الجلسة
        </span>
      </div>

      <div className="flex flex-col items-center gap-6 py-8">
        <div className="flex items-center gap-3">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
            <Mic className="h-7 w-7" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold">المحادثة جارية</h2>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              {participants} {participants === 1 ? "مشارك" : "مشاركون"}
            </div>
          </div>
        </div>

        <div
          className="flex items-center gap-2 rounded-2xl bg-blue-100 px-6 py-3 font-mono text-2xl font-extrabold tabular-nums text-blue-700"
          dir="ltr"
        >
          <Clock className="h-5 w-5" />
          {formatCountdown(MEETING_DURATION_MS - callDurationMs)}
        </div>

        {error && isAdmin && (
          <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
            {error}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleMute}
            className={`inline-flex h-14 w-14 items-center justify-center rounded-full transition ${
              muted
                ? "bg-red-100 text-red-700 hover:bg-red-200"
                : "bg-secondary text-foreground hover:bg-secondary/80"
            }`}
            aria-label={muted ? "إلغاء كتم الصوت" : "كتم الصوت"}
          >
            {muted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
          </button>

          <button
            type="button"
            onClick={toggleSpeaker}
            className={`inline-flex h-14 w-14 items-center justify-center rounded-full transition ${
              speakerOn
                ? "bg-secondary text-foreground hover:bg-secondary/80"
                : "bg-slate-200 text-slate-500 hover:bg-slate-300"
            }`}
            aria-label={speakerOn ? "كتم السماعة" : "تشغيل السماعة"}
          >
            {speakerOn ? (
              <Volume2 className="h-6 w-6" />
            ) : (
              <Volume2 className="h-6 w-6 opacity-40" />
            )}
          </button>

          <button
            type="button"
            onClick={handleEndCall}
            className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-white transition hover:bg-red-700"
            aria-label="إنهاء المكالمة"
          >
            <PhoneOff className="h-6 w-6" />
          </button>
        </div>

        <p className="text-xs text-muted-foreground">
          اضغط على الزر الأحمر لإنهاء المكالمة
        </p>
      </div>
    </MeetingRoomModal>
  );
}

function MeetingRoomModal({
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
      className="pointer-events-auto fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto bg-black/60 px-4 pb-4 pt-16"
      role="dialog"
      aria-modal="true"
      aria-labelledby="meeting-room-title"
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
        <div id="meeting-room-title" className="sr-only">
          غرفة الاجتماع
        </div>
        {children}
      </div>
    </div>
  );
}
