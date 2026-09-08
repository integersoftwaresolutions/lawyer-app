import { ComingSoonPanel } from "../ui";
import { AI_COMING_SOON } from "../../config/features";

/** Swap AI page bodies for a placeholder without removing routes or nav. */
export default function AiComingSoonGate({ icon, title, description, children }) {
  if (AI_COMING_SOON) {
    return <ComingSoonPanel icon={icon} title={title} description={description} />;
  }
  return children;
}
