import { useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

export default function PhysicianSignature({ physicianName, prcLicenseNo, value, onChange }) {
  const padRef = useRef(null);

  const handleEnd = () => {
    if (padRef.current?.isEmpty()) return onChange(null);
    onChange(padRef.current.toDataURL('image/png'));
  };

  const handleClear = () => {
    padRef.current?.clear();
    onChange(null);
  };

  return (
    <Card title="Physician Certification">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-2 text-sm">
          <div>
            <span className="text-xs text-ink-500">Name of Physician</span>
            <p className="font-medium text-ink-900">{physicianName}</p>
          </div>
          <div>
            <span className="text-xs text-ink-500">PRC License No.</span>
            <p className="font-medium text-ink-900">{prcLicenseNo}</p>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-ink-700">
            Signature <span className="text-rose-600">*</span>
          </span>
          <div className="rounded border border-line bg-surface">
            <SignatureCanvas
              ref={padRef}
              penColor="#111827"
              onEnd={handleEnd}
              canvasProps={{ className: 'h-32 w-full', 'aria-label': 'Signature pad' }}
            />
          </div>
          <div className="flex items-center justify-between">
            <Button type="button" variant="ghost" onClick={handleClear}>Clear</Button>
            {!value && <span className="text-[11px] text-rose-600">Signature required</span>}
          </div>
        </div>
      </div>
    </Card>
  );
}
