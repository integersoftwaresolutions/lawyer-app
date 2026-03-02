import { useRef, useState, useEffect } from "react";
import { lawyerApi } from "../../services/lawyer.api";
import { Card, Badge, Button } from "../../components/ui";

export default function LawyerVerificationPage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadingType, setUploadingType] = useState(null);
  const fileInputRef = useRef(null);
  const pendingDocTypeRef = useRef(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await lawyerApi.getMyProfile();
      setProfile(res.data);
    } catch (error) {
      console.error("Failed to load profile:", error);
    } finally {
      setLoading(false);
    }
  };

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

    try {
      setUploadingType(docType);
      await lawyerApi.uploadVerificationDocument(docType, file);
      alert("Document uploaded. It will be reviewed by admin.");
      loadProfile();
    } catch (error) {
      console.error("Upload failed:", error);
      alert(error.response?.data?.message || "Failed to upload document");
    } finally {
      setUploadingType(null);
      pendingDocTypeRef.current = null;
    }
  };

  if (loading) {
    return <div className="p-6 text-text-secondary">Loading...</div>;
  }

  const getStatusBadge = (status) => {
    const variants = {
      PENDING: "warning",
      APPROVED: "success",
      REJECTED: "danger",
    };
    return <Badge variant={variants[status] || "default"} size="lg">{status}</Badge>;
  };

  const documents = [
    { type: "BAR_LICENSE", label: "Bar License", required: true },
    { type: "GOVERNMENT_ID", label: "Government ID", required: true },
    { type: "PROFESSIONAL_CERTIFICATE", label: "Professional Certificate", required: false },
  ];

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={onFileSelected}
        accept="image/*,application/pdf"
      />

      <Card className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-text-primary mb-2">
              Verification Status
            </h2>
            <p className="text-text-secondary m-0">
              {profile?.verificationStatus === "APPROVED" 
                ? "Your profile has been verified. You can now receive bookings from clients."
                : profile?.verificationStatus === "REJECTED"
                ? "Your verification was rejected. Please review the notes and resubmit."
                : "Your verification is pending review by our admin team."}
            </p>
          </div>
          {getStatusBadge(profile?.verificationStatus || "PENDING")}
        </div>

        {profile?.verificationNotes && (
          <div className={`mt-4 p-3 bg-surface rounded-md border-l-4 ${
            profile?.verificationStatus === "REJECTED" ? "border-danger" : "border-warning"
          }`}>
            <strong className="text-text-primary">Admin Notes:</strong>
            <p className="text-text-secondary mt-2 m-0">
              {profile.verificationNotes}
            </p>
          </div>
        )}
      </Card>

      <Card title="Required Documents" subtitle="Upload the following documents for verification">
        <div className="flex flex-col gap-4">
          {documents.map((doc) => (
            <div
              key={doc.type}
              className="border border-border rounded-lg p-4 flex justify-between items-center"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-text-primary">
                    {doc.label}
                  </span>
                  {doc.required && (
                    <Badge variant="danger" size="sm">Required</Badge>
                  )}
                </div>
                <p className="text-text-secondary m-0 text-xs">
                  Upload a clear copy of your {doc.label.toLowerCase()}
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                loading={uploadingType === doc.type}
                onClick={() => openFilePicker(doc.type)}
              >
                Upload
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-surface rounded-lg">
          <h4 className="text-text-primary mb-2">
            Verification Process
          </h4>
          <ol className="text-text-secondary pl-5 m-0">
            <li className="mb-2">Upload all required documents</li>
            <li className="mb-2">Our admin team will review your documents within 1-3 business days</li>
            <li className="mb-2">Once approved, you'll receive a verification badge on your profile</li>
            <li>Verified lawyers appear higher in search results and can receive more bookings</li>
          </ol>
        </div>
      </Card>
    </div>
  );
}
