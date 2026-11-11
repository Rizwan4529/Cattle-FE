/** Small helpers shared by the site's forms. */

/** id + aria-invalid + aria-describedby for a control inside `FormField`. */
export const fieldAria = (id: string, error?: string) => ({
  id,
  'aria-invalid': Boolean(error),
  'aria-describedby': error ? `${id}-error` : undefined,
})

export const EMAIL = /^\S+@\S+\.\S+$/
export const validPhone = (v: string) => {
  const d = v.replace(/\D/g, '')
  return d.length === 10 || (d.length === 11 && d.startsWith('1'))
}

/** Focuses the first field (in `order`) that has an error. Returns true if there was one. */
export function focusFirstError(prefix: string, order: string[], errors: Record<string, string | undefined>) {
  const first = order.find((f) => errors[f])
  if (first) document.getElementById(`${prefix}-${first}`)?.focus()
  return Boolean(first)
}
