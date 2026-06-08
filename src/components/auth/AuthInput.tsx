interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function AuthInput({ label, error, id, ...props }: AuthInputProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div>
      <label
        htmlFor={inputId}
        className="mb-1.5 block text-sm font-medium text-gray-300"
      >
        {label}
      </label>
      <input
        id={inputId}
        className={`w-full rounded-lg border bg-surface px-3 py-2.5 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-1 ${
          error
            ? "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/30"
            : "border-border focus:border-accent/50 focus:ring-accent/30"
        }`}
        {...props}
      />
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </div>
  );
}
