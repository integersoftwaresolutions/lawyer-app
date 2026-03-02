import { useState, useEffect } from "react";
import { walletApi } from "../../services/wallet.api";
import { Card, Button, Input, Modal, StatCard } from "../../components/ui";

export default function ClientWalletPage() {
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
    return <div className="p-6 text-text-secondary">Loading...</div>;
  }

  const creditPackages = [
    { credits: 10, price: "$9.99", popular: false },
    { credits: 25, price: "$19.99", popular: true },
    { credits: 50, price: "$34.99", popular: false },
    { credits: 100, price: "$59.99", popular: false },
  ];

  return (
    <div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 mb-6">
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

      <Card title="Purchase Credits" className="mb-6">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
          {creditPackages.map((pkg) => (
            <div
              key={pkg.credits}
              className={`border-2 rounded-lg p-5 text-center relative ${
                pkg.popular ? "border-primary" : "border-border"
              }`}
            >
              {pkg.popular && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-primary text-primary-text py-1 px-3 rounded-xl text-[11px] font-semibold">
                  POPULAR
                </span>
              )}
              <div className="text-[32px] font-bold text-text-primary">
                {pkg.credits}
              </div>
              <div className="text-text-secondary mb-3">
                Credits
              </div>
              <div className="text-xl font-semibold text-text-primary mb-4">
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
        <div className="text-text-secondary">
          <ul className="pl-5 m-0">
            <li className="mb-2">Credits are used to book consultations with lawyers</li>
            <li className="mb-2">Each consultation costs a certain number of credits based on the lawyer's rate</li>
            <li className="mb-2">You receive free monthly credits based on your plan</li>
            <li className="mb-2">Purchased credits never expire</li>
          </ul>
        </div>
      </Card>

      <Card title="Purchase History" className="mt-6">
        {ledgerLoading ? (
          <p className="text-text-secondary m-0">Loading history...</p>
        ) : ledger.length === 0 ? (
          <p className="text-text-secondary m-0">No transactions yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left p-2.5 border-b border-border text-text-secondary text-xs">Date</th>
                  <th className="text-left p-2.5 border-b border-border text-text-secondary text-xs">Type</th>
                  <th className="text-left p-2.5 border-b border-border text-text-secondary text-xs">Amount</th>
                  <th className="text-left p-2.5 border-b border-border text-text-secondary text-xs">Note</th>
                  <th className="text-left p-2.5 border-b border-border text-text-secondary text-xs">Actions</th>
                </tr>
              </thead>
              <tbody>
                {ledger.map((tx) => (
                  <tr key={tx._id}>
                    <td className="p-2.5 border-b border-border text-text-primary text-sm">
                      {formatLedgerDate(tx.createdAt)}
                    </td>
                    <td className="p-2.5 border-b border-border text-text-primary text-sm">
                      {tx.type}
                    </td>
                    <td className={`p-2.5 border-b border-border text-sm font-semibold ${
                      tx.amount >= 0 ? "text-text-primary" : "text-text-secondary"
                    }`}>
                      {tx.amount >= 0 ? `+${tx.amount}` : tx.amount}
                    </td>
                    <td className="p-2.5 border-b border-border text-text-secondary text-sm">
                      {tx.note || "-"}
                    </td>
                    <td className="p-2.5 border-b border-border">
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
        <p className="text-text-secondary mt-0">
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
        <p className="text-text-secondary text-sm">
          Note: In production, this would integrate with a payment gateway.
        </p>
      </Modal>
    </div>
  );
}
