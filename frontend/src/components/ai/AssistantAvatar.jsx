export default function AssistantAvatar({
  icon: Icon,
  className = "bg-primary-light text-primary"
}) {
  const IconComponent = Icon;
  return (
    <div
      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${className}`}
    >
      {IconComponent ? <IconComponent className="w-4 h-4" /> : null}
    </div>
  );
}
