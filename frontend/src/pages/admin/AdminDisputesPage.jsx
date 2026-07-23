import { useState } from "react";
import { adminApi } from "../../services/admin.api";
import {
  Badge,
  Button,
  Modal,
  PageHeader,
  PageShell,
  PageTabFilters,
  Select,
  Table,
  Textarea
} from "../../components/ui";
import { useToast } from "../../hooks/useToast";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiXCircle,
  FiDollarSign,
  FiUser
} from "react-icons/fi";

const DISPUTE_REASON_LABELS = {
  NO_SHOW: "No Show",
  POOR_SERVICE: "Poor Service",
  BILLING_ISSUE: "Billing Issue",
  TECHNICAL_ISSUE: "Technical Issue",
  OTHER: "Other"
};

const DISPUTE_RESOLUTION_LABELS = {
  REFUND_CLIENT_FULL: "Full Refund to Client",
  REFUND_CLIENT_PARTIAL: "Partial Refund to Client",
  NO_ACTION: "No Action",
  WARNING_LAWYER: "Warning to Lawyer",
  DISMISSED: "Dismissed"
};

export default function AdminDisputesPage() {
  const [filter, setFilter] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [resolveModal, setResolveModal] = useState({ open: false, dispute: null });
  const [resolveData, setResolveData] = useState({ resolution: "NO_ACTION", resolutionNote: "", refundAmount: 0 });
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  const fetchDisputes = async () => {
    const params = filter ? { status: filter } : {};
    const res = await adminApi.getDisputes(params);
    return res.data || [];
  };

  const handleOpenResolve = (dispute) => {
    setResolveModal({ open: true, dispute });
    setResolveData({
      resolution: "NO_ACTION",
      resolutionNote: "",
      refundAmount: dispute.bookingId?.amount || 0
    });
  };

  const handleMarkUnderReview = async (dispute) => {
    try {
      await adminApi.updateDisputeStatus(dispute._id, { status: "UNDER_REVIEW" });
      toast.success("Dispute marked as Under Review");
      setRefreshKey((k) => k + 1);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update status");
    }
  };

  const handleResolveSubmit = async () => {
    if (!resolveModal.dispute) return;

    const { resolution, resolutionNote, refundAmount } = resolveData;
    const needsRefund = ["REFUND_CLIENT_FULL", "REFUND_CLIENT_PARTIAL"].includes(resolution);

    if (needsRefund && (!refundAmount || refundAmount <= 0)) {
      toast.error("Refund amount is required for refund resolutions");
      return;
    }

    try {
      setSubmitting(true);
      await adminApi.resolveDispute(resolveModal.dispute._id, {
        resolution,
        resolutionNote,
        refundAmount: needsRefund ? Number(refundAmount) : 0
      });
      toast.success("Dispute resolved successfully");
      setResolveModal({ open: false, dispute: null });
      setRefreshKey((k) => k + 1);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to resolve dispute");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      OPEN: "warning",
      UNDER_REVIEW: "info",
      RESOLVED: "success"
    };
    return <Badge variant={variants[status] || "default"}>{status?.replace(/_/g, " ")}</Badge>;
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const filterOptions = [
    { value: "", label: "All" },
    { value: "OPEN", label: "Open" },
    { value: "UNDER_REVIEW", label: "Under Review" },
    { value: "RESOLVED", label: "Resolved" }
  ];

  const columns = [
    {
      key: "createdAt",
      label: "Date",
      render: (value) => formatDate(value)
    },
    {
      key: "raisedBy",
      label: "Raised By",
      render: (_, row) => (
        <span className="text-text-primary">
          {row.raisedBy?.email || row.raisedBy?.fullName || "N/A"}
        </span>
      )
    },
    {
      key: "raisedAgainst",
      label: "Against",
      render: (_, row) => (
        <span className="text-text-primary">
          {row.raisedAgainst?.email || row.raisedAgainst?.fullName || "N/A"}
        </span>
      )
    },
    {
      key: "reason",
      label: "Reason",
      render: (value) => DISPUTE_REASON_LABELS[value] || value
    },
    {
      key: "bookingId",
      label: "Booking",
      render: (_, row) => {
        const b = row.bookingId;
        if (!b) return "N/A";
        return (
          <span>
            ${b.amount || 0} · {formatDate(b.startAt)}
          </span>
        );
      }
    },
    {
      key: "status",
      label: "Status",
      render: (value) => getStatusBadge(value)
    },
    {
      key: "actions",
      label: "Actions",
      render: (_, row) =>
        row.status === "RESOLVED" ? (
          <span className="text-text-muted text-sm">{row.resolution?.replace(/_/g, " ")}</span>
        ) : (
          <div className="flex gap-2">
            {row.status === "OPEN" && (
              <Button size="sm" variant="secondary" onClick={() => handleMarkUnderReview(row)}>
                Mark Under Review
              </Button>
            )}
            <Button size="sm" variant="primary" onClick={() => handleOpenResolve(row)}>
              Resolve
            </Button>
          </div>
        )
    }
  ];

  return (
    <PageShell>
      <PageHeader
        icon={FiAlertCircle}
        title="Disputes"
        subtitle="Review and resolve client–lawyer disputes"
      />
      <PageTabFilters options={filterOptions} value={filter} onChange={setFilter} />
      <Table
        columns={columns}
        data={fetchDisputes}
        dependencies={[filter, refreshKey]}
        emptyMessage="No disputes found"
      />

      <Modal
        isOpen={resolveModal.open}
        onClose={() => setResolveModal({ open: false, dispute: null })}
        title="Resolve Dispute"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setResolveModal({ open: false, dispute: null })}
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={handleResolveSubmit} loading={submitting}>
              Resolve
            </Button>
          </>
        }
      >
        {resolveModal.dispute && (
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-surface/50 p-3 mb-2">
              <p className="text-text-primary text-sm m-0">
                <strong>Raised by:</strong> {resolveModal.dispute.raisedBy?.email || "N/A"}
              </p>
              <p className="text-text-primary text-sm m-0 mt-1">
                <strong>Against:</strong> {resolveModal.dispute.raisedAgainst?.email || "N/A"}
              </p>
            </div>
            <p className="text-text-secondary text-sm m-0">
              <strong>Reason:</strong> {DISPUTE_REASON_LABELS[resolveModal.dispute.reason] || resolveModal.dispute.reason}
            </p>
            {resolveModal.dispute.description && (
              <p className="text-text-secondary text-sm m-0">
                <strong>Description:</strong> {resolveModal.dispute.description}
              </p>
            )}
            <p className="text-text-secondary text-sm m-0">
              <strong>Booking amount:</strong> ${resolveModal.dispute.bookingId?.amount || 0}
            </p>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Resolution</label>
              <Select
                value={resolveData.resolution}
                onChange={(e) => setResolveData((d) => ({ ...d, resolution: e.target.value }))}
                className="w-full"
                options={Object.entries(DISPUTE_RESOLUTION_LABELS).map(([value, label]) => ({ value, label }))}
                placeholder="Select resolution"
              />
            </div>

            {["REFUND_CLIENT_FULL", "REFUND_CLIENT_PARTIAL"].includes(resolveData.resolution) && (
              <div>
                {resolveModal.dispute.raisedAgainst?.email && (
                  <p className="text-warning text-xs mb-2">
                    Note: Refunding credits the client. Ensure this aligns with who raised the dispute and your investigation.
                  </p>
                )}
                <label className="block text-sm font-medium text-text-primary mb-1">Refund Amount</label>
                <input
                  type="number"
                  min="1"
                  max={resolveModal.dispute.bookingId?.amount || 0}
                  value={resolveData.refundAmount}
                  onChange={(e) =>
                    setResolveData((d) => ({ ...d, refundAmount: Number(e.target.value) || 0 }))
                  }
                  className="w-full px-3 py-2 rounded border border-border bg-card text-text-primary"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Resolution Note (optional)</label>
              <Textarea
                value={resolveData.resolutionNote}
                onChange={(e) => setResolveData((d) => ({ ...d, resolutionNote: e.target.value }))}
                rows={3}
                placeholder="Add notes for the resolution..."
                className="w-full"
              />
            </div>
          </div>
        )}
      </Modal>
    </PageShell>
  );
}
