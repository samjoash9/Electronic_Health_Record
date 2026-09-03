import { useQuery } from '@tanstack/react-query';
import { getForm } from '../api/forms.api';

export function useWellnessForm(formId) {
  return useQuery({
    queryKey: ['form', Number(formId)],
    queryFn: () => getForm(Number(formId)),
    enabled: Boolean(formId),
  });
}
