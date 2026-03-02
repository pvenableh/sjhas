/**
 * Default Tax Services Questionnaire form definition.
 *
 * This is the hardcoded fallback that matches the Cognito Forms structure.
 * When the CMS form (slug: tax-planning) has all fields and steps configured,
 * the CMS version takes priority. This file serves as the canonical reference
 * and fallback.
 */
import type { Form, FormField, FormStepConfig } from '~/types/directus'
import type { FormStep } from '~/components/forms/DynamicForm.vue'

// Helper to create a field definition concisely
const field = (
  id: string,
  type: string,
  label: string,
  sort: number,
  overrides: Record<string, unknown> = {},
): FormField => ({
  id,
  type: type as FormField['type'],
  label,
  name: id,
  placeholder: null,
  help_text: null,
  required: false,
  validation_rules: null,
  options: null,
  conditional_logic: null,
  width: 'full' as const,
  sort,
  ...overrides,
})

const yesNo = [
  { label: 'Yes', value: 'yes' },
  { label: 'No', value: 'no' },
]

const businessTypeOptions = [
  { label: 'Self-Employment or DBA', value: 'self_employment_dba' },
  { label: 'LLC - Single Member', value: 'llc_single_member' },
  { label: 'LLC - Partnership', value: 'llc_partnership' },
  { label: 'LLC - S-Corporation', value: 'llc_s_corp' },
  { label: 'Partnership', value: 'partnership' },
  { label: 'S-Corporation', value: 's_corporation' },
  { label: 'C-Corporation', value: 'c_corporation' },
  { label: 'Exempt Organization', value: 'exempt_organization' },
  { label: 'Fiduciary', value: 'fiduciary' },
]

const benefitsOptions = [
  { label: 'Health Insurance', value: 'health_insurance' },
  { label: 'Fringe Benefits', value: 'fringe_benefits' },
  { label: 'Paid Time Off', value: 'paid_time_off' },
  { label: 'Dependent Care Benefits', value: 'dependent_care' },
  { label: 'Union Dues & Benefits', value: 'union_dues' },
]

const payFrequencyOptions = [
  { label: 'Weekly', value: 'weekly' },
  { label: 'Bi-Weekly', value: 'bi_weekly' },
  { label: 'Semi-Monthly', value: 'semi_monthly' },
  { label: 'Monthly', value: 'monthly' },
]

export const taxServicesDefaultForm: Form = {
  id: 0,
  status: 'published',
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
    // ═══════════════════════════════════════════════════════════════
    // STEP 1: General Information (sort 0–19)
    // ═══════════════════════════════════════════════════════════════
    field('gen_heading', 'heading', 'General Information', 0),
    field('taxpayer_name', 'text', 'Taxpayer Name', 1, { required: true }),
    field('address', 'text', 'Address', 2, { required: true }),
    field('phone', 'phone', 'Phone', 3, { required: true, width: 'half' }),
    field('date_of_birth', 'date', 'Date of Birth', 4, { required: true, width: 'half' }),
    field('email', 'email', 'Email', 5, { required: true }),
    field('text_capability', 'radio', 'Can this phone number send and receive text (sms) messages?', 6, {
      required: true,
      options: yesNo,
    }),
    field('sms_consent', 'radio', 'Do you give consent to SJHAS, Inc. to send text (SMS) messages to the mobile number you have provided?', 7, {
      required: true,
      options: yesNo,
    }),
    field('services', 'checkbox_group', 'What type of tax & payroll services are you interested in:', 8, {
      required: true,
      help_text: 'Select all that apply',
      options: [
        { label: 'Individual Tax', value: 'individual_tax' },
        { label: 'Self-Employment', value: 'self_employment' },
        { label: 'LLC & Partnership', value: 'llc_partnership' },
        { label: 'S or C Corporation', value: 's_or_c_corporation' },
        { label: 'Payroll Services', value: 'payroll_services' },
        { label: 'Sales Tax Services', value: 'sales_tax_services' },
        { label: 'Exempt Organization Returns', value: 'exempt_organization' },
        { label: 'Fiduciary Returns - Trusts & Estates', value: 'fiduciary_returns' },
      ],
    }),

    // ═══════════════════════════════════════════════════════════════
    // STEP 2: Individual Tax Information (sort 100–199)
    // Shown when: Individual Tax or Self-Employment is selected
    // ═══════════════════════════════════════════════════════════════
    field('individual_heading', 'heading', 'Individual Tax Information', 100),
    field('lived_at_address', 'radio', 'Did you live at the address above for the entire tax year?', 101, {
      options: yesNo,
    }),
    field('filing_status', 'radio', 'Filing Status', 102, {
      required: true,
      options: [
        { label: 'Single', value: 'single' },
        { label: 'Head of Household', value: 'head_of_household' },
        { label: 'Married Filing Jointly', value: 'married_filing_jointly' },
        { label: 'Married Filing Separately', value: 'married_filing_separately' },
        { label: 'Unsure', value: 'unsure' },
      ],
    }),
    field('has_dependents', 'radio', 'Do you have any dependents?', 103, {
      options: yesNo,
    }),

    // — Income —
    field('income_heading', 'heading', 'Income', 104),
    field('income_types', 'checkbox_group', 'Types of Income:', 105, {
      required: true,
      options: [
        { label: 'Wages', value: 'wages' },
        { label: 'Interest', value: 'interest' },
        { label: 'Dividends', value: 'dividends' },
        { label: 'Pension or IRA', value: 'pension_or_ira' },
        { label: 'Social Security', value: 'social_security' },
        { label: 'Capital Gains (i.e. Stock Sales)', value: 'capital_gains' },
        { label: 'Rental', value: 'rental' },
        { label: 'Passthrough Income - K-1', value: 'passthrough_income_k1' },
        { label: 'Royalties', value: 'royalties' },
      ],
    }),
    field('self_employment_note', 'paragraph', "If you're looking for Self-Employment, please go back to page 1 and check the tax services box for Self-Employment Income.", 106),

    // Conditional count fields — shown based on income type selections
    field('w2_count', 'number', 'How many W-2s do you receive?', 107, {
      required: true,
      conditional_logic: { field: 'income_types', operator: 'includes', value: 'wages' },
    }),
    field('interest_count', 'number', 'How many sources of interest income do you have?', 108, {
      required: true,
      conditional_logic: { field: 'income_types', operator: 'includes', value: 'interest' },
    }),
    field('dividend_count', 'number', 'How many sources of dividend income do you have?', 109, {
      required: true,
      conditional_logic: { field: 'income_types', operator: 'includes', value: 'dividends' },
    }),
    field('pension_count', 'number', 'How many pension or IRA distribution forms do you receive?', 110, {
      required: true,
      conditional_logic: { field: 'income_types', operator: 'includes', value: 'pension_or_ira' },
    }),
    field('capital_gains_count', 'number', 'How many investment accounts do you have with capital gains activity?', 111, {
      required: true,
      conditional_logic: { field: 'income_types', operator: 'includes', value: 'capital_gains' },
    }),
    field('rental_count', 'number', 'How many rental properties do you have?', 112, {
      required: true,
      conditional_logic: { field: 'income_types', operator: 'includes', value: 'rental' },
    }),
    field('k1_count', 'number', 'How many K-1s do you receive?', 113, {
      required: true,
      conditional_logic: { field: 'income_types', operator: 'includes', value: 'passthrough_income_k1' },
    }),
    field('royalty_count', 'number', 'How many different royalties do you receive?', 114, {
      required: true,
      conditional_logic: { field: 'income_types', operator: 'includes', value: 'royalties' },
    }),
    field('other_income_info', 'textarea', 'Other Income Information', 115),

    // — Deductions —
    field('deductions_heading', 'heading', 'Deductions', 116),
    field('deduction_types', 'checkbox_group', 'Types of Deductions:', 117, {
      options: [
        { label: 'IRA Contributions', value: 'ira_contributions' },
        { label: 'Student Loan Interest', value: 'student_loan_interest' },
        { label: 'Itemized Deductions - Medical', value: 'itemized_medical' },
        { label: 'Itemized Deductions - Taxes', value: 'itemized_taxes' },
        { label: 'Itemized Deductions - Mortgage Interest', value: 'itemized_mortgage' },
        { label: 'Charitable Donations', value: 'charitable_donations' },
        { label: 'Business Use of Home', value: 'business_use_of_home' },
      ],
    }),

    // — Credits —
    field('credits_heading', 'heading', 'Credits', 118),
    field('credit_types', 'checkbox_group', 'Types of Credits:', 119, {
      options: [
        { label: 'Dependent Care Expense Credit', value: 'dependent_care' },
        { label: 'Foreign Tax Credit', value: 'foreign_tax' },
        { label: 'Education Credit', value: 'education' },
        { label: 'Health Insurance - Premium Tax Credit', value: 'health_insurance_ptc' },
      ],
    }),

    field('multi_state_work', 'radio', 'Do you perform work or earn income from states other than where you reside?', 120, {
      options: yesNo,
    }),

    field('other_personal_services', 'checkbox_group', 'Other Personal Tax Services You\'re Interested In', 121, {
      help_text: 'Select all that apply',
      options: [
        { label: 'Annual Tax Planning Meeting', value: 'annual_planning' },
        { label: 'Bi-Annual Planning Meetings', value: 'biannual_planning' },
        { label: 'Employer Benefits Review', value: 'employer_benefits' },
        { label: 'Tax Notice Resolution', value: 'tax_notice' },
        { label: 'Estate Plan Review', value: 'estate_plan' },
      ],
    }),

    field('anticipated_changes', 'radio', 'Do you anticipate any changes in your income, deductions, or credits when compared to last year\'s tax return?', 122, {
      required: true,
      options: [
        { label: "I don't really expect any changes.", value: 'no_changes' },
        { label: 'I do expect changes.', value: 'expect_changes' },
        { label: "I'm not sure.", value: 'not_sure' },
      ],
    }),

    // ═══════════════════════════════════════════════════════════════
    // STEP 3: Business Information (sort 200–299)
    // Shown when: Self-Employment, LLC & Partnership, S or C Corporation,
    //             Sales Tax, Exempt Organization, or Fiduciary is selected
    // ═══════════════════════════════════════════════════════════════
    field('biz_heading', 'heading', 'Business Information', 200),
    field('biz_legal_name', 'text', 'Business Legal Name (Taxpayer\'s Name if Self-Employed)', 201, { required: true }),
    field('biz_type', 'select', 'Type of Business:', 202, {
      required: true,
      placeholder: 'Select business type',
      options: businessTypeOptions,
    }),
    field('biz_address', 'text', 'Address', 203, { required: true }),
    field('biz_county', 'text', 'County in which the business is located:', 204, { required: true }),
    field('biz_phone', 'phone', 'Phone', 205, { required: true, width: 'half' }),
    field('biz_email', 'email', 'Email', 206, { width: 'half' }),
    field('biz_website', 'text', 'Website', 207),
    field('biz_employee_count', 'number', 'How many employees do you have or expect to have?', 208, { required: true }),
    field('biz_registered_employer', 'radio', 'Have you already registered with the required tax and employment agencies as an employer?', 209, {
      required: true,
      options: yesNo,
    }),
    field('biz_benefits', 'checkbox_group', 'What employee benefits and obligations do you expect to care for through payroll:', 210, {
      help_text: 'Select all that apply.',
      options: benefitsOptions,
    }),
    field('biz_pay_frequency', 'radio', 'How often do you expect to pay your employees:', 211, {
      required: true,
      options: payFrequencyOptions,
    }),
    field('biz_already_run_payroll', 'radio', 'Have you already run payroll this year?', 212, {
      required: true,
      options: yesNo,
    }),
    field('biz_multi_state', 'radio', 'Does your business conduct activity in more than one state?', 213, {
      options: yesNo,
    }),
    field('biz_other_info', 'textarea', 'Other Business Information:', 214),
    field('biz_add_note', 'paragraph', 'Need to add more businesses? Please submit this form first, then fill it out again for each additional business, or contact our office.', 215),

    // ═══════════════════════════════════════════════════════════════
    // STEP 4: Payroll Information (sort 300–399)
    // Shown when: Payroll Services is selected
    // Same field structure as Business step with payroll_ prefix
    // ═══════════════════════════════════════════════════════════════
    field('payroll_heading', 'heading', 'Business Payroll Service Information', 300),
    field('payroll_legal_name', 'text', 'Business Legal Name (Taxpayer\'s Name if Self-Employed)', 301, { required: true }),
    field('payroll_biz_type', 'select', 'Type of Business:', 302, {
      required: true,
      placeholder: 'Select business type',
      options: businessTypeOptions,
    }),
    field('payroll_address', 'text', 'Address', 303, { required: true }),
    field('payroll_county', 'text', 'County in which the business is located:', 304, { required: true }),
    field('payroll_phone', 'phone', 'Phone', 305, { required: true, width: 'half' }),
    field('payroll_email', 'email', 'Email', 306, { width: 'half' }),
    field('payroll_website', 'text', 'Website', 307),
    field('payroll_employee_count', 'number', 'How many employees do you have or expect to have?', 308, { required: true }),
    field('payroll_registered_employer', 'radio', 'Have you already registered with the required tax and employment agencies as an employer?', 309, {
      required: true,
      options: yesNo,
    }),
    field('payroll_benefits', 'checkbox_group', 'What employee benefits and obligations do you expect to care for through payroll:', 310, {
      help_text: 'Select all that apply.',
      options: benefitsOptions,
    }),
    field('payroll_pay_frequency', 'radio', 'How often do you expect to pay your employees:', 311, {
      required: true,
      options: payFrequencyOptions,
    }),
    field('payroll_already_run', 'radio', 'Have you already run payroll this year?', 312, {
      required: true,
      options: yesNo,
    }),
    field('payroll_multi_state', 'radio', 'Does your business conduct activity in more than one state?', 313, {
      options: yesNo,
    }),
    field('payroll_other_info', 'textarea', 'Other Business Information:', 314),
    field('payroll_add_note', 'paragraph', 'Need to add more businesses? Please submit this form first, then fill it out again for each additional business, or contact our office.', 315),

    // ═══════════════════════════════════════════════════════════════
    // STEP 5: Other Information (sort 400–499)
    // Always shown as the final step
    // ═══════════════════════════════════════════════════════════════
    field('other_heading', 'heading', 'Other Information', 400),
    field('prev_tax_care', 'radio', 'How did you care for your taxes last year?', 401, {
      required: true,
      options: [
        { label: 'I paid an accountant or tax preparation service', value: 'accountant' },
        { label: 'I prepared my own tax returns', value: 'self_prepared' },
        { label: 'I had a friend help me prepare my tax returns', value: 'friend_helped' },
        { label: 'I did not need to file last year', value: 'did_not_file' },
      ],
    }),
    field('prev_tax_cost', 'text', 'How much did you pay for tax preparation services last year?', 402, {
      required: true,
    }),
    field('other_info', 'textarea', 'Other Information', 403),
    field('prior_return_upload', 'file', 'Please upload a copy of your prior year tax return(s) here.', 404, {
      required: true,
      help_text: 'Upload or drag files here.',
    }),
    field('no_return_acknowledgement', 'checkbox', 'By checking this box, I acknowledge that by not providing a copy of my previously filed tax returns my quote may require substantial updates.', 405),
    field('submission_agreement', 'paragraph', 'By submitting this form you are agreeing to allow Stephen J. Hoffman to review your personal tax information for the purpose of providing you a quote for professional tax services.\n\nIn the event that you do not use our office to care for your tax services, the information that you provide will be destroyed.', 406),
  ],
}

export const taxServicesDefaultSteps: FormStep[] = [
  // Step 1: General Information — always shown
  { label: 'General', icon: 'lucide:user', fieldRange: [0, 19] },
  // Step 2: Individual Tax — shown when Individual Tax or Self-Employment selected
  {
    label: 'Individual',
    icon: 'lucide:user-check',
    fieldRange: [100, 199],
    condition: { field: 'services', operator: 'includes_any', value: 'individual_tax,self_employment' },
  },
  // Step 3: Business Information — shown for business-type services
  {
    label: 'Business',
    icon: 'lucide:building-2',
    fieldRange: [200, 299],
    condition: {
      field: 'services',
      operator: 'includes_any',
      value: 'self_employment,llc_partnership,s_or_c_corporation,sales_tax_services,exempt_organization,fiduciary_returns',
    },
  },
  // Step 4: Payroll — shown when Payroll Services selected
  {
    label: 'Payroll',
    icon: 'lucide:banknote',
    fieldRange: [300, 399],
    condition: { field: 'services', operator: 'includes', value: 'payroll_services' },
  },
  // Step 5: Other Information — always shown as final step
  { label: 'Final Details', icon: 'lucide:file-text', fieldRange: [400, 499] },
]
