import { useQuery } from '@tanstack/react-query';
import { getForm } from '../api/forms.api';

export function useWellnessForm(formId) {
  return useQuery({
    queryKey: ['form', Number(formId)],
    queryFn: () => getForm(Number(formId)),
    enabled: Boolean(formId),
    // A form's status decides which desk may edit it, so opening a station
    // page always re-reads it rather than trusting the app-wide staleTime.
    // Without this, a form handed off seconds ago is served from cache with
    // the previous station's status still on it.
    refetchOnMount: 'always',
  });
}
