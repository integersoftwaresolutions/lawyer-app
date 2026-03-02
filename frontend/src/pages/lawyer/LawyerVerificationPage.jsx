import { useRef, useState, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import { lawyerApi } from "../../services/lawyer.api";
import { Card, Badge, Button } from "../../components/ui";

export default function LawyerVerificationPage() {
  const { colors } = useTheme();
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
    return <div style={{ padding: "24px", color: colors.text.secondary }}>Loading...</div>;
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
        style={{ display: "none" }}
        onChange={onFileSelected}
        accept="image/*,application/pdf"
      />

      <Card style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ fontSize: "20px", fontWeight: "bold", color: colors.text.primary, marginBottom: "8px" }}>
              Verification Status
            </h2>
            <p style={{ color: colors.text.secondary, margin: 0 }}>
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
          <div style={{ 
            marginTop: "16px", 
            padding: "12px", 
            backgroundColor: colors.surface, 
            borderRadius: "6px",
            borderLeft: `4px solid ${profile?.verificationStatus === "REJECTED" ? "#dc3545" : "#ffc107"}`
          }}>
            <strong style={{ color: colors.text.primary }}>Admin Notes:</strong>
            <p style={{ color: colors.text.secondary, margin: "8px 0 0 0" }}>
              {profile.verificationNotes}
            </p>
          </div>
        )}
      </Card>

      <Card title="Required Documents" subtitle="Upload the following documents for verification">
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {documents.map((doc) => (
            <div
              key={doc.type}
              style={{
                border: `1px solid ${colors.border}`,
                borderRadius: "8px",
                padding: "16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  <span style={{ fontWeight: "600", color: colors.text.primary }}>
                    {doc.label}
                  </span>
                  {doc.required && (
                    <Badge variant="danger" size="sm">Required</Badge>
                  )}
                </div>
                <p style={{ color: colors.text.secondary, margin: 0, fontSize: "13px" }}>
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

        <div style={{ 
          marginTop: "24px", 
          padding: "16px", 
          backgroundColor: colors.surface, 
          borderRadius: "8px" 
        }}>
          <h4 style={{ color: colors.text.primary, marginBottom: "8px" }}>
            Verification Process
          </h4>
          <ol style={{ color: colors.text.secondary, paddingLeft: "20px", margin: 0 }}>
            <li style={{ marginBottom: "8px" }}>Upload all required documents</li>
            <li style={{ marginBottom: "8px" }}>Our admin team will review your documents within 1-3 business days</li>
            <li style={{ marginBottom: "8px" }}>Once approved, you'll receive a verification badge on your profile</li>
            <li>Verified lawyers appear higher in search results and can receive more bookings</li>
          </ol>
        </div>
      </Card>
    </div>
  );
}
