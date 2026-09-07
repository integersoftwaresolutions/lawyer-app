import { useReveal } from "./useReveal";

/**
 * Scroll-reveal wrapper. Replays each time it enters the viewport.
 */
export default function Reveal({
  as: Tag = "div",
  children,
  className = "",
  delay = 0,
  ...rest
}) {
  const { ref, isVisible, isResetting } = useReveal();

  return (
    <Tag
      ref={ref}
      className={`reveal ${isVisible ? "is-visible" : ""} ${isResetting ? "is-resetting" : ""} ${className}`.trim()}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/**
 * Observes once per group; children stagger together and replay on re-enter.
 */
export function RevealGroup({
  as: Tag = "div",
  children,
  className = "",
  ...rest
}) {
  const { ref, isVisible, isResetting } = useReveal();

  return (
    <Tag
      ref={ref}
      className={`reveal-group ${isVisible ? "is-visible" : ""} ${isResetting ? "is-resetting" : ""} ${className}`.trim()}
      {...rest}
    >
      {children}
    </Tag>
  );
}
