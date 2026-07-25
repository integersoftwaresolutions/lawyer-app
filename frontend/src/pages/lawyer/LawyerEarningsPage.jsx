import { useCallback, useState } from "react";
import { lawyerApi } from "../../services/lawyer.api";
import {
  Badge,
  StatCard,
  Button,
  Modal,
  PageHeader,
  PageShell,
  DataTable,
  DataList,
  Pagination
} from "../../components/ui";
import { usePaginatedQuery } from "../../hooks/usePaginatedQuery";
import { useToast } from "../../hooks/useToast";
import { FiDollarSign, FiCreditCard, FiTrendingUp } from "react-icons/fi";

export default function LawyerEarningsPage() {
  const [submitting, setSubmitting] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ open: false, item: null });
  const [refreshKey, setRefreshKey] = useState(0);
  const toast = useToast();

  const fetchEarnings = useCallback((params) => lawyerApi.getMyEarnings(params), []);

  const { items, meta, extras, setPage, loading, error, retry } = usePaginatedQuery(fetchEarnings, {
    dependencies: [refreshKey],
    defaultLimit: 20
  });

  const summary = extras.summary || {};

  const handleDelete = async () => {
    if (!deleteModal.item) return;
    try {
      setSubmitting(true);
      await lawyerApi.hideEarningHistory(deleteModal.item._id);
      setDeleteModal({ open: false, item: null });
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete history");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });

  const getTypeBadge = (type) => {
    const variants = { EARNING: "success", PAYOUT: "info", SPEND: "danger" };
    return <Badge variant={variants[type] || "default"}>{type}</Badge>;
  };

  const columns = [
    {
      key: "createdAt",
      label: "Date",
      render: (value) => formatDate(value)
    },
    {
      key: "type",
      label: "Type",
      render: (value, row) => {
        if (
          value === "SPEND" &&
          typeof row?.note === "string" &&
          row.note.toLowerCase().includes("verification")
        ) {
          return <Badge variant="danger">VERIFICATION FEE</Badge>;
        }
        return getTypeBadge(value);
      }
    },
    {
      key: "amount",
      label: "Amount",
      render: (value) => (
        <span className={`text-sm font-semibold ${value >= 0 ? "text-success" : "text-danger"}`}>
          {value >= 0 ? "+" : "-"}${Math.abs(value)}
        </span>
      )
    },
    {
      key: "note",
      label: "Note",
      render: (value) => value || "—"
    },
    {
      key: "actions",
      label: "Actions",
      align: "right",
      render: (_, row) => (
        <Button size="sm" variant="danger" outline onClick={() => setDeleteModal({ open: true, item: row })}>
          Delete
        </Button>
      )
    }
  ];

  return (
    <PageShell>
      <PageHeader
        icon={FiDollarSign}
        title="Earnings"
        subtitle="Track payouts, balance, and transaction history"
      />

      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 mb-1">
        <StatCard icon={FiDollarSign} value={`$${summary.totalEarnings || 0}`} label="Total Earnings" />
        <StatCard icon={FiCreditCard} value={`$${summary.balance || 0}`} label="Current Balance" />
        <StatCard icon={FiTrendingUp} value={`$${summary.totalPayouts || 0}`} label="Total Payouts" />
      </div>

      <DataList pagination={<Pagination meta={meta} onPageChange={setPage} />}>
        <DataTable
          columns={columns}
          data={items}
          keyField="_id"
          loading={loading}
          error={error}
          retry={retry}
          emptyMessage="No transactions yet"
          emptyDescription="Earnings and payouts will show up here."
        />
      </DataList>

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
