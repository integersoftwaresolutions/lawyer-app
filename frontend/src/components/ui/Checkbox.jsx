export default function Checkbox({ 
  label,
  error,
  checked = false,
  onChange,
  id,
  containerClassName = "",
  ...props 
}) {
  const handleChange = (e) => {
    if (onChange) onChange(e);
  };

  return (
    <div>
      <div className={`flex items-start gap-2.5 mb-4 ${containerClassName}`}>
        <div className="relative inline-flex">
          <input 
            type="checkbox" 
            id={id}
            checked={checked}
            onChange={handleChange}
            className={`w-[18px] h-[18px] min-w-[18px] rounded border ${
              error ? "border-danger" : "border-input-border"
            } ${checked ? "bg-primary" : "bg-input-background"} cursor-pointer appearance-none relative mt-0.5`}
            {...props} 
          />
          {checked && (
            <svg 
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 pointer-events-none"
              viewBox="0 0 12 10" 
              fill="none"
            >
              <path 
                d="M1 5L4.5 8.5L11 1" 
                stroke="white" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
        {label && (
          <label htmlFor={id} className="text-sm text-text-secondary cursor-pointer leading-normal">
            {label}
          </label>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}
