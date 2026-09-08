import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FiChevronRight } from "react-icons/fi";

function resolvePath(item, basePath) {
  if (item.to) return item.to;
  if (!basePath) return `/${item.id}`;
  return `${basePath.replace(/\/$/, "")}/${item.id}`;
}

function pathMatches(pathname, path, exact = false) {
  if (!path) return false;
  const normalized = path.replace(/\/$/, "") || "/";
  const current = pathname.replace(/\/$/, "") || "/";
  if (exact) return current === normalized;
  return current === normalized || current.startsWith(`${normalized}/`);
}

function isLeafActive(pathname, item, basePath) {
  return pathMatches(pathname, resolvePath(item, basePath), Boolean(item.exact));
}

function hasActiveDescendant(pathname, item, basePath) {
  if (!item.children?.length) return false;
  return item.children.some(
    (child) =>
      isLeafActive(pathname, child, basePath) ||
      hasActiveDescendant(pathname, child, basePath)
  );
}

const rowBase =
  "group flex items-center gap-3 w-full rounded-lg no-underline outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-primary";

function NavLeaf({ item, basePath, onNavigate, nested = false }) {
  const location = useLocation();
  const path = resolvePath(item, basePath);
  const isActive = isLeafActive(location.pathname, item, basePath);
  const IconComponent = item.icon;

  return (
    <Link
      to={path}
      onClick={onNavigate}
      aria-current={isActive ? "page" : undefined}
      className={`${rowBase} ${nested ? "py-2 px-3" : "py-2.5 px-3"} ${
        isActive
          ? "bg-surface-hover text-text-primary"
          : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
      }`}
    >
      {IconComponent ? (
        <IconComponent
          className={`w-[18px] h-[18px] shrink-0 ${
            isActive ? "text-text-muted group-hover:text-text-secondary" : "text-text-muted group-hover:text-text-secondary"
          }`}
        />
      ) : null}
      <span className={`text-sm truncate min-w-0 ${isActive ? "font-semibold" : "font-medium"}`}>
        {item.label}
      </span>
      {item.badge ? (
        <span className="ml-auto text-[10px] font-semibold uppercase tracking-wide text-warning bg-warning-light px-1.5 py-0.5 rounded-full shrink-0">
          {item.badge}
        </span>
      ) : null}
    </Link>
  );
}

function NavBranch({ item, basePath, onNavigate, expandedIds, toggleExpanded }) {
  const location = useLocation();
  const path = resolvePath(item, basePath);
  const childActive = hasActiveDescendant(location.pathname, item, basePath);
  const selfOnlyActive =
    pathMatches(location.pathname, path, Boolean(item.exact)) && !childActive;
  const isExpanded = expandedIds.has(item.id) || childActive;
  const IconComponent = item.icon;

  return (
    <div>
      <div
        className={`${rowBase} py-2.5 pl-3 pr-1.5 ${
          selfOnlyActive
            ? "bg-surface-hover text-text-primary"
            : childActive
              ? "text-text-primary"
              : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
        }`}
      >
        <Link
          to={path}
          onClick={onNavigate}
          className="flex items-center gap-3 flex-1 min-w-0 no-underline text-inherit outline-none"
        >
          {IconComponent ? (
            <IconComponent
              className={`w-[18px] h-[18px] shrink-0 ${
                selfOnlyActive || childActive
                  ? "text-text-muted group-hover:text-text-secondary"
                  : "text-text-muted group-hover:text-text-secondary"
              }`}
            />
          ) : null}
          <span
            className={`text-sm truncate min-w-0 ${
              selfOnlyActive || childActive ? "font-semibold" : "font-medium"
            }`}
          >
            {item.label}
          </span>
          {item.badge ? (
            <span className="ml-auto text-[10px] font-semibold uppercase tracking-wide text-warning bg-warning-light px-1.5 py-0.5 rounded-full shrink-0">
              {item.badge}
            </span>
          ) : null}
        </Link>
        <button
          type="button"
          aria-label={isExpanded ? `Collapse ${item.label}` : `Expand ${item.label}`}
          aria-expanded={isExpanded}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleExpanded(item.id);
          }}
          className="shrink-0 p-1.5 rounded-md border-0 cursor-pointer bg-transparent text-text-muted hover:text-text-primary hover:bg-surface-hover outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <FiChevronRight
            className={`w-4 h-4 transition-transform duration-150 ${
              isExpanded ? "rotate-90" : "rotate-0"
            }`}
          />
        </button>
      </div>

      {isExpanded ? (
        <div className="ml-4 mt-0.5 space-y-0.5" role="group" aria-label={item.label}>
          {item.children.map((child) =>
            child.children?.length ? (
              <NavBranch
                key={child.id}
                item={child}
                basePath={basePath}
                onNavigate={onNavigate}
                expandedIds={expandedIds}
                toggleExpanded={toggleExpanded}
              />
            ) : (
              <NavLeaf
                key={child.id}
                item={child}
                basePath={basePath}
                onNavigate={onNavigate}
                nested
              />
            )
          )}
        </div>
      ) : null}
    </div>
  );
}

export default function DashboardNav({ items = [], basePath = "", onNavigate }) {
  const location = useLocation();
  const [expandedIds, setExpandedIds] = useState(() => new Set());

  useEffect(() => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      items.forEach((item) => {
        if (item.children?.length && hasActiveDescendant(location.pathname, item, basePath)) {
          next.add(item.id);
        }
      });
      return next;
    });
  }, [location.pathname, items, basePath]);

  const toggleExpanded = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <nav className="space-y-0.5" aria-label="Dashboard">
      {items.map((item) =>
        item.children?.length ? (
          <NavBranch
            key={item.id}
            item={item}
            basePath={basePath}
            onNavigate={onNavigate}
            expandedIds={expandedIds}
            toggleExpanded={toggleExpanded}
          />
        ) : (
          <NavLeaf key={item.id} item={item} basePath={basePath} onNavigate={onNavigate} />
        )
      )}
    </nav>
  );
}
