import { useState } from "react";
import { adminApi } from "../../services/admin.api";
import { getProfilePictureUrl } from "../../utils/profilePicture";
import { Button, Badge, Modal, Textarea, Select, StateHandler, PageHeader, PageShell } from "../../components/ui";
import { useToast } from "../../hooks/useToast";
import { useStateHandler } from "../../hooks/useStateHandler";
import { 
  FiCheckCircle, 
  FiXCircle, 
  FiClock, 
  FiFile, 
  FiEye,
  FiShield,
  FiUser,
  FiMail,
  FiMapPin,
  FiBriefcase,
  FiDollarSign,
  FiCalendar,
  FiAlertCircle
} from "react-icons/fi";

export default function AdminVerificationPage() {
  const [verifyModal, setVerifyModal] = useState({ open: false, lawyer: null });
  const [documentsModal, setDocumentsModal] = useState({ open: false, lawyer: null, documents: [] });
  const [verifyData, setVerifyData] = useState({ status: "APPROVED", notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const toast = useToast();

  const { loading, error, data, retry } = useStateHandler(
    async () => {
      const res = await adminApi.getPendingLawyers();
      return res.data || [];
    }
  );

  const pendingLawyers = data || [];

  const loadLawyerDocuments = async (lawyerUserId) => {
    try {
      setLoadingDocs(true);
      const res = await adminApi.getLawyerVerificationStatus(lawyerUserId);
      setDocumentsModal({ 
        open: true, 
        lawyer: res.data.profile, 
        documents: res.data.allDocuments || [] 
      });
    } catch (error) {
      console.error("Failed to load documents:", error);
      toast.error(error.response?.data?.message || "Failed to load documents");
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
      retry();
    } catch (error) {
      console.error("Failed to verify:", error);
      toast.error(error.response?.data?.message || "Failed to update verification");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
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

  return (
    <StateHandler loading={loading} error={error} retry={retry}>
      <PageShell>
        <PageHeader
          icon={FiShield}
          title="Pending Verifications"
          subtitle="Review and approve lawyer verification requests. Verify documents before making a decision."
        />

      {pendingLawyers.length === 0 ? (
        <div className="rounded-xl border border-card-border bg-card text-center py-16 px-6">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-success-light text-success flex items-center justify-center">
            <FiCheckCircle className="w-7 h-7" />
          </div>
          <p className="text-lg font-medium text-text-primary mb-2">No pending verifications</p>
          <p className="text-sm text-text-secondary m-0">
            All lawyer verification requests have been processed.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3 m-0 p-0 list-none">
          {pendingLawyers.map((lawyer) => (
            <li
              key={lawyer._id}
              className="rounded-xl border border-card-border bg-card p-4 sm:p-5"
            >
              <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-11 h-11 rounded-xl bg-primary-light text-primary flex items-center justify-center shrink-0">
                      <FiUser className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="text-base font-semibold text-text-primary m-0 truncate">
                          {lawyer.fullName || "N/A"}
                        </h3>
                        <Badge variant="warning" size="sm">Pending</Badge>
                      </div>
                      {lawyer.barCouncilNumber && (
                        <p className="text-sm text-text-secondary m-0">
                          Bar Council: {lawyer.barCouncilNumber}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                    <div className="flex items-center gap-2 text-sm min-w-0">
                      <FiMail className="w-4 h-4 text-text-muted shrink-0" />
                      <span className="text-text-secondary truncate">{lawyer.userId?.email || "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <FiMapPin className="w-4 h-4 text-text-muted shrink-0" />
                      <span className="text-text-secondary">{lawyer.city || "Not specified"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <FiBriefcase className="w-4 h-4 text-text-muted shrink-0" />
                      <span className="text-text-secondary">{lawyer.experienceYears || 0} years</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <FiDollarSign className="w-4 h-4 text-text-muted shrink-0" />
                      <span className="text-text-secondary">${lawyer.hourlyRate || 0}/hr</span>
                    </div>
                  </div>

                  {lawyer.specialization && lawyer.specialization.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {lawyer.specialization.map((spec) => (
                        <Badge key={spec} size="sm" variant="secondary">{spec}</Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-text-muted">
                    <FiCalendar className="w-3.5 h-3.5" />
                    <span>Registered: {formatDate(lawyer.createdAt)}</span>
                    {lawyer.documentCount !== undefined && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>{lawyer.documentCount} document(s) uploaded</span>
                        <span aria-hidden="true">·</span>
                        <span>{lawyer.approvedDocuments || 0} approved</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex flex-row lg:flex-col gap-2 shrink-0 lg:w-40">
                  <Button
                    variant="primary"
                    outline
                    size="sm"
                    icon={FiEye}
                    onClick={() => loadLawyerDocuments(lawyer.userId?._id || lawyer.userId)}
                    loading={loadingDocs}
                    className="flex-1 lg:flex-none"
                  >
                    View Documents
                  </Button>
                  <Button
                    variant="success"
                    size="sm"
                    icon={FiCheckCircle}
                    onClick={() => {
                      setVerifyData({ status: "APPROVED", notes: "" });
                      setVerifyModal({ open: true, lawyer });
                    }}
                    className="flex-1 lg:flex-none"
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
                    className="flex-1 lg:flex-none"
                  >
                    Reject
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Verification Modal */}
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
              { value: "REJECTED", label: "Rejected" },
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

      {/* Documents Modal */}
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
    </StateHandler>
  );
}
