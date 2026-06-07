import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../../supabase";

interface Profile {
  name: string | null;
}

interface AuthContextValue {
  user: User | null;
  role: string | null;
  profile: Profile | null;
  loading: boolean;
  roleLoading: boolean;
  roleError: string | null;
  signOut: () => Promise<void>;
}

interface AuthProviderProps {
  children: ReactNode;
}

type ProfileRow = {
  role: string | null;
  name: string | null;
};

type SupabaseQueryError = {
  message?: string;
  details?: string;
  hint?: string;
  status?: number;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [roleLoading, setRoleLoading] = useState<boolean>(false);
  const [roleError, setRoleError] = useState<string | null>(null);
  const signingOutRef = useRef<boolean>(false);

  const fetchUserRole = async (
    userId: string,
    isMounted: () => boolean,
    maxRetries: number = 1,
    timeoutMs: number = 3000,
  ): Promise<void> => {
    console.debug("[Auth] fetchUserRole start", { userId });
    if (!userId) return;

    const ROLE_CACHE_KEY = (id: string) => `hcb-role-${id}`;
    const ROLE_CACHE_TTL = 30 * 60 * 1000;

    const cachedInfo = (() => {
      try {
        const raw = localStorage.getItem(ROLE_CACHE_KEY(userId));
        if (!raw) return null;
        const parsed = JSON.parse(raw) as { role?: string | null; ts?: number };
        if (!parsed) return null;
        if (parsed.ts && Date.now() - parsed.ts > ROLE_CACHE_TTL) return null;
        return parsed;
      } catch (_error) {
        return null;
      }
    })();

    const hasValidCache = Boolean(cachedInfo && cachedInfo.role !== undefined);

    if (hasValidCache && isMounted()) {
      setRole(cachedInfo?.role ?? null);
    }

    if (!hasValidCache && isMounted()) setRoleLoading(true);

    const doFetch = async (attemptAllowed: number = maxRetries): Promise<void> => {
      let attempt = 0;

      try {
        while (attempt <= attemptAllowed && isMounted()) {
          try {
            const timeoutPromise = new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error("Timeout")), timeoutMs),
            );

            const fetchPromise = supabase
              .from("profiles")
              .select("role, name")
              .eq("id", userId)
              .single();

            const result = (await Promise.race([fetchPromise, timeoutPromise])) as {
              data: ProfileRow | null;
              error: SupabaseQueryError | null;
            };

            const { data, error } = result;

            if (error) {
              if (error.message?.includes("AbortError") || error.details?.includes("AbortError")) {
                return;
              }

              if (error.status && error.status >= 400 && error.status < 500) {
                console.warn("[Auth] fetchUserRole client error (no retry)", { status: error.status, message: error.message });
                if (isMounted() && !hasValidCache) {
                  setRole(null);
                  setRoleError(error.message || "Client error fetching role");
                }
                return;
              }

              if (error.message === "Timeout") {
                if (attempt < attemptAllowed) {
                  attempt += 1;
                  await new Promise((resolve) => setTimeout(resolve, 250));
                  continue;
                }
                if (isMounted() && !hasValidCache) {
                  setRole(null);
                  setRoleError("Timeout while fetching role");
                }
                return;
              }

              console.warn("[Auth] fetchUserRole error, attempt", attempt, error);
              console.error("[Auth] fetchUserRole error details", {
                message: error.message,
                details: error.details,
                hint: error.hint,
                status: error.status,
              });

              if (attempt < attemptAllowed) {
                attempt += 1;
                await new Promise((resolve) => setTimeout(resolve, 250));
                continue;
              }

              if (isMounted() && !hasValidCache) {
                setRole(null);
                setRoleError(error.message || "Unknown error fetching role");
              }
              return;
            }

            if (isMounted()) {
              console.debug("[Auth] fetchUserRole success", { role: data?.role, name: data?.name });
              setRole(data?.role ?? null);
              setProfile({ name: data?.name ?? null });
              setRoleError(null);

              try {
                localStorage.setItem(ROLE_CACHE_KEY(userId), JSON.stringify({ role: data?.role ?? null, ts: Date.now() }));
              } catch (_error) {
              
              }
            }
            break;
          } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);

            if (message.includes("AbortError")) {
              return;
            }

            if (message === "Timeout") {
              if (attempt < attemptAllowed) {
                attempt += 1;
                await new Promise((resolve) => setTimeout(resolve, 250));
                continue;
              }
              if (isMounted() && !hasValidCache) {
                setRole(null);
                setRoleError("Timeout while fetching role");
              }
              break;
            }

            console.warn("[Auth] fetchUserRole unexpected error, attempt", attempt, error);
            console.error("[Auth] fetchUserRole unexpected error details", {
              message,
              stack: error instanceof Error ? error.stack : undefined,
            });

            if (attempt < attemptAllowed) {
              attempt += 1;
              await new Promise((resolve) => setTimeout(resolve, 250));
              continue;
            }

            if (isMounted() && !hasValidCache) {
              setRole(null);
            }
            break;
          }
        }
      } finally {
        if (isMounted() && !hasValidCache) setRoleLoading(false);
      }
    };

    if (hasValidCache) {
      doFetch(maxRetries).catch(() => undefined);
    } else {
      await doFetch(maxRetries);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const checkMounted = () => isMounted;

    const initAuth = async () => {
      console.debug("[Auth] initAuth starting");

      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        console.debug("[Auth] getSession result", { session, error });

        if (error && !error.message?.includes("AbortError")) {
          console.error("Session error:", error);
        }

        if (session?.user && isMounted) {
          setUser(session.user);

          try {
            const cachedName = localStorage.getItem("hcb-signup-name") || null;
            if (cachedName) {
              await supabase.from("profiles").upsert([{ id: session.user.id, name: cachedName, email: session.user.email }]);
            }
          } catch (_error) {
          
          }

          await fetchUserRole(session.user.id, checkMounted);
        }
      } catch (error: unknown) {
        console.error("Auth init error:", error);
      }

      if (isMounted) {
        setLoading(false);
        
      }
    };

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      if (event === "SIGNED_IN" && session?.user) {
        setUser(session.user);

        try {
          const cachedName = localStorage.getItem("hcb-signup-name") || null;
          if (cachedName) {
            await supabase.from("profiles").upsert([{ id: session.user.id, name: cachedName, email: session.user.email }]);
          }
        } catch (_error) {
         
        }

        await fetchUserRole(session.user.id, checkMounted);
        setLoading(false);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setRole(null);
        setProfile(null);
        setLoading(false);
      } else if (event === "TOKEN_REFRESHED" && session?.user) {
        setUser(session.user);
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const signOut = async (): Promise<void> => {
    if (signingOutRef.current) {
      return;
    }

    signingOutRef.current = true;

    try {
      if (user) {
        localStorage.removeItem(`hcb-role-${user.id}`);
      }
    } catch (_err) {

    }

    setUser(null);
    setRole(null);
    setProfile(null);

    try {
    
      const signOutPromise = supabase.auth.signOut();
      const timeoutPromise = new Promise<void>((_, reject) =>
        setTimeout(() => reject(new Error("Supabase signOut timeout")), 1500)
      );
      await Promise.race([signOutPromise, timeoutPromise]);
    } catch (_error) {
      console.warn("[Auth] Supabase signOut error or timeout caught:", _error);
    } finally {
  
      setUser(null);
      setRole(null);
      setProfile(null);
      signingOutRef.current = false;
    }
  };

  return (
    <AuthContext.Provider value={{ user, role, profile, loading, roleLoading, roleError, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

