import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { FiCreditCard } from "react-icons/fi";
import {
  Badge,
  DataList,
  DataTable,
  PageFilters,
  PageHeader,
  PageShell,
  PageTabFilters,
  Pagination
} from "../../components/ui";
import { adminBillingApi } from "../../services/billing.api";
import { usePaginatedQuery } from "../../hooks/usePaginatedQuery";

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "FREE", label: "Unpaid / Free status" },
  { value: "TRIALING", label: "Trialing" },
  { value: "ACTIVE", label: "Active" },
  { value: "PAST_DUE", label: "Past due" },
  { value: "CANCELED", label: "Canceled" }
];

const PLAN_OPTIONS = [
  { value: "", label: "All plans" },
  { value: "base", label: "Adal Base" },
  { value: "max", label: "Adal Max" },
  { value: "firm", label: "Law Firm" },
  { value: "firm_max", label: "Law Firm Max" }
];

export default function AdminSubscriptionsPage() {
  const [status, setStatus] = useState("");
  const [planKey, setPlanKey] = useState("");

  const fetchSubs = useCallback(
    (params) =>
      adminBillingApi.listSubscriptions({
        ...params,
        ...(status ? { status } : {}),
        ...(planKey ? { planKey } : {})
      }),
    [status, planKey]
  );

  const { items, meta, setPage, loading, error, retry } = usePaginatedQuery(fetchSubs, {
    dependencies: [status, planKey],
    defaultLimit: 20
  });

  const columns = [
    {
      key: "workspace",
      label: "Workspace",
      render: (_, row) => (
        <div className="min-w-0">
          <p className="text-sm font-semibold text-text-primary m-0 truncate">
            {row.workspace?.name || "—"}
          </p>
          <p className="text-xs text-text-muted m-0 mt-0.5">{row.workspace?.type || ""}</p>
        </div>
      )
    },
    {
      key: "planKey",
      label: "Plan",
      render: (v) => <span className="capitalize">{v}</span>
    },
    {
      key: "status",
      label: "Status",
      render: (v) => <Badge size="sm">{v}</Badge>
    },
    {
      key: "provider",
      label: "Provider",
      hideOnMobile: true
    },
    {
      key: "currentPeriodEnd",
      label: "Period end",
      hideOnMobile: true,
      render: (v) => (v ? new Date(v).toLocaleDateString() : "—")
    },
    {
      key: "actions",
      label: "",
      render: (_, row) => (
        <Link
          to={`/admin/subscriptions/${row.workspaceId}`}
          className="text-sm text-link hover:underline no-underline"
        >
          Open
        </Link>
      )
    }
  ];

  return (
    <PageShell>
      <PageHeader
        icon={FiCreditCard}
        title="Subscriptions"
        subtitle="Workspace plans, Stripe status, and support actions"
        actions={
          <Link
            to="/admin/subscriptions/catalog"
            className="text-sm text-link hover:underline no-underline"
          >
            Plan catalog
          </Link>
        }
      />

      <DataList
        filters={
          <PageFilters>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <PageTabFilters options={STATUS_OPTIONS} value={status} onChange={setStatus} />
              <select
                className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
                value={planKey}
                onChange={(e) => setPlanKey(e.target.value)}
              >
                {PLAN_OPTIONS.map((o) => (
                  <option key={o.value || "all"} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </PageFilters>
        }
        pagination={<Pagination meta={meta} onPageChange={setPage} />}
      >
        <DataTable
          columns={columns}
          data={items}
          keyField="id"
          loading={loading}
          error={error}
          retry={retry}
          emptyMessage="No subscriptions found"
          emptyDescription="Try a different status or plan filter."
          emptyIcon={<FiCreditCard className="w-6 h-6" />}
        />
      </DataList>
    </PageShell>
  );
}
