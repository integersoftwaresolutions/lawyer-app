import { Link } from "react-router-dom";
import { FiShield } from "react-icons/fi";
import { Badge, Button, PageHeader, PageShell } from "../ui";

export function verificationCopy(status) {
  if (status === "REJECTED") {
    return {
      heading: "Verification needs attention",
      body: "Your verification was not approved. Review the feedback and resubmit your documents to use bookings, availability, earnings, and related marketplace tools."
    };
  }
  return {
    heading: "Verification required",
    body: "This page is available after your lawyer profile is verified. Clients can only book verified lawyers."
  };
}

/** Full-page placeholder for marketplace tools that require KYC. */
export default function VerificationRequiredPanel({
  icon: Icon = FiShield,
  title,
  subtitle,
  status = "PENDING",
  compact = false
}) {
  const copy = verificationCopy(status);

  const inner = (
    <>
      <div className="mx-auto w-12 h-12 rounded-xl bg-warning-light text-warning flex items-center justify-center mb-4">
        <FiShield className="w-6 h-6" />
      </div>
      <h2 className="text-lg font-semibold text-text-primary m-0">{copy.heading}</h2>
      <p className="text-sm text-text-secondary max-w-md mx-auto m-0 mt-2 leading-relaxed">
        {copy.body}
      </p>
      <Link to="/lawyer/verification" className="no-underline inline-flex mt-6">
        <Button>Go to verification</Button>
      </Link>
    </>
  );

  if (compact) {
    return <div className="px-4 py-10 text-center">{inner}</div>;
  }

  return (
    <PageShell className="h-full">
      <PageHeader
        icon={Icon}
        title={title}
        subtitle={subtitle}
        actions={
          <Badge variant="warning" size="sm">
            Verification needed
          </Badge>
        }
      />
      <div className="rounded-2xl border border-border bg-card px-6 py-16 sm:py-20 text-center">{inner}</div>
    </PageShell>
  );
}
