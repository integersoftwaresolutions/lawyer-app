import { useState, useEffect } from "react";
import { lawyerApi } from "../../services/lawyer.api";
import { Card, Badge, StatCard, Button, Modal, PageHeader, PageShell, Table } from "../../components/ui";
import { useToast } from "../../hooks/useToast";
import { 
  FiDollarSign, 
  FiCreditCard, 
  FiTrendingUp 
} from "react-icons/fi";

export default function LawyerEarningsPage() {
  const [submitting, setSubmitting] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ open: false, item: null });
  const [summary, setSummary] = useState({});
  const toast = useToast();

  const fetchEarnings = async () => {
    const res = await lawyerApi.getMyEarnings({});
    setSummary(res.summary || {});
    return res.data || [];
  };

  useEffect(() => {
    // Fetch summary on mount
    lawyerApi.getMyEarnings({}).then((res) => {
      setSummary(res.summary || {});
    });
  }, []);

  const handleDelete = async () => {
    if (!deleteModal.item) return;
    try {
      setSubmitting(true);
      await lawyerApi.hideEarningHistory(deleteModal.item._id);
      setDeleteModal({ open: false, item: null });
      fetchEarnings();
    } catch (error) {
      console.error("Failed to delete earning history:", error);
      toast.error(error.response?.data?.message || "Failed to delete history");
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
      SPEND: "danger",
    };
    return <Badge variant={variants[type] || "default"}>{type}</Badge>;
  };

  const columns = [
    {
      key: "createdAt",
      label: "Date",
      render: (value) => formatDate(value),
    },
    {
      key: "type",
      label: "Type",
      render: (value, row) => {
        if (value === "SPEND" && typeof row?.note === "string" && row.note.toLowerCase().includes("verification")) {
          return <Badge variant="danger">VERIFICATION FEE</Badge>;
        }
        return getTypeBadge(value);
      },
    },
    {
      key: "amount",
      label: "Amount",
      render: (value) => (
        <span className={`text-sm font-semibold ${
          value >= 0 ? "text-success" : "text-danger"
        }`}>
          {value >= 0 ? "+" : "-"}${Math.abs(value)}
        </span>
      ),
    },
    {
      key: "note",
      label: "Note",
      render: (value) => value || "-",
    },
    {
      key: "actions",
      label: "Actions",
      render: (_, row) => (
        <Button
          size="sm"
          variant="danger"
          onClick={() => setDeleteModal({ open: true, item: row })}
        >
          Delete
        </Button>
      ),
    },
  ];

  return (
    <PageShell>
      <PageHeader
        icon={FiDollarSign}
        title="Earnings"
        subtitle="Track payouts, balance, and transaction history"
      />

      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
        <StatCard
          icon={FiDollarSign}
          value={`$${summary.totalEarnings || 0}`}
          label="Total Earnings"
        />
        <StatCard
          icon={FiCreditCard}
          value={`$${summary.balance || 0}`}
          label="Current Balance"
        />
        <StatCard
          icon={FiTrendingUp}
          value={`$${summary.totalPayouts || 0}`}
          label="Total Payouts"
        />
      </div>

      <Table
        columns={columns}
        data={fetchEarnings}
        emptyMessage="No transactions yet"
      />

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
    </PageShell>
  );
}
