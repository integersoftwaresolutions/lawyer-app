import { FiCpu } from "react-icons/fi";
import Badge from "./Badge";
import PageHeader from "./PageHeader";
import PageShell from "./PageShell";

export default function ComingSoonPanel({
  icon: Icon = FiCpu,
  title,
  description = "Research chat, cross-examination practice, and document intelligence are launching soon. Your other practice tools stay available."
}) {
  return (
    <PageShell className="h-full">
      <PageHeader
        icon={Icon}
        title={title}
        actions={
          <Badge variant="warning" size="sm">
            Coming soon
          </Badge>
        }
      />
      <div className="rounded-2xl border border-border bg-card px-6 py-16 sm:py-20 text-center">
        <div className="mx-auto w-12 h-12 rounded-xl bg-primary-light text-primary flex items-center justify-center mb-4">
            <Icon className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-semibold text-text-primary m-0">This module is coming soon</h2>
        <p className="text-sm text-text-secondary max-w-md mx-auto m-0 mt-2 leading-relaxed">
          {description}
        </p>
      </div>
    </PageShell>
  );
}
