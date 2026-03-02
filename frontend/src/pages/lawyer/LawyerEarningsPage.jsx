import { useState, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import { lawyerApi } from "../../services/lawyer.api";
import { Card, Badge, StatCard, Button, Modal } from "../../components/ui";

export default function LawyerEarningsPage() {
  const { colors } = useTheme();
  const [earnings, setEarnings] = useState({ items: [], summary: {} });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ open: false, item: null });

  useEffect(() => {
    loadEarnings();
  }, []);

  const loadEarnings = async () => {
    try {
      const res = await lawyerApi.getMyEarnings({});
      setEarnings({
        items: res.data || [],
        summary: res.summary || {},
      });
    } catch (error) {
      console.error("Failed to load earnings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.item) return;
    try {
      setSubmitting(true);
      await lawyerApi.hideEarningHistory(deleteModal.item._id);
      setDeleteModal({ open: false, item: null });
      loadEarnings();
    } catch (error) {
      console.error("Failed to delete earning history:", error);
      alert(error.response?.data?.message || "Failed to delete history");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getTypeBadge = (type) => {
    const variants = {
      EARNING: "success",
      PAYOUT: "info",
    };
    return <Badge variant={variants[type] || "default"}>{type}</Badge>;
  };

  if (loading) {
    return <div style={{ padding: "24px", color: colors.text.secondary }}>Loading...</div>;
  }

  const tableStyles = {
    width: "100%",
    borderCollapse: "collapse",
  };

  const thStyles = {
    textAlign: "left",
    padding: "12px",
    borderBottom: `1px solid ${colors.border}`,
    color: colors.text.secondary,
    fontSize: "13px",
    fontWeight: "600",
  };

  const tdStyles = {
    padding: "12px",
    borderBottom: `1px solid ${colors.border}`,
    color: colors.text.primary,
    fontSize: "14px",
  };

  return (
    <div>
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
        gap: "16px", 
        marginBottom: "24px" 
      }}>
        <StatCard
          icon="💰"
          value={`$${earnings.summary.totalEarnings || 0}`}
          label="Total Earnings"
        />
        <StatCard
          icon="💳"
          value={`$${earnings.summary.balance || 0}`}
          label="Current Balance"
        />
        <StatCard
          icon="📤"
          value={`$${earnings.summary.totalPayouts || 0}`}
          label="Total Payouts"
        />
      </div>

      <Card title="Transaction History">
        {earnings.items.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: colors.text.secondary }}>
            <p>No transactions yet</p>
          </div>
        ) : (
          <table style={tableStyles}>
            <thead>
              <tr>
                <th style={thStyles}>Date</th>
                <th style={thStyles}>Type</th>
                <th style={thStyles}>Amount</th>
                <th style={thStyles}>Note</th>
                <th style={thStyles}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {earnings.items.map((item) => (
                <tr key={item._id}>
                  <td style={tdStyles}>{formatDate(item.createdAt)}</td>
                  <td style={tdStyles}>{getTypeBadge(item.type)}</td>
                  <td style={{
                    ...tdStyles,
                    color: item.amount >= 0 ? "#28a745" : "#dc3545",
                    fontWeight: "600",
                  }}>
                    {item.amount >= 0 ? "+" : ""}${Math.abs(item.amount)}
                  </td>
                  <td style={tdStyles}>{item.note || "-"}</td>
                  <td style={tdStyles}>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => setDeleteModal({ open: true, item })}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, item: null })}
        title="Delete History"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteModal({ open: false, item: null })}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} loading={submitting}>
              Delete
            </Button>
          </>
        }
      >
        <p style={{ color: colors.text.secondary, marginTop: 0 }}>
          This will remove the item from your history. It will not change your wallet balance.
        </p>
      </Modal>
    </div>
  );
}
