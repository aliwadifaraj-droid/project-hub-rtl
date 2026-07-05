import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRouterState, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { getMaintenance } from "@/lib/maintenance.functions";
import { getMyRoles } from "@/lib/admin.functions";
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
  const fetchRoles = useServerFn(getMyRoles);

  // Track auth readiness client-side so we don't call protected fns unsigned.
  const [authReady, setAuthReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSignedIn(!!data.session);
      setAuthReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setSignedIn(!!session);
      setAuthReady(true);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const { data: m } = useQuery({
    queryKey: ["maintenance-public"],
    queryFn: () => fetchMaintenance(),
    refetchInterval: 60000,
    staleTime: 30000,
  });

  const { data: roles, isLoading: rolesLoading } = useQuery({
    queryKey: ["my-roles", signedIn],
    queryFn: async () => {
      try { return await fetchRoles(); } catch { return []; }
    },
    enabled: authReady && signedIn,
    staleTime: 30000,
    retry: false,
  });

  const isAdmin = signedIn && hasAdminRole(roles);
  const allowed = ALLOW_PREFIXES.some((p) => path === p || path.startsWith(p));

  useEffect(() => {
    if (!m?.enabled) return;
    if (!authReady) return;
    // If signed in, wait for role check to complete before deciding.
    if (signedIn && rolesLoading) return;
    if (isAdmin) return;
    if (allowed) return;
    navigate({ to: "/maintenance", replace: true });
  }, [m?.enabled, authReady, signedIn, rolesLoading, isAdmin, allowed, path, navigate]);

  return null;
}
