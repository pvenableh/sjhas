import { createDirectus, rest, createItem, uploadFiles } from '@directus/sdk'
import type { Collections } from '~/types/directus'

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

    // Create Directus client with admin token
    const client = createDirectus<Collections>(config.public.directusUrl)
      .with(rest())

    // Upload files to Directus if any
    const uploadedFiles: { fieldName: string; fileId: string; filename: string }[] = []

    if (files.length > 0 && config.directusToken) {
      for (const fileData of files) {
        try {
          // Create a FormData object for the file upload
          const uploadFormData = new FormData()
          const blob = new Blob([fileData.file], { type: fileData.type })
          uploadFormData.append('file', blob, fileData.filename)

          // Upload to Directus
          const response = await fetch(`${config.public.directusUrl}/files`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${config.directusToken}`,
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
    if (config.directusToken) {
      try {
        const response = await fetch(`${config.public.directusUrl}/items/form_submissions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${config.directusToken}`,
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

    // Send email notification
    if (config.sendgridApiKey && config.notificationEmail) {
      try {
        await sendNotificationEmail(config, jsonData, uploadedFiles, formId)
      } catch (emailError) {
        console.error('Email notification error:', emailError)
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
  formId: number | null
) {
  const sgMail = await import('@sendgrid/mail')
  sgMail.default.setApiKey(config.sendgridApiKey)

  // Build email content
  const submitterName = data.name || (data.first_name && data.last_name ? `${data.first_name} ${data.last_name}` : 'Unknown')
  const submitterEmail = data.email || 'Not provided'

  // Format data for email
  const dataRows = Object.entries(data)
    .filter(([key]) => !['uploaded_files'].includes(key))
    .map(([key, value]) => {
      const label = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
      const displayValue = typeof value === 'boolean'
        ? (value ? 'Yes' : 'No')
        : (value || 'Not provided')
      return `<tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: 500; color: #374151;">${label}</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">${displayValue}</td></tr>`
    })
    .join('')

  // Files section
  const filesSection = files.length > 0
    ? `
      <h3 style="color: #1f2937; margin-top: 24px; margin-bottom: 12px;">Uploaded Files</h3>
      <ul style="color: #6b7280; padding-left: 20px;">
        ${files.map((f) => `<li>${f.filename} <a href="${config.public.directusUrl}/assets/${f.fileId}" style="color: #2563eb;">View</a></li>`).join('')}
      </ul>
    `
    : ''

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #374151; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #1f4537 0%, #2a6c51 100%); padding: 24px; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">New Form Submission</h1>
        <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0 0;">From ${submitterName}</p>
      </div>

      <div style="background: #ffffff; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        <table style="width: 100%; border-collapse: collapse;">
          ${dataRows}
        </table>

        ${filesSection}

        <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            This submission was received on ${new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}
          </p>
        </div>
      </div>
    </body>
    </html>
  `

  const msg = {
    to: config.notificationEmail,
    from: config.sendgridFromEmail,
    subject: `New Form Submission from ${submitterName}`,
    html: htmlContent,
    replyTo: submitterEmail as string,
  }

  await sgMail.default.send(msg)
}
