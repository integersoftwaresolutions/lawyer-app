import { ComingSoonPanel } from "../ui";
import { BILLING_COMING_SOON } from "../../config/features";

/** Swap billing page bodies for a placeholder without removing routes or nav. */
export default function BillingComingSoonGate({ icon, title, description, children }) {
  if (BILLING_COMING_SOON) {
    return <ComingSoonPanel icon={icon} title={title} description={description} />;
  }
  return children;
}
