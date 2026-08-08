import { Fragment } from "react";

const STATUS_BADGE_RE = /__STATUS_BADGE__:(\w+)__/g;

const STATUS_STYLES: Record<string, { icon: string; label: string; bg: string }> = {
  active: { icon: "🟡", label: "مفتوح للعروض", bg: "#ffc107" },
  delivered: { icon: "✅", label: "تم التسليم", bg: "#28a745" },
  cancelled: { icon: "❌", label: "ملغي", bg: "#dc3545" },
};

const badgeStyle: React.CSSProperties = {
  color: "#ffffff",
  fontWeight: "bold",
  padding: "10px 20px",
  borderRadius: "8px",
  display: "inline-block",
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_STYLES[status] ?? STATUS_STYLES.active;
  return (
    <span style={{ ...badgeStyle, backgroundColor: cfg.bg }}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

export function BotMessageBody({ body }: { body: string }) {
  const parts: Array<{ type: "text" | "badge"; value: string }> = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  STATUS_BADGE_RE.lastIndex = 0;

  while ((match = STATUS_BADGE_RE.exec(body)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", value: body.slice(lastIndex, match.index) });
    }
    parts.push({ type: "badge", value: match[1] });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < body.length) {
    parts.push({ type: "text", value: body.slice(lastIndex) });
  }

  if (parts.length === 0) {
    return <>{body}</>;
  }

  return (
    <>
      {parts.map((p, i) =>
        p.type === "badge" ? (
          <StatusBadge key={i} status={p.value} />
        ) : (
          <Fragment key={i}>{p.value}</Fragment>
        ),
      )}
    </>
  );
}
