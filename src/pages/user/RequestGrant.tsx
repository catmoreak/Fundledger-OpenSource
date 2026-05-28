import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent, CSSProperties } from "react";
import type { User } from "@supabase/supabase-js";
import UserLayout from "../../Layouts/UserLayout";
import { supabase } from "../../../supabase";
import { useNavigate } from "react-router-dom";
import { Spinner } from "../../components/Spinner";
import { useToast } from "../../context/ToastContext";
import { colors, spacing, borderRadius, cardStyle as themeCard, inputStyle as themeInput, buttonPrimary } from "../../styles/theme";


interface FormState {
  name: string;
  phone: string;
  email: string;
  amount: string;
  title: string;
  description: string;
}

function RequestGrant() {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>({
    name: "",
    phone: "",
    email: "",
    amount: "",
    title: "",
    description: ""
  });

  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      const startTime = Date.now();
      try {
        const { data } = await supabase.auth.getUser();
        if (!isMounted) return;
        
        if (!data.user) {
          navigate("/login");
          return;
        }
        if (isMounted) {
          setUser(data.user);
          setForm(prev => ({ ...prev, email: data.user?.email || "" }));
        }
      } catch (err: any) {
        
        if (err?.name === 'AbortError' || err?.message?.includes('AbortError')) {
          return;
        }
        if (isMounted) {
          console.error(err);
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

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!form.title || !form.amount || !form.description) {
      setError("Please fill all required fields");
      return;
    }

    if (!user) {
      setError("You must be logged in to request a grant");
      return;
    }

    try {
      setSubmitting(true);

      const { error: insertError } = await supabase.from("grant_requests").insert([
        {
          user_id: user.id,
          title: form.title,
          description: form.description,
          amount: Number(form.amount),
          phone: form.phone ? `+91 ${(form.phone || '').replace(/\D/g, '').slice(-10)}` : null,
          email: form.email,
          status: "pending"
        }
      ]);

      if (insertError) throw insertError;

      addToast("Grant request submitted successfully!", "success");
      setForm({
        name: "",
        phone: "",
        email: user.email || "",
        amount: "",
        title: "",
        description: ""
      });
    } catch (err) {
      addToast("Failed to submit grant request", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <UserLayout><Spinner /></UserLayout>;

  return (
    <UserLayout>
    
      <div style={headerSection}>
        <div>
          <h1 style={{ textAlign: "left", fontSize: 34, fontWeight: 800, margin: "32px 0 8px 0", letterSpacing: -1, color: colors.textPrimary }}>Request Grant</h1>
        </div>
      </div>

      <div style={formContainer}>
        <div style={formCard}>
          <form onSubmit={handleSubmit}>
            {error && (
              <div style={errorBox}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
                {error}
              </div>
            )}
            {success && (
              <div style={successBox}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                {success}
              </div>
            )}

            <div style={formGroup}>
              <label htmlFor="grant-title" style={labelStyle}>Grant Title <span style={requiredStar}>*</span></label>
              <input
                id="grant-title"
                name="title"
                autoComplete="off"
                placeholder="E.g., Community Workshop Funding"
                value={form.title}
                onChange={handleChange}
                style={inputStyle}
              />
            </div>

            <div style={formGroup}>
              <label style={labelStyle}>Description <span style={requiredStar}>*</span></label>
              <textarea
                name="description"
                placeholder="Describe your project and how the funds will be used..."
                value={form.description}
                onChange={handleChange}
                rows={4}
                style={{ ...inputStyle, resize: "vertical", minHeight: "100px" }}
              />
            </div>

            <div style={formRow}>
              <div style={formGroup}>
                <label style={labelStyle}>Amount (₹) <span style={requiredStar}>*</span></label>
                <input
                  name="amount"
                  type="number"
                  placeholder="5000"
                  value={form.amount}
                  onChange={handleChange}
                  style={inputStyle}
                />
              </div>

              <div style={formGroup}>
                <label htmlFor="grant-phone" style={labelStyle}>Phone</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ padding: '8px 10px', background: colors.bgSecondary, borderRadius: 8, color: colors.textMuted, fontSize: 13 }}>+91</span>
                  <input
                    id="grant-phone"
                    name="phone"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    placeholder="1234567890"
                    value={form.phone}
                    onChange={(e) => setForm(prev => ({ ...prev, phone: (e.target.value || '').replace(/\D/g, '').slice(0, 10) }))}
                    maxLength={10}
                    pattern="[0-9]{10}"
                    style={{ ...inputStyle, width: '100%' }}
                  />
                </div>
              </div>
            </div>

            <div style={formGroup}>
              <label style={labelStyle}>Email</label>
              <input
                name="email"
                placeholder="Email"
                value={form.email}
                disabled
                style={{ ...inputStyle, opacity: 0.6, cursor: "not-allowed" }}
              />
              <span style={helperText}>Linked to your account</span>
            </div>

            <button
              type="submit"
              disabled={submitting}
              style={{
                ...submitBtn,
                opacity: submitting ? 0.7 : 1,
                cursor: submitting ? "not-allowed" : "pointer",
              }}
            >
              {submitting ? (
                <>
                  <span style={spinnerStyle} />
                  Submitting...
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"/>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                  Submit Request
                </>
              )}
            </button>
          </form>
        </div>

       
        <div style={infoCard}>
          <h3 style={infoTitle}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
            How it works
          </h3>
          <ul style={infoList}>
            <li style={infoItem}>
              <span style={infoBullet}>1</span>
              Submit your grant request with details
            </li>
            <li style={infoItem}>
              <span style={infoBullet}>2</span>
              Admin reviews your application
            </li>
            <li style={infoItem}>
              <span style={infoBullet}>3</span>
              If approved, funds are allocated
            </li>
            <li style={infoItem}>
              <span style={infoBullet}>4</span>
              Track your project in the Projects section
            </li>
          </ul>
        </div>
      </div>
    </UserLayout>
  );
}



const headerSection: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: spacing.md,
  marginBottom: spacing.xl,
};

const formContainer: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 300px",
  gap: spacing.lg,
  maxWidth: "900px",
};

const formCard: CSSProperties = {
  ...themeCard,
};

const formGroup: CSSProperties = {
  marginBottom: spacing.md,
  flex: 1,
};

const formRow: CSSProperties = {
  display: "flex",
  gap: spacing.md,
};

const labelStyle: CSSProperties = {
  display: "block",
  fontSize: "13px",
  fontWeight: 500,
  color: colors.textSecondary,
  marginBottom: spacing.xs,
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const requiredStar: CSSProperties = {
  color: colors.accentRed,
};

const inputStyle: CSSProperties = {
  ...(themeInput as CSSProperties),
  width: "100%",
  boxSizing: "border-box",
};

const helperText: CSSProperties = {
  fontSize: "12px",
  color: colors.textMuted,
  marginTop: "4px",
  display: "block",
};

const errorBox: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: spacing.sm,
  padding: spacing.md,
  background: `${colors.accentRed}15`,
  border: `1px solid ${colors.accentRed}30`,
  borderRadius: borderRadius.md,
  color: colors.accentRed,
  marginBottom: spacing.md,
  fontSize: "14px",
};

const successBox: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: spacing.sm,
  padding: spacing.md,
  background: `${colors.accentGreen}15`,
  border: `1px solid ${colors.accentGreen}30`,
  borderRadius: borderRadius.md,
  color: colors.accentGreen,
  marginBottom: spacing.md,
  fontSize: "14px",
};

const submitBtn: CSSProperties = {
  ...(buttonPrimary as CSSProperties),
  width: "100%",
  marginTop: spacing.md,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: spacing.sm,
};

const spinnerStyle: CSSProperties = {
  width: "16px",
  height: "16px",
  border: "2px solid transparent",
  borderTopColor: "currentColor",
  borderRadius: "50%",
  animation: "spin 0.8s linear infinite",
};

const infoCard: CSSProperties = {
  ...(themeCard as CSSProperties),
  height: "fit-content",
  background: colors.bgSecondary,
};

const infoTitle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: spacing.sm,
  fontSize: "16px",
  fontWeight: 600,
  color: colors.textPrimary,
  margin: 0,
  marginBottom: spacing.md,
};

const infoList: CSSProperties = {
  listStyle: "none",
  padding: 0,
  margin: 0,
};

const infoItem: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: spacing.sm,
  fontSize: "14px",
  color: colors.textSecondary,
  marginBottom: spacing.md,
  lineHeight: 1.5,
};

const infoBullet: CSSProperties = {
  width: "20px",
  height: "20px",
  borderRadius: "50%",
  background: colors.bgCard,
  color: colors.accentGreen,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "11px",
  fontWeight: 600,
  flexShrink: 0,
};

export default RequestGrant;