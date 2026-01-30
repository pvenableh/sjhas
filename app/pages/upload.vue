<script setup lang="ts">
// Fetch the upload form from Directus
const { data: form, error } = await useAsyncData('upload-form', async () => {
  try {
    return await useForm('upload')
  } catch (error) {
    console.error('Failed to fetch upload form:', error)
    return null
  }
})

// Default form structure if CMS form doesn't exist
const defaultForm = {
  id: 0,
  status: 'published' as const,
  date_created: new Date().toISOString(),
  date_updated: null,
  title: 'Upload Files to SJHAS, Inc.',
  slug: 'upload',
  description: 'Upload your documents securely. We accept PDF, Word, Excel, and image files up to 10MB each.',
  success_message: 'Thank you! Your documents have been uploaded successfully. We will review them and get back to you soon.',
  notify_email: 'sjh@sjhas.com',
  notify_on_submission: true,
  allow_file_uploads: true,
  max_file_size_mb: 10,
  allowed_file_types: '.pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png,.gif,.txt',
  fields: [
    {
      id: 'name',
      type: 'text' as const,
      label: 'Your Name',
      name: 'name',
      placeholder: 'John Smith',
      help_text: null,
      required: true,
      validation_rules: null,
      options: null,
      conditional_logic: null,
      width: 'half' as const,
      sort: 1,
    },
    {
      id: 'email',
      type: 'email' as const,
      label: 'Email Address',
      name: 'email',
      placeholder: 'john@example.com',
      help_text: 'We\'ll send a confirmation to this address.',
      required: true,
      validation_rules: null,
      options: null,
      conditional_logic: null,
      width: 'half' as const,
      sort: 2,
    },
    {
      id: 'phone',
      type: 'phone' as const,
      label: 'Phone Number',
      name: 'phone',
      placeholder: '(607) 555-1234',
      help_text: null,
      required: false,
      validation_rules: null,
      options: null,
      conditional_logic: null,
      width: 'half' as const,
      sort: 3,
    },
    {
      id: 'document_type',
      type: 'select' as const,
      label: 'Document Type',
      name: 'document_type',
      placeholder: 'Select document type',
      help_text: null,
      required: true,
      validation_rules: null,
      options: [
        { label: 'Tax Documents', value: 'tax' },
        { label: 'W-2 Forms', value: 'w2' },
        { label: '1099 Forms', value: '1099' },
        { label: 'Business Documents', value: 'business' },
        { label: 'Payroll Documents', value: 'payroll' },
        { label: 'Other', value: 'other' },
      ],
      conditional_logic: null,
      width: 'half' as const,
      sort: 4,
    },
    {
      id: 'files',
      type: 'file' as const,
      label: 'Upload Documents',
      name: 'files',
      placeholder: null,
      help_text: 'You can upload multiple files. Accepted formats: PDF, Word, Excel, CSV, images (max 10MB each).',
      required: true,
      validation_rules: null,
      options: null,
      conditional_logic: null,
      width: 'full' as const,
      sort: 5,
    },
    {
      id: 'notes',
      type: 'textarea' as const,
      label: 'Additional Notes',
      name: 'notes',
      placeholder: 'Any additional information about these documents...',
      help_text: null,
      required: false,
      validation_rules: null,
      options: null,
      conditional_logic: null,
      width: 'full' as const,
      sort: 6,
    },
  ],
}

const displayForm = computed(() => form.value || defaultForm)

const handleSubmitted = (data: Record<string, unknown>) => {
  console.log('Form submitted:', data)
}

// SEO
useSeoMeta({
  title: 'Upload Documents - SJHAS, Inc.',
  description: 'Securely upload your tax documents, W-2s, 1099s, and other financial documents to SJHAS, Inc.',
})
</script>

<template>
  <div class="min-h-screen t-bg">
    <!-- Hero -->
    <section class="t-hero py-20 lg:py-28">
      <div class="container-wide section-padding text-center">
        <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full t-hero-badge text-sm font-medium mb-6">
          <Icon name="lucide:shield-check" class="w-4 h-4" />
          <span>Secure Document Upload</span>
        </div>
        <h1 class="text-3xl sm:text-4xl lg:text-5xl t-heading t-hero-text mb-4">
          {{ displayForm.title }}
        </h1>
        <p class="text-lg t-hero-text-secondary max-w-2xl mx-auto">
          {{ displayForm.description }}
        </p>
      </div>
    </section>

    <!-- Form section -->
    <section class="py-12 lg:py-20">
      <div class="container-narrow section-padding">
        <Card class="p-6 sm:p-8 lg:p-10">
          <FormsDynamicForm
            :form="displayForm"
            @submitted="handleSubmitted"
          />
        </Card>

        <!-- Security note -->
        <div class="mt-8 flex items-start gap-3 text-sm t-text-muted">
          <Icon name="lucide:lock" class="w-5 h-5 t-text-accent flex-shrink-0 mt-0.5" />
          <p>
            Your documents are transmitted securely and stored in our protected system.
            We take your privacy seriously and will never share your information with third parties.
          </p>
        </div>
      </div>
    </section>
  </div>
</template>
