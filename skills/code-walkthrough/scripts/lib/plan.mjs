export const isPlan = data => data?.mode === 'plan';

// Shape failures that only a plan has. Later checks are added to this list.
export function planShapeErrors(data) {
  const errors = [];
  if (data.extend !== undefined) errors.push('a plan has no extend points; put the work in plan.tasks');
  return errors;
}
