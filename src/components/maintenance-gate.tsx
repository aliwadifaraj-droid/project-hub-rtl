import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRouterState, useNavigate } from "@tanstack/react-router";
import { getMaintenance } from "@/lib/maintenance.functions";
import { getMe } from "@/lib/auth.functions";
import { hasAdminRole } from "@/lib/role-label";

const ALLOW_PREFIXES = [
  "/maintenance",
  "/auth",
  "/reset-password",
  "/lovable/",
  "/api/",
];

export function MaintenanceGate() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const fetchMaintenance = useServerFn(getMaintenance);
  const fetchMe = useServerFn(getMe);

  const [authReady, setAuthReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [roles, setRoles] = useState<string[]>([]);

  useEffect(() => {
    let mounted = true;
    fetchMe()
      .then((me) => {
        if (!mounted) return;
        setSignedIn(!!me);
        setRoles(me?.roles ?? []);
      })
      .catch(() => {
        if (!mounted) return;
        setSignedIn(false);
        setRoles([]);
      })
      .finally(() => {
        if (mounted) setAuthReady(true);
      });
    return () => {
      mounted = false;
    };
  }, [fetchMe, path]);

  const { data: m } = useQuery({
    queryKey: ["maintenance-public"],
    queryFn: () => fetchMaintenance(),
    refetchInterval: 60000,
    staleTime: 30000,
  });

  const isAdmin = signedIn && hasAdminRole(roles);
  const allowed = ALLOW_PREFIXES.some((p) => path === p || path.startsWith(p));

  useEffect(() => {
    if (!m?.enabled) return;
    if (!authReady) return;
    if (isAdmin) return;
    if (allowed) return;
    navigate({ to: "/maintenance", replace: true });
  }, [m?.enabled, authReady, isAdmin, allowed, path, navigate]);

  return null;
}
