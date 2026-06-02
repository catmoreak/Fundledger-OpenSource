import { useEffect, useState, useCallback, type CSSProperties } from "react";
import AdminLayout from "../../Layouts/AdminLayout";
import { supabase } from "../../../supabase";
import { Spinner } from "../../components/Spinner";
import { useToast } from "../../context/ToastContext";
import { colors, spacing, borderRadius, cardStyle as themeCard,tableStyles } from "../../styles/theme";


interface GrantRequest {
  id: string | number;
  user_id: string;
  title: string;
  description: string;
  amount: number | string;
  phone: string | null;
  email: string;
  status: "pending" | "approved" | "rejected" | string;
  created_at: string;
}

function AdminGrants(): JSX.Element {
  const [grants, setGrants] = useState<GrantRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [processingId, setProcessingId] = useState<string | number | null>(null);

  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "approved" | "rejected">("all");

  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    grant: GrantRequest | null;
    action: "approve" | "reject" | null;
    message: string;
  }>({ open: false, grant: null, action: null, message: "" });

  const { addToast } = useToast();

  const fetchGrants = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      const { data, error } = await supabase
        .from("grant_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setGrants((data || []) as GrantRequest[]);
    } catch {
      addToast("Failed to load grant requests", "error");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchGrants(false);
  }, [fetchGrants]);

  const handleActionClick = (grant: GrantRequest, action: "approve" | "reject") => {
    const message = action === "approve"
      ? `Are you sure you want to approve this grant request? This will automatically record a debit transaction of ₹${Number(grant.amount).toLocaleString()} for this grant in the public ledger.`
      : `Are you sure you want to reject this grant request?`;

    setConfirmModal({
      open: true,
      grant,
      action,
      message
    });
  };

  const executeAction = async () => {
    const { grant, action } = confirmModal;
    if (!grant || !action) return;

    setConfirmModal({ open: false, grant: null, action: null, message: "" });
    setProcessingId(grant.id);

    try {
      if (action === "approve") {
       
        const { error: updateError } = await supabase
          .from("grant_requests")
          .update({ status: "approved" })
          .eq("id", grant.id);

        if (updateError) throw updateError;

        
        const txnId = `TXN-GRANT-${grant.id}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        const { error: txnError } = await supabase
          .from("transactions")
          .insert([
            {
              txn_id: txnId,
              title: `Disbursement: ${grant.title}`,
              description: `Approved grant request for ${grant.email}`,
              amount: Number(grant.amount),
              type: "debit"
            }
          ]);

        if (txnError) {
          addToast("Grant approved, but failed to record debit transaction in ledger", "error");
        } else {
          addToast("Grant approved and debit transaction recorded successfully!", "success");
        }
      } else {
     
        const { error: updateError } = await supabase
          .from("grant_requests")
          .update({ status: "rejected" })
          .eq("id", grant.id);

        if (updateError) throw updateError;

        addToast("Grant request rejected", "success");
      }

      fetchGrants();
    } catch {
      addToast(`Failed to process request`, "error");
    } finally {
      setProcessingId(null);
    }
  };

  const filteredGrants = grants.filter(g => {
    return filterStatus === "all" || g.status === filterStatus;
  });

  return (
    <AdminLayout>
      <div style={headerContainer}>
        <div>
          <h1 style={pageTitle}>Grant Requests</h1>
          <p style={pageSubtitle}>Review and process funding requests from users</p>
        </div>
      </div>

   
      <div style={filterBar}>
        <div style={btnGroup}>
          <button
            onClick={() => setFilterStatus("all")}
            style={filterStatus === "all" ? activeFilterBtn : filterBtn}
          >
            All
          </button>
          <button
            onClick={() => setFilterStatus("pending")}
            style={filterStatus === "pending" ? activeFilterBtn : filterBtn}
          >
            Pending
          </button>
          <button
            onClick={() => setFilterStatus("approved")}
            style={filterStatus === "approved" ? activeFilterBtn : filterBtn}
          >
            Approved
          </button>
          <button
            onClick={() => setFilterStatus("rejected")}
            style={filterStatus === "rejected" ? activeFilterBtn : filterBtn}
          >
            Rejected
          </button>
        </div>
      </div>

      <div style={themeCard}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: spacing.xl }}>
            <Spinner />
          </div>
        ) : filteredGrants.length === 0 ? (
          <p style={muted}>No grant requests found.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
              <thead>
                <tr>
                  <th style={tableStyles.header}>Date</th>
                  <th style={tableStyles.header}>Applicant Details</th>
                  <th style={tableStyles.header}>Grant Project</th>
                  <th style={tableStyles.header}>Status</th>
                  <th style={{ ...tableStyles.header, textAlign: "right" }}>Amount</th>
                  <th style={{ ...tableStyles.header, textAlign: "center", width: "180px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredGrants.map(grant => (
                  <tr key={grant.id} style={tableStyles.row}>
                    <td style={tableStyles.cellMuted}>
                      {new Date(grant.created_at).toLocaleDateString()}
                    </td>
                    <td style={tableStyles.cell}>
                      <div>
                        <div style={{ fontWeight: 500 }}>{grant.email}</div>
                        {grant.phone && (
                          <div style={{ fontSize: "12px", color: colors.textMuted, marginTop: "2px" }}>
                            {grant.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={tableStyles.cell}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{grant.title}</div>
                        <div style={{ fontSize: "13px", color: colors.textSecondary, marginTop: "4px", maxWidth: "400px", lineHeight: "1.4" }}>
                          {grant.description}
                        </div>
                      </div>
                    </td>
                    <td style={tableStyles.cell}>
                      <span style={{
                        ...statusBadge,
                        background: grant.status === "approved" ? `${colors.accentGreen}15` : grant.status === "rejected" ? `${colors.accentRed}15` : `${colors.accentYellow}15`,
                        color: grant.status === "approved" ? colors.accentGreen : grant.status === "rejected" ? colors.accentRed : colors.accentYellow,
                        borderColor: grant.status === "approved" ? `${colors.accentGreen}40` : grant.status === "rejected" ? `${colors.accentRed}40` : `${colors.accentYellow}40`,
                      }}>
                        {grant.status}
                      </span>
                    </td>
                    <td style={{
                      ...tableStyles.cell,
                      textAlign: "right",
                      fontWeight: 600,
                      fontSize: "15px"
                    }}>
                      ₹{Number(grant.amount).toLocaleString("en-IN")}
                    </td>
                    <td style={{ ...tableStyles.cell, textAlign: "center" }}>
                      {grant.status === "pending" ? (
                        processingId === grant.id ? (
                          <span style={{ fontSize: "13px", color: colors.textMuted }}>Processing...</span>
                        ) : (
                          <div style={actionsContainer}>
                            <button
                              onClick={() => handleActionClick(grant, "approve")}
                              style={approveBtn}
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleActionClick(grant, "reject")}
                              style={rejectBtn}
                            >
                              Reject
                            </button>
                          </div>
                        )
                      ) : (
                        <span style={{ fontSize: "13px", color: colors.textMuted }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

     
      {confirmModal.open && (
        <div style={modalOverlay} onClick={() => setConfirmModal({ open: false, grant: null, action: null, message: "" })}>
          <div style={modalContent} onClick={e => e.stopPropagation()}>
            <h3 style={confirmTitle}>
              {confirmModal.action === "approve" ? "Approve Grant Request" : "Reject Grant Request"}
            </h3>
            <p style={confirmMsgStyle}>{confirmModal.message}</p>
            <div style={confirmActions}>
              <button
                style={cancelBtn}
                onClick={() => setConfirmModal({ open: false, grant: null, action: null, message: "" })}
              >
                Cancel
              </button>
              <button
                style={confirmModal.action === "approve" ? confirmApproveBtn : confirmRejectBtn}
                onClick={executeAction}
              >
                {confirmModal.action === "approve" ? "Confirm Approve" : "Confirm Reject"}
              </button>
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

const filterBar: CSSProperties = {
  display: "flex",
  marginBottom: spacing.lg,
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

const statusBadge: CSSProperties = {
  padding: "4px 8px",
  borderRadius: borderRadius.sm,
  fontSize: "11px",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  border: "1px solid",
  display: "inline-block",
};

const actionsContainer: CSSProperties = {
  display: "flex",
  gap: "8px",
  justifyContent: "center",
};

const approveBtn: CSSProperties = {
  background: colors.accentGreen,
  color: "#000",
  border: "none",
  borderRadius: borderRadius.sm,
  padding: "6px 12px",
  fontWeight: 600,
  fontSize: "12px",
  cursor: "pointer",
  transition: "all 0.2s ease",
};

const rejectBtn: CSSProperties = {
  background: `${colors.accentRed}15`,
  color: colors.accentRed,
  border: `1px solid ${colors.accentRed}30`,
  borderRadius: borderRadius.sm,
  padding: "5px 12px",
  fontWeight: 600,
  fontSize: "12px",
  cursor: "pointer",
  transition: "all 0.2s ease",
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
  background: "rgba(0,0,0,0.75)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1100,
  backdropFilter: "blur(4px)",
};

const modalContent: CSSProperties = {
  ...themeCard,
  maxWidth: 480,
  width: "100%",
  padding: spacing.lg,
  textAlign: "left",
};

const confirmTitle: CSSProperties = {
  fontSize: "18px",
  fontWeight: 700,
  margin: 0,
  marginBottom: spacing.sm,
  color: colors.textPrimary,
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

const confirmApproveBtn: CSSProperties = {
  background: colors.accentGreen,
  color: "#000",
  border: "none",
  padding: `${spacing.sm} ${spacing.md}`,
  borderRadius: borderRadius.md,
  cursor: "pointer",
  fontWeight: 600,
};

const confirmRejectBtn: CSSProperties = {
  background: colors.accentRed,
  color: "#fff",
  border: "none",
  padding: `${spacing.sm} ${spacing.md}`,
  borderRadius: borderRadius.md,
  cursor: "pointer",
  fontWeight: 600,
};

const cancelBtn: CSSProperties = {
  background: "transparent",
  color: colors.textSecondary,
  border: `1px solid ${colors.border}`,
  padding: `${spacing.sm} ${spacing.md}`,
  borderRadius: borderRadius.md,
  cursor: "pointer",
};

export default AdminGrants;
