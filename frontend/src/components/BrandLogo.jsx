import { Link } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

export const LOGO_LIGHT = "/images/adal-logo-light-mode.png";
export const LOGO_DARK = "/images/adal-logo-dark-mode.png";

export default function BrandLogo({
  to = "/",
  showWordmark = true,
  className = "",
  imgClassName = "h-8 w-auto",
  wordmarkClassName = "font-bold text-text-primary truncate text-lg md:text-xl"
}) {
  const { isDarkMode } = useTheme();
  const src = isDarkMode ? LOGO_DARK : LOGO_LIGHT;

  const content = (
    <>
      <img
        src={src}
        alt={showWordmark ? "" : "Adal AI"}
        aria-hidden={showWordmark ? true : undefined}
        className={`object-contain ${imgClassName}`}
        width={32}
        height={32}
      />
      {showWordmark ? (
        <span className={wordmarkClassName}>Adal AI</span>
      ) : null}
    </>
  );

  const shared = `inline-flex items-center gap-2 no-underline shrink-0 ${className}`.trim();

  if (to) {
    return (
      <Link to={to} className={shared} aria-label="Adal AI home">
        {content}
      </Link>
    );
  }

  return <div className={shared}>{content}</div>;
}
