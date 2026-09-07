import { useTheme } from "../../../context/ThemeContext";

/** Light/dark marketing image swap */
export default function ThemeImage({
  lightSrc,
  darkSrc,
  alt,
  className = "",
  width,
  height,
  loading = "lazy",
}) {
  const { isDarkMode } = useTheme();

  return (
    <img
      src={isDarkMode ? darkSrc : lightSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      loading={loading}
      decoding="async"
    />
  );
}

/**
 * Expressive framed product visual for landing spotlights.
 * Files live at /images/marketing/spotlights/{name}-light|dark.png
 */
export function SpotlightImage({ name, alt, className = "", eager = false }) {
  return (
    <figure className={`mkt-spotlight ${className}`.trim()}>
      <div className="mkt-spotlight__frame">
        <ThemeImage
          lightSrc={`/images/marketing/spotlights/${name}-light.png`}
          darkSrc={`/images/marketing/spotlights/${name}-dark.png`}
          alt={alt}
          width={1100}
          height={620}
          loading={eager ? "eager" : "lazy"}
          className="mkt-spotlight__img"
        />
      </div>
    </figure>
  );
}
