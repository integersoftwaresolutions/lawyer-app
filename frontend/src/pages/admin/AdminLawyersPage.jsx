import { useState, useEffect } from "react";
import { adminApi } from "../../services/admin.api";
import { Card, Button, Badge, Modal, Textarea, Select } from "../../components/ui";

export default function AdminLawyersPage() {
  const [lawyers, setLawyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [verifyModal, setVerifyModal] = useState({ open: false, lawyer: null });
  const [verifyData, setVerifyData] = useState({ status: "APPROVED", notes: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadLawyers();
  }, [filter]);

  const loadLawyers = async () => {
    try {
      setLoading(true);
      const params = filter ? { status: filter } : {};
      const res = await adminApi.getLawyers(params);
      setLawyers(res.data || []);
    } catch (error) {
      console.error("Failed to load lawyers:", error);
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
      loadLawyers();
    } catch (error) {
      console.error("Failed to verify:", error);
      alert(error.response?.data?.message || "Failed to update verification");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      PENDING: "warning",
      APPROVED: "success",
      REJECTED: "danger",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const filterOptions = [
    { value: "", label: "All" },
    { value: "PENDING", label: "Pending" },
    { value: "APPROVED", label: "Approved" },
    { value: "REJECTED", label: "Rejected" },
  ];

  return (
    <div>
      <Card>
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-bold text-text-primary m-0">
            All Lawyers
          </h2>
          <div className="flex gap-2">
            {filterOptions.map((opt) => (
              <Button
                key={opt.value}
                variant={filter === opt.value ? "primary" : "secondary"}
                size="sm"
                onClick={() => setFilter(opt.value)}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </div>

        {loading ? (
          <p className="text-text-secondary">Loading...</p>
        ) : lawyers.length === 0 ? (
          <div className="text-center py-10 text-text-secondary">
            <p>No lawyers found</p>
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left p-3 border-b border-border text-text-secondary text-xs font-semibold">Name</th>
                <th className="text-left p-3 border-b border-border text-text-secondary text-xs font-semibold">Email</th>
                <th className="text-left p-3 border-b border-border text-text-secondary text-xs font-semibold">City</th>
                <th className="text-left p-3 border-b border-border text-text-secondary text-xs font-semibold">Experience</th>
                <th className="text-left p-3 border-b border-border text-text-secondary text-xs font-semibold">Rate</th>
                <th className="text-left p-3 border-b border-border text-text-secondary text-xs font-semibold">Rating</th>
                <th className="text-left p-3 border-b border-border text-text-secondary text-xs font-semibold">Status</th>
                <th className="text-left p-3 border-b border-border text-text-secondary text-xs font-semibold">Joined</th>
                <th className="text-left p-3 border-b border-border text-text-secondary text-xs font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {lawyers.map((lawyer) => (
                <tr key={lawyer._id}>
                  <td className="p-3 border-b border-border text-text-primary text-sm">{lawyer.fullName}</td>
                  <td className="p-3 border-b border-border text-text-primary text-sm">{lawyer.userId?.email || "N/A"}</td>
                  <td className="p-3 border-b border-border text-text-primary text-sm">{lawyer.city || "-"}</td>
                  <td className="p-3 border-b border-border text-text-primary text-sm">{lawyer.experienceYears || 0} yrs</td>
                  <td className="p-3 border-b border-border text-text-primary text-sm">${lawyer.hourlyRate || 0}/hr</td>
                  <td className="p-3 border-b border-border text-text-primary text-sm">{lawyer.ratingAvg?.toFixed(1) || "0.0"} ({lawyer.ratingCount || 0})</td>
                  <td className="p-3 border-b border-border text-text-primary text-sm">{getStatusBadge(lawyer.verificationStatus)}</td>
                  <td className="p-3 border-b border-border text-text-primary text-sm">{formatDate(lawyer.createdAt)}</td>
                  <td className="p-3 border-b border-border text-text-primary text-sm">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setVerifyData({ status: lawyer.verificationStatus, notes: lawyer.verificationNotes || "" });
                        setVerifyModal({ open: true, lawyer });
                      }}
                    >
                      Update Status
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

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
            { value: "REJECTED", label: "Rejected" },
          ]}
        />
        <Textarea
          label="Admin Notes"
          placeholder="Add notes about this verification decision..."
          value={verifyData.notes}
          onChange={(e) => setVerifyData({ ...verifyData, notes: e.target.value })}
        />
      </Modal>
    </div>
  );
}
