import { useState } from "react";
import { adminApi } from "../../services/admin.api";
import { getProfilePictureUrl } from "../../utils/profilePicture";
import { Card, Button, Badge, Modal, Textarea, Select, StateHandler } from "../../components/ui";
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
      <div>
      <Card className="mb-6">
        <div className="mb-5">
          <h2 className="text-2xl font-bold text-text-primary mb-2 flex items-center gap-2">
            <FiShield className="w-6 h-6 text-primary" />
            Pending Verifications
          </h2>
          <p className="text-text-secondary m-0">
            Review and approve lawyer verification requests. Verify documents before making a decision.
          </p>
        </div>

        {pendingLawyers.length === 0 ? (
          <div className="text-center py-16 text-text-secondary">
            <FiCheckCircle className="w-16 h-16 mx-auto mb-4 text-success opacity-50" />
            <p className="text-lg font-medium mb-2">No pending verifications</p>
            <p className="text-sm">
              All lawyer verification requests have been processed.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {pendingLawyers.map((lawyer) => (
              <Card key={lawyer._id} className="border-l-4 border-warning">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <FiUser className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold text-text-primary m-0">
                            {lawyer.fullName || "N/A"}
                          </h3>
                          <Badge variant="warning" size="sm">Pending</Badge>
                        </div>
                        <p className="text-sm text-text-secondary m-0">
                          {lawyer.barCouncilNumber && `Bar Council: ${lawyer.barCouncilNumber}`}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <FiMail className="w-4 h-4 text-text-secondary" />
                        <span className="text-text-secondary">{lawyer.userId?.email || "N/A"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <FiMapPin className="w-4 h-4 text-text-secondary" />
                        <span className="text-text-secondary">{lawyer.city || "Not specified"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <FiBriefcase className="w-4 h-4 text-text-secondary" />
                        <span className="text-text-secondary">{lawyer.experienceYears || 0} years</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <FiDollarSign className="w-4 h-4 text-text-secondary" />
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

                    <div className="flex items-center gap-2 text-sm text-text-secondary">
                      <FiCalendar className="w-4 h-4" />
                      <span>Registered: {formatDate(lawyer.createdAt)}</span>
                      {lawyer.documentCount !== undefined && (
                        <>
                          <span>•</span>
                          <span>{lawyer.documentCount} document(s) uploaded</span>
                          <span>•</span>
                          <span>{lawyer.approvedDocuments || 0} approved</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => loadLawyerDocuments(lawyer.userId?._id || lawyer.userId)}
                      loading={loadingDocs}
                      className="flex items-center gap-1"
                    >
                      <FiEye className="w-4 h-4" />
                      View Documents
                    </Button>
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => {
                        setVerifyData({ status: "APPROVED", notes: "" });
                        setVerifyModal({ open: true, lawyer });
                      }}
                      className="flex items-center gap-1"
                    >
                      <FiCheckCircle className="w-4 h-4" />
                      Approve
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => {
                        setVerifyData({ status: "REJECTED", notes: "" });
                        setVerifyModal({ open: true, lawyer });
                      }}
                      className="flex items-center gap-1"
                    >
                      <FiXCircle className="w-4 h-4" />
                      Reject
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>

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
          <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
            <div className="flex items-start gap-2">
              <FiAlertCircle className="w-5 h-5 text-warning mt-0.5 flex-shrink-0" />
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
          <div className="text-center py-8 text-text-secondary">
            <FiFile className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No documents uploaded yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {documentsModal.documents.map((doc) => (
              <Card key={doc._id} className="border-l-4 border-primary">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <FiFile className="w-5 h-5 text-primary" />
                      <h4 className="text-base font-semibold text-text-primary m-0">
                        {doc.documentType.replace(/_/g, " ")}
                      </h4>
                      {getDocumentStatusBadge(doc.status)}
                    </div>
                    <p className="text-sm text-text-secondary m-0 mb-2">
                      Uploaded: {formatDate(doc.createdAt)}
                    </p>
                    {doc.adminNotes && (
                      <p className="text-sm text-text-secondary m-0">
                        <strong>Admin Note:</strong> {doc.adminNotes}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      const url = getProfilePictureUrl(doc.documentUrl || doc.mediaId?.url);
                      if (url) window.open(url, "_blank");
                    }}
                    className="flex items-center gap-1"
                  >
                    <FiEye className="w-4 h-4" />
                    View
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Modal>
      </div>
    </StateHandler>
  );
}
