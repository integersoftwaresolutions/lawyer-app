import { useState, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import { adminApi } from "../../services/admin.api";
import { Card, Button, Badge, Modal, Textarea, Select } from "../../components/ui";

export default function AdminLawyersPage() {
  const { colors } = useTheme();
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

  const tableStyles = {
    width: "100%",
    borderCollapse: "collapse",
  };

  const thStyles = {
    textAlign: "left",
    padding: "12px",
    borderBottom: `1px solid ${colors.border}`,
    color: colors.text.secondary,
    fontSize: "13px",
    fontWeight: "600",
  };

  const tdStyles = {
    padding: "12px",
    borderBottom: `1px solid ${colors.border}`,
    color: colors.text.primary,
    fontSize: "14px",
  };

  return (
    <div>
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: "bold", color: colors.text.primary, margin: 0 }}>
            All Lawyers
          </h2>
          <div style={{ display: "flex", gap: "8px" }}>
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
          <p style={{ color: colors.text.secondary }}>Loading...</p>
        ) : lawyers.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: colors.text.secondary }}>
            <p>No lawyers found</p>
          </div>
        ) : (
          <table style={tableStyles}>
            <thead>
              <tr>
                <th style={thStyles}>Name</th>
                <th style={thStyles}>Email</th>
                <th style={thStyles}>City</th>
                <th style={thStyles}>Experience</th>
                <th style={thStyles}>Rate</th>
                <th style={thStyles}>Rating</th>
                <th style={thStyles}>Status</th>
                <th style={thStyles}>Joined</th>
                <th style={thStyles}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {lawyers.map((lawyer) => (
                <tr key={lawyer._id}>
                  <td style={tdStyles}>{lawyer.fullName}</td>
                  <td style={tdStyles}>{lawyer.userId?.email || "N/A"}</td>
                  <td style={tdStyles}>{lawyer.city || "-"}</td>
                  <td style={tdStyles}>{lawyer.experienceYears || 0} yrs</td>
                  <td style={tdStyles}>${lawyer.hourlyRate || 0}/hr</td>
                  <td style={tdStyles}>{lawyer.ratingAvg?.toFixed(1) || "0.0"} ({lawyer.ratingCount || 0})</td>
                  <td style={tdStyles}>{getStatusBadge(lawyer.verificationStatus)}</td>
                  <td style={tdStyles}>{formatDate(lawyer.createdAt)}</td>
                  <td style={tdStyles}>
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
