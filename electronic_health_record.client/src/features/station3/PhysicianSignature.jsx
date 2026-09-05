import { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import {
  Pen, Upload, X, CheckCircle2, BadgeCheck, IdCard, Eraser, ShieldCheck, RotateCcw,
} from 'lucide-react';
import SectionCard from './SectionCard';

const ACCEPTED = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_BYTES = 2 * 1024 * 1024;

const MODES = [
  { id: 'draw', label: 'Draw', icon: Pen },
  { id: 'upload', label: 'Upload', icon: Upload },
];

/** Identity read off the signed-in account, shown as a credential line. */
function Credential({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <span
        aria-hidden
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#e9fbf6] text-[#0e7d6b] ring-1 ring-[#0e7d6b]/10"
      >
        <Icon size={16} strokeWidth={1.9} />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold tracking-wide text-ink-500 uppercase">{label}</p>
        <p className="truncate text-sm font-semibold text-ink-900">{value || '—'}</p>
      </div>
    </div>
  );
}

export default function PhysicianSignature({ physicianName, prcLicenseNo, value, onChange }) {
  const padRef = useRef(null);
  const fileRef = useRef(null);
  const [mode, setMode] = useState('draw');
  const [uploadError, setUploadError] = useState(null);
  const [uploadName, setUploadName] = useState(null);

  const handleEnd = () => {
    if (padRef.current?.isEmpty()) return onChange(null);
    onChange(padRef.current.toDataURL('image/png'));
  };

  const handleClear = () => {
    padRef.current?.clear();
    onChange(null);
  };

  const handleFile = (file) => {
    if (!file) return;
    setUploadError(null);

    if (!ACCEPTED.includes(file.type)) {
      setUploadError('Use a PNG, JPG, or WebP image.');
      return;
    }
    if (file.size > MAX_BYTES) {
      setUploadError('Image must be 2 MB or smaller.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setUploadName(file.name);
      onChange(reader.result);
    };
    reader.onerror = () => setUploadError('Could not read that file. Try again.');
    reader.readAsDataURL(file);
  };

  const handleRemoveUpload = () => {
    setUploadName(null);
    setUploadError(null);
    if (fileRef.current) fileRef.current.value = '';
    onChange(null);
  };

  // Switching modes discards the other mode's signature so `value` always
  // reflects what the physician can currently see.
  const switchMode = (next) => {
    if (next === mode) return;
    padRef.current?.clear();
    setUploadName(null);
    setUploadError(null);
    if (fileRef.current) fileRef.current.value = '';
    onChange(null);
    setMode(next);
  };

  const uploaded = mode === 'upload' && value;
  const signed = Boolean(value);

  return (
    <SectionCard
      title="Physician Certification"
      subtitle="Sign to certify and complete this consultation."
      icon={BadgeCheck}
      actions={
        <span
          className={`hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 sm:inline-flex ${
            signed
              ? 'bg-[#e9fbf6] text-[#0e7d6b] ring-[#0e7d6b]/20'
              : 'bg-amber-50 text-amber-700 ring-amber-200'
          }`}
        >
          {signed ? <CheckCircle2 size={12} /> : <Pen size={12} />}
          {signed ? 'Signed' : 'Awaiting signature'}
        </span>
      }
    >
      {/* Even split: the pad stops at half the card instead of stretching to a
          signing area far wider than any signature. */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6">
        {/* Identity and attestation stay together: what is being certified, and
            by whom, reads as one statement rather than scattered labels. */}
        <div className="flex flex-col gap-4 rounded-xl border border-line bg-surface/60 p-4 sm:p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Credential icon={BadgeCheck} label="Name of Physician" value={physicianName} />
            <Credential icon={IdCard} label="PRC License No." value={prcLicenseNo} />
          </div>

          <p className="mt-auto flex gap-2.5 rounded-lg bg-[#f3fdfb] px-3.5 py-3 text-xs leading-relaxed text-ink-600 ring-1 ring-[#0e7d6b]/10">
            <ShieldCheck size={15} className="mt-0.5 shrink-0 text-[#0e7d6b]" />
            <span>
              By signing, you certify that the findings and recommendations recorded in
              this form are accurate to the best of your professional judgment.
            </span>
          </p>
        </div>

        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-semibold text-ink-700">
              Signature <span className="text-rose-600">*</span>
            </span>
            <div
              role="tablist"
              aria-label="Signature method"
              className="flex rounded-lg border border-line bg-canvas p-0.5"
            >
              {MODES.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={mode === id}
                  onClick={() => switchMode(id)}
                  className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    mode === id
                      ? 'bg-surface text-[#0e7d6b] shadow-sm'
                      : 'text-ink-500 hover:text-ink-700'
                  }`}
                >
                  <Icon size={13} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {mode === 'draw' ? (
            <>
              {/* A ruled baseline and the physician's own name under the pad
                  make the empty canvas read as a place to sign. */}
              <div
                className={`relative overflow-hidden rounded-xl border bg-surface transition-colors ${
                  signed ? 'border-[#0e7d6b]/40' : 'border-line'
                }`}
              >
                <SignatureCanvas
                  ref={padRef}
                  penColor="#111827"
                  onEnd={handleEnd}
                  canvasProps={{
                    className: 'relative z-10 h-40 w-full cursor-crosshair touch-none',
                    'aria-label': 'Signature pad',
                  }}
                />

                <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 px-5 pb-3.5">
                  <div className="border-b border-dashed border-ink-300/70" />
                  <p className="mt-1.5 text-center text-[10px] font-medium tracking-wide text-ink-400 uppercase">
                    {physicianName || 'Attending physician'}
                  </p>
                </div>

                {!signed && (
                  <p
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-xs text-ink-400"
                  >
                    Sign above the line
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={!signed}
                  className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-ink-500 transition-colors hover:bg-canvas hover:text-rose-600 disabled:cursor-not-allowed disabled:text-ink-300 disabled:hover:bg-transparent"
                >
                  <Eraser size={13} />
                  Clear
                </button>
                <SignatureStatus signed={signed} />
              </div>
            </>
          ) : (
            <>
              <input
                ref={fileRef}
                type="file"
                accept={ACCEPTED.join(',')}
                className="sr-only"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />

              {uploaded ? (
                <div className="overflow-hidden rounded-xl border border-[#0e7d6b]/40 bg-[#f3fdfb]">
                  <div className="flex h-40 items-center justify-center p-4">
                    <img
                      src={value}
                      alt="Uploaded physician signature"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 border-t border-[#0e7d6b]/15 bg-white/60 px-3 py-2">
                    <CheckCircle2 size={13} className="shrink-0 text-[#0e7d6b]" />
                    <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-ink-600">
                      {uploadName}
                    </span>
                    <button
                      type="button"
                      onClick={handleRemoveUpload}
                      className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium text-ink-500 transition-colors hover:bg-white hover:text-rose-600"
                    >
                      <X size={12} />
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className={`flex h-40 w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-canvas transition-colors ${
                    uploadError
                      ? 'border-rose-300 text-rose-600 hover:bg-rose-50/40'
                      : 'border-gray-300 text-ink-500 hover:border-[#0e7d6b]/40 hover:bg-[#f9fefd] hover:text-[#0e7d6b]'
                  }`}
                >
                  <span
                    aria-hidden
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white ring-1 ring-line"
                  >
                    <Upload size={17} />
                  </span>
                  <span className="text-xs font-semibold">Choose a signature image</span>
                  <span className="text-[11px] text-ink-500">PNG, JPG, or WebP · max 2 MB</span>
                </button>
              )}

              <div className="flex items-center justify-between gap-3">
                {uploaded ? (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-ink-500 transition-colors hover:bg-canvas hover:text-[#0e7d6b]"
                  >
                    <RotateCcw size={13} />
                    Replace image
                  </button>
                ) : (
                  <span />
                )}
                {uploadError ? (
                  <span className="text-[11px] font-medium text-rose-600">{uploadError}</span>
                ) : (
                  <SignatureStatus signed={signed} />
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </SectionCard>
  );
}

/**
 * Confirms a captured signature, and otherwise states what is still needed.
 * Neutral until something is wrong, so an untouched form does not open in red.
 */
function SignatureStatus({ signed }) {
  if (signed) {
    return (
      <span className="flex items-center gap-1.5 text-[11px] font-semibold text-[#0e7d6b]">
        <CheckCircle2 size={13} />
        Signature captured
      </span>
    );
  }
  return (
    <span className="text-[11px] text-ink-500">
      Required before submitting
    </span>
  );
}
