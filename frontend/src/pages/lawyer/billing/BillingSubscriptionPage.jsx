import { Link } from "react-router-dom";
import { FiCreditCard, FiExternalLink } from "react-icons/fi";
import {
  Badge,
  Button,
  Card,
  PageHeader,
  PageShell,
  StateHandler
} from "../../../components/ui";
import PlanComparisonCards from "../../../components/billing/PlanComparisonCards";
import FirmCreateModal from "../../../components/billing/FirmCreateModal";
import {
  billingStatusVariant,
  useWorkspaceBilling
} from "../../../hooks/useWorkspaceBilling";
import { PLAN_KEYS } from "../../../billing/plans";

export default function BillingSubscriptionPage() {
  const billing = useWorkspaceBilling({ handleUpgradeDeepLinks: true });
  const {
    workspace,
    canManage,
    loading,
    error,
    load,
    entitlements,
    plans,
    stripeConfigured,
    busyPlanKey,
    sub,
    currentPlanKey,
    planLabels,
    isFirm,
    firmOpen,
    setFirmOpen,
    firmBusy,
    firmForm,
    setFirmForm,
    handleCheckout,
    handleSelectPlan,
    handlePortal,
    handleCreateFirm
  } = billing;

  const visiblePlans = isFirm
    ? plans.filter((p) => p.key === PLAN_KEYS.FIRM || p.key === PLAN_KEYS.FIRM_MAX)
    : plans;

  return (
    <StateHandler loading={loading} error={error} retry={load}>
      <PageShell>
        <PageHeader
          icon={FiCreditCard}
          title="Subscription"
          subtitle={`Workspace: ${workspace?.name || "—"}. Manage plan and payment for the active workspace.`}
          actions={
            <Link to="/pricing" className="no-underline">
              <Button size="sm" variant="secondary" outline iconRight={FiExternalLink}>
                View pricing
              </Button>
            </Link>
          }
        />

        {!stripeConfigured && (
          <div className="mb-4 rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-secondary">
            Live checkout is not configured in this environment. An admin can grant Base / Max / Firm
            plans for testing.
          </div>
        )}

        {entitlements?.practiceLocked && (
          <div className="mb-4 rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-text-primary">
            Practice tools are locked (trial ended or past-due billing).{" "}
            {canManage ? (
              <>
                <button
                  type="button"
                  className="text-link underline bg-transparent border-0 p-0 cursor-pointer"
                  onClick={() => handleCheckout(isFirm ? PLAN_KEYS.FIRM : PLAN_KEYS.BASE)}
                >
                  Subscribe
                </button>
                {sub?.stripeCustomerId ? (
                  <>
                    {" "}
                    or{" "}
                    <button
                      type="button"
                      className="text-link underline bg-transparent border-0 p-0 cursor-pointer"
                      onClick={handlePortal}
                    >
                      update payment
                    </button>
                  </>
                ) : null}
              </>
            ) : (
              "Ask a billing manager to subscribe or update payment."
            )}
          </div>
        )}

        <section aria-labelledby="subscription-heading" className="mb-8">
          <h2
            id="subscription-heading"
            className="text-sm font-semibold text-text-muted uppercase tracking-wide m-0 mb-3"
          >
            Current plan
          </h2>
          <Card>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-2xl font-semibold text-text-primary m-0">
                    {entitlements?.planName || currentPlanKey}
                  </h3>
                  <Badge variant={billingStatusVariant(sub?.status)}>{sub?.status || "FREE"}</Badge>
                  {isFirm ? <Badge variant="info">Firm workspace</Badge> : null}
                </div>
                {sub?.status === "TRIALING" && sub?.trialEndsAt && (
                  <p className="text-sm text-text-muted m-0 mt-2">
                    Base trial ends {new Date(sub.trialEndsAt).toLocaleString()}
                  </p>
                )}
                {sub?.currentPeriodEnd && sub?.status === "ACTIVE" && (
                  <p className="text-sm text-text-muted m-0 mt-2">
                    Renews {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                    {sub.cancelAtPeriodEnd ? " · Cancels at period end" : ""}
                  </p>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                {canManage &&
                  !isFirm &&
                  (currentPlanKey !== PLAN_KEYS.MAX || sub?.status === "TRIALING") && (
                    <Button
                      loading={busyPlanKey === PLAN_KEYS.MAX}
                      onClick={() => handleCheckout(PLAN_KEYS.MAX)}
                    >
                      {sub?.status === "TRIALING" ? "Subscribe to Max" : "Upgrade to Max"}
                    </Button>
                  )}
                {canManage && isFirm && currentPlanKey !== PLAN_KEYS.FIRM_MAX && (
                  <Button
                    loading={busyPlanKey === PLAN_KEYS.FIRM_MAX}
                    onClick={() => handleCheckout(PLAN_KEYS.FIRM_MAX)}
                  >
                    Upgrade to Firm Max
                  </Button>
                )}
                {canManage && sub?.stripeCustomerId && (
                  <Button
                    variant="secondary"
                    outline
                    loading={busyPlanKey === "portal"}
                    onClick={handlePortal}
                  >
                    Payment method
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </section>

        <section id="change-plan" aria-labelledby="change-plan-heading" className="scroll-mt-20">
          <h2
            id="change-plan-heading"
            className="text-sm font-semibold text-text-muted uppercase tracking-wide m-0 mb-1"
          >
            Change plan
          </h2>
          <p className="text-sm text-text-secondary m-0 mb-5">
            {isFirm
              ? "Applies to the active firm workspace. Switch workspace in the top bar to bill another one."
              : "Base and Max apply to this personal workspace. Law Firm Plan and Law Firm Max create a new firm on the plan you pick."}
          </p>
          <PlanComparisonCards
            plans={visiblePlans.length ? visiblePlans : plans}
            currentPlanKey={currentPlanKey}
            highlightCurrent
            ctaMode="button"
            busyPlanKey={busyPlanKey}
            onSelectPlan={handleSelectPlan}
            getLabel={(plan) => planLabels[plan.key]}
          />
        </section>

        <FirmCreateModal
          open={firmOpen}
          onClose={() => setFirmOpen(false)}
          firmForm={firmForm}
          setFirmForm={setFirmForm}
          firmBusy={firmBusy}
          onSubmit={handleCreateFirm}
          stripeConfigured={stripeConfigured}
          plans={plans}
        />
      </PageShell>
    </StateHandler>
  );
}
