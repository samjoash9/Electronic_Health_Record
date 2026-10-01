import { LANGUAGES } from '../../i18n/assessmentTranslations';

/**
 * EN / TL / CEB switcher for the kiosk header. Switching only changes the
 * wording on screen -- answers are keyed by optionID and are kept, so a
 * patient can change language mid-assessment without losing work.
 */
export default function LanguageToggle({ value, onChange }) {
  return (
    <div
      role="radiogroup"
      aria-label="Question language"
      className="flex items-center gap-1 rounded-xl border border-line bg-surface p-1"
    >
      {LANGUAGES.map((lang) => {
        const selected = value === lang.code;
        return (
          <button
            key={lang.code}
            type="button"
            role="radio"
            aria-checked={selected}
            // The short code is what is drawn; the full name is what a
            // screen reader announces.
            aria-label={lang.label}
            onClick={() => onChange(lang.code)}
            className={`inline-flex h-10 min-w-12 items-center justify-center rounded-lg px-3 text-sm font-semibold transition active:scale-95
              ${selected
                ? 'bg-[#129883] text-white shadow-sm'
                : 'text-ink-700 hover:bg-gray-50'}`}
          >
            {lang.short}
          </button>
        );
      })}
    </div>
  );
}
