import { useEffect, useState, useCallback, type CSSProperties } from "react";
import AdminLayout from "../../Layouts/AdminLayout";
import { supabase } from "../../../supabase";
import { Spinner } from "../../components/Spinner";
import { useToast } from "../../context/ToastContext";
import QRCode from "qrcode";
import { colors, spacing, borderRadius, cardStyle as themeCard, inputStyle as themeInput, buttonPrimary, tableStyles } from "../../styles/theme";



interface Transaction {
  id: string | number;
  txn_id: string;
  title: string | null;
  description: string | null;
  amount: number | string;
  type: "credit" | "debit" | string;
  created_at: string;
}

interface QrModalState {
  open: boolean;
  txn: Transaction | null;
  qrImage: string;
}

function AdminTransactions(): JSX.Element {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [showForm, setShowForm] = useState<boolean>(false);
  
  
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterType, setFilterType] = useState<"all" | "credit" | "debit">("all");


  const [form, setForm] = useState({
    txn_id: "",
    title: "",
    description: "",
    amount: "",
    type: "credit" as "credit" | "debit"
  });


  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState<boolean>(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | number | null>(null);
  const [deleteMsg, setDeleteMsg] = useState<string>("");

  
  const [qrModal, setQrModal] = useState<QrModalState>({ open: false, txn: null, qrImage: "" });

  const { addToast } = useToast();

  const generateTxnId = (): string => {
    const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `TXN-${Date.now().toString().slice(-6)}-${randomHex}`;
  };

  const initForm = () => {
    setForm({
      txn_id: generateTxnId(),
      title: "",
      description: "",
      amount: "",
      type: "credit"
    });
  };

  const fetchTransactions = useCallback(async () => {
    await Promise.resolve();
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTransactions((data || []) as Transaction[]);
    } catch {
      addToast("Failed to load transactions", "error");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!form.txn_id.trim() || !form.title.trim() || !form.amount) {
      addToast("Please fill in all required fields", "error");
      return;
    }

    if (Number(form.amount) <= 0) {
      addToast("Amount must be a positive number", "error");
      return;
    }

    try {
      setSubmitting(true);

      const { error } = await supabase.from("transactions").insert([
        {
          txn_id: form.txn_id.trim(),
          title: form.title.trim(),
          description: form.description.trim() || null,
          amount: Number(form.amount),
          type: form.type,
        }
      ]);

      if (error) throw error;

      addToast("Transaction recorded successfully!", "success");
      setShowForm(false);
      fetchTransactions();
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Failed to record transaction";
      addToast(errMsg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (txn: Transaction) => {
    setDeleteTargetId(txn.id);
    setDeleteMsg(`Are you sure you want to delete transaction "${txn.title || txn.txn_id}" for ₹${Number(txn.amount).toLocaleString()}?`);
    setConfirmDeleteOpen(true);
  };

  const performDelete = async () => {
    if (!deleteTargetId) return;
    setConfirmDeleteOpen(false);

    try {
      const { error } = await supabase.from("transactions").delete().eq("id", deleteTargetId);
      if (error) throw error;

      addToast("Transaction deleted successfully", "success");
      fetchTransactions();
    } catch {
      addToast("Failed to delete transaction", "error");
    } finally {
      setDeleteTargetId(null);
      setDeleteMsg("");
    }
  };

  const handleShowQR = async (txn: Transaction): Promise<void> => {
    try {
      const payload = JSON.stringify({
        txn_id: txn.txn_id,
        title: txn.title,
        description: txn.description || "",
        amount: txn.amount,
        type: txn.type,
        date: txn.created_at,
      });

      const qrImage = await QRCode.toDataURL(payload, {
        width: 200,
        margin: 2,
        color: { dark: "#000", light: "#fff" },
      });

      setQrModal({ open: true, txn, qrImage });
    } catch (err) {
      console.error("Failed to generate QR:", err);
    }
  };

  const closeQrModal = (): void => setQrModal({ open: false, txn: null, qrImage: "" });


  const filteredTransactions = transactions.filter(txn => {
    const matchesSearch = 
      (txn.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (txn.txn_id || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (txn.description || "").toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = filterType === "all" || txn.type === filterType;

    return matchesSearch && matchesType;
  });

  return (
    <AdminLayout>
      <div style={headerContainer}>
        <div>
          <h1 style={pageTitle}>Transactions</h1>
          <p style={pageSubtitle}>Manage and record financial flow</p>
        </div>
        <button 
          onClick={() => {
            const nextShowForm = !showForm;
            setShowForm(nextShowForm);
            if (nextShowForm) {
              initForm();
            }
          }} 
          style={{ ...primaryBtn, background: showForm ? colors.accentRed : colors.accentGreen, color: showForm ? "#fff" : "#000" }}
        >
          {showForm ? "Cancel" : "+ Add Transaction"}
        </button>
      </div>

      {showForm && (
        <div style={{ ...themeCard, marginBottom: spacing.lg }}>
          <h3 style={formTitle}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="5" width="20" height="14" rx="2" ry="2"/>
              <line x1="2" y1="10" x2="22" y2="10"/>
            </svg>
            Record New Transaction
          </h3>
          <form onSubmit={handleSubmit}>
            <div style={formRow}>
              <div style={formGroup}>
                <label style={labelStyle}>Transaction ID <span style={requiredStar}>*</span></label>
                <input
                  name="txn_id"
                  placeholder="E.g., TXN-123456"
                  value={form.txn_id}
                  onChange={handleInputChange}
                  style={inputStyle}
                  required
                />
              </div>

              <div style={formGroup}>
                <label style={labelStyle}>Type <span style={requiredStar}>*</span></label>
                <select
                  name="type"
                  value={form.type}
                  onChange={handleInputChange}
                  style={selectStyle}
                >
                  <option value="credit">Credit (Inflow)</option>
                  <option value="debit">Debit (Outflow)</option>
                </select>
              </div>
            </div>

            <div style={formRow}>
              <div style={formGroup}>
                <label style={labelStyle}>Title <span style={requiredStar}>*</span></label>
                <input
                  name="title"
                  placeholder="E.g., Inflow Contribution / Project Grant"
                  value={form.title}
                  onChange={handleInputChange}
                  style={inputStyle}
                  required
                />
              </div>

              <div style={formGroup}>
                <label style={labelStyle}>Amount (₹) <span style={requiredStar}>*</span></label>
                <input
                  name="amount"
                  type="number"
                  placeholder="E.g., 25000"
                  value={form.amount}
                  onChange={handleInputChange}
                  style={inputStyle}
                  required
                />
              </div>
            </div>

            <div style={formGroup}>
              <label style={labelStyle}>Description</label>
              <textarea
                name="description"
                placeholder="Details about the source or purpose of transaction..."
                value={form.description}
                onChange={handleInputChange}
                rows={3}
                style={{ ...inputStyle, resize: "vertical" }}
              />
            </div>

            <div style={formActions}>
              <button type="submit" disabled={submitting} style={{ ...primaryBtn, opacity: submitting ? 0.7 : 1 }}>
                {submitting ? "Saving..." : "Save Transaction"}
              </button>
            </div>
          </form>
        </div>
      )}

   
      <div style={filterBar}>
        <div style={searchContainer}>
          <svg style={searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder="Search by Title, ID, or Description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={searchField}
          />
        </div>

        <div style={btnGroup}>
          <button 
            onClick={() => setFilterType("all")} 
            style={filterType === "all" ? activeFilterBtn : filterBtn}
          >
            All
          </button>
          <button 
            onClick={() => setFilterType("credit")} 
            style={filterType === "credit" ? activeFilterBtn : filterBtn}
          >
            Credits
          </button>
          <button 
            onClick={() => setFilterType("debit")} 
            style={filterType === "debit" ? activeFilterBtn : filterBtn}
          >
            Debits
          </button>
        </div>
      </div>

      <div style={themeCard}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: spacing.xl }}>
            <Spinner />
          </div>
        ) : filteredTransactions.length === 0 ? (
          <p style={muted}>No transactions found matching your filters.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
              <thead>
                <tr>
                  <th style={tableStyles.header}>Date</th>
                  <th style={tableStyles.header}>ID</th>
                  <th style={tableStyles.header}>Title</th>
                  <th style={tableStyles.header}>Type</th>
                  <th style={tableStyles.header}>QR</th>
                  <th style={{ ...tableStyles.header, textAlign: "right" }}>Amount</th>
                  <th style={{ ...tableStyles.header, width: "80px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map(txn => (
                  <tr key={txn.id} style={tableStyles.row}>
                    <td style={tableStyles.cellMuted}>
                      {new Date(txn.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ ...tableStyles.cell, fontFamily: "monospace", fontSize: "13px" }}>
                      {txn.txn_id}
                    </td>
                    <td style={tableStyles.cell}>
                      <div>
                        <div style={{ fontWeight: 500 }}>{txn.title}</div>
                        {txn.description && (
                          <div style={{ fontSize: "12px", color: colors.textMuted, marginTop: "2px" }}>
                            {txn.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={tableStyles.cell}>
                      <span style={{
                        ...typeBadge,
                        background: txn.type === "credit" ? `${colors.accentGreen}15` : `${colors.accentRed}15`,
                        color: txn.type === "credit" ? colors.accentGreen : colors.accentRed,
                        borderColor: txn.type === "credit" ? `${colors.accentGreen}40` : `${colors.accentRed}40`,
                      }}>
                        {txn.type === "credit" ? "Credit" : "Debit"}
                      </span>
                    </td>
                    <td style={tableStyles.cell}>
                      <button
                        onClick={() => handleShowQR(txn)}
                        title="View QR Code"
                        style={iconActionBtn}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="3" width="7" height="7"/>
                          <rect x="14" y="3" width="7" height="7"/>
                          <rect x="3" y="14" width="7" height="7"/>
                          <rect x="14" y="14" width="7" height="7"/>
                        </svg>
                      </button>
                    </td>
                    <td style={{
                      ...tableStyles.cell,
                      textAlign: "right",
                      color: txn.type === "credit" ? colors.accentGreen : colors.accentRed,
                      fontWeight: 600,
                      fontSize: "15px"
                    }}>
                      {txn.type === "credit" ? "+" : "-"}₹{Number(txn.amount).toLocaleString("en-IN")}
                    </td>
                    <td style={{ ...tableStyles.cell, textAlign: "center" }}>
                      <button
                        onClick={() => handleDeleteClick(txn)}
                        title="Delete Transaction"
                        style={deleteIconBtn}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {qrModal.open && (
        <div style={modalOverlay} onClick={closeQrModal}>
          <div style={modalContent} onClick={e => e.stopPropagation()}>
            <button onClick={closeQrModal} style={closeBtn} aria-label="Close QR modal">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
            {qrModal.qrImage && (
              <img src={qrModal.qrImage} alt="Transaction QR" style={qrImage} />
            )}
            <h4 style={{ margin: "0 0 4px 0", color: colors.textPrimary }}>{qrModal.txn?.title}</h4>
            <p style={{ margin: "0 0 12px 0", fontFamily: "monospace", fontSize: "12px", color: colors.textMuted }}>{qrModal.txn?.txn_id}</p>
            <p style={qrHint}>Scan to verify this transaction in our public ledger</p>
          </div>
        </div>
      )}

    
      {confirmDeleteOpen && (
        <div style={confirmOverlay} onClick={() => setConfirmDeleteOpen(false)}>
          <div style={confirmBox} onClick={(e) => e.stopPropagation()}>
            <h3 style={confirmTitle}>Confirm Delete</h3>
            <p style={confirmMsgStyle}>{deleteMsg}</p>
            <div style={confirmActions}>
              <button style={confirmCancelBtn} onClick={() => setConfirmDeleteOpen(false)}>Cancel</button>
              <button style={confirmPrimaryBtn} onClick={performDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

const headerContainer: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: spacing.xl,
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

const primaryBtn: CSSProperties = {
  ...buttonPrimary,
  padding: "10px 20px",
  fontSize: "13px",
};

const formTitle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: spacing.sm,
  fontSize: "16px",
  fontWeight: 600,
  color: colors.textPrimary,
  marginBottom: spacing.md,
};

const formRow: CSSProperties = {
  display: "flex",
  gap: spacing.md,
  marginBottom: spacing.md,
};

const formGroup: CSSProperties = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
};

const labelStyle: CSSProperties = {
  fontSize: "12px",
  fontWeight: 600,
  color: colors.textSecondary,
  marginBottom: spacing.xs,
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const requiredStar: CSSProperties = {
  color: colors.accentRed,
};

const inputStyle: CSSProperties = {
  ...themeInput,
  boxSizing: "border-box",
};

const selectStyle: CSSProperties = {
  ...themeInput,
  boxSizing: "border-box",
  cursor: "pointer",
};

const formActions: CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  marginTop: spacing.md,
};

const filterBar: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: spacing.md,
  marginBottom: spacing.lg,
  flexWrap: "wrap",
};

const searchContainer: CSSProperties = {
  position: "relative",
  flex: 1,
  minWidth: "280px",
};

const searchField: CSSProperties = {
  ...themeInput,
  paddingLeft: "38px",
  boxSizing: "border-box",
};

const searchIcon: CSSProperties = {
  position: "absolute",
  left: "14px",
  top: "50%",
  transform: "translateY(-50%)",
  color: colors.textMuted,
  pointerEvents: "none",
};

const btnGroup: CSSProperties = {
  display: "flex",
  gap: "6px",
  background: colors.bgSecondary,
  padding: "4px",
  borderRadius: borderRadius.md,
  border: `1px solid ${colors.border}`,
};

const filterBtn: CSSProperties = {
  background: "transparent",
  border: "none",
  color: colors.textSecondary,
  padding: "6px 16px",
  borderRadius: borderRadius.sm,
  cursor: "pointer",
  fontSize: "13px",
  fontWeight: 500,
  transition: "all 0.2s ease",
};

const activeFilterBtn: CSSProperties = {
  ...filterBtn,
  background: colors.bgCard,
  color: colors.textPrimary,
  boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
};

const typeBadge: CSSProperties = {
  padding: "4px 8px",
  borderRadius: borderRadius.sm,
  fontSize: "11px",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  border: "1px solid",
};

const iconActionBtn: CSSProperties = {
  background: colors.bgSecondary,
  border: `1px solid ${colors.border}`,
  borderRadius: borderRadius.sm,
  padding: 6,
  color: colors.textPrimary,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "all 0.2s ease",
};

const deleteIconBtn: CSSProperties = {
  ...iconActionBtn,
  color: colors.accentRed,
  borderColor: `${colors.accentRed}20`,
  background: `${colors.accentRed}08`,
};

const muted: CSSProperties = {
  color: colors.textMuted,
  fontSize: "14px",
  textAlign: "center",
  padding: spacing.xl,
};

const modalOverlay: CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "rgba(0,0,0,0.85)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
  backdropFilter: "blur(4px)",
};

const modalContent: CSSProperties = {
  ...themeCard,
  textAlign: "center",
  maxWidth: 380,
  width: "100%",
  position: "relative",
  padding: spacing.lg,
  paddingTop: spacing.xl,
};

const closeBtn: CSSProperties = {
  position: "absolute",
  right: spacing.sm,
  top: spacing.sm,
  background: "transparent",
  border: "none",
  cursor: "pointer",
  color: colors.textMuted,
  padding: "4px",
  display: "flex",
};

const qrImage: CSSProperties = {
  width: 200,
  height: 200,
  padding: 4,
  background: "#fff",
  borderRadius: borderRadius.md,
  display: "inline-block",
  marginBottom: spacing.md,
  boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
};

const qrHint: CSSProperties = {
  fontSize: "12px",
  color: colors.textMuted,
  margin: 0,
};

const confirmOverlay: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.6)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1100,
};

const confirmBox: CSSProperties = {
  ...themeCard,
  maxWidth: 500,
  width: "100%",
  padding: spacing.lg,
  textAlign: "left",
};

const confirmTitle: CSSProperties = {
  fontSize: "18px",
  fontWeight: 700,
  margin: 0,
  marginBottom: spacing.sm,
};

const confirmMsgStyle: CSSProperties = {
  fontSize: "14px",
  color: colors.textSecondary,
  marginBottom: spacing.md,
  lineHeight: 1.5,
};

const confirmActions: CSSProperties = {
  display: "flex",
  gap: spacing.sm,
  justifyContent: "flex-end",
};

const confirmPrimaryBtn: CSSProperties = {
  background: colors.accentRed,
  color: "#fff",
  border: "none",
  padding: `${spacing.sm} ${spacing.md}`,
  borderRadius: borderRadius.md,
  cursor: "pointer",
  fontWeight: 600,
};

const confirmCancelBtn: CSSProperties = {
  background: "transparent",
  color: colors.textSecondary,
  border: `1px solid ${colors.border}`,
  padding: `${spacing.sm} ${spacing.md}`,
  borderRadius: borderRadius.md,
  cursor: "pointer",
};

export default AdminTransactions;
