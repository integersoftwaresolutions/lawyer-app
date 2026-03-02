import { Link, useLocation } from "react-router-dom";

export default function Sidebar({ 
  items = [], 
  basePath = "",
  className = "",
}) {
  const location = useLocation();

  return (
    <nav className={`w-[260px] min-w-[260px] border-r border-border bg-card p-4 h-[calc(100vh-50px)] fixed top-16 left-0 overflow-y-auto z-[999] ${className}`}>
      {items.map((item) => {
        const path = `${basePath}/${item.id}`;
        const isActive = location.pathname === path;
        return (
          <Link
            key={item.id}
            to={path}
            className={`flex items-center gap-3 py-3 px-4 rounded-md mb-1 no-underline transition-all duration-200 cursor-pointer ${
              isActive 
                ? "bg-primary text-primary-text" 
                : "bg-transparent text-text-secondary hover:bg-surface"
            }`}
          >
            <span className="text-lg w-6 text-center">{item.icon}</span>
            <span className="text-sm font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
