import { FiSave } from "react-icons/fi";
import Button from "./Button";

export default function StickySaveBar({
  dirty = false,
  onSave,
  loading = false,
  saveLabel = "Save changes",
  savedMessage = "All changes saved",
  dirtyMessage = "You have unsaved changes",
  hint,
  onCancel,
  cancelLabel = "Cancel",
  disabled,
  submitType = "button",
  className = ""
}) {
  const isDisabled = disabled ?? (!dirty && !loading);

  return (
    <div
      className={`sticky bottom-0 z-20 mt-6 -mx-1 px-1 pt-4 pb-2 bg-gradient-to-t from-background from-60% to-transparent ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 rounded-xl border border-border bg-card shadow-lg">
        <div className="min-w-0">
          {dirty ? (
            <p className="text-sm font-medium text-warning m-0">{dirtyMessage}</p>
          ) : (
            <p className="text-sm text-text-muted m-0">{savedMessage}</p>
          )}
          {hint && (
            <p className="text-xs text-text-muted mt-0.5 mb-0 hidden sm:block">{hint}</p>
          )}
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-2 w-full sm:w-auto shrink-0">
          {onCancel && (
            <Button
              type="button"
              variant="secondary"
              outline
              onClick={onCancel}
              className="w-full sm:w-auto"
            >
              {cancelLabel}
            </Button>
          )}
          <Button
            type={submitType}
            icon={FiSave}
            onClick={submitType === "button" ? onSave : undefined}
            loading={loading}
            disabled={isDisabled}
            className="w-full sm:w-auto"
          >
            {saveLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
