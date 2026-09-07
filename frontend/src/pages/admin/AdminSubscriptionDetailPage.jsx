import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FiArrowLeft, FiCreditCard } from "react-icons/fi";
import {
  Badge,
  Button,
  Card,
  Input,
  PageHeader,
  PageShell,
  Select,
  StateHandler,
  Textarea
} from "../../components/ui";
import { adminBillingApi } from "../../services/billing.api";
import { useToast } from "../../hooks/useToast";
import { getErrorMessage } from "../../utils/errorHandler";

export default function AdminSubscriptionDetailPage() {
  const { workspaceId } = useParams();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [planKey, setPlanKey] = useState("pro");
  const [seatLimit, setSeatLimit] = useState("");
  const [trialDays, setTrialDays] = useState("");
  const [reason, setReason] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminBillingApi.getSubscription(workspaceId);
      setData(res.data);
      setPlanKey(res.data?.subscription?.planKey || "pro");
      setSeatLimit(
        res.data?.subscription?.seatLimit != null ? String(res.data.subscription.seatLimit) : ""
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    load();
  }, [load]);

  const grant = async () => {
    try {
      setBusy(true);
      await adminBillingApi.grant(workspaceId, {
        planKey,
        reason,
        seatLimit: seatLimit === "" ? null : Number(seatLimit),
        trialDaysExtend: trialDays === "" ? null : Number(trialDays)
      });
      toast.success("Plan updated");
      setReason("");
      setTrialDays("");
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const forceFree = async () => {
    if (!window.confirm("Force this workspace to Free?")) return;
    try {
      setBusy(true);
      await adminBillingApi.forceFree(workspaceId, { reason });
      toast.success("Set to Free");
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const reconcile = async () => {
    try {
      setBusy(true);
      await adminBillingApi.reconcile(workspaceId);
      toast.success("Reconciled with Stripe");
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const sub = data?.subscription;
  const ws = data?.workspace;

  return (
    <StateHandler loading={loading} error={error} retry={load}>
      <PageShell>
        <Link
          to="/admin/subscriptions"
          className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary no-underline mb-2"
        >
          <FiArrowLeft className="w-4 h-4" /> Back to subscriptions
        </Link>
        <PageHeader
          icon={FiCreditCard}
          title={ws?.name || "Subscription"}
          subtitle={`${ws?.type || ""} · ${workspaceId}`}
        />

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <h3 className="text-sm font-semibold m-0 mb-3">Subscription</h3>
            <dl className="grid grid-cols-2 gap-2 text-sm m-0">
              <dt className="text-text-muted">Plan</dt>
              <dd className="m-0 capitalize">{sub?.planKey}</dd>
              <dt className="text-text-muted">Status</dt>
              <dd className="m-0">
                <Badge>{sub?.status}</Badge>
              </dd>
              <dt className="text-text-muted">Provider</dt>
              <dd className="m-0">{sub?.provider}</dd>
              <dt className="text-text-muted">Seats</dt>
              <dd className="m-0">{sub?.seatLimit ?? "—"}</dd>
              <dt className="text-text-muted">Stripe customer</dt>
              <dd className="m-0 break-all text-xs">{sub?.stripeCustomerId || "—"}</dd>
              <dt className="text-text-muted">Stripe sub</dt>
              <dd className="m-0 break-all text-xs">{sub?.stripeSubscriptionId || "—"}</dd>
            </dl>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" outline loading={busy} onClick={reconcile}>
                Reconcile Stripe
              </Button>
              <Button size="sm" variant="danger" outline loading={busy} onClick={forceFree}>
                Force Free
              </Button>
            </div>
          </Card>

          <Card>
            <h3 className="text-sm font-semibold m-0 mb-3">Support grant</h3>
            <Select
              label="Plan"
              value={planKey}
              onChange={(e) => setPlanKey(e.target.value)}
              options={[
                { value: "free", label: "Free" },
                { value: "pro", label: "Pro" },
                { value: "firm", label: "Firm" }
              ]}
            />
            <Input
              label="Seat limit override"
              value={seatLimit}
              onChange={(e) => setSeatLimit(e.target.value)}
              placeholder="Leave blank for catalog default"
            />
            <Input
              label="Extend trial (days)"
              type="number"
              value={trialDays}
              onChange={(e) => setTrialDays(e.target.value)}
              placeholder="Optional — sets TRIALING Pro"
            />
            <Textarea
              label="Reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
            />
            <Button className="mt-2" loading={busy} onClick={grant}>
              Apply grant
            </Button>
          </Card>
        </div>

        <Card className="mt-4">
          <h3 className="text-sm font-semibold m-0 mb-3">Invoices</h3>
          {!data?.invoices?.length ? (
            <p className="text-sm text-text-muted m-0">None</p>
          ) : (
            <ul className="m-0 p-0 list-none divide-y divide-border">
              {data.invoices.map((inv) => (
                <li key={inv._id || inv.stripeInvoiceId} className="py-2 text-sm flex justify-between gap-3">
                  <span>
                    {inv.number || inv.stripeInvoiceId} · {inv.status}
                  </span>
                  {inv.hostedInvoiceUrl && (
                    <a href={inv.hostedInvoiceUrl} target="_blank" rel="noreferrer" className="text-link">
                      Open
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </PageShell>
    </StateHandler>
  );
}
