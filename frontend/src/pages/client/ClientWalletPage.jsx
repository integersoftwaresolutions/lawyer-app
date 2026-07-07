import { useState } from "react";
import {
  FiTrash2,
  FiCreditCard,
  FiCalendar,
  FiZap,
  FiShoppingCart,
  FiInfo,
  FiClock,
} from "react-icons/fi";
import { walletApi } from "../../services/wallet.api";
import { Card, Button, Input, Modal, StateHandler, Table, Badge } from "../../components/ui";
import { useStateHandler } from "../../hooks/useStateHandler";

const CREDIT_PACKAGES = [
  { credits: 10, price: "$9.99", popular: false },
  { credits: 25, price: "$19.99", popular: true },
  { credits: 50, price: "$34.99", popular: false },
  { credits: 100, price: "$59.99", popular: false },
];

const CREDIT_TIPS = [
  { icon: FiZap, text: "Credits are used to book consultations with lawyers" },
  { icon: FiCreditCard, text: "Each session costs credits based on the lawyer's hourly rate" },
  { icon: FiCalendar, text: "You receive free monthly credits based on your plan" },
  { icon: FiClock, text: "Purchased credits never expire" },
];

function getTypeBadge(type) {
  const variants = {
    TOPUP: "success",
    SPEND: "danger",
  };
  return (
    <Badge variant={variants[type] || "default"} size="table">
      {type}
    </Badge>
  );
}

export default function ClientWalletPage() {
  const [deleteModal, setDeleteModal] = useState({ open: false, item: null });
  const [topupModal, setTopupModal] = useState(false);
  const [topupAmount, setTopupAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const { loading, error, data, retry: retryWallet } = useStateHandler(async () => {
    const res = await walletApi.me();
    return res.data;
  });

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
    } catch (err) {
      console.error("Failed to delete history:", err);
      alert(err.response?.data?.message || "Failed to delete history");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTopup = async () => {
    const amount = parseInt(topupAmount, 10);
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
    } catch (err) {
      console.error("Failed to topup:", err);
      alert(err.response?.data?.message || "Failed to topup");
    } finally {
      setSubmitting(false);
    }
  };

  const openTopup = (credits) => {
    setTopupAmount(credits.toString());
    setTopupModal(true);
  };

  const formatLedgerDate = (date) =>
    new Date(date).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <StateHandler loading={loading} error={error} retry={retryWallet}>
      <div className="flex flex-col min-h-0">
        {/* Page header */}
        <div className="shrink-0 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-4 sm:mb-6">
          <div className="flex items-start gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-primary-light text-primary shrink-0">
              <FiCreditCard className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-text-primary leading-tight m-0">
                Wallet & Credits
              </h1>
              <p className="text-xs sm:text-sm text-text-muted mt-1 mb-0 max-w-2xl">
                Top up credits, track your balance, and review purchase history for consultations.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            icon={FiShoppingCart}
            className="shrink-0 self-start sm:self-center"
            onClick={() => openTopup("")}
          >
            Custom amount
          </Button>
        </div>

        {/* Balance summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5 sm:mb-6">
          <Card padding="p-4 sm:p-5" className="flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-primary-light text-primary shrink-0">
              <FiCreditCard className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-2xl sm:text-3xl font-bold text-text-primary leading-none m-0 tabular-nums">
                {wallet?.balanceCredits ?? 0}
              </p>
              <p className="text-xs sm:text-sm text-text-muted mt-1.5 m-0">Current balance</p>
            </div>
          </Card>

          <Card padding="p-4 sm:p-5" className="flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-accent-light text-accent shrink-0">
              <FiCalendar className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-2xl sm:text-3xl font-bold text-text-primary leading-none m-0 tabular-nums">
                {wallet?.monthlyCredits ?? 0}
              </p>
              <p className="text-xs sm:text-sm text-text-muted mt-1.5 m-0">Monthly plan credits</p>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-5 sm:mb-6">
          {/* Credit packages */}
          <Card
            title="Purchase credits"
            subtitle="Choose a package or enter a custom amount"
            padding="p-4 sm:p-5"
            className="lg:col-span-2"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {CREDIT_PACKAGES.map((pkg) => (
                <div
                  key={pkg.credits}
                  className={`relative rounded-xl bg-background border p-4 sm:p-5 flex flex-col transition-colors ${
                    pkg.popular
                      ? "border-primary-border"
                      : "border-card-border"
                  }`}
                >
                  {pkg.popular && (
                    <Badge variant="primary" size="sm" className="absolute -top-2.5 left-4">
                      Popular
                    </Badge>
                  )}

                  <div className="flex items-baseline gap-1.5 mb-1">
                    <span className="text-3xl font-bold text-text-primary tabular-nums">
                      {pkg.credits}
                    </span>
                    <span className="text-sm text-text-secondary">credits</span>
                  </div>

                  <p className="text-lg font-semibold text-text-primary m-0 mb-4 tabular-nums">
                    {pkg.price}
                  </p>

                  <Button
                    fullWidth
                    variant={pkg.popular ? "primary" : "secondary"}
                    size="sm"
                    icon={FiShoppingCart}
                    className="mt-auto"
                    onClick={() => openTopup(pkg.credits)}
                  >
                    Purchase
                  </Button>
                </div>
              ))}
            </div>
          </Card>

          {/* How credits work */}
          <Card
            title="How credits work"
            subtitle="Everything you need to know"
            padding="p-4 sm:p-5"
            className="lg:col-span-1"
          >
            <ul className="list-none m-0 p-0 space-y-3">
              {CREDIT_TIPS.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-3">
                  <span className="p-1.5 rounded-lg bg-surface border border-card-border text-text-secondary shrink-0 mt-0.5">
                    <Icon className="w-3.5 h-3.5" />
                  </span>
                  <span className="text-sm text-text-secondary leading-relaxed">{text}</span>
                </li>
              ))}
            </ul>

            <div className="mt-5 pt-4 border-t border-card-border flex items-start gap-2">
              <FiInfo className="w-4 h-4 text-text-muted shrink-0 mt-0.5" />
              <p className="text-xs text-text-muted m-0 leading-relaxed">
                In production, purchases will connect to a secure payment gateway.
              </p>
            </div>
          </Card>
        </div>

        {/* Purchase history */}
        <Card
          title="Purchase history"
          subtitle="Recent top-ups and consultation charges"
          padding="p-4 sm:p-5"
        >
          <Table
            columns={[
              {
                key: "createdAt",
                label: "Date",
                render: (value) => (
                  <span className="text-sm text-text-primary whitespace-nowrap">
                    {formatLedgerDate(value)}
                  </span>
                ),
              },
              {
                key: "type",
                label: "Type",
                render: (value) => getTypeBadge(value),
              },
              {
                key: "amount",
                label: "Amount",
                render: (value) => (
                  <span
                    className={`text-sm font-semibold tabular-nums ${
                      value >= 0 ? "text-success" : "text-danger"
                    }`}
                  >
                    {value >= 0 ? `+${value}` : value}
                  </span>
                ),
              },
              {
                key: "note",
                label: "Note",
                render: (value) => (
                  <span className="text-sm text-text-secondary">{value || "—"}</span>
                ),
              },
              {
                key: "actions",
                label: "Actions",
                render: (_, row) => (
                  <Button
                    size="sm"
                    variant="danger"
                    outline
                    icon={FiTrash2}
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
          title="Delete history entry"
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
          <p className="text-text-secondary mt-0 leading-relaxed">
            This removes the entry from your history. Your wallet balance will not change.
          </p>
        </Modal>

        <Modal
          isOpen={topupModal}
          onClose={() => setTopupModal(false)}
          title="Add credits"
          footer={
            <>
              <Button variant="secondary" onClick={() => setTopupModal(false)}>
                Cancel
              </Button>
              <Button icon={FiShoppingCart} onClick={handleTopup} loading={submitting}>
                Confirm purchase
              </Button>
            </>
          }
        >
          <Input
            label="Number of credits"
            type="number"
            value={topupAmount}
            onChange={(e) => setTopupAmount(e.target.value)}
            placeholder="Enter amount"
            containerClassName="mb-3"
          />
          <p className="text-text-muted text-sm m-0 leading-relaxed">
            Credits are added to your balance immediately after confirmation.
          </p>
        </Modal>
      </div>
    </StateHandler>
  );
}
