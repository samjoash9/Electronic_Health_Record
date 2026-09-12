import { useState, useMemo } from 'react';
import {
  Receipt,
  Search,
  X,
  CheckCircle2,
  Printer,
  ExternalLink,
  ShieldCheck,
  Building2,
  Calendar,
  AlertCircle,
  RotateCcw,
  Landmark,
  Coins,
  ArrowDownRight,
  Sparkles
} from 'lucide-react';

const INITIAL_FUND = 1000000.00; // ₱1,000,000.00 Government Subsidy Pool

// Default mock billing dataset with individual allocatedBudget removed
const INITIAL_BILLING_DATA = [
  {
    id: 'BLL-9021',
    patientName: 'Sarah Connor',
    office: 'Department of Agriculture',
    date: 'Sep 11, 2026',
    status: 'Pending',
    medicines: [
      { name: 'Amoxicillin 500mg', category: 'Antibiotic', price: 150.00 },
      { name: 'Losartan 50mg', category: 'Maintenance', price: 450.00 },
      { name: 'Paracetamol 500mg', category: 'Pain Relief', price: 50.00 }
    ]
  },
  {
    id: 'BLL-9022',
    patientName: 'Jonathan Reyes',
    office: 'Department of Education (DepEd)',
    date: 'Sep 11, 2026',
    status: 'Pending',
    medicines: [
      { name: 'Metformin 500mg', category: 'Maintenance', price: 320.00 },
      { name: 'Atorvastatin 20mg', category: 'Maintenance', price: 580.00 },
      { name: 'Multivitamins + Iron', category: 'Vitamins', price: 210.00 },
      { name: 'Vitamin C 500mg Zinc', category: 'Vitamins', price: 180.00 }
    ]
  },
  {
    id: 'BLL-9023',
    patientName: 'Maria Elena Santos',
    office: 'Provincial Health Office',
    date: 'Sep 11, 2026',
    status: 'Pending',
    medicines: [
      { name: 'Cefuroxime 500mg', category: 'Antibiotic', price: 720.00 },
      { name: 'Mefenamic Acid 500mg', category: 'Pain Relief', price: 95.00 },
      { name: 'B-Complex High Potency', category: 'Vitamins', price: 240.00 }
    ]
  },
  {
    id: 'BLL-9024',
    patientName: 'Roberto Mendoza',
    office: 'DPWH - District 2',
    date: 'Sep 11, 2026',
    status: 'Pending',
    medicines: [
      { name: 'Amlodipine 10mg', category: 'Maintenance', price: 280.00 },
      { name: 'Ibuprofen 400mg', category: 'Pain Relief', price: 110.00 },
      { name: 'Omeprazole 20mg', category: 'Gastrointestinal', price: 340.00 }
    ]
  },
  {
    id: 'BLL-9025',
    patientName: 'Corazon Villanueva',
    office: 'Bureau of Internal Revenue',
    date: 'Sep 11, 2026',
    status: 'Pending',
    medicines: [
      { name: 'Co-Amoxiclav 625mg', category: 'Antibiotic', price: 890.00 },
      { name: 'Ascorbic Acid + Zinc', category: 'Vitamins', price: 195.00 }
    ]
  },
  {
    id: 'BLL-9026',
    patientName: 'Danilo Cruz',
    office: 'Department of Social Welfare (DSWD)',
    date: 'Sep 10, 2026',
    status: 'Pending',
    medicines: [
      { name: 'Gliclazide 80mg', category: 'Maintenance', price: 410.00 },
      { name: 'Paracetamol 500mg', category: 'Pain Relief', price: 60.00 }
    ]
  }
];

// Helper currency formatter for Philippine Peso
const formatPeso = (amount) =>
  new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(amount);

// Pill colors for medication categories
const CATEGORY_COLORS = {
  Antibiotic: 'bg-purple-50 text-purple-700 border-purple-200',
  Maintenance: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Pain Relief': 'bg-rose-50 text-rose-700 border-rose-200',
  Vitamins: 'bg-amber-50 text-amber-700 border-amber-200',
  Gastrointestinal: 'bg-sky-50 text-sky-700 border-sky-200',
};

export default function Station6Billing() {
  const [billingList, setBillingList] = useState(INITIAL_BILLING_DATA);
  const [globalFund, setGlobalFund] = useState(INITIAL_FUND);
  const [selectedRecordId, setSelectedRecordId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Currently selected patient record derived from billingList
  const selectedRecord = useMemo(
    () => billingList.find((item) => item.id === selectedRecordId) || null,
    [billingList, selectedRecordId]
  );

  // Filtered table records
  const filteredRecords = useMemo(() => {
    return billingList.filter((item) => {
      const matchesSearch =
        item.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.office.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'PENDING' && item.status === 'Pending') ||
        (statusFilter === 'DEDUCTED' && item.status === 'Deducted');

      return matchesSearch && matchesStatus;
    });
  }, [billingList, searchQuery, statusFilter]);

  // Metrics for Top Summary Cards
  const totalPatients = billingList.length;
  const pendingCount = billingList.filter((item) => item.status === 'Pending').length;

  // Deduction handler: subtracts total cost from globalFund, updates status, and closes panel
  const handleApproveAndDeduct = (recordId) => {
    const target = billingList.find((item) => item.id === recordId);
    if (!target || target.status === 'Deducted') return;

    const totalCost = target.medicines.reduce((sum, item) => sum + item.price, 0);

    setGlobalFund((prevFund) => Math.max(0, prevFund - totalCost));
    setBillingList((prevList) =>
      prevList.map((item) =>
        item.id === recordId ? { ...item, status: 'Deducted' } : item
      )
    );
    setSelectedRecordId(null); // Closes the sliding panel
  };

  // Reset helper for presentation demonstrations
  const handleResetDemo = () => {
    setBillingList(INITIAL_BILLING_DATA);
    setGlobalFund(INITIAL_FUND);
    setSelectedRecordId(null);
  };

  return (
    <div className="flex h-full flex-col overflow-hidden font-['Geist',sans-serif]">
      {/* Top Header Banner */}
      <div className="mb-4 flex flex-col justify-between gap-3 border-b border-gray-200/80 pb-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-[#0A594D] to-[#37AF9B] text-white shadow-sm">
              <Receipt size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-gray-900">
                Station 6: Billing (Medicine Deduction)
              </h1>
              <p className="text-xs text-gray-500">
                Global government subsidy pool management and patient pharmacy deductions
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetDemo}
            title="Reset demonstration state back to ₱1,000,000"
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-600 shadow-2xs transition hover:border-[#37AF9B] hover:text-[#0A594D]"
          >
            <RotateCcw size={12} />
            <span>Reset Demo Pool</span>
          </button>
          <div className="flex items-center gap-1.5 rounded-full border border-[#37AF9B]/30 bg-[#e6f7f4] px-3 py-1 text-xs font-semibold text-[#0A594D]">
            <ShieldCheck size={14} className="text-[#37AF9B]" />
            <span>Superadmin Access</span>
          </div>
        </div>
      </div>

      {/* 2. Top Summary Cards (4 Cards) */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Card 1: Station Queue */}
        <div className="rounded-xl border border-gray-200/80 bg-white p-4 shadow-xs">
          <span className="text-xs font-medium text-gray-500">Station Queue</span>
          <div className="mt-1.5 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-gray-900">{totalPatients}</span>
            <span className="text-xs text-gray-400">Total Patients</span>
          </div>
        </div>

        {/* Card 2: Pending Deductions */}
        <div className="rounded-xl border border-amber-200/80 bg-amber-50/40 p-4 shadow-xs">
          <span className="text-xs font-medium text-amber-700">Pending Deductions</span>
          <div className="mt-1.5 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-amber-700">{pendingCount}</span>
            <span className="inline-flex items-center rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
              Pending
            </span>
          </div>
        </div>

        {/* Card 3: Initial Government Fund */}
        <div className="rounded-xl border border-gray-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Initial Government Fund</span>
            <Landmark size={14} className="text-gray-400" />
          </div>
          <div className="mt-1.5 flex items-baseline justify-between">
            <span className="text-xl font-bold text-gray-700">{formatPeso(INITIAL_FUND)}</span>
            <span className="text-[10px] text-gray-400">Fixed Pool</span>
          </div>
        </div>

        {/* Card 4: Current Available Fund (Prominently Styled) */}
        <div className="rounded-xl border-2 border-[#37AF9B]/50 bg-linear-to-br from-[#f0faf8] via-[#e6f7f4] to-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0A594D]">
              Current Available Fund
            </span>
            <Coins size={16} className="text-[#37AF9B]" />
          </div>
          <div className="mt-1.5 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold tracking-tight text-[#0A594D]">
              {formatPeso(globalFund)}
            </span>
            <span className="inline-flex items-center rounded-md bg-[#37AF9B]/20 px-1.5 py-0.5 text-[10px] font-bold text-[#0A594D]">
              Live Balance
            </span>
          </div>
        </div>
      </div>

      {/* 3. Table UI Section */}
      <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {/* Search & Filter Toolbar */}
        <div className="flex flex-col items-center justify-between gap-3 border-b border-gray-100 p-4 sm:flex-row">
          <div className="relative w-full sm:w-80">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by patient, ID, or office..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2 pl-9 pr-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[#37AF9B] focus:bg-white focus:ring-2 focus:ring-[#37AF9B]/20"
            />
          </div>

          <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
            <div className="flex rounded-xl bg-gray-100 p-0.5 text-xs font-medium text-gray-600">
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={`rounded-lg px-3 py-1.5 transition ${
                  statusFilter === 'ALL'
                    ? 'bg-white font-semibold text-gray-900 shadow-xs'
                    : 'hover:text-gray-900'
                }`}
              >
                All ({billingList.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('PENDING')}
                className={`rounded-lg px-3 py-1.5 transition ${
                  statusFilter === 'PENDING'
                    ? 'bg-white font-semibold text-amber-700 shadow-xs'
                    : 'hover:text-gray-900'
                }`}
              >
                Pending ({pendingCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('DEDUCTED')}
                className={`rounded-lg px-3 py-1.5 transition ${
                  statusFilter === 'DEDUCTED'
                    ? 'bg-white font-semibold text-[#0A594D] shadow-xs'
                    : 'hover:text-gray-900'
                }`}
              >
                Deducted ({totalPatients - pendingCount})
              </button>
            </div>
          </div>
        </div>

        {/* Patients Table: Columns = TRANSACTION ID, PATIENT DETAILS, PRESCRIBED ITEMS, TOTAL COST, STATUS, ACTION */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="sticky top-0 z-10 border-b border-gray-200 bg-gray-50/90 text-xs font-semibold uppercase tracking-wider text-gray-500 backdrop-blur-xs">
              <tr>
                <th className="px-5 py-3.5">Transaction ID</th>
                <th className="px-5 py-3.5">Patient Details</th>
                <th className="px-5 py-3.5">Prescribed Items</th>
                <th className="px-5 py-3.5 text-right">Total Cost</th>
                <th className="px-5 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    <AlertCircle className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                    <p className="font-medium text-gray-600">No billing records found</p>
                    <p className="text-xs text-gray-400">Try adjusting your search query or filter criteria</p>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((row) => {
                  const totalCost = row.medicines.reduce((sum, item) => sum + item.price, 0);
                  const isDeducted = row.status === 'Deducted';
                  const isSelected = selectedRecordId === row.id;

                  return (
                    <tr
                      key={row.id}
                      onClick={() => setSelectedRecordId(row.id)}
                      className={`cursor-pointer transition-colors duration-150 hover:bg-[#0A594D]/5 ${
                        isSelected ? 'bg-[#37AF9B]/10 font-medium' : ''
                      }`}
                    >
                      {/* TRANSACTION ID */}
                      <td className="px-5 py-4 font-mono text-xs font-semibold text-[#0A594D]">
                        <div className="flex items-center gap-1">
                          <span>{row.id}</span>
                          <ExternalLink size={12} className="text-gray-400" />
                        </div>
                      </td>

                      {/* PATIENT DETAILS */}
                      <td className="px-5 py-4">
                        <div className="font-semibold text-gray-900">{row.patientName}</div>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Building2 size={12} className="text-gray-400" />
                          <span>{row.office}</span>
                        </div>
                      </td>

                      {/* PRESCRIBED ITEMS */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-700">
                            {row.medicines.length}
                          </span>
                          <span className="truncate text-xs text-gray-600">
                            {row.medicines.map((m) => m.name.split(' ')[0]).join(', ')}
                          </span>
                        </div>
                      </td>

                      {/* TOTAL COST */}
                      <td className="px-5 py-4 text-right font-semibold text-gray-900">
                        {formatPeso(totalCost)}
                      </td>

                      {/* STATUS */}
                      <td className="px-5 py-4 text-center">
                        {isDeducted ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                            <CheckCircle2 size={12} />
                            Deducted
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                            Pending
                          </span>
                        )}
                      </td>

                      {/* ACTION */}
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRecordId(row.id);
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-2xs transition hover:border-[#37AF9B] hover:bg-[#37AF9B]/5 hover:text-[#0A594D]"
                        >
                          <span>View Invoice</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/60 px-5 py-3 text-xs text-gray-500">
          <span>
            Showing <strong className="font-semibold text-gray-700">{filteredRecords.length}</strong> of{' '}
            {billingList.length} patient records
          </span>
          <span className="italic">Click any row to open invoice and deduct from the global subsidy pool</span>
        </div>
      </div>

      {/* 4. Sliding Side-Panel / Invoice Modal */}
      {selectedRecord && (
        <InvoiceSlidePanel
          record={selectedRecord}
          globalFund={globalFund}
          onClose={() => setSelectedRecordId(null)}
          onApproveAndDeduct={() => handleApproveAndDeduct(selectedRecord.id)}
        />
      )}
    </div>
  );
}

/**
 * Modern Receipt / Invoice Sliding Side Panel
 * Features global subsidy deduction logic and calculation breakdown.
 */
function InvoiceSlidePanel({ record, globalFund, onClose, onApproveAndDeduct }) {
  const totalCost = record.medicines.reduce((sum, item) => sum + item.price, 0);
  const projectedRemaining = globalFund - totalCost;
  const isPending = record.status === 'Pending';

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs transition-opacity duration-300">
      {/* Click outside to close backdrop */}
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      {/* Sliding panel container with modern light-gray background (#f4f6f8) */}
      <div className="relative z-10 flex h-full w-full max-w-xl flex-col bg-[#f4f6f8] shadow-2xl transition-transform duration-300 sm:rounded-l-3xl">
        {/* Panel Header */}
        <div className="flex items-start justify-between border-b border-gray-200/80 bg-white px-6 py-5 sm:rounded-tl-3xl">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500">{record.date}</span>
              <span className="text-gray-300">•</span>
              <span className="font-mono text-xs font-semibold text-gray-500">{record.id}</span>
            </div>
            <div className="mt-1 flex items-baseline gap-3">
              <span className="text-3xl font-extrabold tracking-tight text-gray-900">
                {formatPeso(totalCost)}
              </span>
              {!isPending ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                  <CheckCircle2 size={12} />
                  Deducted
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                  Pending Deduction
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close invoice panel"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200 hover:text-gray-800"
          >
            <X size={18} />
          </button>
        </div>

        {/* Panel Scrollable Content */}
        <div className="flex-1 space-y-4 overflow-y-auto p-6">
          {/* Main Billing Card (Clean white card: rounded-2xl shadow-lg p-6) */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-lg">
            {/* Header: Patient Name & Office */}
            <div className="flex items-start justify-between border-b border-gray-100 pb-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900 sm:text-xl">
                  {record.patientName}
                </h2>
                <div className="mt-0.5 flex items-center gap-1 font-mono text-xs font-medium text-[#2f6fb5]">
                  <span>{record.id}</span>
                  <ExternalLink size={12} />
                </div>
              </div>

              <div className="text-right">
                <div className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                  <Building2 size={12} className="text-gray-500" />
                  <span>{record.office}</span>
                </div>
                <div className="mt-1 flex items-center justify-end gap-1 text-[11px] text-gray-400">
                  <Calendar size={11} />
                  <span>{record.date}</span>
                </div>
              </div>
            </div>

            {/* Line Items: Medicines Covered */}
            <div className="pt-4">
              <div className="mb-3 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-gray-400">
                <span>Covered Medicine Item</span>
                <span>Price</span>
              </div>

              <div className="divide-y divide-gray-100">
                {record.medicines.map((item, index) => {
                  const tagColor =
                    CATEGORY_COLORS[item.category] || 'bg-gray-100 text-gray-700 border-gray-200';

                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between py-3.5 first:pt-1 last:pb-2"
                    >
                      <div className="flex flex-col items-start gap-1">
                        <span className="font-medium text-gray-800">{item.name}</span>
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${tagColor}`}
                        >
                          {item.category}
                        </span>
                      </div>
                      <div className="font-semibold text-gray-900">
                        {formatPeso(item.price)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer of Card: Calculation Area */}
            <div className="mt-6 border-t border-gray-100 pt-5">
              {isPending ? (
                /* Calculation for Pending Status */
                <div className="space-y-3">
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Landmark size={14} className="text-gray-400" />
                        <span>Current Available Fund</span>
                      </span>
                      <span className="font-medium text-gray-800">{formatPeso(globalFund)}</span>
                    </div>

                    <div className="flex items-center justify-between text-rose-600">
                      <span className="flex items-center gap-1.5">
                        <ArrowDownRight size={14} />
                        <span>Less: Total Medicine Cost</span>
                      </span>
                      <span className="font-semibold">- {formatPeso(totalCost)}</span>
                    </div>
                  </div>

                  {/* Highlighted 'Projected Remaining Fund' Card */}
                  <div className="rounded-xl border border-[#37AF9B]/40 bg-linear-to-r from-[#e6f7f4] via-[#f0faf8] to-white p-4 shadow-xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-[#0A594D]">
                          Projected Remaining Fund
                        </span>
                        <p className="text-[11px] text-[#0A594D]/75">
                          Remaining global subsidy balance after deducting this bill
                        </p>
                      </div>
                      <span className="text-2xl font-black tracking-tight text-[#0A594D]">
                        {formatPeso(projectedRemaining)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Display for Already Deducted Status */
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Total Medicine Deducted</span>
                    <span className="font-semibold text-gray-900">{formatPeso(totalCost)}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Subsidy Pool Balance</span>
                    <span className="font-medium text-[#0A594D]">{formatPeso(globalFund)}</span>
                  </div>

                  {/* Processed Badge Container */}
                  <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 text-emerald-800">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={18} className="text-emerald-600" />
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wide">
                          Processed & Deducted
                        </span>
                        <p className="text-[11px] text-emerald-700">
                          This invoice has already been subtracted from the government fund.
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex rounded-md bg-emerald-200/80 px-2.5 py-1 text-xs font-bold text-emerald-900">
                      Processed
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Secondary Terms Card */}
          <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500">
              <Sparkles size={14} className="text-[#37AF9B]" />
              <span>Government Subsidy Terms</span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-gray-600">
              Prescriptions are drawn directly from the general health subsidy allocation. All processed
              deductions are audited and tracked against the provincial treasury wellness grant.
            </p>
          </div>
        </div>

        {/* Bottom Action Bar */}
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-6 py-4 sm:rounded-bl-3xl">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-xs font-semibold text-gray-700 shadow-2xs transition hover:bg-gray-50"
          >
            <Printer size={15} />
            <span>Print Invoice</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-100"
            >
              Cancel
            </button>

            {/* Primary Action Button: 'Approve & Deduct from Fund' (Shown ONLY for Pending) */}
            {isPending ? (
              <button
                type="button"
                onClick={onApproveAndDeduct}
                className="flex items-center gap-2 rounded-xl bg-linear-to-r from-[#0A594D] to-[#37AF9B] px-5 py-2.5 text-xs font-semibold text-white shadow-md transition hover:opacity-95 active:scale-[0.98]"
              >
                <CheckCircle2 size={16} />
                <span>Approve & Deduct from Fund</span>
              </button>
            ) : (
              /* Already Deducted: Action button hidden, 'Processed' badge shown */
              <div className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700">
                <CheckCircle2 size={15} />
                <span>Processed</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
