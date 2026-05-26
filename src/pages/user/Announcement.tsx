import { useEffect, useState, type CSSProperties, type ReactElement } from "react";
import UserLayout from "../../Layouts/UserLayout";
import { supabase } from "../../../supabase";
import { Spinner } from "../../components/Spinner";
import { colors, spacing, borderRadius, cardStyle as themeCard } from "../../styles/theme";

interface Announcement {
  id: number | string;
  message: string;
  created_at: string;
}

function Announcements(): ReactElement {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchAnnouncements = async () => {
      const startTime = Date.now();
      try {
        if (!isMounted) return;
        setLoading(true);

        const { data, error } = await supabase
          .from("announcements")
          .select("id, message, created_at")
          .order("created_at", { ascending: false });

        if (error) throw error;

        if (isMounted) {
          setAnnouncements(data || []);
        }
      } catch (caughtErr) {
        const err = caughtErr as any;
        if (err?.name === "AbortError" || err?.message?.includes("AbortError")) {
         
        } else if (isMounted) {
          setError("Failed to load announcements");
        }
      } finally {
       
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, 3000 - elapsed);
        setTimeout(() => {
          if (isMounted) {
            setLoading(false);
          }
        }, remaining);
      }
    };

    fetchAnnouncements();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <UserLayout>
     
      <div style={headerSection}>
        <div>
          <h1 style={{ textAlign: "left", fontSize: 34, fontWeight: 800, margin: "32px 0 8px 0", letterSpacing: -1, color: colors.textPrimary }}>Announcements</h1>
          <p style={pageSubtitle}>Stay updated with the latest news</p>
        </div>
      </div>

      {loading && <Spinner />}
      {error && <p style={{ color: colors.accentRed, marginBottom: spacing.md }}>{error}</p>}

      {!loading && !error && (
        <div style={announcementsList}>
          {announcements.map((ann, index) => (
            <div key={ann.id} style={announcementCard}>
              <div style={announcementHeader}>
                <div style={bulletDot} />
                <span style={dateLabel}>
                  {new Date(ann.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric"
                  })}
                </span>
                {index === 0 && (
                  <span style={newBadge}>New</span>
                )}
              </div>
              <p style={messageText}>{ann.message}</p>
            </div>
          ))}

          {announcements.length === 0 && (
            <div style={emptyState}>
              <div style={emptyIcon}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
              </div>
              <p style={emptyTitle}>No announcements yet</p>
              <p style={emptySubtitle}>Check back later for updates</p>
            </div>
          )}
        </div>
      )}
    </UserLayout>
  );
}


const headerSection: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: spacing.md,
  marginBottom: spacing.xl,
};

const headerIcon: CSSProperties = {
  width: "48px",
  height: "48px",
  borderRadius: borderRadius.md,
  background: `linear-gradient(135deg, ${colors.accentBlue}20, ${colors.accentPurple}20)`,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: colors.accentBlue,
};

const pageTitle: CSSProperties = {
  fontSize: "28px",
  fontWeight: 700,
  color: colors.textPrimary,
  margin: 0,
};

const pageSubtitle: CSSProperties = {
  fontSize: "14px",
  color: colors.textMuted,
  margin: 0,
  marginTop: "4px",
};

const announcementsList: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: spacing.md,
};

const announcementCard: CSSProperties = {
  ...(themeCard as CSSProperties),
  transition: "transform 0.2s, box-shadow 0.2s",
};

const announcementHeader: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: spacing.sm,
  marginBottom: spacing.sm,
};

const bulletDot: CSSProperties = {
  width: "8px",
  height: "8px",
  borderRadius: "50%",
  background: colors.accentBlue,
};

const dateLabel: CSSProperties = {
  color: colors.textMuted,
  fontSize: "13px",
};

const newBadge: CSSProperties = {
  background: `${colors.accentGreen}20`,
  color: colors.accentGreen,
  padding: "2px 8px",
  borderRadius: borderRadius.full,
  fontSize: "11px",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const messageText: CSSProperties = {
  color: colors.textPrimary,
  fontSize: "15px",
  lineHeight: 1.6,
  margin: 0,
};

const emptyState: CSSProperties = {
  ...(themeCard as CSSProperties),
  textAlign: "center",
  padding: spacing.xxl,
};

const emptyIcon: CSSProperties = {
  color: colors.textMuted,
  marginBottom: spacing.md,
};

const emptyTitle: CSSProperties = {
  fontSize: "18px",
  fontWeight: 600,
  color: colors.textSecondary,
  margin: 0,
};

const emptySubtitle: CSSProperties = {
  fontSize: "14px",
  color: colors.textMuted,
  margin: 0,
  marginTop: spacing.xs,
};

export default Announcements;