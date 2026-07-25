import { useCallback, useState } from "react";
import {
  FiTrash2,
  FiCreditCard,
  FiCalendar,
  FiZap,
  FiInfo,
  FiClock
} from "react-icons/fi";
import { walletApi } from "../../services/wallet.api";
import {
  Card,
  Button,
  Modal,
  StateHandler,
  Badge,
  PageHeader,
  PageShell,
  DataTable,
  DataList,
  Pagination
} from "../../components/ui";
import { useStateHandler } from "../../hooks/useStateHandler";
import { usePaginatedQuery } from "../../hooks/usePaginatedQuery";
import { useToast } from "../../hooks/useToast";

const CREDIT_TIPS = [
  { icon: FiZap, text: "Credits are used to book consultations with lawyers" },
  { icon: FiCreditCard, text: "Each session costs credits based on the lawyer's hourly rate" },
  { icon: FiCalendar, text: "You receive free monthly credits based on your plan" },
  { icon: FiClock, text: "Unused monthly credits refresh with your plan cycle" }
];

function getTypeBadge(type) {
  const variants = {
    TOPUP: "success",
    SPEND: "danger"
  };
  return (
    <Badge variant={variants[type] || "default"} size="table">
      {type}
    </Badge>
  );
}

export default function ClientWalletPage() {
  const [deleteModal, setDeleteModal] = useState({ open: false, item: null });
  const [submitting, setSubmitting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const toast = useToast();

  const { loading, error, data, retry: retryWallet } = useStateHandler(async () => {
    const res = await walletApi.me();
    return res.data;
  });

  const fetchLedger = useCallback((params) => walletApi.ledger(params), []);

  const {
    items: ledgerItems,
    meta: ledgerMeta,
    setPage: setLedgerPage,
    loading: ledgerLoading,
    error: ledgerError,
    retry: retryLedger
  } = usePaginatedQuery(fetchLedger, {
    dependencies: [refreshKey],
    defaultLimit: 20
  });

  const wallet = data;

  const handleDeleteHistory = async () => {
    if (!deleteModal.item) return;
    try {
      setSubmitting(true);
      await walletApi.hideLedgerEntry(deleteModal.item._id);
      setDeleteModal({ open: false, item: null });
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete history");
    } finally {
      setSubmitting(false);
    }
  };

  const formatLedgerDate = (date) =>
    new Date(date).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });

  return (
    <StateHandler loading={loading} error={error} retry={retryWallet}>
      <PageShell>
        <PageHeader
          icon={FiCreditCard}
          title="Wallet & Credits"
          subtitle="Track your balance and consultation spend history"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
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
                Self-serve purchases are disabled until payments go live. Admins can credit wallets when needed.
              </p>
            </div>
          </Card>

          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-sm font-semibold text-text-primary m-0">Transaction history</h3>
            <DataList pagination={<Pagination meta={ledgerMeta} onPageChange={setLedgerPage} />}>
              <DataTable
                columns={[
                  {
                    key: "createdAt",
                    label: "Date",
                    render: (value) => (
                      <span className="text-sm text-text-primary whitespace-nowrap">
                        {formatLedgerDate(value)}
                      </span>
                    )
                  },
                  {
                    key: "type",
                    label: "Type",
                    render: (value) => getTypeBadge(value)
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
                    )
                  },
                  {
                    key: "note",
                    label: "Note",
                    render: (value) => (
                      <span className="text-sm text-text-secondary">{value || "—"}</span>
                    )
                  },
                  {
                    key: "actions",
                    label: "Actions",
                    align: "right",
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
                    )
                  }
                ]}
                data={ledgerItems}
                keyField="_id"
                loading={ledgerLoading}
                error={ledgerError}
                retry={retryLedger}
                emptyMessage="No transactions yet"
                emptyDescription="Spends and credits will appear in this ledger."
              />
            </DataList>
          </div>
        </div>

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
      </PageShell>
    </StateHandler>
  );
}
