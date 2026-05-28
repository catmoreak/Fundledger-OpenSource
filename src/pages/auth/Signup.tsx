import { useState } from "react";
import type { FormEvent, ChangeEvent } from "react";
import { supabase } from "../../../supabase";
import { useNavigate, Link } from "react-router-dom";
import { useToast } from "../../context/ToastContext";
import { colors, spacing, borderRadius } from "../../styles/theme";
import { Eye, EyeOff } from "lucide-react";

const Signup: React.FC = () => {
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [nameFocused, setNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [btnHovered, setBtnHovered] = useState(false);
  const [btnPressed, setBtnPressed] = useState(false);
  const [logoHovered, setLogoHovered] = useState(false);
  const [signinHovered, setSigninHovered] = useState(false);
  const [backHovered, setBackHovered] = useState(false);
  const [continueHovered, setContinueHovered] = useState(false);

  const handleSignup = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError(null);

    if (!name || !email || !password) {
      setError("Please fill all fields");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    try {
      setLoading(true);
      try { localStorage.setItem('hcb-signup-name', name.trim()); } catch (e) {}

      const { data, error: signUpError } = await supabase.auth.signUp({ 
        email: email.trim(), 
        password 
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      const user = data?.user;
      
      if (!user) {
        setError("Signup failed. Please try again.");
        return;
      }

      const { error: profileError } = await supabase.from("profiles").insert([{
        id: user.id,
        name: name.trim(),
        email: email.trim(),
        role: "user"
      }]);

      if (profileError) {
        console.error("Profile creation error:", profileError);
      }

      if (data.session) {
        addToast("Account created successfully!", "success");
        navigate("/home");
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const getInputStyle = (isFocused: boolean): React.CSSProperties => ({
    width: "100%",
    padding: "12px 44px 12px 44px",
    borderRadius: borderRadius.md,
    border: `1px solid ${isFocused ? colors.accentGreen : colors.border}`,
    background: isFocused ? "rgba(23, 23, 29, 0.9)" : colors.bgSecondary,
    color: colors.textPrimary,
    fontSize: "14px",
    outline: "none",
    transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
    boxSizing: "border-box",
    boxShadow: isFocused ? `0 0 0 3px ${colors.accentGreen}20, 0 4px 12px rgba(0, 0, 0, 0.15)` : "none",
  });

  return (
    <div style={pageContainer}>
     
      <div style={orb1} />
      <div style={orb2} />

    
      <div style={backlight} />

      <div style={formCard}>
        <div 
          style={logoContainer}
          onMouseEnter={() => setLogoHovered(true)}
          onMouseLeave={() => setLogoHovered(false)}
        >
          <img 
            src="/logo.png" 
            alt="FundLedger Logo" 
            style={{ 
              width: 50, 
              height: 65, 
              borderRadius: 12, 
              objectFit: "cover",
              transform: logoHovered ? "scale(1.08) rotate(-3deg)" : "scale(1)",
              boxShadow: logoHovered ? "0 8px 24px rgba(51, 209, 122, 0.25)" : "0 4px 12px rgba(0, 0, 0, 0.15)",
              transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
            }} 
          />
          <span style={{
            ...logoText,
            background: "linear-gradient(135deg, #ffffff 0%, #a0a0a8 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            textShadow: logoHovered ? "0 0 15px rgba(255,255,255,0.15)" : "none",
            transition: "all 0.3s ease"
          }}>FundLedger</span>
        </div>

        <h2 style={titleStyle}>Create your account</h2>
        <p style={subtitleStyle}>Join us for transparent financial management</p>

        {error && (
          <div style={errorBox}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            {error}
          </div>
        )}

        {success ? (
          <div style={successContainer}>
            <div style={successBox}>
              <div style={successIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
              <h3 style={successTitle}>Account created!</h3>
              <p style={successText}>
                Please check your email to confirm your account, then sign in.
              </p>
            </div>
            <Link 
              to="/login" 
              style={{
                ...btnStyle,
                background: continueHovered 
                  ? "linear-gradient(135deg, #2ecc71 0%, #1ec28b 100%)" 
                  : "linear-gradient(135deg, #1ec28b 0%, #10b981 100%)",
                boxShadow: continueHovered 
                  ? "0 6px 20px rgba(51, 209, 122, 0.35)" 
                  : "0 4px 15px rgba(30, 194, 139, 0.2)",
                transform: continueHovered ? "scale(1.02)" : "scale(1)",
              }}
              onMouseEnter={() => setContinueHovered(true)}
              onMouseLeave={() => setContinueHovered(false)}
            >
              Continue to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSignup}>
            <div style={inputGroup}>
              <label style={labelStyle}>Full Name</label>
              <div style={inputWrapper}>
                <svg 
                  width="18" 
                  height="18" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  style={{
                    ...inputIcon,
                    color: nameFocused ? colors.accentGreen : colors.textMuted,
                    transition: "color 0.25s ease"
                  }}
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                <input 
                  placeholder="your name here" 
                  value={name} 
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)} 
                  onFocus={() => setNameFocused(true)}
                  onBlur={() => setNameFocused(false)}
                  style={getInputStyle(nameFocused)} 
                  disabled={loading}
                />
              </div>
            </div>

            <div style={inputGroup}>
              <label style={labelStyle}>Email</label>
              <div style={inputWrapper}>
                <svg 
                  width="18" 
                  height="18" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  style={{
                    ...inputIcon,
                    color: emailFocused ? colors.accentGreen : colors.textMuted,
                    transition: "color 0.25s ease"
                  }}
                >
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                <input 
                  type="email"
                  placeholder="your email here" 
                  value={email} 
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} 
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  style={getInputStyle(emailFocused)} 
                  disabled={loading}
                />
              </div>
            </div>

            <div style={inputGroup}>
              <label style={labelStyle}>Password</label>
              <div style={{ position: 'relative' }}>
                <div style={inputWrapper}>
                  <svg 
                    width="18" 
                    height="18" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    style={{
                      ...inputIcon,
                      color: passwordFocused ? colors.accentGreen : colors.textMuted,
                      transition: "color 0.25s ease"
                    }}
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    placeholder="Min 6 characters" 
                    value={password} 
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)} 
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    style={getInputStyle(passwordFocused)} 
                    disabled={loading}
                  />
                </div>
                <button 
                  type="button" 
                  onClick={() => setShowPassword((s: boolean) => !s)} 
                  aria-label={showPassword ? "Hide password" : "Show password"} 
                  style={{ 
                    position: 'absolute', 
                    right: 14, 
                    top: '50%', 
                    transform: 'translateY(-50%)', 
                    background: 'transparent', 
                    border: 'none', 
                    color: passwordFocused ? colors.accentGreen : colors.textMuted, 
                    zIndex: 2,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 4,
                    transition: 'color 0.25s ease'
                  }}
                >
                  {showPassword ? <Eye size={18} strokeWidth={2} /> : <EyeOff size={18} strokeWidth={2} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              onMouseEnter={() => setBtnHovered(true)}
              onMouseLeave={() => { setBtnHovered(false); setBtnPressed(false); }}
              onMouseDown={() => setBtnPressed(true)}
              onMouseUp={() => setBtnPressed(false)}
              style={{
                width: "100%",
                padding: "14px 0",
                fontSize: 16,
                fontWeight: 700,
                border: "none",
                borderRadius: borderRadius.md,
                color: "#ffffff",
                background: btnHovered 
                  ? "linear-gradient(135deg, #2ecc71 0%, #1ec28b 100%)" 
                  : "linear-gradient(135deg, #1ec28b 0%, #10b981 100%)",
                boxShadow: btnHovered 
                  ? "0 6px 20px rgba(51, 209, 122, 0.35)" 
                  : "0 4px 15px rgba(30, 194, 139, 0.2)",
                cursor: loading ? "not-allowed" : "pointer",
                transform: btnPressed ? "scale(0.98)" : btnHovered ? "scale(1.02)" : "scale(1)",
                transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                marginTop: 16,
                marginBottom: 8,
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? (
                <span style={loadingContent}>
                  <span style={spinner} />
                  Creating account...
                </span>
              ) : "Create Account"}
            </button>

            <div style={divider}>
              <span style={dividerLine} />
              <span style={dividerText}>or</span>
              <span style={dividerLine} />
            </div>

            <p style={signinText}>
              Already have an account?{" "}
              <Link 
                to="/login" 
                style={{
                  ...linkStyle,
                  color: signinHovered ? "#58e49f" : colors.accentGreen,
                  textDecoration: signinHovered ? "underline" : "none",
                }}
                onMouseEnter={() => setSigninHovered(true)}
                onMouseLeave={() => setSigninHovered(false)}
              >
                Sign in
              </Link>
            </p>

            <Link 
              to="/home" 
              style={{
                ...backLink,
                color: backHovered ? colors.textPrimary : colors.textMuted,
                transform: backHovered ? "translateX(-4px)" : "translateX(0)",
              }}
              onMouseEnter={() => setBackHovered(true)}
              onMouseLeave={() => setBackHovered(false)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6 }}>
                <line x1="19" y1="12" x2="5" y2="12"/>
                <polyline points="12 19 5 12 12 5"/>
              </svg>
              Back to Home
            </Link>
          </form>
        )}
      </div>

      <p style={footerText}>Transparent finances for your organization</p>
    </div>
  );
};

const pageContainer: React.CSSProperties = {
  minHeight: "100vh",
  background: colors.bgPrimary,
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  padding: spacing.lg,
  position: "relative",
  overflow: "hidden",
};

const orb1: React.CSSProperties = {
  position: "absolute",
  top: "10%",
  left: "15%",
  width: "350px",
  height: "350px",
  borderRadius: "50%",
  background: "radial-gradient(circle, rgba(51, 209, 122, 0.12) 0%, transparent 70%)",
  filter: "blur(60px)",
  animation: "float-slow-1 25s ease-in-out infinite",
  pointerEvents: "none",
  zIndex: 0,
};

const orb2: React.CSSProperties = {
  position: "absolute",
  bottom: "10%",
  right: "15%",
  width: "400px",
  height: "400px",
  borderRadius: "50%",
  background: "radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)",
  filter: "blur(70px)",
  animation: "float-slow-2 30s ease-in-out infinite",
  pointerEvents: "none",
  zIndex: 0,
};

const backlight: React.CSSProperties = {
  position: "absolute",
  width: "450px",
  height: "450px",
  background: "radial-gradient(circle, rgba(51, 209, 122, 0.05) 0%, transparent 70%)",
  borderRadius: "50%",
  filter: "blur(50px)",
  pointerEvents: "none",
  zIndex: 0,
};

const formCard: React.CSSProperties = {
  width: "100%",
  maxWidth: "420px",
  background: "rgba(37, 37, 48, 0.65)",
  backdropFilter: "blur(20px) saturate(120%)",
  WebkitBackdropFilter: "blur(20px) saturate(120%)",
  padding: spacing.xl,
  borderRadius: borderRadius.lg,
  border: `1px solid rgba(255, 255, 255, 0.08)`,
  boxShadow: "0 24px 50px rgba(0, 0, 0, 0.35), inset 0 1px 1px rgba(255, 255, 255, 0.05)",
  position: "relative",
  zIndex: 1,
  animation: "fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) both",
};

const logoContainer: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: spacing.sm,
  marginBottom: spacing.lg,
  cursor: "pointer",
};

const logoText: React.CSSProperties = {
  fontSize: "26px",
  fontWeight: 800,
  letterSpacing: "-0.5px",
};

const titleStyle: React.CSSProperties = {
  fontSize: "24px",
  fontWeight: 700,
  color: colors.textPrimary,
  margin: 0,
  textAlign: "center",
  letterSpacing: "-0.3px",
};

const subtitleStyle: React.CSSProperties = {
  fontSize: "14px",
  color: colors.textMuted,
  margin: 0,
  marginTop: spacing.xs,
  marginBottom: spacing.xl,
  textAlign: "center",
};

const errorBox: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: spacing.sm,
  padding: spacing.md,
  background: "rgba(236, 94, 94, 0.12)",
  border: `1px solid rgba(236, 94, 94, 0.25)`,
  borderRadius: borderRadius.md,
  color: colors.accentRed,
  fontSize: "14px",
  marginBottom: spacing.md,
  animation: "fadeIn 0.3s ease",
};

const successContainer: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: spacing.lg,
};

const successBox: React.CSSProperties = {
  textAlign: "center",
  padding: spacing.xl,
  background: "rgba(51, 209, 122, 0.08)",
  border: `1px solid rgba(51, 209, 122, 0.25)`,
  borderRadius: borderRadius.md,
  backdropFilter: "blur(5px)",
};

const successIcon: React.CSSProperties = {
  width: "48px",
  height: "48px",
  borderRadius: "50%",
  background: "rgba(51, 209, 122, 0.15)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: colors.accentGreen,
  margin: "0 auto",
  marginBottom: spacing.md,
};

const successTitle: React.CSSProperties = {
  fontSize: "20px",
  fontWeight: 700,
  color: colors.textPrimary,
  margin: 0,
  marginBottom: spacing.sm,
  letterSpacing: "-0.3px",
};

const successText: React.CSSProperties = {
  fontSize: "14px",
  color: colors.textSecondary,
  margin: 0,
  lineHeight: 1.5,
};

const inputGroup: React.CSSProperties = {
  marginBottom: spacing.lg,
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "13px",
  fontWeight: 600,
  color: colors.textSecondary,
  marginBottom: spacing.xs,
  letterSpacing: "0.2px",
};

const inputWrapper: React.CSSProperties = {
  position: "relative",
};

const inputIcon: React.CSSProperties = {
  position: "absolute",
  left: "16px",
  top: "50%",
  transform: "translateY(-50%)",
  pointerEvents: "none",
  zIndex: 2,
};

const btnStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  padding: "14px",
  borderRadius: borderRadius.md,
  border: "none",
  color: "#fff",
  fontSize: "16px",
  fontWeight: 700,
  marginTop: spacing.sm,
  transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
  textDecoration: "none",
  textAlign: "center",
  cursor: "pointer",
};

const loadingContent: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: spacing.sm,
};

const spinner: React.CSSProperties = {
  width: "18px",
  height: "18px",
  border: "2px solid rgba(255,255,255,0.35)",
  borderTopColor: "#fff",
  borderRadius: "50%",
  animation: "spin 0.8s linear infinite",
};

const divider: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: spacing.md,
  margin: `${spacing.lg} 0`,
};

const dividerLine: React.CSSProperties = {
  flex: 1,
  height: "1px",
  background: "rgba(255, 255, 255, 0.08)",
};

const dividerText: React.CSSProperties = {
  fontSize: "12px",
  color: colors.textMuted,
  textTransform: "uppercase",
  letterSpacing: "1px",
};
const signinText: React.CSSProperties = {
  textAlign: "center",
  fontSize: "14px",
  color: colors.textSecondary,
  margin: 0,
};

const linkStyle: React.CSSProperties = {
  textDecoration: "none",
  fontWeight: 600,
  transition: "all 0.2s ease",
};

const backLink: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  marginTop: spacing.xl,
  textDecoration: "none",
  fontSize: "14px",
  fontWeight: 500,
  transition: "all 0.25s ease",
};

const footerText: React.CSSProperties = {
  marginTop: spacing.xxl,
  fontSize: "13px",
  color: colors.textMuted,
  position: "relative",
  zIndex: 1,
  letterSpacing: "0.2px",
};

export default Signup;