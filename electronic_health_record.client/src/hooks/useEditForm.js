import { useMutation, useQueryClient } from '@tanstack/react-query';
import { editForm } from '../api/forms.api';

/**
 * Superadmin correction of an existing form.
 *
 * `changes` holds only the fields the operator actually touched -- the endpoint
 * is a sparse PATCH, so anything not sent is left alone. See editForm in
 * src/api/forms.api.js.
 */
export function useEditForm(formId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ changes, reason, rowVersion }) =>
      editForm({ formID: Number(formId), changes, reason, rowVersion }),
    onSuccess: (updated) => {
      // The response is the full rebuilt form, so seed it straight into the
      // cache rather than only invalidating: the page re-renders from the
      // server's own copy (including the new rowVersion) without a round trip,
      // and a second edit in the same sitting then has a fresh token to send.
      queryClient.setQueryData(['form', Number(formId)], updated);

      // The forms list and the dashboard read ['forms']; the edit also writes
      // an audit row, so the activity log is stale too.
      queryClient.invalidateQueries({ queryKey: ['forms'] });
      queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
    },
  });
}
