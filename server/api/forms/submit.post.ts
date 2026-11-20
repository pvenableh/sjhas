import { adminNotificationTemplate } from '../../utils/emails/templates/adminNotification'
import { submitterConfirmationTemplate } from '../../utils/emails/templates/submitterConfirmation'
import { renderTemplate } from '../../utils/emails/render'

const DEFAULT_MAX_FILE_SIZE_MB = 10
const DEFAULT_ALLOWED_FILE_TYPES = '.pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png,.gif,.txt'
const MAX_FILES_PER_SUBMISSION = 20

// Response returned to suspected bots so they can't tell they were blocked
const FAKE_SUCCESS = { success: true, message: 'Form submitted successfully' }

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  console.log('[FormSubmit] ---- New form submission request ----')

  try {
    if (isRateLimited(event)) {
      console.warn('Form submission rate limited:', getRequestIP(event, { xForwardedFor: true }))
      throw createError({
        statusCode: 429,
        message: 'Too many submissions. Please wait a few minutes and try again.',
      })
    }

    // Parse multipart form data
    const formData = await readMultipartFormData(event)

    if (!formData) {
      console.error('[FormSubmit] No multipart form data found in request')
      throw createError({
        statusCode: 400,
        message: 'No form data received',
      })
    }

    console.log('[FormSubmit] Received', formData.length, 'multipart fields')

    // Extract data and files
    let jsonData: Record<string, unknown> = {}
    let formId: number | null = null
    let formToken: string | null = null
    let honeypot = ''
    const files: { fieldName: string; file: Buffer; filename: string; type: string }[] = []

    for (const field of formData) {
      if (field.name === 'data' && field.data) {
        try {
          jsonData = JSON.parse(field.data.toString())
        } catch {
          throw createError({ statusCode: 400, message: 'Invalid form data' })
        }
        console.log('[FormSubmit] Parsed JSON data keys:', Object.keys(jsonData).join(', '))
      } else if (field.name === 'form_id' && field.data) {
        formId = parseInt(field.data.toString())
        console.log('[FormSubmit] Form ID:', formId)
      } else if (field.name === '_token' && field.data) {
        formToken = field.data.toString()
      } else if (field.name === HONEYPOT_FIELD && field.data) {
        honeypot = field.data.toString()
      } else if (field.filename && field.data) {
        files.push({
          fieldName: field.name || 'file',
          file: field.data,
          filename: field.filename,
          type: field.type || 'application/octet-stream',
        })
        console.log('[FormSubmit] File received:', field.filename, `(${field.data.length} bytes)`)
      } else {
        console.log('[FormSubmit] Unhandled field:', field.name, '| has data:', !!field.data, '| has filename:', !!field.filename)
      }
    }

    if (!jsonData || typeof jsonData !== 'object' || Array.isArray(jsonData)) {
      throw createError({ statusCode: 400, message: 'Invalid form data' })
    }
    delete jsonData[HONEYPOT_FIELD]

    // --- Spam checks (silently drop anything that looks automated) ---
    const ip = getRequestIP(event, { xForwardedFor: true })

    if (honeypot.trim()) {
      console.warn('Form spam blocked (honeypot):', { ip, formId })
      return FAKE_SUCCESS
    }

    const tokenCheck = verifyFormToken(formToken)
    if (tokenCheck === 'expired') {
      throw createError({
        statusCode: 400,
        message: 'This form has expired. Please refresh the page and try again.',
      })
    }
    if (tokenCheck !== 'ok') {
      console.warn(`Form spam blocked (token ${tokenCheck}):`, { ip, formId })
      return FAKE_SUCCESS
    }

    const spamReason = detectSpamContent(jsonData)
    if (spamReason) {
      console.warn(`Form spam blocked (${spamReason}):`, { ip, formId })
      return FAKE_SUCCESS
    }

    // Fetch form details for file rules, per-form notify_email and title
    let formTitle = 'Form Submission'
    let formNotifyEmail: string | null = null
    let formSuccessMessage: string | null = null
    let allowFileUploads = true
    let maxFileSizeMb = DEFAULT_MAX_FILE_SIZE_MB
    let allowedFileTypes = DEFAULT_ALLOWED_FILE_TYPES

    if (formId && config.directus.staticToken) {
      try {
        const formResponse = await fetch(
          `${config.directus.url}/items/forms/${formId}?fields=title,notify_email,notify_on_submission,success_message,allow_file_uploads,max_file_size_mb,allowed_file_types`,
          { headers: { Authorization: `Bearer ${config.directus.staticToken}` } }
        )
        if (formResponse.ok) {
          const formResult = await formResponse.json()
          formTitle = formResult.data?.title || formTitle
          formNotifyEmail = formResult.data?.notify_email || null
          formSuccessMessage = formResult.data?.success_message || null
          if (formResult.data?.allow_file_uploads === false) allowFileUploads = false
          maxFileSizeMb = formResult.data?.max_file_size_mb || maxFileSizeMb
          allowedFileTypes = formResult.data?.allowed_file_types || allowedFileTypes
        }
      } catch (e) {
        console.error('Failed to fetch form details:', e)
      }
    }

    // --- Server-side file validation ---
    if (files.length > 0) {
      if (!allowFileUploads) {
        throw createError({ statusCode: 400, message: 'This form does not accept file uploads.' })
      }
      if (files.length > MAX_FILES_PER_SUBMISSION) {
        throw createError({
          statusCode: 400,
          message: `Please upload no more than ${MAX_FILES_PER_SUBMISSION} files at a time.`,
        })
      }
      const allowedExtensions = allowedFileTypes
        .split(',')
        .map((ext) => ext.trim().toLowerCase())
        .filter(Boolean)
      for (const fileData of files) {
        const ext = fileData.filename.includes('.')
          ? `.${fileData.filename.split('.').pop()!.toLowerCase()}`
          : ''
        if (allowedExtensions.length > 0 && !allowedExtensions.includes(ext)) {
          throw createError({ statusCode: 400, message: `File type not allowed: ${fileData.filename}` })
        }
        if (fileData.file.length > maxFileSizeMb * 1024 * 1024) {
          throw createError({
            statusCode: 400,
            message: `${fileData.filename} is larger than ${maxFileSizeMb}MB.`,
          })
        }
      }
    }

    // Submitter name (used for the saved submission and as the uploaded files' title)
    const submitterName: string | null = jsonData.name
      ? (jsonData.name as string)
      : jsonData.first_name && jsonData.last_name
        ? `${jsonData.first_name} ${jsonData.last_name}`
        : jsonData.taxpayer_name
          ? (jsonData.taxpayer_name as string)
          : null

    // Upload files to Directus if any
    const uploadedFiles: { fieldName: string; fileId: string; filename: string }[] = []

    if (files.length > 0 && config.directus.staticToken) {
      console.log('[FormSubmit] Uploading', files.length, 'file(s) to Directus')

      // Keep submitted files out of the folder Public can read: they go in
      // "Form Submissions/<form title>". If the folder can't be resolved we still
      // upload (the file must not be lost), just without a folder.
      let folderId: string | null = null
      try {
        folderId = await getSubmissionFolderId(
          { url: config.directus.url, token: config.directus.staticToken },
          formTitle
        )
      } catch (folderError) {
        console.error('[FormSubmit] Could not resolve submissions folder:', folderError)
      }

      for (const fileData of files) {
        try {
          const uploadFormData = new FormData()
          // Directus only reads metadata fields that come before the file part
          if (folderId) uploadFormData.append('folder', folderId)
          uploadFormData.append('title', submitterName || fileData.filename)
          const blob = new Blob([fileData.file], { type: fileData.type })
          uploadFormData.append('file', blob, fileData.filename)

          const response = await fetch(`${config.directus.url}/files`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${config.directus.staticToken}`,
            },
            body: uploadFormData,
          })

          if (response.ok) {
            const result = await response.json()
            uploadedFiles.push({
              fieldName: fileData.fieldName,
              fileId: result.data.id,
              filename: fileData.filename,
            })
            console.log('[FormSubmit] File uploaded:', fileData.filename, '-> ID:', result.data.id)
          } else {
            const errorText = await response.text()
            console.error('[FormSubmit] File upload failed:', response.status, errorText)
          }
        } catch (uploadError) {
          console.error('[FormSubmit] File upload error:', uploadError)
        }
      }
    } else if (files.length > 0) {
      console.warn('[FormSubmit] Files present but no Directus static token configured — skipping upload')
    }

    // Prepare submission data
    const submissionData = {
      form: formId || 0,
      data: {
        ...jsonData,
        uploaded_files: uploadedFiles.map((f) => ({
          field: f.fieldName,
          file_id: f.fileId,
          filename: f.filename,
        })),
      },
      submitter_email: (jsonData.email as string) || null,
      submitter_name: submitterName,
      status: 'new' as const,
    }

    // Save submission to Directus (if we have admin access)
    let submissionId: number | null = null
    // Set when the submission could not be saved; flagged loudly in the admin email
    // because the email is then the only record of it.
    let saveFailure: string | null = null
    if (config.directus.staticToken) {
      console.log('[FormSubmit] Saving submission to Directus for form_id:', formId)
      try {
        const response = await fetch(`${config.directus.url}/items/form_submissions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${config.directus.staticToken}`,
          },
          body: JSON.stringify(submissionData),
        })

        if (!response.ok) {
          const errorBody = await response.text()
          console.error('[FormSubmit] Failed to save submission:', response.status, errorBody)
          saveFailure = `Directus returned ${response.status}: ${errorBody.slice(0, 300)}`
        } else {
          const result = await response.json()
          submissionId = result.data?.id ?? null
          console.log('[FormSubmit] Submission saved successfully, ID:', submissionId)
        }
      } catch (saveError) {
        console.error('[FormSubmit] Submission save error:', saveError)
        saveFailure = `Could not reach Directus: ${(saveError as Error)?.message || saveError}`
      }
    } else {
      console.warn('[FormSubmit] No Directus static token — submission NOT saved to database')
      saveFailure = 'No Directus token is configured on the server'
    }

    // Send admin notification email
    let adminEmailSent = false
    if (config.sendgridApiKey && config.notificationEmail) {
      try {
        const notifyTo = formNotifyEmail || config.notificationEmail
        console.log('[FormSubmit] Sending admin notification to:', notifyTo)
        await sendNotificationEmail(config, jsonData, uploadedFiles, formTitle, notifyTo, submissionId, saveFailure)
        adminEmailSent = true
        console.log('[FormSubmit] Admin notification sent successfully')
      } catch (emailError) {
        console.error('[FormSubmit] Email notification error:', emailError)
      }
    } else {
      console.warn('[FormSubmit] Skipping admin email — sendgridApiKey:', !!config.sendgridApiKey, '| notificationEmail:', !!config.notificationEmail)
    }

    // Neither saved nor emailed: nothing records this submission, so tell the submitter
    // (instead of a false success) so they can retry or contact the office.
    if (saveFailure && !adminEmailSent) {
      console.error('[FormSubmit] DATA LOSS RISK: not saved and admin email not sent. Reason:', saveFailure)
      throw createError({
        statusCode: 500,
        message: 'We could not process your submission. Please try again in a few minutes or contact us directly.',
      })
    }

    // Send confirmation email to submitter
    const submitterEmail = (jsonData.email as string) || null
    if (config.sendgridApiKey && submitterEmail) {
      try {
        console.log('[FormSubmit] Sending confirmation email to:', submitterEmail)
        await sendConfirmationEmail(config, submitterEmail, submissionData.submitter_name, formTitle, formSuccessMessage)
        console.log('[FormSubmit] Confirmation email sent successfully')
      } catch (emailError) {
        console.error('[FormSubmit] Confirmation email error:', emailError)
      }
    } else {
      console.warn('[FormSubmit] Skipping confirmation email — sendgridApiKey:', !!config.sendgridApiKey, '| submitterEmail:', submitterEmail)
    }

    console.log('[FormSubmit] ---- Submission complete — returning success ----')
    return {
      success: true,
      message: 'Form submitted successfully',
    }
  } catch (error: any) {
    console.error('[FormSubmit] ---- FATAL submission error ----')
    console.error('[FormSubmit] Error:', error?.message || error)
    console.error('[FormSubmit] Stack:', error?.stack)
    throw createError({
      statusCode: error?.statusCode || 500,
      message: error?.message || 'Failed to process form submission',
    })
  }
})

async function sendNotificationEmail(
  config: ReturnType<typeof useRuntimeConfig>,
  data: Record<string, unknown>,
  files: { fieldName: string; fileId: string; filename: string }[],
  formTitle: string,
  notifyTo: string,
  submissionId: number | null,
  saveFailure: string | null = null
) {
  const sgMail = await import('@sendgrid/mail')
  sgMail.default.setApiKey(config.sendgridApiKey)

  const submitterName = data.name || (data.first_name && data.last_name ? `${data.first_name} ${data.last_name}` : null) || data.taxpayer_name || 'Unknown'
  const submitterEmail = data.email || 'Not provided'

  // Prominent banner (first table row) when the submission was not saved
  const saveFailureRow = saveFailure
    ? `<tr><td colspan="2" style="padding: 14px 16px; background: #b42318; color: #ffffff; font-weight: 600; border-radius: 4px;">&#9888; NOT SAVED TO THE ADMIN. This email is the only record of this submission &mdash; it will not appear under Submissions. Please keep this email and tell the developer.<br><span style="font-weight: 400; font-size: 12px;">${escapeHtml(saveFailure)}</span></td></tr>`
    : ''

  const dataRows = saveFailureRow + Object.entries(data)
    .filter(([key]) => !['uploaded_files'].includes(key))
    .map(([key, value]) => {
      const label = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
      const displayValue = typeof value === 'boolean'
        ? (value ? 'Yes' : 'No')
        : (value || 'Not provided')
      return `<tr><td style="padding: 10px 12px; border-bottom: 1px solid rgba(255,255,255,0.15); font-weight: 500; color: rgba(255,255,255,0.9);">${escapeHtml(label)}</td><td style="padding: 10px 12px; border-bottom: 1px solid rgba(255,255,255,0.15); color: rgba(255,255,255,0.7);">${escapeHtml(displayValue)}</td></tr>`
    })
    .join('')

  const filesSection = files.length > 0
    ? `
      <h3 style="color: rgba(255,255,255,0.9); margin-top: 24px; margin-bottom: 12px; font-size: 14px; font-weight: 600;">Uploaded Files</h3>
      <ul style="color: rgba(255,255,255,0.7); padding-left: 20px;">
        ${files.map((f) => `<li style="margin-bottom: 6px;">${escapeHtml(f.filename)}</li>`).join('')}
      </ul>
    `
    : ''

  // Link to the submission in the admin (falls back to the list if saving failed)
  const siteUrl = String(config.public.siteUrl || '').replace(/\/+$/, '')
  const submissionUrl = submissionId
    ? `${siteUrl}/admin/submissions/${submissionId}`
    : `${siteUrl}/admin/submissions`

  const htmlContent = renderTemplate(adminNotificationTemplate, {
    submissionUrl: escapeHtml(submissionUrl),
    formTitle: escapeHtml(formTitle),
    submitterName: escapeHtml(submitterName),
    dataRows,
    filesSection,
    receivedDate: new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' }),
  })

  await sgMail.default.send({
    to: notifyTo,
    from: { email: config.sendgridFromEmail, name: 'SJH Accounting' },
    subject: `${saveFailure ? '[NOT SAVED] ' : ''}New Submission: ${formTitle} — from ${submitterName}`,
    html: htmlContent,
    replyTo: submitterEmail as string,
    bcc: notifyTo.toLowerCase() !== config.notificationEmail.toLowerCase()
      ? [config.notificationEmail, 'huestudios.com@gmail.com']
      : 'huestudios.com@gmail.com',
  })
}

async function sendConfirmationEmail(
  config: ReturnType<typeof useRuntimeConfig>,
  recipientEmail: string,
  recipientName: string | null,
  formTitle: string,
  successMessage: string | null
) {
  const sgMail = await import('@sendgrid/mail')
  sgMail.default.setApiKey(config.sendgridApiKey)

  const displayName = recipientName || recipientEmail.split('@')[0] || recipientEmail
  const confirmationText = successMessage || 'Thank you for your submission! We have received your information and will be in touch soon.'

  const htmlContent = renderTemplate(submitterConfirmationTemplate, {
    displayName: escapeHtml(displayName),
    confirmationText,
    formTitle: escapeHtml(formTitle),
    submittedDate: new Date().toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' }),
  })

  await sgMail.default.send({
    to: recipientEmail,
    from: { email: config.sendgridFromEmail, name: 'SJH Accounting' },
    replyTo: config.notificationEmail,
    subject: `Confirmation: ${formTitle} — SJHAS, Inc.`,
    html: htmlContent,
    bcc: [config.notificationEmail, 'huestudios.com@gmail.com'],
  })
}
