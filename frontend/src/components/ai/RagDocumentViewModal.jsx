import { useEffect, useState } from "react";
import { FiAlertCircle } from "react-icons/fi";
import { Badge, Button, Modal } from "../ui";
import Spinner from "../ui/Spinner";
import { getErrorMessage } from "../../utils/errorHandler";

const STATUS_COLORS = {
  INDEXED: "success",
  ready: "success",
  PROCESSING: "info",
  processing: "info",
  PENDING: "warning",
  pending: "warning",
  FAILED: "danger",
  failed: "danger"
};

export default function RagDocumentViewModal({ isOpen, onClose, documentId, fetchDocument, variant = "document" }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [doc, setDoc] = useState(null);

  useEffect(() => {
    if (!isOpen || !documentId || !fetchDocument) {
      setDoc(null);
      setError(null);
      return undefined;
    }

    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchDocument(documentId);
        if (!cancelled) setDoc(res?.data ?? null);
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen, documentId, fetchDocument]);

  const statusLabel = (doc?.status || "").toLowerCase();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={doc?.title || "Document"}
      size="xl"
      footer={
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      }
    >
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner className="w-6 h-6 text-primary" />
        </div>
      ) : error ? (
        <div className="flex items-start gap-2 rounded-lg p-3 text-sm bg-danger-light text-danger border border-danger">
          <FiAlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p className="m-0">{error}</p>
        </div>
      ) : doc ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {doc.status && (
              <Badge variant={STATUS_COLORS[doc.status] || "default"} size="sm">
                {statusLabel}
              </Badge>
            )}
            {doc.chunkCount != null && <span className="text-xs text-text-muted">{doc.chunkCount} chunks</span>}
            {doc.rawTextChars > 0 && (
              <span className="text-xs text-text-muted">· {doc.rawTextChars.toLocaleString()} characters</span>
            )}
            {doc.createdAt && (
              <span className="text-xs text-text-muted">
                · added {new Date(doc.createdAt).toLocaleDateString()}
              </span>
            )}
          </div>

          {variant === "case-law" ? (
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm m-0">
              {doc.court && (
                <>
                  <dt className="text-text-muted m-0">Court</dt>
                  <dd className="text-text-primary m-0">{doc.court}</dd>
                </>
              )}
              {doc.year && (
                <>
                  <dt className="text-text-muted m-0">Year</dt>
                  <dd className="text-text-primary m-0">{doc.year}</dd>
                </>
              )}
              {doc.citation && (
                <>
                  <dt className="text-text-muted m-0">Citation</dt>
                  <dd className="text-text-primary m-0">{doc.citation}</dd>
                </>
              )}
              {doc.caseReference && (
                <>
                  <dt className="text-text-muted m-0">Case reference</dt>
                  <dd className="text-text-primary m-0">{doc.caseReference}</dd>
                </>
              )}
              {doc.subject && (
                <>
                  <dt className="text-text-muted m-0">Subject</dt>
                  <dd className="text-text-primary m-0">{doc.subject}</dd>
                </>
              )}
            </dl>
          ) : (
            <>
              {doc.caseRef && (
                <p className="text-sm text-text-secondary m-0">
                  <span className="font-medium text-text-primary">Case ref:</span> {doc.caseRef}
                </p>
              )}
              {doc.description && (
                <p className="text-sm text-text-secondary m-0">{doc.description}</p>
              )}
            </>
          )}

          {doc.statusMessage && (
            <p className="text-sm text-danger m-0">{doc.statusMessage}</p>
          )}

          <div className="rounded-lg border border-border bg-surface overflow-hidden">
            <div className="px-3 py-2 border-b border-border bg-surface-hover">
              <p className="text-xs font-semibold uppercase tracking-wide text-text-muted m-0">
                Full text
              </p>
            </div>
            {doc.rawText ? (
              <pre className="m-0 p-4 text-sm text-text-primary whitespace-pre-wrap break-words font-sans max-h-[50vh] overflow-y-auto">
                {doc.rawText}
              </pre>
            ) : (
              <p className="m-0 p-4 text-sm text-text-muted">
                No text content available. The document may still be processing.
              </p>
            )}
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
