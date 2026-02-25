/**
 * Replaces {{variable}} placeholders in an email template with provided values.
 *
 * Variables not present in `vars` are replaced with an empty string,
 * so optional sections (like {{customMessage}}) simply disappear when not provided.
 */
export function renderTemplate(html: string, vars: Record<string, string>): string {
  return html.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? '')
}
