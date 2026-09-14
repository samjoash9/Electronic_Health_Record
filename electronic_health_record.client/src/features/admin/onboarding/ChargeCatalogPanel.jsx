import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Check, X, Pencil, Ban, RotateCcw } from 'lucide-react';
import { getChargeItems, createChargeItem, updateChargeItem, retireChargeItem } from '../../../api/chargeItems.api';
import { useTableControls } from '../../../hooks/useTableControls';
import { peso } from '../../../lib/formatters';
import Card from '../../../components/ui/Card';
import Skeleton from '../../../components/ui/Skeleton';
import ErrorState from '../../../components/ui/ErrorState';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import DataTable from '../../../components/ui/DataTable';
import TableFooter from '../../../components/ui/TableFooter';
import SearchInput from '../../../components/ui/SearchInput';
import Select from '../../../components/ui/Select';
import Input from '../../../components/ui/Input';
import Modal from '../../../components/ui/Modal';

const TYPE_FILTER_OPTIONS = [
  { value: 'all', label: 'All Items' },
  { value: 'Lab', label: 'Laboratory Tests' },
  { value: 'Medication', label: 'Medications' },
];

const searchFields = (item) => [item.name, item.category];
const filterField = (item) => item.itemType;

/** Editable price cell: click to type a new amount, Enter/checkmark to save. */
function PriceCell({ item, onSave, saving }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState('');

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => {
          setValue(item.unitPrice == null ? '' : String(item.unitPrice));
          setEditing(true);
        }}
        className="group inline-flex items-center gap-1.5 text-sm font-medium text-ink-900 hover:text-[#0e7d6b]"
      >
        {item.unitPrice == null
          ? <span className="text-amber-600">Quote per patient</span>
          : peso(item.unitPrice)}
        <Pencil size={12} className="text-ink-300 opacity-0 transition group-hover:opacity-100" />
      </button>
    );
  }

  const commit = () => {
    const trimmed = value.trim();
    const price = trimmed === '' ? null : Number(trimmed);
    if (trimmed !== '' && !Number.isFinite(price)) return;
    onSave(price);
    setEditing(false);
  };

  return (
    <div className="flex items-center gap-1">
      <Input
        type="number"
        min="0"
        step="0.01"
        autoFocus
        value={value}
        placeholder="Blank = quote per patient"
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') setEditing(false);
        }}
        className="h-8 w-36 text-sm"
      />
      <button type="button" onClick={commit} disabled={saving} aria-label="Save price"
        className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#129883] text-white hover:bg-[#0e7d6b] disabled:opacity-50">
        <Check size={13} />
      </button>
      <button type="button" onClick={() => setEditing(false)} aria-label="Cancel"
        className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-400 hover:bg-gray-100">
        <X size={13} />
      </button>
    </div>
  );
}

function CreateItemModal({ onSubmit, onClose, isPending, error }) {
  const [itemType, setItemType] = useState('Lab');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [unitPrice, setUnitPrice] = useState('');

  const canSubmit = name.trim().length > 0;

  return (
    <Modal
      open
      title="Add Catalog Item"
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="secondary" size="md" onClick={onClose}>Cancel</Button>
          <Button
            type="button"
            variant="teal"
            size="md"
            disabled={!canSubmit || isPending}
            onClick={() => onSubmit({
              itemType,
              name: name.trim(),
              category: category.trim() || null,
              unitPrice: unitPrice.trim() === '' ? null : Number(unitPrice),
              displayOrder: 0,
            })}
          >
            {isPending ? 'Adding…' : 'Add Item'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error.message}</p>}

        <div>
          <label className="mb-1 block text-xs font-medium text-ink-700">Type</label>
          <Select
            value={itemType}
            onChange={(e) => setItemType(e.target.value)}
            options={[{ value: 'Lab', label: 'Laboratory Test' }, { value: 'Medication', label: 'Medication' }]}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-ink-700">Name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. CBC, Amoxicillin 500mg" className="w-full" />
        </div>

        {itemType === 'Medication' && (
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-700">Category</label>
            <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Antibiotic, Maintenance" className="w-full" />
          </div>
        )}

        <div>
          <label className="mb-1 block text-xs font-medium text-ink-700">Unit Price</label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={unitPrice}
            onChange={(e) => setUnitPrice(e.target.value)}
            placeholder="Leave blank to quote per patient"
            className="w-full"
          />
        </div>
      </div>
    </Modal>
  );
}

/**
 * The admin-owned price catalog behind Station 3's lab/medication charges and
 * Station 6's billing totals (decision 5). Superadmin-only writes, enforced
 * server-side -- this panel does not attempt its own permission check beyond
 * what the route already requires.
 *
 * Retiring an item never deletes it (a WellnessFormCharge row may reference
 * it), so the "delete" action here is really IsActive = false, and a retired
 * item can be restored the same way.
 */
export default function ChargeCatalogPanel() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);

  const { data: items, isLoading, error, refetch } = useQuery({
    queryKey: ['chargeitems', 'all'],
    queryFn: () => getChargeItems({}),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['chargeitems'] });

  const createMutation = useMutation({
    mutationFn: createChargeItem,
    onSuccess: () => { invalidate(); setCreateOpen(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...patch }) => updateChargeItem(id, patch),
    onSuccess: invalidate,
  });

  const retireMutation = useMutation({
    mutationFn: retireChargeItem,
    onSuccess: invalidate,
  });

  const table = useTableControls(items, { searchFields, filterField });

  if (isLoading) return <Skeleton />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  const savePrice = (item, unitPrice) =>
    updateMutation.mutate({
      id: item.chargeItemID,
      name: item.name,
      category: item.category,
      unitPrice,
      isActive: item.isActive,
      displayOrder: item.displayOrder,
    });

  const toggleActive = (item) =>
    item.isActive
      ? retireMutation.mutate(item.chargeItemID)
      : updateMutation.mutate({
          id: item.chargeItemID,
          name: item.name,
          category: item.category,
          unitPrice: item.unitPrice,
          isActive: true,
          displayOrder: item.displayOrder,
        });

  const columns = [
    {
      key: 'name',
      header: 'Name',
      render: (item) => (
        <span className={item.isActive ? '' : 'text-ink-400 line-through'}>{item.name}</span>
      ),
    },
    {
      key: 'itemType',
      header: 'Type',
      render: (item) => (
        <Badge tone={item.itemType === 'Lab' ? 'info' : 'success'}>
          {item.itemType === 'Lab' ? 'Lab' : 'Medication'}
        </Badge>
      ),
    },
    { key: 'category', header: 'Category', render: (item) => item.category || '—' },
    {
      key: 'unitPrice',
      header: 'Unit Price',
      render: (item) => (
        <PriceCell
          item={item}
          saving={updateMutation.isPending}
          onSave={(price) => savePrice(item, price)}
        />
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (item) => (item.isActive
        ? <Badge tone="success" dot>Active</Badge>
        : <Badge tone="danger" dot>Retired</Badge>),
    },
  ];

  return (
    <Card
      flush
      title="Billing Catalog"
      actions={
        <div className="flex w-full flex-col gap-2 @2xl:flex-row @2xl:items-center">
          <SearchInput
            id="chargeitems-search"
            value={table.query}
            onChange={table.onSearch}
            placeholder="Search by name or category"
            className="w-full min-w-0 @2xl:flex-1"
          />
          <div className="flex w-full items-center gap-2 @2xl:w-auto">
            <Select
              value={table.filter}
              onChange={(e) => table.onFilter(e.target.value)}
              options={TYPE_FILTER_OPTIONS}
              className="min-w-0 flex-1 @2xl:w-48 @2xl:flex-none"
            />
            <Button
              type="button"
              variant="teal"
              size="md"
              className="min-w-0 flex-1 @2xl:w-48 @2xl:flex-none"
              onClick={() => setCreateOpen(true)}
            >
              <Plus size={16} />
              Add Item
            </Button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        <DataTable
          columns={columns}
          rows={table.pageRows.map((item) => ({ ...item, id: item.chargeItemID }))}
          rowActions={(item) => (
            <button
              type="button"
              title={item.isActive ? 'Retire this item' : 'Restore this item'}
              onClick={() => toggleActive(item)}
              className={`flex h-11 w-11 items-center justify-center rounded-lg transition ${
                item.isActive
                  ? 'text-ink-400 hover:bg-rose-50 hover:text-rose-600'
                  : 'text-ink-400 hover:bg-emerald-50 hover:text-emerald-600'
              }`}
            >
              {item.isActive ? <Ban size={15} /> : <RotateCcw size={15} />}
            </button>
          )}
          empty={table.isSearching || table.isFiltered
            ? 'No catalog items match your search.'
            : 'No catalog items yet.'}
        />

        <TableFooter
          page={table.page}
          totalPages={table.totalPages}
          total={table.total}
          noun="item"
          onPageChange={table.setPage}
        />
      </div>

      {createOpen && (
        <CreateItemModal
          isPending={createMutation.isPending}
          error={createMutation.error}
          onSubmit={(values) => createMutation.mutate(values)}
          onClose={() => { createMutation.reset(); setCreateOpen(false); }}
        />
      )}
    </Card>
  );
}
