import { useEffect, useMemo, useRef, useState } from "react";
import { lawyerApi } from "../../services/lawyer.api";
import { Card, Badge, Button, StateHandler, Modal, PageHeader, PageShell } from "../../components/ui";
import { useToast } from "../../hooks/useToast";
import { useAuth } from "../../hooks/useAuth";
import { useStateHandler } from "../../hooks/useStateHandler";
import { getProfilePictureUrl } from "../../utils/profilePicture";
import {
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiUpload,
  FiFile,
  FiAlertCircle,
  FiShield,
  FiEye,
  FiDollarSign,
  FiFileText
} from "react-icons/fi";

const STATUS_META = {
  APPROVED: {
    icon: FiCheckCircle,
    color: "text-success",
    iconBg: "bg-success-light",
    badge: "success",
    title: "Verified Lawyer",
    description:
      "Your profile has been verified. You can receive bookings and appear with a verified badge."
  },
  REJECTED: {
    icon: FiXCircle,
    color: "text-danger",
    iconBg: "bg-danger-light",
    badge: "danger",
    title: "Verification Rejected",
    description:
      "Your verification was rejected. Review the admin notes below and resubmit your documents."
  },
  PENDING: {
    icon: FiClock,
    color: "text-warning",
    iconBg: "bg-warning-light",
    badge: "warning",
    title: "Verification Pending",
    description:
      "Upload required documents to begin review. Our team typically responds within 1–3 business days."
  }
};

const DOC_STATUS_META = {
  APPROVED: { variant: "success", label: "Approved", icon: FiCheckCircle },
  REJECTED: { variant: "danger", label: "Rejected", icon: FiXCircle },
  PENDING: { variant: "warning", label: "Under Review", icon: FiClock },
  NOT_UPLOADED: { variant: "default", label: "Not uploaded", icon: FiFile }
};

function StepItem({ step, title, description, active, done }) {
  return (
    <div
      className={`flex gap-3 rounded-xl border p-3 sm:p-4 ${
        done
          ? "border-success bg-success-light"
          : active
            ? "border-primary bg-primary"
            : "border-border bg-surface"
      }`}
    >
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${
          done
            ? "bg-success-light text-success"
            : active
              ? "bg-primary-light text-primary"
              : "bg-surface text-text-muted"
        }`}
      >
        {done ? <FiCheckCircle className="w-4 h-4" /> : step}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-text-primary m-0">{title}</p>
        <p className="text-xs text-text mt-1 mb-0 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

export default function LawyerVerificationPage() {
  const [uploadingType, setUploadingType] = useState(null);
  const [viewingDoc, setViewingDoc] = useState(null);
  const fileInputRef = useRef(null);
  const pendingDocTypeRef = useRef(null);
  const toast = useToast();
  const { loadProfile } = useAuth();

  const { loading, error, data, retry } = useStateHandler(async () => {
    const res = await lawyerApi.getVerificationStatus();
    return res.data;
  });

  const verificationData = data;

  useEffect(() => {
    if (!verificationData?.profile?.verificationStatus) return;
    loadProfile().catch(() => {});
  }, [verificationData?.profile?.verificationStatus, loadProfile]);

  const openFilePicker = (docType) => {
    pendingDocTypeRef.current = docType;
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const onFileSelected = async (e) => {
    const file = e.target.files?.[0];
    const docType = pendingDocTypeRef.current;
    if (!file || !docType) return;

    const validTypes = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload a PDF or image file (JPG, PNG)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    try {
      setUploadingType(docType);
      await lawyerApi.uploadVerificationDocument(docType, file);
      toast.success("Document uploaded successfully! It will be reviewed by our admin team.");
      retry();
    } catch (uploadError) {
      console.error("Upload failed:", uploadError);
      toast.error(uploadError.response?.data?.message || "Failed to upload document");
    } finally {
      setUploadingType(null);
      pendingDocTypeRef.current = null;
    }
  };

  const status = verificationData?.profile?.verificationStatus || "PENDING";
  const verificationFeeAmount = 0;
  const isVerificationFeeRequired = false;

  const documentsByType = verificationData?.documents || {};
  const requiredDocTypes = (verificationData?.requiredDocuments || [])
    .filter((d) => d.required)
    .map((d) => d.type);

  const uploadedRequiredCount = requiredDocTypes.filter(
    (t) => (documentsByType[t] || []).length > 0
  ).length;

  const hasAnyUploadedDocs = Object.values(documentsByType).some(
    (arr) => Array.isArray(arr) && arr.length > 0
  );

  const statusMeta = useMemo(() => {
    const base = STATUS_META[status] || STATUS_META.PENDING;
    if (status !== "PENDING") return base;
    return {
      ...base,
      description: hasAnyUploadedDocs
        ? "Your documents are under review. Our team typically responds within 1–3 business days."
        : base.description
    };
  }, [status, hasAnyUploadedDocs]);

  const StatusIcon = statusMeta.icon;

  const getDocumentStatus = (docType) => {
    const docs = verificationData?.documents?.[docType] || [];
    if (docs.length === 0) return { status: "NOT_UPLOADED", doc: null };
    const latestDoc = docs[0];
    return { status: latestDoc.status, doc: latestDoc };
  };

  const getDocumentUrl = (doc) => {
    if (!doc) return null;
    const url = doc.mediaId?.url || doc.documentUrl || "";
    return url ? getProfilePictureUrl(url) : null;
  };

  const handleViewDocument = (doc) => {
    const url = getDocumentUrl(doc);
    if (url) {
      setViewingDoc({
        url,
        fileName: doc.fileName || doc.mediaId?.originalFileName || "Document"
      });
    } else {
      toast.error("Document URL not available");
    }
  };

  const feeStepDone = verificationFeeAmount <= 0 || !isVerificationFeeRequired;
  const docsStepActive = feeStepDone && uploadedRequiredCount < requiredDocTypes.length;
  const docsStepDone = uploadedRequiredCount >= requiredDocTypes.length && requiredDocTypes.length > 0;
  const reviewStepActive = docsStepDone && status === "PENDING";
  const reviewStepDone = status === "APPROVED";

  const renderDocumentRow = (docConfig) => {
    const docStatus = getDocumentStatus(docConfig.type);
    const hasDocument = docStatus.doc !== null;
    const statusInfo = DOC_STATUS_META[docStatus.status] || DOC_STATUS_META.NOT_UPLOADED;
    const DocStatusIcon = statusInfo.icon;

    return (
      <div
        key={docConfig.type}
        className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between py-4 first:pt-0 last:pb-0 border-b border-card-border last:border-0"
      >
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              docStatus.status === "APPROVED"
                ? "bg-success-light text-success"
                : docStatus.status === "REJECTED"
                  ? "bg-danger-light text-danger"
                  : docStatus.status === "PENDING"
                    ? "bg-warning-light text-warning"
                    : "bg-primary-light text-primary"
            }`}
          >
            <FiFileText className="w-5 h-5" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm sm:text-base font-semibold text-text-primary m-0">
                {docConfig.label}
              </h3>
              {docConfig.required && (
                <Badge variant="danger" size="sm">
                  Required
                </Badge>
              )}
              <Badge variant={statusInfo.variant} size="sm" className="inline-flex items-center gap-1">
                <DocStatusIcon className="w-3 h-3" />
                {statusInfo.label}
              </Badge>
            </div>

            <p className="text-xs sm:text-sm text-text-muted mt-1 mb-0">
              {hasDocument
                ? `Uploaded ${new Date(docStatus.doc.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric"
                  })}`
                : "PDF, JPG, or PNG · max 5MB"}
            </p>

            {docStatus.doc?.adminNotes && (
              <div className="mt-2 flex items-start gap-2 rounded-lg border border-warning-light bg-warning-light px-3 py-2">
                <FiAlertCircle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                <p className="text-xs text-text-secondary m-0">{docStatus.doc.adminNotes}</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 shrink-0 sm:justify-end">
          {hasDocument && (
            <Button
              variant="ghost"
              outline
              size="sm"
              icon={FiEye}
              onClick={() => handleViewDocument(docStatus.doc)}
            >
              View
            </Button>
          )}
          <Button
            variant="primary"
            outline
            size="sm"
            icon={FiUpload}
            loading={uploadingType === docConfig.type}
            onClick={() => openFilePicker(docConfig.type)}
            disabled={isVerificationFeeRequired}
          >
            {hasDocument ? "Replace" : "Upload"}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <StateHandler loading={loading} error={error} retry={retry}>
      <PageShell>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={onFileSelected}
          accept="image/*,application/pdf"
        />

        <PageHeader
          icon={FiShield}
          title="Profile Verification"
          subtitle="Submit your credentials to become a verified lawyer and unlock bookings, visibility, and profile boosts"
          actions={<Badge variant={statusMeta.badge} size="lg">{status}</Badge>}
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card padding="p-4" className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg ${statusMeta.iconBg} ${statusMeta.color}`}>
              <StatusIcon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold text-text-primary leading-none m-0">{statusMeta.title}</p>
              <p className="text-xs text-text-muted mt-1 m-0">Current status</p>
            </div>
          </Card>

          <Card padding="p-4" className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-accent-light text-accent">
              <FiFile className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-bold text-text-primary leading-none m-0">
                {uploadedRequiredCount}/{requiredDocTypes.length || 0}
              </p>
              <p className="text-xs text-text-muted mt-1 m-0">Required documents</p>
            </div>
          </Card>

          <Card padding="p-4" className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-lg ${
                verificationFeeAmount <= 0
                  ? "bg-success-light text-success"
                  : isVerificationFeeRequired
                    ? "bg-warning-light text-warning"
                    : "bg-success-light text-success"
              }`}
            >
              <FiDollarSign className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold text-text-primary leading-none m-0">
                {verificationFeeAmount <= 0
                  ? "Free"
                  : isVerificationFeeRequired
                    ? `$${verificationFeeAmount}`
                    : "Paid"}
              </p>
              <p className="text-xs text-text-muted mt-1 m-0">Verification fee</p>
            </div>
          </Card>
        </div>

        {/* Status banner */}
        <Card
          padding="p-4 sm:p-5"
          className={`mb-5 sm:mb-6 ${
            status === "APPROVED"
              ? "border-success-light"
              : status === "REJECTED"
                ? "border-danger/25"
                : "border-warning-light"
          }`}
        >
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg shrink-0 ${statusMeta.iconBg} ${statusMeta.color}`}>
              <StatusIcon className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm sm:text-base text-text-secondary m-0">{statusMeta.description}</p>

              {verificationData?.profile?.verificationNotes && (
                <div
                  className={`mt-3 flex items-start gap-2 rounded-lg border px-3 py-2.5 ${
                    status === "REJECTED"
                      ? "border-danger-light bg-danger-light"
                      : "border-warning-light bg-warning-light"
                  }`}
                >
                  <FiAlertCircle
                    className={`w-4 h-4 shrink-0 mt-0.5 ${
                      status === "REJECTED" ? "text-danger" : "text-warning"
                    }`}
                  />
                  <div>
                    <p className="text-xs font-semibold text-text-primary m-0">Admin notes</p>
                    <p className="text-sm text-text-secondary mt-1 mb-0">
                      {verificationData.profile.verificationNotes}
                    </p>
                  </div>
                </div>
              )}

              {status === "APPROVED" && verificationData?.profile?.verifiedAt && (
                <p className="text-xs text-text-muted mt-3 mb-0">
                  Verified on{" "}
                  {new Date(verificationData.profile.verifiedAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                  })}
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Documents */}
        <Card
          title="Verification documents"
          subtitle="Upload clear copies of each required document. Accepted formats: PDF, JPG, PNG."
          padding="p-4 sm:p-6"
          className="mb-5 sm:mb-6"
        >
          <div className="[&>*]:border-card-border">
            {verificationData?.requiredDocuments?.map((doc) => renderDocumentRow(doc))}
          </div>
        </Card>

        {/* Process steps */}
        <Card title="How verification works" padding="p-4 sm:p-6" className="mb-5 sm:mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <StepItem
              step="1"
              title={verificationFeeAmount > 0 ? "Pay fee" : "Prepare documents"}
              description={
                verificationFeeAmount > 0
                  ? "Pay the one-time verification fee to unlock uploads."
                  : "Gather your bar license and government ID."
              }
              active={verificationFeeAmount > 0 && isVerificationFeeRequired}
              done={feeStepDone}
            />
            <StepItem
              step="2"
              title="Upload documents"
              description="Submit all required documents for admin review."
              active={docsStepActive}
              done={docsStepDone}
            />
            <StepItem
              step="3"
              title="Admin review"
              description="Our team reviews your submission within 1–3 business days."
              active={reviewStepActive}
              done={reviewStepDone}
            />
            <StepItem
              step="4"
              title="Get verified"
              description="Receive your badge, higher search visibility, and booking access."
              done={status === "APPROVED"}
            />
          </div>
        </Card>

        {/* Benefits */}
        {status === "APPROVED" && (
          <Card padding="p-4 sm:p-5" className="border-success-light bg-success-light">
            <h3 className="text-base font-semibold text-text-primary mb-3 flex items-center gap-2 m-0">
              <FiCheckCircle className="w-5 h-5 text-success" />
              Verification benefits
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                "Verified badge on your public profile",
                "Higher visibility in lawyer search",
                "Ability to receive client bookings",
                "Access to profile boost packages"
              ].map((benefit) => (
                <div key={benefit} className="flex items-center gap-2 text-sm text-text-secondary">
                  <FiCheckCircle className="w-4 h-4 text-success shrink-0" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        <Modal
          isOpen={!!viewingDoc}
          onClose={() => setViewingDoc(null)}
          title={viewingDoc?.fileName || "View Document"}
          size="xl"
        >
          {viewingDoc && (
            <div className="flex justify-center items-center min-h-[400px]">
              {viewingDoc.url.endsWith(".pdf") || viewingDoc.url.includes("application/pdf") ? (
                <iframe
                  src={viewingDoc.url}
                  className="w-full h-[70vh] border border-border rounded-lg"
                  title="Document Viewer"
                />
              ) : (
                <img
                  src={viewingDoc.url}
                  alt={viewingDoc.fileName}
                  className="max-w-full max-h-[70vh] object-contain rounded-lg"
                  onError={(e) => {
                    e.target.style.display = "none";
                    const errorDiv = e.target.nextElementSibling;
                    if (errorDiv) errorDiv.style.display = "flex";
                  }}
                />
              )}
              <div className="hidden flex-col items-center justify-center py-12">
                <FiFile className="w-16 h-16 text-text-muted mb-4" />
                <p className="text-text-secondary">Unable to load document</p>
                <Button
                  variant="primary"
                  size="sm"
                  className="mt-4"
                  onClick={() => window.open(viewingDoc.url, "_blank")}
                >
                  Open in New Tab
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </PageShell>
    </StateHandler>
  );
}
