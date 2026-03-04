import { useState } from "react";
import { adminApi } from "../../services/admin.api";
import { Card, Button, Badge, Modal, Textarea, Select, Table } from "../../components/ui";

export default function AdminLawyersPage() {
  const [filter, setFilter] = useState("");
  const [verifyModal, setVerifyModal] = useState({ open: false, lawyer: null });
  const [verifyData, setVerifyData] = useState({ status: "APPROVED", notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchLawyers = async () => {
    const params = filter ? { status: filter } : {};
    const res = await adminApi.getLawyers(params);
    return res.data || [];
  };

  const handleVerify = async () => {
    if (!verifyModal.lawyer) return;
    
    try {
      setSubmitting(true);
      const lawyerUserId = verifyModal.lawyer.userId?._id || verifyModal.lawyer.userId;
      await adminApi.verifyLawyer(lawyerUserId, verifyData);
      setVerifyModal({ open: false, lawyer: null });
      setVerifyData({ status: "APPROVED", notes: "" });
      setRefreshKey((k) => k + 1);
    } catch (error) {
      console.error("Failed to verify:", error);
      alert(error.response?.data?.message || "Failed to update verification");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      PENDING: "warning",
      APPROVED: "success",
      REJECTED: "danger",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const filterOptions = [
    { value: "", label: "All" },
    { value: "PENDING", label: "Pending" },
    { value: "APPROVED", label: "Approved" },
    { value: "REJECTED", label: "Rejected" },
  ];

  const columns = [
    {
      key: "fullName",
      label: "Name",
    },
    {
      key: "email",
      label: "Email",
      render: (_, row) => row.userId?.email || "N/A",
    },
    {
      key: "city",
      label: "City",
      render: (value) => value || "-",
    },
    {
      key: "experienceYears",
      label: "Experience",
      render: (value) => `${value || 0} yrs`,
    },
    {
      key: "hourlyRate",
      label: "Rate",
      render: (value) => `$${value || 0}/hr`,
    },
    {
      key: "rating",
      label: "Rating",
      render: (_, row) => `${row.ratingAvg?.toFixed(1) || "0.0"} (${row.ratingCount || 0})`,
    },
    {
      key: "verificationStatus",
      label: "Status",
      render: (value) => getStatusBadge(value),
    },
    {
      key: "createdAt",
      label: "Joined",
      render: (value) => formatDate(value),
    },
    {
      key: "actions",
      label: "Actions",
      render: (_, row) => (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            setVerifyData({ status: row.verificationStatus, notes: row.verificationNotes || "" });
            setVerifyModal({ open: true, lawyer: row });
          }}
        >
          Update Status
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Card>
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-bold text-text-primary m-0">
            All Lawyers
          </h2>
          <div className="flex gap-2">
            {filterOptions.map((opt) => (
              <Button
                key={opt.value}
                variant={filter === opt.value ? "primary" : "secondary"}
                size="sm"
                onClick={() => setFilter(opt.value)}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </div>

        <Table
          columns={columns}
          data={fetchLawyers}
          dependencies={[filter, refreshKey]}
          emptyMessage="No lawyers found"
        />
      </Card>

      <Modal
        isOpen={verifyModal.open}
        onClose={() => setVerifyModal({ open: false, lawyer: null })}
        title={`Update Verification - ${verifyModal.lawyer?.fullName}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setVerifyModal({ open: false, lawyer: null })}>
              Cancel
            </Button>
            <Button onClick={handleVerify} loading={submitting}>
              Update Status
            </Button>
          </>
        }
      >
        <Select
          label="Verification Status"
          value={verifyData.status}
          onChange={(e) => setVerifyData({ ...verifyData, status: e.target.value })}
          options={[
            { value: "PENDING", label: "Pending" },
            { value: "APPROVED", label: "Approved" },
            { value: "REJECTED", label: "Rejected" },
          ]}
        />
        <Textarea
          label="Admin Notes"
          placeholder="Add notes about this verification decision..."
          value={verifyData.notes}
          onChange={(e) => setVerifyData({ ...verifyData, notes: e.target.value })}
        />
      </Modal>
    </div>
  );
}
