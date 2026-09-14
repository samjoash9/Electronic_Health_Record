import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { createBillingForm, updateBillingForm } from '../../api/billing.api';
import Modal from '../../components/ui/Modal';
import Field from '../../components/ui/Field';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

/** An <input type="date"> needs YYYY-MM-DD; the API sends a full ISO string. */
function toDateInputValue(value) {
  if (!value) return '';
  return new Date(value).toISOString().slice(0, 10);
}

function initialValues(billingForm) {
  if (!billingForm) return { title: '', startDate: '', endDate: '', capital: '' };
  return {
    title: billingForm.title ?? '',
    startDate: toDateInputValue(billingForm.startDate),
    endDate: toDateInputValue(billingForm.endDate),
    capital: String(billingForm.capital ?? ''),
  };
}

/**
 * Create or edit a budget period. The same form serves both because the fields
 * are identical -- editing exists so a period's capital can be corrected
 * without deleting it and losing its title and range.
 *
 * Validation here is only what keeps the request well-formed. The rule that
 * actually matters -- that two periods may not cover the same dates -- is the
 * server's, since only it can see the other periods; a 409 comes back carrying
 * the conflicting period's name and is shown inline.
 *
 * State is seeded once per mount rather than resynced in an effect. The
 * exported wrapper below remounts this on every open, so a cancelled edit
 * cannot leave its values behind for the next "Add Billing".
 */
function BillingFormFields({ billingForm, onClose, onSaved }) {
  const isEditing = Boolean(billingForm);

  const [values, setValues] = useState(() => initialValues(billingForm));
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function setField(name, value) {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
    setSubmitError(null);
  }

  function validate() {
    const next = {};

    if (!values.title.trim()) next.title = 'Give this period a name.';
    if (!values.startDate) next.startDate = 'Required.';
    if (!values.endDate) next.endDate = 'Required.';

    if (values.startDate && values.endDate && values.endDate < values.startDate) {
      next.endDate = 'End date must be on or after the start date.';
    }

    const capital = Number(values.capital);
    if (values.capital === '' || !Number.isFinite(capital) || capital < 0) {
      next.capital = 'Enter the capital allocated to this period.';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!validate()) return;

    const payload = {
      title: values.title.trim(),
      startDate: values.startDate,
      endDate: values.endDate,
      capital: Number(values.capital),
    };

    setSubmitting(true);
    setSubmitError(null);
    try {
      const saved = isEditing
        ? await updateBillingForm(billingForm.billingFormID, {
          ...payload,
          rowVersion: billingForm.rowVersion,
        })
        : await createBillingForm(payload);

      onSaved(saved);
      onClose();
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open
      onClose={submitting ? undefined : onClose}
      title={isEditing ? 'Edit Billing Period' : 'Add Billing'}
      footer={
        <>
          <Button type="button" variant="secondary" size="md" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" form="billing-form" variant="teal" size="md" disabled={submitting}>
            {submitting ? 'Saving…' : isEditing ? 'Save Changes' : 'Create Billing'}
          </Button>
        </>
      }
    >
      <form id="billing-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Title" htmlFor="billing-title" required error={errors.title}>
          <Input
            id="billing-title"
            value={values.title}
            onChange={(e) => setField('title', e.target.value)}
            placeholder="e.g. September 2026 Wellness Budget"
            maxLength={100}
            error={errors.title}
            autoFocus
          />
        </Field>

        <div className="grid grid-cols-1 gap-3 tab:grid-cols-2">
          <Field label="From" htmlFor="billing-start" required error={errors.startDate}>
            <Input
              id="billing-start"
              type="date"
              value={values.startDate}
              onChange={(e) => setField('startDate', e.target.value)}
              error={errors.startDate}
            />
          </Field>

          <Field label="To" htmlFor="billing-end" required error={errors.endDate}>
            <Input
              id="billing-end"
              type="date"
              value={values.endDate}
              // Both bounds are inclusive, so the same day on both sides is a
              // valid single-day period.
              min={values.startDate || undefined}
              onChange={(e) => setField('endDate', e.target.value)}
              error={errors.endDate}
            />
          </Field>
        </div>

        <Field
          label="Capital Allocation"
          htmlFor="billing-capital"
          required
          error={errors.capital}
          hint="Every lab and medication recorded for a visit in this range is deducted from this amount."
        >
          <Input
            id="billing-capital"
            type="number"
            min="0"
            step="0.01"
            value={values.capital}
            onChange={(e) => setField('capital', e.target.value)}
            placeholder="0.00"
            error={errors.capital}
          />
        </Field>

        {submitError && (
          <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs text-rose-700">
            <AlertCircle size={15} className="mt-px shrink-0" />
            <span>{submitError}</span>
          </div>
        )}
      </form>
    </Modal>
  );
}

/**
 * Renders nothing while closed, so the fields mount fresh on every open and
 * seed themselves from `billingForm` in useState. That is what keeps a
 * half-filled create form from reappearing inside a later edit, without an
 * effect resyncing state behind the user's back.
 */
export default function BillingFormModal({ open, billingForm, onClose, onSaved }) {
  if (!open) return null;

  return (
    <BillingFormFields
      billingForm={billingForm}
      onClose={onClose}
      onSaved={onSaved}
    />
  );
}
