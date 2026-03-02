import { useState, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import { adminApi } from "../../services/admin.api";
import { Card, Button, Badge, Modal, Textarea, Select } from "../../components/ui";

export default function AdminVerificationPage() {
  const { colors } = useTheme();
  const [pendingLawyers, setPendingLawyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifyModal, setVerifyModal] = useState({ open: false, lawyer: null });
  const [verifyData, setVerifyData] = useState({ status: "APPROVED", notes: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadPendingLawyers();
  }, []);

  const loadPendingLawyers = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getPendingLawyers();
      setPendingLawyers(res.data || []);
    } catch (error) {
      console.error("Failed to load pending lawyers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!verifyModal.lawyer) return;
    
    try {
      setSubmitting(true);
      const lawyerUserId = verifyModal.lawyer.userId?._id || verifyModal.lawyer.userId;
      await adminApi.verifyLawyer(lawyerUserId, verifyData);
      setVerifyModal({ open: false, lawyer: null });
      setVerifyData({ status: "APPROVED", notes: "" });
      loadPendingLawyers();
    } catch (error) {
      console.error("Failed to verify:", error);
      alert(error.response?.data?.message || "Failed to update verification");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return <div style={{ padding: "24px", color: colors.text.secondary }}>Loading...</div>;
  }

  return (
    <div>
      <Card>
        <div style={{ marginBottom: "20px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: "bold", color: colors.text.primary, marginBottom: "8px" }}>
            Pending Verifications
          </h2>
          <p style={{ color: colors.text.secondary, margin: 0 }}>
            Review and approve lawyer verification requests
          </p>
        </div>

        {pendingLawyers.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: colors.text.secondary }}>
            <p style={{ fontSize: "48px", marginBottom: "16px" }}>✅</p>
            <p>No pending verifications</p>
            <p style={{ fontSize: "14px", marginTop: "8px" }}>
              All lawyer verification requests have been processed.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {pendingLawyers.map((lawyer) => (
              <div
                key={lawyer._id}
                style={{
                  border: `1px solid ${colors.border}`,
                  borderRadius: "8px",
                  padding: "20px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                      <h3 style={{ fontSize: "18px", fontWeight: "600", color: colors.text.primary, margin: 0 }}>
                        {lawyer.fullName}
                      </h3>
                      <Badge variant="warning">Pending</Badge>
                    </div>
                    <div style={{ color: colors.text.secondary, fontSize: "14px", marginBottom: "12px" }}>
                      <p style={{ margin: "4px 0" }}>Email: {lawyer.userId?.email || "N/A"}</p>
                      <p style={{ margin: "4px 0" }}>City: {lawyer.city || "Not specified"}</p>
                      <p style={{ margin: "4px 0" }}>Experience: {lawyer.experienceYears || 0} years</p>
                      <p style={{ margin: "4px 0" }}>Hourly Rate: ${lawyer.hourlyRate || 0}/hr</p>
                      <p style={{ margin: "4px 0" }}>Registered: {formatDate(lawyer.createdAt)}</p>
                    </div>
                    {lawyer.specialization && lawyer.specialization.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                        {lawyer.specialization.map((spec) => (
                          <Badge key={spec} size="sm">{spec}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <Button
                      variant="success"
                      size="sm"
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
                      onClick={() => {
                        setVerifyData({ status: "REJECTED", notes: "" });
                        setVerifyModal({ open: true, lawyer });
                      }}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal
        isOpen={verifyModal.open}
        onClose={() => setVerifyModal({ open: false, lawyer: null })}
        title={`${verifyData.status === "APPROVED" ? "Approve" : "Reject"} - ${verifyModal.lawyer?.fullName}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setVerifyModal({ open: false, lawyer: null })}>
              Cancel
            </Button>
            <Button
              variant={verifyData.status === "APPROVED" ? "success" : "danger"}
              onClick={handleVerify}
              loading={submitting}
            >
              {verifyData.status === "APPROVED" ? "Approve" : "Reject"}
            </Button>
          </>
        }
      >
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
          placeholder="Add notes about this verification decision..."
          value={verifyData.notes}
          onChange={(e) => setVerifyData({ ...verifyData, notes: e.target.value })}
        />
      </Modal>
    </div>
  );
}
