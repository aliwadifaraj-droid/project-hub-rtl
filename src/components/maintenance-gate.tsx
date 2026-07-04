import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRouterState, useNavigate } from "@tanstack/react-router";
import { getMaintenance } from "@/lib/maintenance.functions";
import { getMyRoles } from "@/lib/admin.functions";
import { hasAdminRole } from "@/lib/role-label";

const ALLOW_PREFIXES = [
  "/maintenance",
  "/auth",
  "/reset-password",
  "/lovable/",
  "/email/",
  "/unsubscribe",
  "/api/",
  "/admin",
  "/settings",
];


export function MaintenanceGate() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const fetchMaintenance = useServerFn(getMaintenance);
  const fetchRoles = useServerFn(getMyRoles);

  const { data: m } = useQuery({
    queryKey: ["maintenance-public"],
    queryFn: () => fetchMaintenance(),
    refetchInterval: 60000,
    staleTime: 30000,
  });

  const { data: roles } = useQuery({
    queryKey: ["my-roles"],
    queryFn: () => fetchRoles(),
    staleTime: 30000,
  });

  const isAdmin = hasAdminRole(roles);
  const allowed = ALLOW_PREFIXES.some((p) => path === p || path.startsWith(p));

  useEffect(() => {
    if (!m?.enabled) return;
    if (isAdmin) return;
    if (allowed) return;
    navigate({ to: "/maintenance", replace: true });
  }, [m?.enabled, isAdmin, allowed, path, navigate]);

  return null;
}
