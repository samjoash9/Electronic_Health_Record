import phoLogo from '../../assets/images/PHO_logo.jpg';

export default function Topbar() {
  return (
    <header className="flex h-14 items-center border-b border-line bg-surface px-4">
      <div className="flex items-center gap-2">
        <img src={phoLogo} alt="Provincial Health Office" className="h-8 w-8 rounded object-cover" />
        <span className="text-sm font-semibold text-ink-900">Electronic Health Record</span>
      </div>
    </header>
  );
}
