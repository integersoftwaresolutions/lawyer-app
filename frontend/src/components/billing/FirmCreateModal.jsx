import { Button, Input, Modal, Textarea } from "../ui";
import { formatPlanPrice, getDefaultPlans, PLAN_KEYS } from "../../billing/plans";

function optionalLabel(label) {
  return `${label} (optional)`;
}

export default function FirmCreateModal({
  open,
  onClose,
  firmForm,
  setFirmForm,
  firmBusy,
  onSubmit,
  stripeConfigured,
  plans
}) {
  const firmPlans = (plans?.length ? plans : getDefaultPlans()).filter(
    (p) => p.key === PLAN_KEYS.FIRM || p.key === PLAN_KEYS.FIRM_MAX
  );
  const selectedKey = firmForm.planKey || PLAN_KEYS.FIRM;
  const selectedPlan = firmPlans.find((p) => p.key === selectedKey) || firmPlans[0];
  const checkoutLabel = selectedPlan?.name || "Law Firm Plan";

  return (
    <Modal
      isOpen={open}
      onClose={() => !firmBusy && onClose()}
      title="Create firm workspace"
      size="lg"
    >
      <p className="text-sm text-text-secondary m-0 mb-4">
        Choose Law Firm Plan or Law Firm Max. Only the firm name and plan are required — everything
        else can be filled in later.{" "}
        {stripeConfigured
          ? "You’ll complete payment for the selected plan before the firm is created."
          : "Stripe is not configured here, so the firm will be created on the selected plan immediately."}
      </p>

      <form onSubmit={onSubmit} className="space-y-0">
        <fieldset className="m-0 mb-4 p-0 border-0">
          <legend className="block mb-2 text-sm font-medium text-text-secondary">
            Plan (required)
          </legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {firmPlans.map((plan) => {
              const selected = selectedKey === plan.key;
              const price = formatPlanPrice(plan);
              return (
                <button
                  key={plan.key}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setFirmForm((f) => ({ ...f, planKey: plan.key }))}
                  className={`text-left rounded-lg border-2 p-4 transition-colors ${
                    selected
                      ? "border-primary bg-primary-light"
                      : "border-border bg-card hover:bg-card-hover"
                  }`}
                >
                  <div className="font-semibold text-text-primary">{plan.name}</div>
                  <p className="text-xs text-text-secondary m-0 mt-1">{plan.tagline}</p>
                  <p className="text-sm font-medium text-text-primary m-0 mt-2">
                    {price.primary}
                    {price.secondary ? (
                      <span className="text-text-muted font-normal">{price.secondary}</span>
                    ) : null}
                  </p>
                  <p className="text-xs text-text-muted m-0 mt-1">
                    Up to {plan.limits?.seats ?? "—"} seats
                  </p>
                </button>
              );
            })}
          </div>
        </fieldset>

        <Input
          label="Firm name (required)"
          value={firmForm.name}
          onChange={(e) => setFirmForm((f) => ({ ...f, name: e.target.value }))}
          required
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label={optionalLabel("City")}
            value={firmForm.city}
            onChange={(e) => setFirmForm((f) => ({ ...f, city: e.target.value }))}
          />
          <Input
            label={optionalLabel("Phone")}
            value={firmForm.phone}
            onChange={(e) => setFirmForm((f) => ({ ...f, phone: e.target.value }))}
          />
        </div>
        <Input
          label={optionalLabel("Website")}
          value={firmForm.website || ""}
          onChange={(e) => setFirmForm((f) => ({ ...f, website: e.target.value }))}
        />
        <Input
          label={optionalLabel("Address")}
          value={firmForm.address || ""}
          onChange={(e) => setFirmForm((f) => ({ ...f, address: e.target.value }))}
        />
        <Input
          label={optionalLabel("Practice areas")}
          placeholder="Family Law, Criminal Law"
          helperText="Comma-separated. You can add these later."
          value={firmForm.practiceAreas || ""}
          onChange={(e) => setFirmForm((f) => ({ ...f, practiceAreas: e.target.value }))}
        />
        <Textarea
          label={optionalLabel("Description")}
          rows={3}
          value={firmForm.description}
          onChange={(e) => setFirmForm((f) => ({ ...f, description: e.target.value }))}
        />
        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end mt-2">
          <Button type="button" variant="secondary" outline disabled={firmBusy} onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={firmBusy}>
            {stripeConfigured ? `Continue to ${checkoutLabel} checkout` : `Create firm on ${checkoutLabel}`}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
