import { useState, useEffect } from "react";
import { adminApi } from "../../services/admin.api";
import { Card, Button, Badge, Modal, Textarea, Select } from "../../components/ui";

export default function AdminVerificationPage() {
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
    return <div className="p-6 text-text-secondary">Loading...</div>;
  }

  return (
    <div>
      <Card>
        <div className="mb-5">
          <h2 className="text-xl font-bold text-text-primary mb-2">
            Pending Verifications
          </h2>
          <p className="text-text-secondary m-0">
            Review and approve lawyer verification requests
          </p>
        </div>

        {pendingLawyers.length === 0 ? (
          <div className="text-center py-10 text-text-secondary">
            <p className="text-[48px] mb-4">✅</p>
            <p>No pending verifications</p>
            <p className="text-sm mt-2">
              All lawyer verification requests have been processed.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {pendingLawyers.map((lawyer) => (
              <div
                key={lawyer._id}
                className="border border-border rounded-lg p-5"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-text-primary m-0">
                        {lawyer.fullName}
                      </h3>
                      <Badge variant="warning">Pending</Badge>
                    </div>
                    <div className="text-text-secondary text-sm mb-3">
                      <p className="m-1">Email: {lawyer.userId?.email || "N/A"}</p>
                      <p className="m-1">City: {lawyer.city || "Not specified"}</p>
                      <p className="m-1">Experience: {lawyer.experienceYears || 0} years</p>
                      <p className="m-1">Hourly Rate: ${lawyer.hourlyRate || 0}/hr</p>
                      <p className="m-1">Registered: {formatDate(lawyer.createdAt)}</p>
                    </div>
                    {lawyer.specialization && lawyer.specialization.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {lawyer.specialization.map((spec) => (
                          <Badge key={spec} size="sm">{spec}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
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
