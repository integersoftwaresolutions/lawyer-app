import { FiArrowLeft } from "react-icons/fi";

export function BackButton({ onClick, label = "Back" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 mb-4 py-2 bg-transparent border-none text-text-secondary text-sm cursor-pointer hover:text-text-primary transition-colors"
    >
      <FiArrowLeft />
      {label}
    </button>
  );
}

