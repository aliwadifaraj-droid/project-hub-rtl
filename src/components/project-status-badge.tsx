type ProjectStatus = "active" | "delivered" | "cancelled" | string | null | undefined;

const labels: Record<string, string> = {
  active: "مفتوح للعروض",
  delivered: "تم التسليم",
  cancelled: "ملغي",
};

const styles: Record<string, string> = {
  active: "bg-secondary text-secondary-foreground",
  delivered: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
};

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const key = status ?? "active";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[key] ?? styles.active}`}
    >
      {labels[key] ?? labels.active}
    </span>
  );
}
