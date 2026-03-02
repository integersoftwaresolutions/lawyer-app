import { useState, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import { walletApi } from "../../services/wallet.api";
import { Card, Button, Input, Modal, StatCard } from "../../components/ui";

export default function ClientWalletPage() {
  const { colors } = useTheme();
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ledger, setLedger] = useState([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ open: false, item: null });
  const [topupModal, setTopupModal] = useState(false);
  const [topupAmount, setTopupAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadWallet();
    loadLedger();
  }, []);

  const loadWallet = async () => {
    try {
      const res = await walletApi.me();
      setWallet(res.data);
    } catch (error) {
      console.error("Failed to load wallet:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHistory = async () => {
    if (!deleteModal.item) return;
    try {
      setSubmitting(true);
      await walletApi.hideLedgerEntry(deleteModal.item._id);
      setDeleteModal({ open: false, item: null });
      loadLedger();
    } catch (error) {
      console.error("Failed to delete history:", error);
      alert(error.response?.data?.message || "Failed to delete history");
    } finally {
      setSubmitting(false);
    }
  };

  const loadLedger = async () => {
    try {
      setLedgerLoading(true);
      const res = await walletApi.ledger({ page: 1, limit: 20 });
      setLedger(res.data || []);
    } catch (error) {
      console.error("Failed to load ledger:", error);
    } finally {
      setLedgerLoading(false);
    }
  };

  const handleTopup = async () => {
    const amount = parseInt(topupAmount);
    if (!amount || amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    try {
      setSubmitting(true);
      await walletApi.topup({ amount, note: "Credit topup" });
      setTopupModal(false);
      setTopupAmount("");
      loadWallet();
      loadLedger();
    } catch (error) {
      console.error("Failed to topup:", error);
      alert(error.response?.data?.message || "Failed to topup");
    } finally {
      setSubmitting(false);
    }
  };

  const formatLedgerDate = (date) => {
    return new Date(date).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return <div style={{ padding: "24px", color: colors.text.secondary }}>Loading...</div>;
  }

  const creditPackages = [
    { credits: 10, price: "$9.99", popular: false },
    { credits: 25, price: "$19.99", popular: true },
    { credits: 50, price: "$34.99", popular: false },
    { credits: 100, price: "$59.99", popular: false },
  ];

  return (
    <div>
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
        gap: "16px", 
        marginBottom: "24px" 
      }}>
        <StatCard
          icon="💳"
          value={wallet?.balanceCredits || 0}
          label="Current Balance"
        />
        <StatCard
          icon="📅"
          value={wallet?.monthlyCredits || 0}
          label="Monthly Credits"
        />
      </div>

      <Card title="Purchase Credits" style={{ marginBottom: "24px" }}>
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", 
          gap: "16px" 
        }}>
          {creditPackages.map((pkg) => (
            <div
              key={pkg.credits}
              style={{
                border: `2px solid ${pkg.popular ? colors.button.primary : colors.border}`,
                borderRadius: "8px",
                padding: "20px",
                textAlign: "center",
                position: "relative",
              }}
            >
              {pkg.popular && (
                <span
                  style={{
                    position: "absolute",
                    top: "-10px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    backgroundColor: colors.button.primary,
                    color: colors.button.primaryText,
                    padding: "4px 12px",
                    borderRadius: "12px",
                    fontSize: "11px",
                    fontWeight: "600",
                  }}
                >
                  POPULAR
                </span>
              )}
              <div style={{ fontSize: "32px", fontWeight: "bold", color: colors.text.primary }}>
                {pkg.credits}
              </div>
              <div style={{ color: colors.text.secondary, marginBottom: "12px" }}>
                Credits
              </div>
              <div style={{ fontSize: "20px", fontWeight: "600", color: colors.text.primary, marginBottom: "16px" }}>
                {pkg.price}
              </div>
              <Button
                fullWidth
                variant={pkg.popular ? "primary" : "secondary"}
                onClick={() => {
                  setTopupAmount(pkg.credits.toString());
                  setTopupModal(true);
                }}
              >
                Purchase
              </Button>
            </div>
          ))}
        </div>
      </Card>

      <Card title="How Credits Work">
        <div style={{ color: colors.text.secondary }}>
          <ul style={{ paddingLeft: "20px", margin: 0 }}>
            <li style={{ marginBottom: "8px" }}>Credits are used to book consultations with lawyers</li>
            <li style={{ marginBottom: "8px" }}>Each consultation costs a certain number of credits based on the lawyer's rate</li>
            <li style={{ marginBottom: "8px" }}>You receive free monthly credits based on your plan</li>
            <li style={{ marginBottom: "8px" }}>Purchased credits never expire</li>
          </ul>
        </div>
      </Card>

      <Card title="Purchase History" style={{ marginTop: "24px" }}>
        {ledgerLoading ? (
          <p style={{ color: colors.text.secondary, margin: 0 }}>Loading history...</p>
        ) : ledger.length === 0 ? (
          <p style={{ color: colors.text.secondary, margin: 0 }}>No transactions yet.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "10px", borderBottom: `1px solid ${colors.border}`, color: colors.text.secondary, fontSize: "13px" }}>Date</th>
                  <th style={{ textAlign: "left", padding: "10px", borderBottom: `1px solid ${colors.border}`, color: colors.text.secondary, fontSize: "13px" }}>Type</th>
                  <th style={{ textAlign: "left", padding: "10px", borderBottom: `1px solid ${colors.border}`, color: colors.text.secondary, fontSize: "13px" }}>Amount</th>
                  <th style={{ textAlign: "left", padding: "10px", borderBottom: `1px solid ${colors.border}`, color: colors.text.secondary, fontSize: "13px" }}>Note</th>
                  <th style={{ textAlign: "left", padding: "10px", borderBottom: `1px solid ${colors.border}`, color: colors.text.secondary, fontSize: "13px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {ledger.map((tx) => (
                  <tr key={tx._id}>
                    <td style={{ padding: "10px", borderBottom: `1px solid ${colors.border}`, color: colors.text.primary, fontSize: "14px" }}>
                      {formatLedgerDate(tx.createdAt)}
                    </td>
                    <td style={{ padding: "10px", borderBottom: `1px solid ${colors.border}`, color: colors.text.primary, fontSize: "14px" }}>
                      {tx.type}
                    </td>
                    <td style={{ padding: "10px", borderBottom: `1px solid ${colors.border}`, color: tx.amount >= 0 ? colors.text.primary : colors.text.secondary, fontSize: "14px", fontWeight: 600 }}>
                      {tx.amount >= 0 ? `+${tx.amount}` : tx.amount}
                    </td>
                    <td style={{ padding: "10px", borderBottom: `1px solid ${colors.border}`, color: colors.text.secondary, fontSize: "14px" }}>
                      {tx.note || "-"}
                    </td>
                    <td style={{ padding: "10px", borderBottom: `1px solid ${colors.border}` }}>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => setDeleteModal({ open: true, item: tx })}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, item: null })}
        title="Delete History"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteModal({ open: false, item: null })}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteHistory} loading={submitting}>
              Delete
            </Button>
          </>
        }
      >
        <p style={{ color: colors.text.secondary, marginTop: 0 }}>
          This will remove the item from your history. It will not change your wallet balance.
        </p>
      </Modal>

      <Modal
        isOpen={topupModal}
        onClose={() => setTopupModal(false)}
        title="Add Credits"
        footer={
          <>
            <Button variant="secondary" onClick={() => setTopupModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleTopup} loading={submitting}>
              Confirm Purchase
            </Button>
          </>
        }
      >
        <Input
          label="Number of Credits"
          type="number"
          value={topupAmount}
          onChange={(e) => setTopupAmount(e.target.value)}
          placeholder="Enter amount"
        />
        <p style={{ color: colors.text.secondary, fontSize: "14px" }}>
          Note: In production, this would integrate with a payment gateway.
        </p>
      </Modal>
    </div>
  );
}
