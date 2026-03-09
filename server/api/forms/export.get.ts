// server/api/forms/export.get.ts
/**
 * Export form submissions as CSV.
 *
 * Query params:
 *   - form_id (required): The ID of the form whose submissions to export
 *   - status (optional): Filter by submission status (new, reviewed, archived)
 *
 * Each dynamic field from the form's JSON `data` column becomes its own CSV column.
 */
export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, message: 'Authentication required' })
  }

  const query = getQuery(event)
  const formId = query.form_id as string | undefined

  if (!formId) {
    throw createError({ statusCode: 400, message: 'form_id is required' })
  }

  const directus = await getUserDirectus(event)

  try {
    // Fetch the form definition to get field labels
    const form = await directus.request(
      readItem('forms', formId, {
        fields: ['id', 'title', 'fields'],
      })
    ) as any

    if (!form) {
      throw createError({ statusCode: 404, message: 'Form not found' })
    }

    // Build a filter for submissions
    const filter: Record<string, any> = { form: { _eq: formId } }
    const status = query.status as string | undefined
    if (status && status !== 'all') {
      filter.status = { _eq: status }
    }

    // Fetch all submissions for this form
    const submissions = await directus.request(
      readItems('form_submissions', {
        filter,
        sort: ['-date_created'],
        fields: ['id', 'status', 'submitter_name', 'submitter_email', 'date_created', 'data', 'notes'],
        limit: -1,
      })
    ) as any[]

    // Build a map of field name -> label from the form definition
    const fieldDefs: Array<{ name: string; label: string; type: string }> = []
    if (Array.isArray(form.fields)) {
      for (const field of form.fields) {
        // Skip display-only fields
        if (field.type === 'heading' || field.type === 'paragraph') continue
        fieldDefs.push({ name: field.name, label: field.label, type: field.type })
      }
    }

    // Collect all unique dynamic field keys across submissions (in case form changed over time)
    const dynamicKeySet = new Set<string>()
    for (const sub of submissions) {
      if (sub.data && typeof sub.data === 'object') {
        for (const key of Object.keys(sub.data)) {
          if (key !== 'uploaded_files') {
            dynamicKeySet.add(key)
          }
        }
      }
    }

    // Order dynamic columns: known fields first (in form order), then any extras
    const knownNames = fieldDefs.map((f) => f.name)
    const extraKeys = [...dynamicKeySet].filter((k) => !knownNames.includes(k)).sort()
    const orderedDynamicKeys = [...knownNames.filter((n) => dynamicKeySet.has(n)), ...extraKeys]

    // Build label lookup
    const labelMap = new Map(fieldDefs.map((f) => [f.name, f.label]))

    // CSV header row
    const staticHeaders = ['Submission ID', 'Status', 'Submitter Name', 'Submitter Email', 'Date Submitted']
    const dynamicHeaders = orderedDynamicKeys.map((key) => labelMap.get(key) || formatKey(key))
    const headers = [...staticHeaders, ...dynamicHeaders, 'Uploaded Files', 'Admin Notes']

    // CSV rows
    const rows: string[][] = [headers]
    for (const sub of submissions) {
      const data = sub.data || {}
      const uploadedFiles = Array.isArray(data.uploaded_files)
        ? data.uploaded_files.map((f: any) => f.filename).join(', ')
        : ''
      const row = [
        String(sub.id),
        sub.status || '',
        sub.submitter_name || '',
        sub.submitter_email || '',
        sub.date_created || '',
        ...orderedDynamicKeys.map((key) => formatCellValue(data[key])),
        uploadedFiles,
        sub.notes || '',
      ]
      rows.push(row)
    }

    // Convert to CSV string
    const csv = rows.map((row) => row.map(escapeCsvField).join(',')).join('\r\n')

    // Sanitize form title for filename
    const safeTitle = (form.title || 'submissions')
      .replace(/[^a-zA-Z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .toLowerCase()
    const filename = `${safeTitle}-submissions.csv`

    setResponseHeaders(event, {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    })

    // Prepend BOM for Excel compatibility
    return '\uFEFF' + csv
  } catch (error: any) {
    if (error.statusCode) throw error
    const statusCode = getDirectusHttpStatus(error)
    const message = getDirectusErrorMessage(error)
    console.error('[/api/forms/export] Error:', message)
    throw createError({ statusCode, message })
  }
})

function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (Array.isArray(value)) return value.join(', ')
  return String(value)
}

function escapeCsvField(field: string): string {
  if (field.includes(',') || field.includes('"') || field.includes('\n') || field.includes('\r')) {
    return '"' + field.replace(/"/g, '""') + '"'
  }
  return field
}

function formatKey(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
}
