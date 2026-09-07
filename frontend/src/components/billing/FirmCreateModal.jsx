import { Button, Input, Modal, Textarea } from "../ui";

export default function FirmCreateModal({
  open,
  onClose,
  firmForm,
  setFirmForm,
  firmBusy,
  onSubmit,
  stripeConfigured
}) {
  return (
    <Modal isOpen={open} onClose={() => !firmBusy && onClose()} title="Create a firm workspace" size="md">
      <p className="text-sm text-text-secondary m-0 mb-4">
        Firm plan includes seats and shared quotas. With Stripe configured, you&apos;ll complete
        payment before the firm is created.
      </p>
      <form onSubmit={onSubmit} className="space-y-0">
        <Input
          label="Firm name"
          value={firmForm.name}
          onChange={(e) => setFirmForm((f) => ({ ...f, name: e.target.value }))}
          required
        />
        <Input
          label="City"
          value={firmForm.city}
          onChange={(e) => setFirmForm((f) => ({ ...f, city: e.target.value }))}
        />
        <Input
          label="Phone"
          value={firmForm.phone}
          onChange={(e) => setFirmForm((f) => ({ ...f, phone: e.target.value }))}
        />
        <Textarea
          label="Description"
          rows={3}
          value={firmForm.description}
          onChange={(e) => setFirmForm((f) => ({ ...f, description: e.target.value }))}
        />
        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end mt-2">
          <Button type="button" variant="secondary" outline disabled={firmBusy} onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={firmBusy}>
            {stripeConfigured ? "Continue to checkout" : "Create firm"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
