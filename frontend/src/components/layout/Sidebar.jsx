import { Link, useLocation } from "react-router-dom";

export default function Sidebar({ 
  items = [], 
  basePath = "",
  className = "",
}) {
  const location = useLocation();

  return (
    <nav className={`w-[280px] min-w-[280px] border-r border-border bg-card h-[calc(100vh-64px)] fixed top-16 left-0 overflow-y-auto z-[999] ${className}`}>
      <div className="p-4">
        {items.map((item) => {
          const path = `${basePath}/${item.id}`;
          const isActive = location.pathname === path;
          const IconComponent = item.icon;
          
          return (
            <Link
              key={item.id}
              to={path}
              className={`group flex items-center gap-3 py-3 px-4 rounded-lg mb-1 no-underline transition-all duration-200 cursor-pointer relative ${
                isActive 
                  ? "bg-primary text-primary-text shadow-md" 
                  : "bg-transparent text-text-secondary hover:bg-surface-hover hover:text-text-primary"
              }`}
            >
              {/* Icon */}
              <div className={`flex items-center justify-center w-5 h-5 transition-transform duration-200 ${
                isActive ? "scale-110" : "group-hover:scale-105"
              }`}>
                {IconComponent && <IconComponent className={`w-5 h-5 ${isActive ? "text-primary-text" : "text-text-secondary group-hover:text-text-primary"}`} />}
              </div>
              
              {/* Label */}
              <span className={`text-sm font-medium transition-colors ${
                isActive ? "text-primary-text" : "text-text-secondary group-hover:text-text-primary"
              }`}>
                {item.label}
              </span>
              
              {/* Active indicator */}
              {isActive && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary-text opacity-80" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
