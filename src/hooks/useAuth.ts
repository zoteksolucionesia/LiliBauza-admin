"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import type { Session } from "@supabase/supabase-js";

/**
 * Hook reutilizable que verifica la sesión activa de Supabase.
 * Si no hay sesión, redirige automáticamente al login.
 */
export function useAuth() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        window.location.href = "/admin/login";
        return;
      }

      setSession(session);
      setLoading(false);
    }

    checkSession();
  }, [router]);

  return { session, loading };
}
