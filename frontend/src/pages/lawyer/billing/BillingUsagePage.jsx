import { Link } from "react-router-dom";
import { FiActivity } from "react-icons/fi";
import {
  Button,
  Card,
  PageHeader,
  PageShell,
  StateHandler
} from "../../../components/ui";
import {
  BILLING_METER_LABELS,
  useWorkspaceBilling
} from "../../../hooks/useWorkspaceBilling";

export default function BillingUsagePage() {
  const {
    workspace,
    canManage,
    loading,
    error,
    load,
    meters,
    isFirm,
    handleUpgradePro
  } = useWorkspaceBilling();

  return (
    <StateHandler loading={loading} error={error} retry={load}>
      <PageShell>
        <PageHeader
          icon={FiActivity}
          title="Usage"
          subtitle={`Quotas for ${workspace?.name || "this workspace"} this billing period.`}
          actions={
            <Link to="/lawyer/billing/subscription" className="no-underline">
              <Button size="sm" variant="secondary" outline>
                Manage plan
              </Button>
            </Link>
          }
        />

        <Card>
          <ul className="m-0 p-0 list-none space-y-3">
            {Object.entries(BILLING_METER_LABELS).map(([key, label]) => {
              const m = meters[key];
              if (!m) return null;
              return (
                <li key={key}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-text-secondary">{label}</span>
                    <span className="text-text-primary font-medium">
                      {m.used} / {m.limit}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-surface-hover overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        m.pct >= 100 ? "bg-danger" : m.pct >= 90 ? "bg-warning" : "bg-primary"
                      }`}
                      style={{ width: `${Math.min(100, m.pct)}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
          {meters["ai.messages_per_month"]?.pct >= 90 && canManage && !isFirm && (
            <div className="mt-4">
              <Button size="sm" onClick={handleUpgradePro}>
                Need more AI? Upgrade to Max
              </Button>
            </div>
          )}
        </Card>
      </PageShell>
    </StateHandler>
  );
}
