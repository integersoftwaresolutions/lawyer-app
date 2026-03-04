import { useState } from "react";
import { walletApi } from "../../services/wallet.api";
import { Card, Button, Input, Modal, StatCard, StateHandler, Table } from "../../components/ui";
import { useStateHandler } from "../../hooks/useStateHandler";

export default function ClientWalletPage() {
  const [deleteModal, setDeleteModal] = useState({ open: false, item: null });
  const [topupModal, setTopupModal] = useState(false);
  const [topupAmount, setTopupAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const { loading, error, data, retry: retryWallet } = useStateHandler(
    async () => {
      const res = await walletApi.me();
      return res.data;
    }
  );

  const fetchLedger = async () => {
    const res = await walletApi.ledger({ page: 1, limit: 20 });
    return res.data || [];
  };

  const wallet = data;

  const handleDeleteHistory = async () => {
    if (!deleteModal.item) return;
    try {
      setSubmitting(true);
      await walletApi.hideLedgerEntry(deleteModal.item._id);
      setDeleteModal({ open: false, item: null });
      setRefreshKey((k) => k + 1);
    } catch (error) {
      console.error("Failed to delete history:", error);
      alert(error.response?.data?.message || "Failed to delete history");
    } finally {
      setSubmitting(false);
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
      retryWallet();
      setRefreshKey((k) => k + 1);
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

  const creditPackages = [
    { credits: 10, price: "$9.99", popular: false },
    { credits: 25, price: "$19.99", popular: true },
    { credits: 50, price: "$34.99", popular: false },
    { credits: 100, price: "$59.99", popular: false },
  ];

  return (
    <StateHandler loading={loading} error={error} retry={retryWallet}>
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
        <Table
          columns={[
            {
              key: "createdAt",
              label: "Date",
              render: (value) => formatLedgerDate(value),
            },
            {
              key: "type",
              label: "Type",
            },
            {
              key: "amount",
              label: "Amount",
              render: (value) => (
                <span className={`text-sm font-semibold ${
                  value >= 0 ? "text-text-primary" : "text-text-secondary"
                }`}>
                  {value >= 0 ? `+${value}` : value}
                </span>
              ),
            },
            {
              key: "note",
              label: "Note",
              render: (value) => value || "-",
            },
            {
              key: "actions",
              label: "Actions",
              render: (_, row) => (
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => setDeleteModal({ open: true, item: row })}
                >
                  Delete
                </Button>
              ),
            },
          ]}
          data={fetchLedger}
          dependencies={[refreshKey]}
          emptyMessage="No transactions yet"
        />
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
    </StateHandler>
  );
}
