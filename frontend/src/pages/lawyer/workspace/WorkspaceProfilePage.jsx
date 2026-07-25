import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { FiSettings } from "react-icons/fi";
import {
  Button,
  Card,
  ConfirmModal,
  Input,
  PageHeader,
  PageShell,
  StickySaveBar,
  Textarea
} from "../../../components/ui";
import { FormSection, FormRow } from "../../auth/AuthLayout";
import { useWorkspace } from "../../../hooks/useWorkspaceAccess";
import { workspaceApi } from "../../../services/workspace.api";
import { activateWorkspace, fetchWorkspaces } from "../../../store/slices/workspaceSlice";
import { useToast } from "../../../hooks/useToast";
import { getErrorMessage } from "../../../utils/errorHandler";

function buildFormFromWorkspace(workspace) {
  return {
    name: workspace?.name || "",
    city: workspace?.city || "",
    phone: workspace?.phone || "",
    website: workspace?.website || "",
    address: workspace?.address || "",
    description: workspace?.description || "",
    practiceAreas: (workspace?.practiceAreas || []).join(", ")
  };
}

export default function WorkspaceProfilePage() {
  const dispatch = useDispatch();
  const toast = useToast();
  const { workspace, workspaceId, isOwner } = useWorkspace();
  const [form, setForm] = useState(buildFormFromWorkspace(null));
  const [savedSnapshot, setSavedSnapshot] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmDissolve, setConfirmDissolve] = useState(false);

  useEffect(() => {
    if (!workspace) return;
    const next = buildFormFromWorkspace(workspace);
    setForm(next);
    setSavedSnapshot(JSON.stringify(next));
  }, [workspace]);

  const isDirty = savedSnapshot !== "" && JSON.stringify(form) !== savedSnapshot;

  const handleChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
  };

  const handleCancel = () => {
    if (!savedSnapshot) return;
    setForm(JSON.parse(savedSnapshot));
  };

  async function handleSave(e) {
    e?.preventDefault?.();
    if (!form.name.trim()) {
      toast.error("Firm name is required");
      return;
    }

    setBusy(true);
    try {
      await workspaceApi.update(workspaceId, {
        name: form.name.trim(),
        city: form.city,
        phone: form.phone,
        website: form.website,
        address: form.address,
        description: form.description,
        practiceAreas: form.practiceAreas
          ? form.practiceAreas
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : []
      });
      await dispatch(fetchWorkspaces());
      await dispatch(activateWorkspace(workspaceId));
      setSavedSnapshot(JSON.stringify(form));
      toast.success("Firm profile updated");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleDissolve() {
    setBusy(true);
    try {
      await workspaceApi.dissolve(workspaceId);
      await dispatch(fetchWorkspaces());
      setConfirmDissolve(false);
      toast.success("Firm dissolved");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageShell>
      <PageHeader
        icon={FiSettings}
        title="Firm profile"
        subtitle="Name, contact, and practice details"
      />

      <form onSubmit={handleSave}>
        <Card className="mb-6">
          <FormSection title="Firm details">
            <FormRow>
              <Input
                label="Firm name"
                value={form.name || ""}
                onChange={handleChange("name")}
                placeholder="Enter firm name"
                required
              />
              <Input
                label="City"
                value={form.city || ""}
                onChange={handleChange("city")}
                placeholder="e.g. Lahore"
              />
            </FormRow>

            <FormRow>
              <Input
                label="Phone"
                type="tel"
                value={form.phone || ""}
                onChange={handleChange("phone")}
                placeholder="+92 300 1234567"
              />
              <Input
                label="Website"
                type="url"
                value={form.website || ""}
                onChange={handleChange("website")}
                placeholder="https://example.com"
              />
            </FormRow>

            <Input
              label="Address"
              value={form.address || ""}
              onChange={handleChange("address")}
              placeholder="Office address"
              helperText="Optional"
            />

            <Input
              label="Practice areas"
              value={form.practiceAreas || ""}
              onChange={handleChange("practiceAreas")}
              placeholder="Corporate, Family, Criminal"
              helperText="Comma-separated list"
            />

            <Textarea
              label="Description"
              rows={4}
              value={form.description || ""}
              onChange={handleChange("description")}
              placeholder="Short description of the firm"
              helperText="Optional"
            />
          </FormSection>
        </Card>

        {isOwner && (
          <Card className="mb-6">
            <FormSection title="Danger zone">
              <p className="text-sm text-text-secondary m-0 mb-4">
                Dissolving the firm revokes roles and invites. Remove all other members first.
              </p>
              <Button
                type="button"
                variant="danger"
                outline
                onClick={() => setConfirmDissolve(true)}
              >
                Dissolve firm
              </Button>
            </FormSection>
          </Card>
        )}

        <StickySaveBar
          dirty={isDirty}
          submitType="submit"
          loading={busy}
          saveLabel="Save profile"
          onCancel={isDirty ? handleCancel : undefined}
          cancelLabel="Discard"
          hint="Changes apply to this firm workspace only"
        />
      </form>

      <ConfirmModal
        isOpen={confirmDissolve}
        onClose={() => setConfirmDissolve(false)}
        onConfirm={handleDissolve}
        title="Dissolve this firm?"
        confirmLabel="Dissolve"
        confirmVariant="danger"
        loading={busy}
      >
        <p className="text-text-secondary m-0">
          All members must be removed first. Firm roles and invites will be revoked.
        </p>
      </ConfirmModal>
    </PageShell>
  );
}
