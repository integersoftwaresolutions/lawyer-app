export default function Select({ 
  label,
  error,
  options = [],
  placeholder = "Select an option",
  fullWidth = true,
  className = "",
  containerClassName = "",
  ...props 
}) {
  return (
    <div className={`mb-4 ${containerClassName}`}>
      {label && (
        <label className="block mb-2 text-sm font-medium text-text-secondary">
          {label}
        </label>
      )}
      <select
        className={`${fullWidth ? "w-full" : ""} py-3 px-4 pr-9 rounded-md border ${
          error ? "border-danger" : "border-input-border"
        } bg-input-background text-input-text text-sm outline-none cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'12\\' height=\\'12\\' viewBox=\\'0 0 12 12\\'%3E%3Cpath fill=\\'%23666\\' d=\\'M6 8L1 3h10z\\'/%3E%3C/svg%3E')] bg-no-repeat bg-[right_12px_center] ${className}`}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}
