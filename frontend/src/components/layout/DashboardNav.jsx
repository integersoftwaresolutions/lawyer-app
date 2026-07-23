import { Link, useLocation } from "react-router-dom";

export default function DashboardNav({ items = [], basePath = "", onNavigate }) {
  const location = useLocation();

  return (
    <nav className="space-y-0.5">
      {items.map((item) => {
        const path = `${basePath}/${item.id}`;
        const isActive =
          location.pathname === path || location.pathname.startsWith(`${path}/`);
        const IconComponent = item.icon;

        return (
          <Link
            key={item.id}
            to={path}
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-lg no-underline transition-colors duration-200 py-2.5 px-3 ${
              isActive
                ? "bg-primary text-primary-text shadow-sm"
                : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
            }`}
          >
            <div className="flex items-center justify-center w-5 h-5 shrink-0">
              {IconComponent && (
                <IconComponent
                  className={`w-5 h-5 ${isActive ? "text-primary-text" : "text-current"}`}
                />
              )}
            </div>
            <span className={`text-sm font-medium truncate ${isActive ? "text-primary-text" : ""}`}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
