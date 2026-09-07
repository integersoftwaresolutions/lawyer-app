import { Link } from "react-router-dom";
import { FiExternalLink, FiFileText } from "react-icons/fi";
import {
  Badge,
  Button,
  DataList,
  DataTable,
  PageHeader,
  PageShell,
  StateHandler
} from "../../../components/ui";
import { useWorkspaceBilling } from "../../../hooks/useWorkspaceBilling";

function invoiceStatusVariant(status) {
  const s = String(status || "").toLowerCase();
  if (s === "paid") return "success";
  if (s === "open" || s === "draft") return "info";
  if (s === "void" || s === "uncollectible") return "danger";
  return "default";
}

function formatInvoiceAmount(inv) {
  const cents = inv.amountPaid || inv.amountDue || 0;
  const currency = (inv.currency || "usd").toUpperCase();
  const amount = (Number(cents) / 100).toFixed(2);
  return currency === "USD" ? `$${amount}` : `${amount} ${currency}`;
}

export default function BillingInvoicesPage() {
  const {
    workspace,
    canManage,
    loading,
    error,
    load,
    invoices,
    sub,
    busyPlanKey,
    handlePortal
  } = useWorkspaceBilling();

  const columns = [
    {
      key: "number",
      label: "Number",
      render: (v) => v || "—"
    },
    {
      key: "status",
      label: "Status",
      render: (v) => (
        <Badge size="sm" variant={invoiceStatusVariant(v)}>
          {v ? String(v).replace(/_/g, " ") : "—"}
        </Badge>
      )
    },
    {
      key: "amount",
      label: "Amount",
      render: (_, row) => (
        <span className="text-sm font-semibold text-text-primary tabular-nums">
          {formatInvoiceAmount(row)}
        </span>
      )
    },
    {
      key: "createdAt",
      label: "Date",
      hideOnMobile: true,
      render: (v) =>
        v
          ? new Date(v).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric"
            })
          : "—"
    },
    {
      key: "actions",
      label: "Actions",
      align: "right",
      render: (_, row) =>
        row.hostedInvoiceUrl ? (
          <a
            href={row.hostedInvoiceUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-sm font-medium text-link no-underline hover:underline"
          >
            View
            <FiExternalLink className="w-3.5 h-3.5" />
          </a>
        ) : (
          <span className="text-sm text-text-muted">—</span>
        )
    }
  ];

  return (
    <StateHandler loading={loading} error={error} retry={load}>
      <PageShell>
        <PageHeader
          icon={FiFileText}
          title="Invoices"
          subtitle={`Receipts for ${workspace?.name || "this workspace"}.`}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              {canManage && sub?.stripeCustomerId ? (
                <Button
                  size="sm"
                  variant="secondary"
                  outline
                  loading={busyPlanKey === "portal"}
                  onClick={handlePortal}
                >
                  Stripe portal
                </Button>
              ) : null}
              <Link to="/lawyer/billing/subscription" className="no-underline">
                <Button size="sm" variant="secondary" outline>
                  Subscription
                </Button>
              </Link>
            </div>
          }
        />

        <DataList>
          <DataTable
            columns={columns}
            data={invoices}
            keyField="stripeInvoiceId"
            loading={false}
            emptyMessage="No invoices yet"
            emptyDescription="After you subscribe, receipts appear here and in the Stripe customer portal."
          />
        </DataList>
      </PageShell>
    </StateHandler>
  );
}
