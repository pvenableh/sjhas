<script setup lang="ts">
import type { FormStep } from '~/components/forms/DynamicForm.vue'

// Fetch the tax planning form from Directus
const { data: form, error } = await useAsyncData('tax-planning-form', async () => {
  try {
    return await useDirectusForm('tax-planning')
  } catch (error) {
    console.error('Failed to fetch tax planning form:', error)
    return null
  }
})

// Helper to create a field definition concisely
const field = (
  id: string,
  type: string,
  label: string,
  sort: number,
  overrides: Record<string, unknown> = {},
) => ({
  id,
  type: type as any,
  label,
  name: id,
  placeholder: null as string | null,
  help_text: null as string | null,
  required: false,
  validation_rules: null,
  options: null as Array<{ label: string; value: string }> | null,
  conditional_logic: null,
  width: 'full' as const,
  sort,
  ...overrides,
})

// Tax Services Questionnaire default form
const defaultForm = {
  id: 0,
  status: 'published' as const,
  title: 'Tax Services Questionnaire',
  slug: 'tax-planning',
  description: 'Please complete this questionnaire so we can best serve your tax and payroll needs. All information is kept strictly confidential.',
  success_message: 'Thank you for completing the Tax Services Questionnaire! We will review your responses and contact you shortly.',
  notify_email: 'sjh@sjhas.com',
  notify_on_submission: true,
  allow_file_uploads: true,
  max_file_size_mb: 10,
  allowed_file_types: '.pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png,.gif,.txt',
  fields: [
    // ── Step 1: Personal Info & Service Selection (sort 1–19) ──
    field('section_personal', 'heading', 'Personal Information', 1, {
      help_text: 'Please provide your contact details.',
    }),
    field('first_name', 'text', 'First Name', 2, {
      placeholder: 'John', required: true, width: 'half',
    }),
    field('last_name', 'text', 'Last Name', 3, {
      placeholder: 'Smith', required: true, width: 'half',
    }),
    field('email', 'email', 'Email Address', 4, {
      placeholder: 'john@example.com', required: true, width: 'half',
    }),
    field('phone', 'phone', 'Phone Number', 5, {
      placeholder: '(607) 555-1234', required: true, width: 'half',
    }),
    field('section_services', 'heading', 'Service Selection', 10, {
      help_text: 'Select all tax & payroll services you are interested in.',
    }),
    field('service_types', 'checkbox_group', 'What type of tax & payroll services are you interested in?', 11, {
      required: true,
      options: [
        { label: 'Individual Tax', value: 'individual_tax' },
        { label: 'Self-Employment', value: 'self_employment' },
        { label: 'LLC & Partnership', value: 'llc_partnership' },
        { label: 'S or C Corporation', value: 's_c_corporation' },
        { label: 'Payroll Services', value: 'payroll_services' },
        { label: 'Sales Tax Services', value: 'sales_tax' },
        { label: 'Exempt Organization Returns', value: 'exempt_org' },
        { label: 'Fiduciary Returns - Trusts & Estates', value: 'fiduciary' },
      ],
    }),

    // ── Step 2: Individual Tax (sort 100–119) ──
    field('section_individual', 'heading', 'Individual Tax Information', 100, {
      help_text: 'Tell us about your individual tax situation.',
    }),
    field('filing_status', 'select', 'Filing Status', 101, {
      required: true, width: 'half',
      placeholder: 'Select your filing status',
      options: [
        { label: 'Single', value: 'single' },
        { label: 'Married Filing Jointly', value: 'married_joint' },
        { label: 'Married Filing Separately', value: 'married_separate' },
        { label: 'Head of Household', value: 'head_household' },
        { label: 'Qualifying Widow(er)', value: 'widow' },
      ],
    }),
    field('dependents', 'number', 'Number of Dependents', 102, {
      placeholder: '0', width: 'half',
    }),
    field('has_w2', 'checkbox', 'I have W-2 income (employment)', 103),
    field('has_investment', 'checkbox', 'I have investment income (dividends, capital gains)', 104),
    field('has_rental', 'checkbox', 'I have rental property income', 105),
    field('has_retirement', 'checkbox', 'I have retirement income (pension, IRA distributions)', 106),
    field('has_social_security', 'checkbox', 'I receive Social Security benefits', 107),
    field('individual_notes', 'textarea', 'Additional details about your individual tax situation', 108, {
      placeholder: 'Any other details relevant to your individual return...',
    }),

    // ── Step 3: Self-Employment (sort 120–139) ──
    field('section_self_employment', 'heading', 'Self-Employment Details', 120, {
      help_text: 'Tell us about your self-employment activity.',
    }),
    field('se_business_name', 'text', 'Business Name (DBA)', 121, { width: 'half' }),
    field('se_business_type', 'select', 'Type of Business Activity', 122, {
      width: 'half',
      placeholder: 'Select business type',
      options: [
        { label: 'Freelance / Consulting', value: 'freelance' },
        { label: 'Sole Proprietorship', value: 'sole_prop' },
        { label: 'Independent Contractor', value: 'contractor' },
        { label: 'Other', value: 'other' },
      ],
    }),
    field('se_has_1099', 'checkbox', 'I receive 1099 forms for my work', 123),
    field('se_home_office', 'checkbox', 'I use a dedicated home office', 124),
    field('se_estimated_income', 'text', 'Estimated Annual Self-Employment Income', 125, {
      placeholder: '$0.00', width: 'half',
    }),
    field('se_notes', 'textarea', 'Additional details about your self-employment', 126, {
      placeholder: 'Describe your business activities, major expenses, etc.',
    }),

    // ── Step 4: LLC & Partnership (sort 140–159) ──
    field('section_llc', 'heading', 'LLC & Partnership Information', 140, {
      help_text: 'Provide details about your LLC or partnership.',
    }),
    field('llc_name', 'text', 'LLC / Partnership Name', 141, { required: true, width: 'half' }),
    field('llc_ein', 'text', 'EIN (Employer Identification Number)', 142, {
      placeholder: 'XX-XXXXXXX', width: 'half',
    }),
    field('llc_members', 'number', 'Number of Members / Partners', 143, {
      placeholder: '1', width: 'half',
    }),
    field('llc_formation_state', 'text', 'State of Formation', 144, { width: 'half' }),
    field('llc_notes', 'textarea', 'Additional details about your LLC or partnership', 145, {
      placeholder: 'Describe the nature of the business, revenue, etc.',
    }),

    // ── Step 5: S or C Corporation (sort 160–179) ──
    field('section_corp', 'heading', 'S or C Corporation Information', 160, {
      help_text: 'Provide details about your corporation.',
    }),
    field('corp_name', 'text', 'Corporation Name', 161, { required: true, width: 'half' }),
    field('corp_type', 'select', 'Corporation Type', 162, {
      width: 'half',
      placeholder: 'Select corporation type',
      options: [
        { label: 'S Corporation', value: 's_corp' },
        { label: 'C Corporation', value: 'c_corp' },
      ],
    }),
    field('corp_ein', 'text', 'EIN (Employer Identification Number)', 163, {
      placeholder: 'XX-XXXXXXX', width: 'half',
    }),
    field('corp_state', 'text', 'State of Incorporation', 164, { width: 'half' }),
    field('corp_shareholders', 'number', 'Number of Shareholders', 165, {
      placeholder: '1', width: 'half',
    }),
    field('corp_notes', 'textarea', 'Additional details about your corporation', 166, {
      placeholder: 'Describe business activities, revenue, payroll details, etc.',
    }),

    // ── Step 6: Payroll Services (sort 180–199) ──
    field('section_payroll', 'heading', 'Payroll Services Information', 180, {
      help_text: 'Tell us about your payroll needs.',
    }),
    field('payroll_business_name', 'text', 'Business Name', 181, { required: true, width: 'half' }),
    field('payroll_employees', 'number', 'Number of Employees', 182, {
      placeholder: '1', width: 'half',
    }),
    field('payroll_frequency', 'select', 'Payroll Frequency', 183, {
      width: 'half',
      placeholder: 'Select frequency',
      options: [
        { label: 'Weekly', value: 'weekly' },
        { label: 'Bi-weekly', value: 'biweekly' },
        { label: 'Semi-monthly', value: 'semimonthly' },
        { label: 'Monthly', value: 'monthly' },
      ],
    }),
    field('payroll_current_provider', 'text', 'Current Payroll Provider (if any)', 184, { width: 'half' }),
    field('payroll_notes', 'textarea', 'Additional details about your payroll needs', 185, {
      placeholder: 'Any special payroll requirements, benefits administration, etc.',
    }),

    // ── Step 7: Sales Tax Services (sort 200–219) ──
    field('section_sales_tax', 'heading', 'Sales Tax Services Information', 200, {
      help_text: 'Tell us about your sales tax needs.',
    }),
    field('sales_tax_business_name', 'text', 'Business Name', 201, { required: true, width: 'half' }),
    field('sales_tax_states', 'text', 'States Where You Collect Sales Tax', 202, {
      placeholder: 'e.g. NY, NJ, CT', width: 'half',
    }),
    field('sales_tax_filing_frequency', 'select', 'Filing Frequency', 203, {
      width: 'half',
      placeholder: 'Select frequency',
      options: [
        { label: 'Monthly', value: 'monthly' },
        { label: 'Quarterly', value: 'quarterly' },
        { label: 'Annually', value: 'annually' },
      ],
    }),
    field('sales_tax_notes', 'textarea', 'Additional details about your sales tax needs', 204, {
      placeholder: 'Describe your sales tax situation, any nexus concerns, etc.',
    }),

    // ── Step 8: Exempt Organization Returns (sort 220–239) ──
    field('section_exempt', 'heading', 'Exempt Organization Information', 220, {
      help_text: 'Provide details about your exempt organization.',
    }),
    field('exempt_org_name', 'text', 'Organization Name', 221, { required: true, width: 'half' }),
    field('exempt_org_type', 'select', 'Organization Type', 222, {
      width: 'half',
      placeholder: 'Select type',
      options: [
        { label: '501(c)(3) - Charitable', value: '501c3' },
        { label: '501(c)(4) - Social Welfare', value: '501c4' },
        { label: '501(c)(6) - Business League', value: '501c6' },
        { label: '501(c)(7) - Social Club', value: '501c7' },
        { label: 'Other', value: 'other' },
      ],
    }),
    field('exempt_ein', 'text', 'EIN (Employer Identification Number)', 223, {
      placeholder: 'XX-XXXXXXX', width: 'half',
    }),
    field('exempt_annual_revenue', 'text', 'Approximate Annual Revenue', 224, {
      placeholder: '$0.00', width: 'half',
    }),
    field('exempt_notes', 'textarea', 'Additional details about your organization', 225, {
      placeholder: 'Describe your organization\'s activities, any compliance concerns, etc.',
    }),

    // ── Step 9: Fiduciary Returns (sort 240–259) ──
    field('section_fiduciary', 'heading', 'Fiduciary Returns - Trusts & Estates', 240, {
      help_text: 'Provide details about the trust or estate.',
    }),
    field('fiduciary_name', 'text', 'Trust / Estate Name', 241, { required: true, width: 'half' }),
    field('fiduciary_type', 'select', 'Type', 242, {
      width: 'half',
      placeholder: 'Select type',
      options: [
        { label: 'Revocable Trust', value: 'revocable' },
        { label: 'Irrevocable Trust', value: 'irrevocable' },
        { label: 'Estate', value: 'estate' },
        { label: 'Other', value: 'other' },
      ],
    }),
    field('fiduciary_ein', 'text', 'EIN (Employer Identification Number)', 243, {
      placeholder: 'XX-XXXXXXX', width: 'half',
    }),
    field('fiduciary_beneficiaries', 'number', 'Number of Beneficiaries', 244, {
      placeholder: '1', width: 'half',
    }),
    field('fiduciary_notes', 'textarea', 'Additional details about the trust or estate', 245, {
      placeholder: 'Describe the nature of the trust or estate, distributions, etc.',
    }),

    // ── Step 10: Documents & Notes (sort 300–319) ──
    field('section_documents', 'heading', 'Supporting Documents', 300, {
      help_text: 'Upload any relevant documents you have available.',
    }),
    field('documents', 'file', 'Upload Documents (Optional)', 301, {
      help_text: 'Upload W-2s, 1099s, or other relevant tax documents.',
    }),
    field('additional_notes', 'textarea', 'Additional Information', 310, {
      placeholder: 'Please share any other information that would be helpful...',
    }),
  ],
}

const displayForm = computed(() => form.value || defaultForm)

// Multi-step configuration with conditional steps
const formSteps: FormStep[] = [
  // Step 1: Always shown — personal info + service selection
  { label: 'Getting Started', icon: 'lucide:user', fieldRange: [1, 19] },
  // Conditional steps — only shown when the matching service is selected
  { label: 'Individual Tax', icon: 'lucide:user-check', fieldRange: [100, 119], condition: { field: 'service_types', operator: 'includes', value: 'individual_tax' } },
  { label: 'Self-Employment', icon: 'lucide:briefcase', fieldRange: [120, 139], condition: { field: 'service_types', operator: 'includes', value: 'self_employment' } },
  { label: 'LLC & Partnership', icon: 'lucide:users', fieldRange: [140, 159], condition: { field: 'service_types', operator: 'includes', value: 'llc_partnership' } },
  { label: 'S/C Corporation', icon: 'lucide:building-2', fieldRange: [160, 179], condition: { field: 'service_types', operator: 'includes', value: 's_c_corporation' } },
  { label: 'Payroll', icon: 'lucide:banknote', fieldRange: [180, 199], condition: { field: 'service_types', operator: 'includes', value: 'payroll_services' } },
  { label: 'Sales Tax', icon: 'lucide:receipt', fieldRange: [200, 219], condition: { field: 'service_types', operator: 'includes', value: 'sales_tax' } },
  { label: 'Exempt Org', icon: 'lucide:heart-handshake', fieldRange: [220, 239], condition: { field: 'service_types', operator: 'includes', value: 'exempt_org' } },
  { label: 'Trusts & Estates', icon: 'lucide:scroll-text', fieldRange: [240, 259], condition: { field: 'service_types', operator: 'includes', value: 'fiduciary' } },
  // Final step: Always shown — documents & notes
  { label: 'Documents', icon: 'lucide:file-text', fieldRange: [300, 319] },
]

const dynamicFormRef = ref<{ activeSteps: FormStep[]; currentStep: number } | null>(null)

const currentStep = ref(0)

const displayedSteps = computed(() => {
  if (!dynamicFormRef.value) {
    // Before mount, show only unconditional steps
    return formSteps.filter((s) => !s.condition)
  }
  return dynamicFormRef.value.activeSteps as FormStep[]
})

const onStepChange = (step: number) => {
  currentStep.value = step
}

const handleSubmitted = (data: Record<string, unknown>) => {
  console.log('Tax services questionnaire submitted:', data)
}

// SEO
useSeoMeta({
  title: 'Tax Services Questionnaire - SJHAS, Inc.',
  description: 'Complete our Tax Services Questionnaire so we can best serve your tax and payroll needs.',
  ogTitle: 'Tax Services Questionnaire - SJHAS, Inc.',
  ogDescription: 'Complete our Tax Services Questionnaire so we can best serve your tax and payroll needs.',
  ogType: 'website',
  ogSiteName: 'SJHAS, Inc.',
  twitterCard: 'summary_large_image',
  twitterTitle: 'Tax Services Questionnaire - SJHAS, Inc.',
  twitterDescription: 'Complete our Tax Services Questionnaire so we can best serve your tax and payroll needs.',
})

defineOgImage({
  component: 'Sjhas',
  title: 'Tax Services Questionnaire',
  description: 'SJHAS, Inc. - Accounting & Tax Services',
})
</script>

<template>
  <div class="min-h-screen t-bg">
    <!-- Hero -->
    <section class="t-hero py-20 lg:py-28">
      <div class="container-wide section-padding text-center">
        <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full t-hero-badge text-sm font-medium mb-6">
          <Icon name="lucide:clipboard-list" class="w-4 h-4" />
          <span>Tax Services</span>
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
        <div class="flex items-center justify-center gap-4 sm:gap-8 text-sm flex-wrap">
          <template v-for="(step, index) in displayedSteps" :key="step.label">
            <div
              class="flex items-center gap-2"
              :class="index <= currentStep ? 't-text-accent' : 't-text-muted'"
            >
              <div
                class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium"
                :class="index <= currentStep ? 't-btn' : 't-bg-alt'"
              >
                <Icon v-if="index < currentStep" name="lucide:check" class="w-3.5 h-3.5" />
                <span v-else>{{ index + 1 }}</span>
              </div>
              <span class="hidden sm:inline" :class="index <= currentStep ? 'font-medium' : ''">
                {{ step.label }}
              </span>
            </div>
            <div
              v-if="index < displayedSteps.length - 1"
              class="w-8 h-px hidden sm:block"
              :style="{ backgroundColor: index < currentStep ? 'var(--theme-accent, var(--theme-primary))' : 'var(--theme-border-secondary)' }"
            />
          </template>
        </div>
      </div>
    </section>

    <!-- Form section -->
    <section class="py-12 lg:py-20">
      <div class="container-narrow section-padding">
        <Card class="p-6 sm:p-8 lg:p-10">
          <FormsDynamicForm
            ref="dynamicFormRef"
            :form="displayForm"
            :steps="formSteps"
            @submitted="handleSubmitted"
            @update:current-step="onStepChange"
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
