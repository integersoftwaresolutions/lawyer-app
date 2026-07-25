import { useCallback, useState } from "react";
import { FiBriefcase } from "react-icons/fi";
import { adminApi } from "../../services/admin.api";
import {
  Badge,
  Button,
  DataList,
  DataTable,
  Modal,
  PageFilters,
  PageHeader,
  PageShell,
  PageTabFilters,
  Pagination,
  Select,
  Textarea
} from "../../components/ui";
import { usePaginatedQuery } from "../../hooks/usePaginatedQuery";
import { useToast } from "../../hooks/useToast";

export default function AdminLawyersPage() {
  const [filter, setFilter] = useState("");
  const [verifyModal, setVerifyModal] = useState({ open: false, lawyer: null });
  const [verifyData, setVerifyData] = useState({ status: "APPROVED", notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const toast = useToast();

  const fetchLawyers = useCallback(
    (params) => adminApi.getLawyers({ ...params, ...(filter ? { status: filter } : {}) }),
    [filter]
  );

  const { items, meta, setPage, loading, error, retry } = usePaginatedQuery(fetchLawyers, {
    dependencies: [filter, refreshKey],
    defaultLimit: 20
  });

  const handleVerify = async () => {
    if (!verifyModal.lawyer) return;
    try {
      setSubmitting(true);
      const lawyerUserId = verifyModal.lawyer.userId?._id || verifyModal.lawyer.userId;
      await adminApi.verifyLawyer(lawyerUserId, verifyData);
      setVerifyModal({ open: false, lawyer: null });
      setVerifyData({ status: "APPROVED", notes: "" });
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update verification");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = { PENDING: "warning", APPROVED: "success", REJECTED: "danger" };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });

  const filterOptions = [
    { value: "", label: "All" },
    { value: "PENDING", label: "Pending" },
    { value: "APPROVED", label: "Approved" },
    { value: "REJECTED", label: "Rejected" }
  ];

  const columns = [
    { key: "fullName", label: "Name" },
    {
      key: "email",
      label: "Email",
      render: (_, row) => row.userId?.email || "N/A"
    },
    {
      key: "city",
      label: "City",
      hideOnMobile: true,
      render: (value) => value || "—"
    },
    {
      key: "experienceYears",
      label: "Experience",
      hideOnMobile: true,
      render: (value) => `${value || 0} yrs`
    },
    {
      key: "hourlyRate",
      label: "Rate",
      render: (value) => `$${value || 0}/hr`
    },
    {
      key: "rating",
      label: "Rating",
      hideOnMobile: true,
      render: (_, row) => `${row.ratingAvg?.toFixed(1) || "0.0"} (${row.ratingCount || 0})`
    },
    {
      key: "verificationStatus",
      label: "Status",
      render: (value) => getStatusBadge(value)
    },
    {
      key: "createdAt",
      label: "Joined",
      hideOnMobile: true,
      render: (value) => formatDate(value)
    },
    {
      key: "actions",
      label: "Actions",
      align: "right",
      render: (_, row) => (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            setVerifyData({ status: row.verificationStatus, notes: row.verificationNotes || "" });
            setVerifyModal({ open: true, lawyer: row });
          }}
        >
          Update
        </Button>
      )
    }
  ];

  return (
    <PageShell>
      <PageHeader
        icon={FiBriefcase}
        title="All Lawyers"
        subtitle="Manage lawyer profiles and verification status"
      />
      <DataList
        filters={
          <PageFilters>
            <PageTabFilters options={filterOptions} value={filter} onChange={setFilter} />
          </PageFilters>
        }
        pagination={<Pagination meta={meta} onPageChange={setPage} />}
      >
        <DataTable
          columns={columns}
          data={items}
          keyField="_id"
          loading={loading}
          error={error}
          retry={retry}
          emptyMessage="No lawyers found"
          emptyDescription="Try a different verification filter."
        />
      </DataList>

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
            { value: "REJECTED", label: "Rejected" }
          ]}
        />
        <Textarea
          label="Admin Notes"
          placeholder="Add notes about this verification decision..."
          value={verifyData.notes}
          onChange={(e) => setVerifyData({ ...verifyData, notes: e.target.value })}
        />
      </Modal>
    </PageShell>
  );
}
