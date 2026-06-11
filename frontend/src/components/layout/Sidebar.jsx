import { Link, useLocation } from "react-router-dom";
import { FiChevronLeft, FiX, FiSidebar } from "react-icons/fi";

const EXPANDED_CLASS = "w-[240px]";
const COLLAPSED_CLASS = "w-[56px]";

export default function Sidebar({
  items = [],
  basePath = "",
  className = "",
  expanded = true,
  pinned = false,
  onTogglePin,
  onMouseEnter,
  onMouseLeave,
  mobileOpen = false,
  onMobileClose
}) {
  const location = useLocation();
  const showLabels = expanded;

  const navContent = (
    <div className="flex flex-col h-full min-h-0">
      {/* Desktop pin / collapse control */}
      <div
        className={`hidden lg:flex shrink-0 items-center border-b border-border ${
          showLabels ? "justify-end px-2 py-2" : "justify-center py-2"
        }`}
      >
        <button
          type="button"
          onClick={onTogglePin}
          className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors"
          title={
            expanded
              ? pinned
                ? "Unpin sidebar (auto-collapse on chat)"
                : "Collapse sidebar"
              : "Expand & pin sidebar"
          }
          aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
        >
          {expanded ? (
            <FiChevronLeft className="w-4 h-4" />
          ) : (
            <FiSidebar className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Mobile drawer header */}
      <div className="lg:hidden shrink-0 flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="text-sm font-semibold text-text-primary">Menu</span>
        <button
          type="button"
          onClick={onMobileClose}
          className="p-2 rounded-lg hover:bg-surface-hover text-text-secondary"
          aria-label="Close menu"
        >
          <FiX className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden py-2 px-2 space-y-0.5">
        {items.map((item) => {
          const path = `${basePath}/${item.id}`;
          const isActive = location.pathname === path;
          const IconComponent = item.icon;

          return (
            <Link
              key={item.id}
              to={path}
              onClick={onMobileClose}
              title={!showLabels ? item.label : undefined}
              className={`group flex items-center gap-3 rounded-lg no-underline transition-all duration-200 ${
                showLabels ? "py-2.5 px-3" : "py-2.5 px-0 justify-center"
              } ${
                isActive
                  ? "bg-primary text-primary-text shadow-sm"
                  : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
              }`}
            >
              <div className="flex items-center justify-center w-5 h-5 shrink-0">
                {IconComponent && (
                  <IconComponent
                    className={`w-5 h-5 ${
                      isActive ? "text-primary-text" : "text-current"
                    }`}
                  />
                )}
              </div>
              {showLabels && (
                <span
                  className={`text-sm font-medium truncate ${
                    isActive ? "text-primary-text" : ""
                  }`}
                >
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {pinned && showLabels && (
        <div className="hidden lg:block shrink-0 px-3 py-2 border-t border-border">
          <p className="text-[10px] text-text-muted flex items-center gap-1">
            <FiSidebar className="w-3 h-3" />
            Sidebar pinned
          </p>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300 ${
          mobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onMobileClose}
        aria-hidden="true"
      />

      {/* Mobile drawer */}
      <aside
        className={`
          fixed top-11 left-0 bottom-0 z-50 w-[260px] bg-card border-r border-border
          lg:hidden transition-transform duration-300 ease-in-out
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          ${className}
        `}
      >
        {navContent}
      </aside>

      {/* Desktop rail */}
      <aside
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        className={`
          hidden lg:flex flex-col shrink-0 h-full min-h-0
          bg-card border-r border-border
          transition-[width] duration-300 ease-in-out overflow-hidden
          ${expanded ? EXPANDED_CLASS : COLLAPSED_CLASS}
          ${className}
        `}
      >
        {navContent}
      </aside>
    </>
  );
}
