import { adminNotificationTemplate } from '../../utils/emails/templates/adminNotification'
import { submitterConfirmationTemplate } from '../../utils/emails/templates/submitterConfirmation'
import { renderTemplate } from '../../utils/emails/render'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  try {
    // Parse multipart form data
    const formData = await readMultipartFormData(event)

    if (!formData) {
      throw createError({
        statusCode: 400,
        message: 'No form data received',
      })
    }

    // Extract data and files
    let jsonData: Record<string, unknown> = {}
    let formId: number | null = null
    const files: { fieldName: string; file: Buffer; filename: string; type: string }[] = []

    for (const field of formData) {
      if (field.name === 'data' && field.data) {
        jsonData = JSON.parse(field.data.toString())
      } else if (field.name === 'form_id' && field.data) {
        formId = parseInt(field.data.toString())
      } else if (field.filename && field.data) {
        files.push({
          fieldName: field.name || 'file',
          file: field.data,
          filename: field.filename,
          type: field.type || 'application/octet-stream',
        })
      }
    }

    // Upload files to Directus if any
    const uploadedFiles: { fieldName: string; fileId: string; filename: string }[] = []

    if (files.length > 0 && config.directus.staticToken) {
      for (const fileData of files) {
        try {
          const uploadFormData = new FormData()
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
          }
        } catch (uploadError) {
          console.error('File upload error:', uploadError)
        }
      }
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
      submitter_name: jsonData.name
        ? (jsonData.name as string)
        : jsonData.first_name && jsonData.last_name
          ? `${jsonData.first_name} ${jsonData.last_name}`
          : null,
      status: 'new' as const,
    }

    // Save submission to Directus (if we have admin access)
    if (config.directus.staticToken) {
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
          console.error('Failed to save submission:', await response.text())
        }
      } catch (saveError) {
        console.error('Submission save error:', saveError)
      }
    }

    // Fetch form details for per-form notify_email and title
    let formTitle = 'Form Submission'
    let formNotifyEmail: string | null = null
    let formSuccessMessage: string | null = null

    if (formId && config.directus.staticToken) {
      try {
        const formResponse = await fetch(
          `${config.directus.url}/items/forms/${formId}?fields=title,notify_email,notify_on_submission,success_message`,
          { headers: { Authorization: `Bearer ${config.directus.staticToken}` } }
        )
        if (formResponse.ok) {
          const formResult = await formResponse.json()
          formTitle = formResult.data?.title || formTitle
          formNotifyEmail = formResult.data?.notify_email || null
          formSuccessMessage = formResult.data?.success_message || null
        }
      } catch (e) {
        console.error('Failed to fetch form details:', e)
      }
    }

    // Send admin notification email
    if (config.sendgridApiKey && config.notificationEmail) {
      try {
        const notifyTo = formNotifyEmail || config.notificationEmail
        await sendNotificationEmail(config, jsonData, uploadedFiles, formTitle, notifyTo)
      } catch (emailError) {
        console.error('Email notification error:', emailError)
      }
    }

    // Send confirmation email to submitter
    const submitterEmail = (jsonData.email as string) || null
    if (config.sendgridApiKey && submitterEmail) {
      try {
        await sendConfirmationEmail(config, submitterEmail, submissionData.submitter_name, formTitle, formSuccessMessage)
      } catch (emailError) {
        console.error('Confirmation email error:', emailError)
      }
    }

    return {
      success: true,
      message: 'Form submitted successfully',
    }
  } catch (error) {
    console.error('Form submission error:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to process form submission',
    })
  }
})

async function sendNotificationEmail(
  config: ReturnType<typeof useRuntimeConfig>,
  data: Record<string, unknown>,
  files: { fieldName: string; fileId: string; filename: string }[],
  formTitle: string,
  notifyTo: string
) {
  const sgMail = await import('@sendgrid/mail')
  sgMail.default.setApiKey(config.sendgridApiKey)

  const submitterName = data.name || (data.first_name && data.last_name ? `${data.first_name} ${data.last_name}` : 'Unknown')
  const submitterEmail = data.email || 'Not provided'

  const dataRows = Object.entries(data)
    .filter(([key]) => !['uploaded_files'].includes(key))
    .map(([key, value]) => {
      const label = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
      const displayValue = typeof value === 'boolean'
        ? (value ? 'Yes' : 'No')
        : (value || 'Not provided')
      return `<tr><td style="padding: 10px 12px; border-bottom: 1px solid rgba(255,255,255,0.15); font-weight: 500; color: rgba(255,255,255,0.9);">${label}</td><td style="padding: 10px 12px; border-bottom: 1px solid rgba(255,255,255,0.15); color: rgba(255,255,255,0.7);">${displayValue}</td></tr>`
    })
    .join('')

  const filesSection = files.length > 0
    ? `
      <h3 style="color: rgba(255,255,255,0.9); margin-top: 24px; margin-bottom: 12px; font-size: 14px; font-weight: 600;">Uploaded Files</h3>
      <ul style="color: rgba(255,255,255,0.7); padding-left: 20px;">
        ${files.map((f) => `<li style="margin-bottom: 6px;">${f.filename} <a href="${config.directus.url}/assets/${f.fileId}" style="color: rgba(255,255,255,0.8); text-decoration: underline;">View</a></li>`).join('')}
      </ul>
    `
    : ''

  const htmlContent = renderTemplate(adminNotificationTemplate, {
    formTitle,
    submitterName: String(submitterName),
    dataRows,
    filesSection,
    receivedDate: new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' }),
  })

  await sgMail.default.send({
    to: notifyTo,
    from: { email: config.sendgridFromEmail, name: 'SJH Accounting' },
    subject: `New Submission: ${formTitle} — from ${submitterName}`,
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
    displayName,
    confirmationText,
    formTitle,
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
