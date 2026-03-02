import { useState, useEffect } from "react";
import { lawyerApi } from "../../services/lawyer.api";
import { Card, Badge, StatCard, Button, Modal } from "../../components/ui";

export default function LawyerEarningsPage() {
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
    return <div className="p-6 text-text-secondary">Loading...</div>;
  }

  return (
    <div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 mb-6">
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
          <div className="text-center py-10 text-text-secondary">
            <p>No transactions yet</p>
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left p-3 border-b border-border text-text-secondary text-xs font-semibold">Date</th>
                <th className="text-left p-3 border-b border-border text-text-secondary text-xs font-semibold">Type</th>
                <th className="text-left p-3 border-b border-border text-text-secondary text-xs font-semibold">Amount</th>
                <th className="text-left p-3 border-b border-border text-text-secondary text-xs font-semibold">Note</th>
                <th className="text-left p-3 border-b border-border text-text-secondary text-xs font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {earnings.items.map((item) => (
                <tr key={item._id}>
                  <td className="p-3 border-b border-border text-text-primary text-sm">{formatDate(item.createdAt)}</td>
                  <td className="p-3 border-b border-border text-text-primary text-sm">{getTypeBadge(item.type)}</td>
                  <td className={`p-3 border-b border-border text-sm font-semibold ${
                    item.amount >= 0 ? "text-success" : "text-danger"
                  }`}>
                    {item.amount >= 0 ? "+" : ""}${Math.abs(item.amount)}
                  </td>
                  <td className="p-3 border-b border-border text-text-primary text-sm">{item.note || "-"}</td>
                  <td className="p-3 border-b border-border">
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
        <p className="text-text-secondary mt-0">
          This will remove the item from your history. It will not change your wallet balance.
        </p>
      </Modal>
    </div>
  );
}
