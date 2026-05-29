"use client";

import { createClient } from "./client";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

export interface UserProfile {
  id: string;
  uid: number | null;
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const init = async () => {
      // 기존 세션 확인
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        setUser(session.user);
        setProfile({ id: session.user.id, uid: null });
      } else {
        // 세션 없으면 익명 로그인 (기기 당 자동 발급)
        const { data } = await supabase.auth.signInAnonymously();
        if (data.user) {
          setUser(data.user);
          setProfile({ id: data.user.id, uid: null });
        }
      }
      setLoading(false);
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setProfile(session?.user ? { id: session.user.id, uid: null } : null);
    });

    return () => subscription.unsubscribe();
  }, []); // eslint-disable-line

  return { user, profile, loading };
}
