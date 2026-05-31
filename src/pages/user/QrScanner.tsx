
import { useEffect, useState, type CSSProperties } from "react";
import UserLayout from "../../Layouts/UserLayout";
import { Html5QrcodeScanner } from "html5-qrcode";
import { supabase } from "../../../supabase";
import { colors, spacing, borderRadius, cardStyle as themeCard } from "../../styles/theme";

interface Txn {
  txn_id: string;
  title?: string | null;
  description?: string | null;
  amount?: number | string | null;
  type?: "credit" | "debit" | string | null;
  created_at?: string | null;
}
function QRScanner(): JSX.Element {
  const [txn, setTxn] = useState<Txn | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState<boolean>(true);

  const onScanSuccess = async (decodedText: string): Promise<void> => {
    try {
      setError(null);
      setTxn(null);
      setScanning(false);
      let txnData: any = null;
      try {
        txnData = JSON.parse(decodedText);
      } catch {
        txnData = null;
      }

      if (txnData && txnData.txn_id) {
        const { data, error } = await supabase
          .from("transactions")
          .select("txn_id")
          .eq("txn_id", txnData.txn_id)
          .single();

        if (error || !data) {
          setError("Invalid or unknown transaction QR");
          return;
        }

        const parsedTxn: Txn = {
          txn_id: txnData.txn_id,
          title: txnData.title,
          description: txnData.description,
          amount: txnData.amount,
          type: txnData.type,
          created_at: txnData.date,
        };
        setTxn(parsedTxn);
      } else {
        const { data, error } = await supabase
          .from("transactions")
          .select("txn_id, title, description, amount, type, created_at")
          .eq("txn_id", decodedText)
          .single();

        if (error || !data) {
          setError("Invalid or unknown transaction QR");
          return;
        }

        setTxn(data as Txn);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to read QR data");
    }
  };

  const onScanError = (_errorMessage?: string): void => {};

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: 250 },
      false
    );

    scanner.render(onScanSuccess, onScanError);

    return () => {
      scanner.clear().catch(() => {});
    };
  }, []);

  return (
    <UserLayout>
      <div style={headerSection}>
        <h1 style={{ textAlign: "left", fontSize: 34, fontWeight: 800, margin: "32px 0 8px 0", letterSpacing: -1, color: colors.textPrimary }}>Scan QR Code</h1>
      </div>

      <div style={contentGrid}>
        <div style={scannerCard}>
          <div style={scannerHeader}>
            <div style={pulsingDot} />
            <span style={scannerStatus}>{scanning ? "Scanner Active" : "Scan Complete"}</span>
          </div>
          <div id="qr-reader" style={scannerArea} />
          <p style={scannerHint}>Position QR code within the frame</p>
        </div>

        <div style={resultCard}>
          <h3 style={resultTitle}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
            Transaction Details
          </h3>

          {error && (
            <div style={errorBox}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
              {error}
            </div>
          )}

          {!txn && !error && (
            <div style={placeholderBox}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7"/>
                <rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/>
              </svg>
              <p style={placeholderText}>Scan a transaction QR to view details</p>
            </div>
          )}

          {txn && (
            <div style={detailsLayout}>
              <div style={detailsContainer}>
                <div style={detailRow}>
                  <span style={detailLabel}>Transaction ID</span>
                  <span style={txnIdStyle}>{txn.txn_id}</span>
                </div>

                <div style={detailRow}>
                  <span style={detailLabel}>Title</span>
                  <span style={detailValue}>{txn.title || "—"}</span>
                </div>

                <div style={detailRow}>
                  <span style={detailLabel}>Description</span>
                  <span style={detailValue}>{txn.description || "—"}</span>
                </div>

                <div style={detailRow}>
                  <span style={detailLabel}>Amount</span>
                  <span style={{
                    ...amountStyle,
                    color: txn.type === "credit" ? colors.accentGreen : colors.accentRed,
                  }}>
                    {txn.type === "credit" ? "+" : "-"}₹{Number(txn.amount).toLocaleString()}
                  </span>
                </div>

                <div style={detailRow}>
                  <span style={detailLabel}>Type</span>
                  <span style={{
                    ...typeBadge,
                    background: txn.type === "credit" ? `${colors.accentGreen}20` : `${colors.accentRed}20`,
                    color: txn.type === "credit" ? colors.accentGreen : colors.accentRed,
                  }}>
                    {txn.type === "credit" ? "Credit" : "Debit"}
                  </span>
                </div>

                <div style={detailRow}>
                  <span style={detailLabel}>Date</span>
                  <span style={detailMuted}>
                    {new Date(String(txn.created_at)).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                <div style={verifiedBadge}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                  Transaction Verified
                </div>
              </div>
            </div>
          )}
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


const contentGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: spacing.lg,
  maxWidth: "900px",
};

const scannerCard: CSSProperties = {
  ...themeCard,
};

const scannerHeader: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: spacing.sm,
  marginBottom: spacing.md,
};

const pulsingDot: CSSProperties = {
  width: "8px",
  height: "8px",
  borderRadius: "50%",
  background: colors.accentGreen,
  animation: "pulse 2s ease-in-out infinite",
};

const scannerStatus: CSSProperties = {
  fontSize: "13px",
  color: colors.textSecondary,
  fontWeight: 500,
};

const scannerArea: CSSProperties = {
  borderRadius: borderRadius.md,
  overflow: "hidden",
};

const scannerHint: CSSProperties = {
  fontSize: "13px",
  color: colors.textMuted,
  textAlign: "center",
  marginTop: spacing.md,
  marginBottom: 0,
};

const resultCard: CSSProperties = {
  ...themeCard,
};

const resultTitle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: spacing.sm,
  fontSize: "16px",
  fontWeight: 600,
  color: colors.textPrimary,
  margin: 0,
  marginBottom: spacing.lg,
  paddingBottom: spacing.md,
  borderBottom: `1px solid ${colors.border}`,
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
  fontSize: "14px",
};

const placeholderBox: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: spacing.xxl,
  color: colors.textMuted,
};

const placeholderText: CSSProperties = {
  marginTop: spacing.md,
  fontSize: "14px",
  textAlign: "center",
};

const detailsLayout: CSSProperties = {
  display: "block",
};

const detailsContainer: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: spacing.md,
};

const detailRow: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: spacing.md,
};

const detailLabel: CSSProperties = {
  fontSize: "13px",
  color: colors.textMuted,
  fontWeight: 500,
};

const detailValue: CSSProperties = {
  fontSize: "14px",
  color: colors.textPrimary,
  textAlign: "right",
  maxWidth: "60%",
  wordBreak: "break-word",
};

const detailMuted: CSSProperties = {
  fontSize: "14px",
  color: colors.textSecondary,
};

const txnIdStyle: CSSProperties = {
  fontFamily: "monospace",
  fontSize: "13px",
  background: colors.bgSecondary,
  padding: "4px 8px",
  borderRadius: borderRadius.sm,
  color: colors.textSecondary,
};

const amountStyle: CSSProperties = {
  fontSize: "18px",
  fontWeight: 700,
};

const typeBadge: CSSProperties = {
  padding: "4px 10px",
  borderRadius: borderRadius.full,
  fontSize: "12px",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const verifiedBadge: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: spacing.sm,
  marginTop: spacing.md,
  padding: spacing.md,
  background: `${colors.accentGreen}10`,
  border: `1px solid ${colors.accentGreen}30`,
  borderRadius: borderRadius.md,
  color: colors.accentGreen,
  fontSize: "14px",
  fontWeight: 500,
};

export default QRScanner;