<script setup lang="ts">
// Fetch the tax planning form from Directus
const { data: form, error } = await useAsyncData('tax-planning-form', async () => {
  try {
    return await useForm('tax-planning')
  } catch (error) {
    console.error('Failed to fetch tax planning form:', error)
    return null
  }
})

// Comprehensive tax planning questionnaire if CMS form doesn't exist
const defaultForm = {
  id: 0,
  status: 'published' as const,
  date_created: new Date().toISOString(),
  date_updated: null,
  title: 'Tax Planning Questionnaire',
  slug: 'tax-planning',
  description: 'Please complete this questionnaire to help us prepare for your tax planning session. All information is kept strictly confidential.',
  success_message: 'Thank you for completing the Tax Planning Questionnaire! We will review your responses and contact you to schedule your planning session.',
  notify_email: 'sjh@sjhas.com',
  notify_on_submission: true,
  allow_file_uploads: true,
  max_file_size_mb: 10,
  allowed_file_types: '.pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png,.gif,.txt',
  fields: [
    // Personal Information Section
    {
      id: 'section-personal',
      type: 'heading' as const,
      label: 'Personal Information',
      name: 'section_personal',
      placeholder: null,
      help_text: 'Please provide your contact details.',
      required: false,
      validation_rules: null,
      options: null,
      conditional_logic: null,
      width: 'full' as const,
      sort: 1,
    },
    {
      id: 'first_name',
      type: 'text' as const,
      label: 'First Name',
      name: 'first_name',
      placeholder: 'John',
      help_text: null,
      required: true,
      validation_rules: null,
      options: null,
      conditional_logic: null,
      width: 'half' as const,
      sort: 2,
    },
    {
      id: 'last_name',
      type: 'text' as const,
      label: 'Last Name',
      name: 'last_name',
      placeholder: 'Smith',
      help_text: null,
      required: true,
      validation_rules: null,
      options: null,
      conditional_logic: null,
      width: 'half' as const,
      sort: 3,
    },
    {
      id: 'email',
      type: 'email' as const,
      label: 'Email Address',
      name: 'email',
      placeholder: 'john@example.com',
      help_text: null,
      required: true,
      validation_rules: null,
      options: null,
      conditional_logic: null,
      width: 'half' as const,
      sort: 4,
    },
    {
      id: 'phone',
      type: 'phone' as const,
      label: 'Phone Number',
      name: 'phone',
      placeholder: '(607) 555-1234',
      help_text: null,
      required: true,
      validation_rules: null,
      options: null,
      conditional_logic: null,
      width: 'half' as const,
      sort: 5,
    },
    // Filing Status Section
    {
      id: 'section-filing',
      type: 'heading' as const,
      label: 'Filing Status',
      name: 'section_filing',
      placeholder: null,
      help_text: 'Tell us about your tax filing situation.',
      required: false,
      validation_rules: null,
      options: null,
      conditional_logic: null,
      width: 'full' as const,
      sort: 10,
    },
    {
      id: 'filing_status',
      type: 'select' as const,
      label: 'Filing Status',
      name: 'filing_status',
      placeholder: 'Select your filing status',
      help_text: null,
      required: true,
      validation_rules: null,
      options: [
        { label: 'Single', value: 'single' },
        { label: 'Married Filing Jointly', value: 'married_joint' },
        { label: 'Married Filing Separately', value: 'married_separate' },
        { label: 'Head of Household', value: 'head_household' },
        { label: 'Qualifying Widow(er)', value: 'widow' },
      ],
      conditional_logic: null,
      width: 'half' as const,
      sort: 11,
    },
    {
      id: 'dependents',
      type: 'number' as const,
      label: 'Number of Dependents',
      name: 'dependents',
      placeholder: '0',
      help_text: null,
      required: false,
      validation_rules: null,
      options: null,
      conditional_logic: null,
      width: 'half' as const,
      sort: 12,
    },
    // Income Section
    {
      id: 'section-income',
      type: 'heading' as const,
      label: 'Income Sources',
      name: 'section_income',
      placeholder: null,
      help_text: 'Please indicate all sources of income.',
      required: false,
      validation_rules: null,
      options: null,
      conditional_logic: null,
      width: 'full' as const,
      sort: 20,
    },
    {
      id: 'has_w2',
      type: 'checkbox' as const,
      label: 'I have W-2 income (employment)',
      name: 'has_w2',
      placeholder: null,
      help_text: null,
      required: false,
      validation_rules: null,
      options: null,
      conditional_logic: null,
      width: 'full' as const,
      sort: 21,
    },
    {
      id: 'has_1099',
      type: 'checkbox' as const,
      label: 'I have 1099 income (self-employment/contract work)',
      name: 'has_1099',
      placeholder: null,
      help_text: null,
      required: false,
      validation_rules: null,
      options: null,
      conditional_logic: null,
      width: 'full' as const,
      sort: 22,
    },
    {
      id: 'has_investment',
      type: 'checkbox' as const,
      label: 'I have investment income (dividends, capital gains)',
      name: 'has_investment',
      placeholder: null,
      help_text: null,
      required: false,
      validation_rules: null,
      options: null,
      conditional_logic: null,
      width: 'full' as const,
      sort: 23,
    },
    {
      id: 'has_rental',
      type: 'checkbox' as const,
      label: 'I have rental income',
      name: 'has_rental',
      placeholder: null,
      help_text: null,
      required: false,
      validation_rules: null,
      options: null,
      conditional_logic: null,
      width: 'full' as const,
      sort: 24,
    },
    {
      id: 'has_retirement',
      type: 'checkbox' as const,
      label: 'I have retirement income (pension, IRA distributions)',
      name: 'has_retirement',
      placeholder: null,
      help_text: null,
      required: false,
      validation_rules: null,
      options: null,
      conditional_logic: null,
      width: 'full' as const,
      sort: 25,
    },
    {
      id: 'has_social_security',
      type: 'checkbox' as const,
      label: 'I receive Social Security benefits',
      name: 'has_social_security',
      placeholder: null,
      help_text: null,
      required: false,
      validation_rules: null,
      options: null,
      conditional_logic: null,
      width: 'full' as const,
      sort: 26,
    },
    // Life Changes Section
    {
      id: 'section-changes',
      type: 'heading' as const,
      label: 'Life Changes This Year',
      name: 'section_changes',
      placeholder: null,
      help_text: 'Have any of the following occurred this year?',
      required: false,
      validation_rules: null,
      options: null,
      conditional_logic: null,
      width: 'full' as const,
      sort: 30,
    },
    {
      id: 'change_marriage',
      type: 'checkbox' as const,
      label: 'Got married or divorced',
      name: 'change_marriage',
      placeholder: null,
      help_text: null,
      required: false,
      validation_rules: null,
      options: null,
      conditional_logic: null,
      width: 'full' as const,
      sort: 31,
    },
    {
      id: 'change_child',
      type: 'checkbox' as const,
      label: 'Had a child or adopted',
      name: 'change_child',
      placeholder: null,
      help_text: null,
      required: false,
      validation_rules: null,
      options: null,
      conditional_logic: null,
      width: 'full' as const,
      sort: 32,
    },
    {
      id: 'change_home',
      type: 'checkbox' as const,
      label: 'Bought or sold a home',
      name: 'change_home',
      placeholder: null,
      help_text: null,
      required: false,
      validation_rules: null,
      options: null,
      conditional_logic: null,
      width: 'full' as const,
      sort: 33,
    },
    {
      id: 'change_job',
      type: 'checkbox' as const,
      label: 'Changed jobs or started a business',
      name: 'change_job',
      placeholder: null,
      help_text: null,
      required: false,
      validation_rules: null,
      options: null,
      conditional_logic: null,
      width: 'full' as const,
      sort: 34,
    },
    {
      id: 'change_retirement',
      type: 'checkbox' as const,
      label: 'Retired or started receiving retirement income',
      name: 'change_retirement',
      placeholder: null,
      help_text: null,
      required: false,
      validation_rules: null,
      options: null,
      conditional_logic: null,
      width: 'full' as const,
      sort: 35,
    },
    // Documents Section
    {
      id: 'section-documents',
      type: 'heading' as const,
      label: 'Supporting Documents',
      name: 'section_documents',
      placeholder: null,
      help_text: 'Upload any relevant documents you have available.',
      required: false,
      validation_rules: null,
      options: null,
      conditional_logic: null,
      width: 'full' as const,
      sort: 40,
    },
    {
      id: 'documents',
      type: 'file' as const,
      label: 'Upload Documents (Optional)',
      name: 'documents',
      placeholder: null,
      help_text: 'Upload W-2s, 1099s, or other relevant tax documents.',
      required: false,
      validation_rules: null,
      options: null,
      conditional_logic: null,
      width: 'full' as const,
      sort: 41,
    },
    // Additional Notes
    {
      id: 'additional_notes',
      type: 'textarea' as const,
      label: 'Additional Information',
      name: 'additional_notes',
      placeholder: 'Please share any other information that would be helpful for your tax planning session...',
      help_text: null,
      required: false,
      validation_rules: null,
      options: null,
      conditional_logic: null,
      width: 'full' as const,
      sort: 50,
    },
  ],
}

const displayForm = computed(() => form.value || defaultForm)

const handleSubmitted = (data: Record<string, unknown>) => {
  console.log('Tax planning questionnaire submitted:', data)
}

// SEO
useSeoMeta({
  title: 'Tax Planning Questionnaire - SJHAS, Inc.',
  description: 'Complete our tax planning questionnaire to help us prepare for your personalized tax planning session.',
})
</script>

<template>
  <div class="min-h-screen t-bg">
    <!-- Hero -->
    <section class="t-hero py-20 lg:py-28">
      <div class="container-wide section-padding text-center">
        <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full t-hero-badge text-sm font-medium mb-6">
          <Icon name="lucide:clipboard-list" class="w-4 h-4" />
          <span>Tax Planning</span>
        </div>
        <h1 class="text-3xl sm:text-4xl lg:text-5xl t-heading t-hero-text mb-4">
          {{ displayForm.title }}
        </h1>
        <p class="text-lg t-hero-text-secondary max-w-2xl mx-auto">
          {{ displayForm.description }}
        </p>
      </div>
    </section>

    <!-- Progress indicator -->
    <section class="t-bg-elevated border-b t-border py-4">
      <div class="container-wide section-padding">
        <div class="flex items-center justify-center gap-8 text-sm">
          <div class="flex items-center gap-2 t-text-accent">
            <div class="w-6 h-6 rounded-full t-btn flex items-center justify-center text-xs font-medium">1</div>
            <span class="hidden sm:inline font-medium">Personal Info</span>
          </div>
          <div class="w-8 h-px" style="background-color: var(--theme-border-secondary);" />
          <div class="flex items-center gap-2 t-text-muted">
            <div class="w-6 h-6 rounded-full t-bg-alt flex items-center justify-center text-xs font-medium">2</div>
            <span class="hidden sm:inline">Income</span>
          </div>
          <div class="w-8 h-px" style="background-color: var(--theme-border-secondary);" />
          <div class="flex items-center gap-2 t-text-muted">
            <div class="w-6 h-6 rounded-full t-bg-alt flex items-center justify-center text-xs font-medium">3</div>
            <span class="hidden sm:inline">Documents</span>
          </div>
        </div>
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

        <!-- Help text -->
        <div class="mt-8 t-section-card rounded-xl p-6 border">
          <div class="flex items-start gap-4">
            <div class="w-10 h-10 rounded-lg t-icon-box flex items-center justify-center flex-shrink-0">
              <Icon name="lucide:help-circle" class="w-5 h-5" />
            </div>
            <div>
              <h3 class="font-semibold t-text mb-1">Need Help?</h3>
              <p class="text-sm t-text-secondary mb-3">
                If you have questions about this questionnaire or need assistance, we're here to help.
              </p>
              <div class="flex flex-wrap gap-4">
                <a
                  href="mailto:sjh@sjhas.com"
                  class="inline-flex items-center gap-2 text-sm t-text-accent font-medium t-link"
                >
                  <Icon name="lucide:mail" class="w-4 h-4" />
                  sjh@sjhas.com
                </a>
                <a
                  href="tel:6072168033"
                  class="inline-flex items-center gap-2 text-sm t-text-accent font-medium t-link"
                >
                  <Icon name="lucide:phone" class="w-4 h-4" />
                  (607) 216-8033
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
