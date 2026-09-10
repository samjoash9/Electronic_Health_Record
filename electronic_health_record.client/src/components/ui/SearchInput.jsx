import { Search, X } from 'lucide-react';

export default function SearchInput({ id, label, value, onChange, placeholder, className = '' }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={id} className="text-xs font-medium text-ink-700">
          {label}
        </label>
      )}
      <div className="group relative w-full">
        <Search
          size={18}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-400 transition group-focus-within:text-[#129883]"
        />
        <input
          id={id}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          className="h-12 w-full rounded-full border border-line bg-surface pl-11 pr-11 text-sm shadow-sm outline-none transition focus:border-[#129883] focus:ring-4 focus:ring-[#129883]/15"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            title="Clear search"
            className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-ink-500 transition hover:bg-gray-100 hover:text-ink-900"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
