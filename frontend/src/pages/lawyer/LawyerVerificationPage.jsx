import { useRef, useState } from "react";
import { lawyerApi } from "../../services/lawyer.api";
import { Card, Badge, Button, StateHandler, Modal } from "../../components/ui";
import { useToast } from "../../hooks/useToast";
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
  FiDownload
} from "react-icons/fi";

export default function LawyerVerificationPage() {
  const [uploadingType, setUploadingType] = useState(null);
  const [viewingDoc, setViewingDoc] = useState(null);
  const fileInputRef = useRef(null);
  const pendingDocTypeRef = useRef(null);
  const [payingFee, setPayingFee] = useState(false);
  const toast = useToast();

  const { loading, error, data, retry } = useStateHandler(
    async () => {
      const res = await lawyerApi.getVerificationStatus();
      return res.data;
    }
  );

  const verificationData = data;

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

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload a PDF or image file (JPG, PNG)");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    try {
      setUploadingType(docType);
      await lawyerApi.uploadVerificationDocument(docType, file);
      toast.success("Document uploaded successfully! It will be reviewed by our admin team.");
      retry();
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error(error.response?.data?.message || "Failed to upload document");
    } finally {
      setUploadingType(null);
      pendingDocTypeRef.current = null;
    }
  };

  const status = verificationData?.profile?.verificationStatus || "PENDING";
  const verificationFeeAmount = verificationData?.profile?.verificationFee?.amount || 0;
  const isVerificationFeeRequired = verificationData?.profile?.verificationFee?.isRequired || false;
  const verificationFeePaidAt = verificationData?.profile?.verificationFee?.paidAt;

  const documentsByType = verificationData?.documents || {};
  const requiredDocTypes = (verificationData?.requiredDocuments || [])
    .filter((d) => d.required)
    .map((d) => d.type);
  const hasAnyUploadedDocs = Object.values(documentsByType).some(
    (arr) => Array.isArray(arr) && arr.length > 0
  );
  const hasRequiredDocsUploaded =
    requiredDocTypes.length > 0
      ? requiredDocTypes.every((t) => (documentsByType[t] || []).length > 0)
      : false;

  const handlePayVerificationFee = async () => {
    if (!verificationFeeAmount || verificationFeeAmount <= 0) return;
    try {
      setPayingFee(true);
      await lawyerApi.payVerificationFee();
      toast.success("Verification fee paid successfully. You can now upload documents.");
      retry();
    } catch (error) {
      console.error("Failed to pay verification fee:", error);
      toast.error(error.response?.data?.message || "Failed to pay verification fee");
    } finally {
      setPayingFee(false);
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      APPROVED: {
        icon: FiCheckCircle,
        color: "text-success",
        bgColor: "bg-success/10",
        borderColor: "border-success",
        badge: "success",
        title: "Verified Lawyer",
        description: "Your profile has been verified. You can now receive bookings from clients."
      },
      REJECTED: {
        icon: FiXCircle,
        color: "text-danger",
        bgColor: "bg-danger/10",
        borderColor: "border-danger",
        badge: "danger",
        title: "Verification Rejected",
        description: "Your verification was rejected. Please review the notes and resubmit your documents."
      },
      PENDING: {
        icon: FiClock,
        color: "text-warning",
        bgColor: "bg-warning/10",
        borderColor: "border-warning",
        badge: "warning",
        title: "Verification Pending",
        description: hasAnyUploadedDocs
          ? "Your verification is under review by our admin team. This usually takes 1-3 business days."
          : "Upload your required documents to start verification. Once submitted, our admin team will review them within 1-3 business days."
      }
    };
    return configs[status] || configs.PENDING;
  };

  const statusConfig = getStatusConfig(status);
  const StatusIcon = statusConfig.icon;

  const getDocumentStatus = (docType) => {
    const docs = verificationData?.documents?.[docType] || [];
    if (docs.length === 0) return { status: "NOT_UPLOADED", doc: null };
    
    const latestDoc = docs[0]; // Most recent document
    return { status: latestDoc.status, doc: latestDoc };
  };

  const getDocumentUrl = (doc) => {
    if (!doc) return null;
    // Prefer mediaId.url (from Media model), fallback to documentUrl (legacy)
    const url = doc.mediaId?.url || doc.documentUrl || "";
    return url ? getProfilePictureUrl(url) : null;
  };

  const handleViewDocument = (doc) => {
    const url = getDocumentUrl(doc);
    if (url) {
      setViewingDoc({ url, fileName: doc.fileName || doc.mediaId?.originalFileName || "Document" });
    } else {
      toast.error("Document URL not available");
    }
  };

  const renderDocumentCard = (docConfig) => {
    const docStatus = getDocumentStatus(docConfig.type);
    const hasDocument = docStatus.doc !== null;
    const isApproved = docStatus.status === "APPROVED";
    const isRejected = docStatus.status === "REJECTED";
    const isPending = docStatus.status === "PENDING";

    return (
      <Card key={docConfig.type} className="overflow-hidden">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                isApproved ? "bg-success/10 text-success" :
                isRejected ? "bg-danger/10 text-danger" :
                isPending ? "bg-warning/10 text-warning" :
                "bg-surface text-text-secondary"
              }`}>
                <FiFile className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-text-primary m-0">
                    {docConfig.label}
                  </h3>
                  {docConfig.required && (
                    <Badge variant="danger" size="sm">Required</Badge>
                  )}
                </div>
                <p className="text-sm text-text-secondary m-0 mt-1">
                  {hasDocument 
                    ? `Uploaded: ${new Date(docStatus.doc.createdAt).toLocaleDateString()}`
                    : "Not uploaded yet"}
                </p>
              </div>
            </div>

            {hasDocument && (
              <div className="mt-3 flex items-center gap-2">
                {isApproved && (
                  <Badge variant="success" size="sm" className="flex items-center gap-1">
                    <FiCheckCircle className="w-3 h-3" />
                    Approved
                  </Badge>
                )}
                {isRejected && (
                  <Badge variant="danger" size="sm" className="flex items-center gap-1">
                    <FiXCircle className="w-3 h-3" />
                    Rejected
                  </Badge>
                )}
                {isPending && (
                  <Badge variant="warning" size="sm" className="flex items-center gap-1">
                    <FiClock className="w-3 h-3" />
                    Under Review
                  </Badge>
                )}
                {docStatus.doc.adminNotes && (
                  <p className="text-xs text-text-secondary mt-1">
                    Note: {docStatus.doc.adminNotes}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {hasDocument && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleViewDocument(docStatus.doc)}
                className="flex items-center gap-1"
              >
                <FiEye className="w-4 h-4" />
                View
              </Button>
            )}
            <Button
              variant={hasDocument ? "secondary" : "primary"}
              size="sm"
              loading={uploadingType === docConfig.type}
              onClick={() => openFilePicker(docConfig.type)}
              className="flex items-center gap-1"
              disabled={isVerificationFeeRequired}
            >
              <FiUpload className="w-4 h-4" />
              {hasDocument ? "Replace" : "Upload"}
            </Button>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <StateHandler loading={loading} error={error} retry={retry}>
      <div>
        <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={onFileSelected}
        accept="image/*,application/pdf"
      />

      {/* Status Card */}
      <Card className={`mb-6 border-l-4 ${statusConfig.borderColor} ${statusConfig.bgColor}`}>
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${statusConfig.bgColor} ${statusConfig.color} flex-shrink-0`}>
            <StatusIcon className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold text-text-primary m-0">
                {statusConfig.title}
              </h2>
              <Badge variant={statusConfig.badge} size="lg" className="flex items-center gap-1">
                {status === "APPROVED" && <FiShield className="w-4 h-4" />}
                {status}
              </Badge>
            </div>
            <p className="text-text-secondary m-0 mb-3">
              {statusConfig.description}
            </p>

            {verificationData?.profile?.verificationNotes && (
              <div className={`mt-4 p-4 rounded-lg border ${
                status === "REJECTED" ? "bg-danger/5 border-danger/20" : "bg-warning/5 border-warning/20"
              }`}>
                <div className="flex items-start gap-2">
                  <FiAlertCircle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                    status === "REJECTED" ? "text-danger" : "text-warning"
                  }`} />
                  <div className="flex-1">
                    <strong className="text-text-primary text-sm">Admin Notes:</strong>
                    <p className="text-text-secondary text-sm mt-1 m-0">
                      {verificationData.profile.verificationNotes}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {status === "APPROVED" && verificationData?.profile?.verifiedAt && (
              <p className="text-sm text-text-secondary mt-3 m-0">
                Verified on: {new Date(verificationData.profile.verifiedAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric"
                })}
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Verification Fee Card */}
      {verificationFeeAmount > 0 && (
        <Card className="mb-6 border border-border bg-surface/50">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-text-primary font-semibold m-0">
                Verification Fee: ${verificationFeeAmount}
              </h3>
              {isVerificationFeeRequired ? (
                <p className="text-text-secondary m-0 mt-1 text-sm">
                  Pay to unlock document uploads and start the verification review.
                </p>
              ) : (
                <p className="text-text-secondary m-0 mt-1 text-sm">
                  Paid{verificationFeePaidAt ? ` on ${new Date(verificationFeePaidAt).toLocaleDateString("en-US")}` : ""}.
                </p>
              )}
            </div>
            {isVerificationFeeRequired ? (
              <Button variant="primary" size="sm" loading={payingFee} onClick={handlePayVerificationFee}>
                Pay Fee
              </Button>
            ) : (
              <Badge variant="success" size="sm">
                Fee Paid
              </Badge>
            )}
          </div>
        </Card>
      )}

      {/* Documents Section */}
      <Card title="Verification Documents" className="mb-6">
        <p className="text-text-secondary mb-6">
          Upload the required documents to complete your verification. All documents are securely stored and reviewed by our admin team.
        </p>

        <div className="flex flex-col gap-4 mb-6">
          {verificationData?.requiredDocuments?.map((doc) => renderDocumentCard(doc))}
        </div>

        {/* Process Info */}
        <div className="mt-6 p-5 bg-surface rounded-lg border border-border">
          <h4 className="text-text-primary mb-3 flex items-center gap-2">
            <FiShield className="w-5 h-5 text-primary" />
            Verification Process
          </h4>
          <ol className="text-text-secondary space-y-2 pl-6 m-0 list-decimal">
            <li>
              Upload required documents (Bar License and Government ID) to start verification
              {verificationFeeAmount > 0 ? " (and pay the verification fee if required)" : ""}
            </li>
            <li>After you submit, our admin team reviews your documents within 1-3 business days</li>
            <li>If approved, you receive a verified badge on your profile</li>
            <li>If rejected, you will see admin notes and can resubmit</li>
            <li>Verified lawyers appear higher in search results and can receive bookings</li>
          </ol>
        </div>
      </Card>

      {/* Benefits Card */}
      {status === "APPROVED" && (
        <Card className="bg-success/5 border-success/20">
          <h3 className="text-text-primary mb-2 flex items-center gap-2">
            <FiCheckCircle className="w-5 h-5 text-success" />
            Verification Benefits
          </h3>
          <ul className="text-text-secondary space-y-1 pl-6 m-0 list-disc">
            <li>Verified badge displayed on your profile</li>
            <li>Higher visibility in lawyer search results</li>
            <li>Ability to receive bookings from clients</li>
            <li>Increased trust and credibility</li>
          </ul>
        </Card>
      )}

      {/* Document View Modal */}
      <Modal
        isOpen={!!viewingDoc}
        onClose={() => setViewingDoc(null)}
        title={viewingDoc?.fileName || "View Document"}
        size="xl"
      >
        {viewingDoc && (
          <div className="flex justify-center items-center min-h-[400px]">
            {viewingDoc.url.endsWith('.pdf') || viewingDoc.url.includes('application/pdf') ? (
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
                onClick={() => window.open(viewingDoc.url, '_blank')}
              >
                Open in New Tab
              </Button>
            </div>
          </div>
        )}
      </Modal>
      </div>
    </StateHandler>
  );
}
