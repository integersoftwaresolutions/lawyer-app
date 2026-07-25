import { useCallback, useState } from "react";
import { adminApi } from "../../services/admin.api";
import { getProfilePictureUrl } from "../../utils/profilePicture";
import {
  Button,
  Badge,
  Modal,
  Textarea,
  Select,
  DataList,
  DataTable,
  PageHeader,
  PageShell,
  Pagination
} from "../../components/ui";
import { useToast } from "../../hooks/useToast";
import { usePaginatedQuery } from "../../hooks/usePaginatedQuery";
import {
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiFile,
  FiEye,
  FiShield,
  FiAlertCircle
} from "react-icons/fi";

export default function AdminVerificationPage() {
  const [verifyModal, setVerifyModal] = useState({ open: false, lawyer: null });
  const [documentsModal, setDocumentsModal] = useState({ open: false, lawyer: null, documents: [] });
  const [verifyData, setVerifyData] = useState({ status: "APPROVED", notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const toast = useToast();

  const fetchPendingLawyers = useCallback((params) => adminApi.getPendingLawyers(params), []);

  const { items, meta, setPage, loading, error, retry } = usePaginatedQuery(fetchPendingLawyers, {
    dependencies: [refreshKey],
    defaultLimit: 20
  });

  const loadLawyerDocuments = async (lawyerUserId) => {
    try {
      setLoadingDocs(true);
      const res = await adminApi.getLawyerVerification(lawyerUserId);
      setDocumentsModal({
        open: true,
        lawyer: res.data.profile,
        documents: res.data.allDocuments || []
      });
    } catch (err) {
      console.error("Failed to load documents:", err);
      toast.error(err.response?.data?.message || "Failed to load documents");
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleVerify = async () => {
    if (!verifyModal.lawyer) return;

    try {
      setSubmitting(true);
      const lawyerUserId = verifyModal.lawyer.userId?._id || verifyModal.lawyer.userId;
      await adminApi.verifyLawyer(lawyerUserId, verifyData);
      toast.success(`Lawyer ${verifyData.status === "APPROVED" ? "approved" : "rejected"} successfully`);
      setVerifyModal({ open: false, lawyer: null });
      setVerifyData({ status: "APPROVED", notes: "" });
      setRefreshKey((k) => k + 1);
    } catch (err) {
      console.error("Failed to verify:", err);
      toast.error(err.response?.data?.message || "Failed to update verification");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  const getDocumentStatusBadge = (status) => {
    const configs = {
      APPROVED: { variant: "success", icon: FiCheckCircle },
      REJECTED: { variant: "danger", icon: FiXCircle },
      PENDING: { variant: "warning", icon: FiClock }
    };
    const config = configs[status] || configs.PENDING;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} size="sm" className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {status}
      </Badge>
    );
  };

  const columns = [
    {
      key: "fullName",
      label: "Name",
      render: (_, lawyer) => (
        <div className="min-w-0">
          <p className="text-sm font-semibold text-text-primary m-0 truncate">
            {lawyer.fullName || "N/A"}
          </p>
          {lawyer.barCouncilNumber && (
            <p className="text-xs text-text-muted m-0 mt-0.5">
              Bar Council: {lawyer.barCouncilNumber}
            </p>
          )}
        </div>
      )
    },
    {
      key: "email",
      label: "Email",
      render: (_, lawyer) => lawyer.userId?.email || "N/A"
    },
    {
      key: "documentCount",
      label: "Docs",
      hideOnMobile: true,
      render: (value, lawyer) =>
        value !== undefined ? `${value} (${lawyer.approvedDocuments || 0} approved)` : "—"
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
      render: (_, lawyer) => (
        <div className="flex items-center justify-end gap-1 flex-wrap">
          <Button
            variant="primary"
            outline
            size="sm"
            icon={FiEye}
            onClick={() => loadLawyerDocuments(lawyer.userId?._id || lawyer.userId)}
            loading={loadingDocs}
          >
            View docs
          </Button>
          <Button
            variant="success"
            size="sm"
            icon={FiCheckCircle}
            onClick={() => {
              setVerifyData({ status: "APPROVED", notes: "" });
              setVerifyModal({ open: true, lawyer });
            }}
          >
            Approve
          </Button>
          <Button
            variant="danger"
            size="sm"
            icon={FiXCircle}
            onClick={() => {
              setVerifyData({ status: "REJECTED", notes: "" });
              setVerifyModal({ open: true, lawyer });
            }}
          >
            Reject
          </Button>
        </div>
      )
    }
  ];

  return (
    <PageShell>
      <PageHeader
        icon={FiShield}
        title="Pending Verifications"
        subtitle="Review and approve lawyer verification requests. Verify documents before making a decision."
      />

      <DataList pagination={<Pagination meta={meta} onPageChange={setPage} />}>
        <DataTable
          columns={columns}
          data={items}
          keyField="_id"
          loading={loading}
          error={error}
          retry={retry}
          emptyMessage="No pending verifications"
          emptyDescription="All lawyer verification requests have been processed."
          emptyIcon={<FiCheckCircle className="w-6 h-6" />}
        />
      </DataList>

      <Modal
        isOpen={verifyModal.open}
        onClose={() => setVerifyModal({ open: false, lawyer: null })}
        title={`${verifyData.status === "APPROVED" ? "Approve" : "Reject"} Verification - ${verifyModal.lawyer?.fullName}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setVerifyModal({ open: false, lawyer: null })}>
              Cancel
            </Button>
            <Button
              variant={verifyData.status === "APPROVED" ? "success" : "danger"}
              onClick={handleVerify}
              loading={submitting}
              className="flex items-center gap-1"
            >
              {verifyData.status === "APPROVED" ? (
                <>
                  <FiCheckCircle className="w-4 h-4" />
                  Approve
                </>
              ) : (
                <>
                  <FiXCircle className="w-4 h-4" />
                  Reject
                </>
              )}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="p-3 bg-warning-light border border-warning rounded-lg">
            <div className="flex items-start gap-2">
              <FiAlertCircle className="w-5 h-5 text-warning mt-0.5 shrink-0" />
              <p className="text-sm text-text-secondary m-0">
                {verifyData.status === "APPROVED"
                  ? "This will approve the lawyer and allow them to receive bookings."
                  : "This will reject the verification. The lawyer will need to resubmit documents."}
              </p>
            </div>
          </div>

          <Select
            label="Verification Status"
            value={verifyData.status}
            onChange={(e) => setVerifyData({ ...verifyData, status: e.target.value })}
            options={[
              { value: "APPROVED", label: "Approved" },
              { value: "REJECTED", label: "Rejected" }
            ]}
          />
          <Textarea
            label="Notes (optional)"
            placeholder="Add notes about this verification decision. These notes will be visible to the lawyer."
            value={verifyData.notes}
            onChange={(e) => setVerifyData({ ...verifyData, notes: e.target.value })}
            rows={4}
          />
        </div>
      </Modal>

      <Modal
        isOpen={documentsModal.open}
        onClose={() => setDocumentsModal({ open: false, lawyer: null, documents: [] })}
        title={`Verification Documents - ${documentsModal.lawyer?.fullName}`}
        size="large"
      >
        {documentsModal.documents.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-surface text-text-muted flex items-center justify-center">
              <FiFile className="w-6 h-6" />
            </div>
            <p className="text-text-secondary m-0">No documents uploaded yet</p>
          </div>
        ) : (
          <ul className="space-y-3 m-0 p-0 list-none">
            {documentsModal.documents.map((doc) => (
              <li
                key={doc._id}
                className="rounded-xl border border-card-border bg-surface p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-primary-light text-primary flex items-center justify-center shrink-0">
                      <FiFile className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h4 className="text-sm font-semibold text-text-primary m-0">
                          {doc.documentType.replace(/_/g, " ")}
                        </h4>
                        {getDocumentStatusBadge(doc.status)}
                      </div>
                      <p className="text-xs text-text-muted m-0 mb-1">
                        Uploaded: {formatDate(doc.createdAt)}
                      </p>
                      {doc.adminNotes && (
                        <p className="text-sm text-text-secondary m-0">
                          <strong className="text-text-primary">Admin Note:</strong> {doc.adminNotes}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="primary"
                    outline
                    size="sm"
                    icon={FiEye}
                    onClick={() => {
                      const url = getProfilePictureUrl(doc.documentUrl || doc.mediaId?.url);
                      if (url) window.open(url, "_blank");
                    }}
                  >
                    View
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Modal>
    </PageShell>
  );
}
