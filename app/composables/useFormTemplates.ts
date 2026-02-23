/**
 * Financial form templates for quick-start form creation.
 * Modeled after common accounting & tax preparation forms.
 */

export interface FormTemplateField {
  id: string
  type: 'text' | 'email' | 'phone' | 'number' | 'date' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'file' | 'heading' | 'paragraph'
  label: string
  name: string
  placeholder: string | null
  help_text: string | null
  required: boolean
  validation_rules: any[] | null
  options: { label: string; value: string }[] | null
  conditional_logic: any | null
  width: 'full' | 'half' | 'third'
  sort: number
}

export interface FormTemplate {
  key: string
  title: string
  slug: string
  description: string
  category: 'general' | 'financial'
  icon: string
  iconColor: string
  iconBg: string
  fields: FormTemplateField[]
}

export interface FormTemplateCategory {
  key: string
  label: string
  description: string
}

export const useFormTemplates = () => {
  const categories: FormTemplateCategory[] = [
    {
      key: 'general',
      label: 'General',
      description: 'Common forms for client communication and onboarding.',
    },
    {
      key: 'financial',
      label: 'Accounting & Financial Services',
      description: 'Tax preparation, expense tracking, and financial data collection templates.',
    },
  ]

  const templates: FormTemplate[] = [
    // ── General Templates ──────────────────────────────────────────
    {
      key: 'basic-contact',
      title: 'Basic Contact Form',
      slug: `basic-contact-${Date.now()}`,
      description: 'A simple contact form for general inquiries.',
      category: 'general',
      icon: 'lucide:contact',
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-100',
      fields: [
        { id: 'f_1', type: 'heading', label: 'Contact Us', name: 'heading', placeholder: null, help_text: 'We\'d love to hear from you. Fill out the form below and we\'ll get back to you shortly.', required: false, validation_rules: null, options: null, conditional_logic: null, width: 'full', sort: 0 },
        { id: 'f_2', type: 'text', label: 'First Name', name: 'first_name', placeholder: 'First name', help_text: null, required: true, validation_rules: null, options: null, conditional_logic: null, width: 'half', sort: 1 },
        { id: 'f_3', type: 'text', label: 'Last Name', name: 'last_name', placeholder: 'Last name', help_text: null, required: true, validation_rules: null, options: null, conditional_logic: null, width: 'half', sort: 2 },
        { id: 'f_4', type: 'email', label: 'Email Address', name: 'email', placeholder: 'you@example.com', help_text: null, required: true, validation_rules: null, options: null, conditional_logic: null, width: 'half', sort: 3 },
        { id: 'f_5', type: 'phone', label: 'Phone Number', name: 'phone', placeholder: '(555) 555-5555', help_text: null, required: false, validation_rules: null, options: null, conditional_logic: null, width: 'half', sort: 4 },
        { id: 'f_6', type: 'select', label: 'Subject', name: 'subject', placeholder: 'Select a subject', help_text: null, required: true, validation_rules: null, options: [{ label: 'General Inquiry', value: 'general' }, { label: 'Tax Preparation', value: 'tax_prep' }, { label: 'Bookkeeping', value: 'bookkeeping' }, { label: 'Business Consulting', value: 'consulting' }, { label: 'Other', value: 'other' }], conditional_logic: null, width: 'full', sort: 5 },
        { id: 'f_7', type: 'textarea', label: 'Message', name: 'message', placeholder: 'How can we help you?', help_text: null, required: true, validation_rules: null, options: null, conditional_logic: null, width: 'full', sort: 6 },
        { id: 'f_8', type: 'select', label: 'Preferred Contact Method', name: 'preferred_contact', placeholder: 'Select preferred method', help_text: null, required: false, validation_rules: null, options: [{ label: 'Email', value: 'email' }, { label: 'Phone', value: 'phone' }], conditional_logic: null, width: 'half', sort: 7 },
        { id: 'f_9', type: 'select', label: 'Best Time to Reach You', name: 'best_time', placeholder: 'Select a time', help_text: null, required: false, validation_rules: null, options: [{ label: 'Morning (8am - 12pm)', value: 'morning' }, { label: 'Afternoon (12pm - 5pm)', value: 'afternoon' }, { label: 'Evening (5pm - 8pm)', value: 'evening' }], conditional_logic: null, width: 'half', sort: 8 },
      ],
    },
    {
      key: 'document-upload',
      title: 'Document Upload',
      slug: `document-upload-${Date.now()}`,
      description: 'Upload your documents securely.',
      category: 'general',
      icon: 'lucide:upload',
      iconColor: 'text-sky-600',
      iconBg: 'bg-sky-100',
      fields: [
        { id: 'f_1', type: 'heading', label: 'Document Upload', name: 'heading', placeholder: null, help_text: null, required: false, validation_rules: null, options: null, conditional_logic: null, width: 'full', sort: 0 },
        { id: 'f_2', type: 'text', label: 'Full Name', name: 'full_name', placeholder: 'Enter your full name', help_text: null, required: true, validation_rules: null, options: null, conditional_logic: null, width: 'half', sort: 1 },
        { id: 'f_3', type: 'email', label: 'Email Address', name: 'email', placeholder: 'you@example.com', help_text: null, required: true, validation_rules: null, options: null, conditional_logic: null, width: 'half', sort: 2 },
        { id: 'f_4', type: 'select', label: 'Document Type', name: 'document_type', placeholder: 'Select document type', help_text: null, required: true, validation_rules: null, options: [{ label: 'Tax Return', value: 'tax_return' }, { label: 'W-2', value: 'w2' }, { label: '1099', value: '1099' }, { label: 'Other', value: 'other' }], conditional_logic: null, width: 'full', sort: 3 },
        { id: 'f_5', type: 'file', label: 'Upload Files', name: 'files', placeholder: null, help_text: 'Accepted formats: PDF, DOC, DOCX, JPG, PNG', required: true, validation_rules: null, options: null, conditional_logic: null, width: 'full', sort: 4 },
        { id: 'f_6', type: 'textarea', label: 'Notes', name: 'notes', placeholder: 'Any additional notes...', help_text: null, required: false, validation_rules: null, options: null, conditional_logic: null, width: 'full', sort: 5 },
      ],
    },
    {
      key: 'client-intake',
      title: 'Tax Client Intake Form',
      slug: `client-intake-${Date.now()}`,
      description: 'Collect new client information for tax preparation and advisory services.',
      category: 'general',
      icon: 'lucide:user-plus',
      iconColor: 'text-purple-600',
      iconBg: 'bg-purple-100',
      fields: [
        { id: 'f_1', type: 'heading', label: 'New Client Information', name: 'heading', placeholder: null, help_text: 'Welcome! Please provide your information so we can serve you better.', required: false, validation_rules: null, options: null, conditional_logic: null, width: 'full', sort: 0 },
        { id: 'f_2', type: 'text', label: 'First Name', name: 'first_name', placeholder: 'First name', help_text: null, required: true, validation_rules: null, options: null, conditional_logic: null, width: 'half', sort: 1 },
        { id: 'f_3', type: 'text', label: 'Last Name', name: 'last_name', placeholder: 'Last name', help_text: null, required: true, validation_rules: null, options: null, conditional_logic: null, width: 'half', sort: 2 },
        { id: 'f_4', type: 'email', label: 'Email Address', name: 'email', placeholder: 'you@example.com', help_text: null, required: true, validation_rules: null, options: null, conditional_logic: null, width: 'half', sort: 3 },
        { id: 'f_5', type: 'phone', label: 'Phone Number', name: 'phone', placeholder: '(555) 555-5555', help_text: null, required: true, validation_rules: null, options: null, conditional_logic: null, width: 'half', sort: 4 },
        { id: 'f_6', type: 'date', label: 'Date of Birth', name: 'date_of_birth', placeholder: null, help_text: null, required: true, validation_rules: null, options: null, conditional_logic: null, width: 'half', sort: 5 },
        { id: 'f_7', type: 'text', label: 'Social Security Number (last 4)', name: 'ssn_last4', placeholder: 'XXXX', help_text: 'For identification purposes only. We will request the full SSN securely during your appointment.', required: false, validation_rules: null, options: null, conditional_logic: null, width: 'half', sort: 6 },
        { id: 'f_8', type: 'text', label: 'Street Address', name: 'address', placeholder: 'Street address', help_text: null, required: true, validation_rules: null, options: null, conditional_logic: null, width: 'full', sort: 7 },
        { id: 'f_9', type: 'text', label: 'City', name: 'city', placeholder: 'City', help_text: null, required: true, validation_rules: null, options: null, conditional_logic: null, width: 'third', sort: 8 },
        { id: 'f_10', type: 'text', label: 'State', name: 'state', placeholder: 'State', help_text: null, required: true, validation_rules: null, options: null, conditional_logic: null, width: 'third', sort: 9 },
        { id: 'f_11', type: 'text', label: 'ZIP Code', name: 'zip_code', placeholder: 'ZIP', help_text: null, required: true, validation_rules: null, options: null, conditional_logic: null, width: 'third', sort: 10 },
        { id: 'f_12', type: 'select', label: 'Filing Status', name: 'filing_status', placeholder: 'Select your filing status', help_text: null, required: true, validation_rules: null, options: [{ label: 'Single', value: 'single' }, { label: 'Married Filing Jointly', value: 'married_joint' }, { label: 'Married Filing Separately', value: 'married_separate' }, { label: 'Head of Household', value: 'head_of_household' }, { label: 'Qualifying Widow(er)', value: 'qualifying_widow' }], conditional_logic: null, width: 'half', sort: 11 },
        { id: 'f_13', type: 'number', label: 'Number of Dependents', name: 'dependents', placeholder: '0', help_text: null, required: false, validation_rules: null, options: null, conditional_logic: null, width: 'half', sort: 12 },
        { id: 'f_14', type: 'select', label: 'How did you hear about us?', name: 'referral_source', placeholder: 'Select one', help_text: null, required: false, validation_rules: null, options: [{ label: 'Referral', value: 'referral' }, { label: 'Google Search', value: 'google' }, { label: 'Social Media', value: 'social_media' }, { label: 'Other', value: 'other' }], conditional_logic: null, width: 'full', sort: 13 },
        { id: 'f_15', type: 'textarea', label: 'What services are you interested in?', name: 'services_needed', placeholder: 'Tell us how we can help...', help_text: null, required: false, validation_rules: null, options: null, conditional_logic: null, width: 'full', sort: 14 },
      ],
    },

    // ── Financial Templates ────────────────────────────────────────
    {
      key: 'credit-card-authorization',
      title: 'Credit Card Authorization Form',
      slug: `cc-auth-${Date.now()}`,
      description: 'Authorize credit card payments for services rendered.',
      category: 'financial',
      icon: 'lucide:credit-card',
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-100',
      fields: [
        { id: 'f_1', type: 'heading', label: 'Credit Card Authorization', name: 'heading', placeholder: null, help_text: 'Please complete this form to authorize a credit card payment. Your information is transmitted securely.', required: false, validation_rules: null, options: null, conditional_logic: null, width: 'full', sort: 0 },
        { id: 'f_2', type: 'text', label: 'Cardholder Name', name: 'cardholder_name', placeholder: 'Name as it appears on card', help_text: null, required: true, validation_rules: null, options: null, conditional_logic: null, width: 'full', sort: 1 },
        { id: 'f_3', type: 'email', label: 'Cardholder Email', name: 'cardholder_email', placeholder: 'you@example.com', help_text: 'A receipt will be sent to this address.', required: true, validation_rules: null, options: null, conditional_logic: null, width: 'half', sort: 2 },
        { id: 'f_4', type: 'phone', label: 'Cardholder Phone', name: 'cardholder_phone', placeholder: '(555) 555-5555', help_text: null, required: true, validation_rules: null, options: null, conditional_logic: null, width: 'half', sort: 3 },
        { id: 'f_5', type: 'text', label: 'Billing Address', name: 'billing_address', placeholder: 'Street address', help_text: null, required: true, validation_rules: null, options: null, conditional_logic: null, width: 'full', sort: 4 },
        { id: 'f_6', type: 'text', label: 'City', name: 'billing_city', placeholder: 'City', help_text: null, required: true, validation_rules: null, options: null, conditional_logic: null, width: 'third', sort: 5 },
        { id: 'f_7', type: 'text', label: 'State', name: 'billing_state', placeholder: 'State', help_text: null, required: true, validation_rules: null, options: null, conditional_logic: null, width: 'third', sort: 6 },
        { id: 'f_8', type: 'text', label: 'ZIP Code', name: 'billing_zip', placeholder: 'ZIP', help_text: null, required: true, validation_rules: null, options: null, conditional_logic: null, width: 'third', sort: 7 },
        { id: 'f_9', type: 'select', label: 'Card Type', name: 'card_type', placeholder: 'Select card type', help_text: null, required: true, validation_rules: null, options: [{ label: 'Visa', value: 'visa' }, { label: 'Mastercard', value: 'mastercard' }, { label: 'American Express', value: 'amex' }, { label: 'Discover', value: 'discover' }], conditional_logic: null, width: 'half', sort: 8 },
        { id: 'f_10', type: 'text', label: 'Last 4 Digits of Card', name: 'card_last4', placeholder: '1234', help_text: 'For verification only. Do not enter your full card number here.', required: true, validation_rules: null, options: null, conditional_logic: null, width: 'half', sort: 9 },
        { id: 'f_11', type: 'text', label: 'Card Expiration Date', name: 'card_expiration', placeholder: 'MM/YY', help_text: null, required: true, validation_rules: null, options: null, conditional_logic: null, width: 'half', sort: 10 },
        { id: 'f_12', type: 'number', label: 'Authorization Amount ($)', name: 'auth_amount', placeholder: '0.00', help_text: 'Amount to be charged to the card.', required: true, validation_rules: null, options: null, conditional_logic: null, width: 'half', sort: 11 },
        { id: 'f_13', type: 'textarea', label: 'Description of Services', name: 'services_description', placeholder: 'Describe the services this payment covers...', help_text: null, required: false, validation_rules: null, options: null, conditional_logic: null, width: 'full', sort: 12 },
        { id: 'f_14', type: 'select', label: 'Payment Frequency', name: 'payment_frequency', placeholder: 'Select frequency', help_text: null, required: true, validation_rules: null, options: [{ label: 'One-time Payment', value: 'one_time' }, { label: 'Monthly Recurring', value: 'monthly' }, { label: 'Quarterly Recurring', value: 'quarterly' }, { label: 'Annual Recurring', value: 'annual' }], conditional_logic: null, width: 'full', sort: 13 },
        { id: 'f_15', type: 'checkbox', label: 'I authorize the above charge to my credit card and agree to the payment terms.', name: 'authorization_consent', placeholder: null, help_text: null, required: true, validation_rules: null, options: null, conditional_logic: null, width: 'full', sort: 14 },
      ],
    },
    {
      key: 'rental-property-tax',
      title: 'Rental Property Tax Organizer',
      slug: `rental-property-tax-${Date.now()}`,
      description: 'Organize rental property income and expenses for tax reporting.',
      category: 'financial',
      icon: 'lucide:home',
      iconColor: 'text-teal-600',
      iconBg: 'bg-teal-100',
      fields: [
        { id: 'f_1', type: 'heading', label: 'Rental Property Tax Organizer', name: 'heading', placeholder: null, help_text: 'Provide details about your rental property income and expenses for the tax year. Complete one form per property.', required: false, validation_rules: null, options: null, conditional_logic: null, width: 'full', sort: 0 },
        { id: 'f_2', type: 'text', label: 'Property Owner Name', name: 'owner_name', placeholder: 'Full name', help_text: null, required: true, validation_rules: null, options: null, conditional_logic: null, width: 'half', sort: 1 },
        { id: 'f_3', type: 'email', label: 'Email Address', name: 'email', placeholder: 'you@example.com', help_text: null, required: true, validation_rules: null, options: null, conditional_logic: null, width: 'half', sort: 2 },
        { id: 'f_4', type: 'heading', label: 'Property Information', name: 'property_heading', placeholder: null, help_text: null, required: false, validation_rules: null, options: null, conditional_logic: null, width: 'full', sort: 3 },
        { id: 'f_5', type: 'text', label: 'Property Address', name: 'property_address', placeholder: 'Full street address', help_text: null, required: true, validation_rules: null, options: null, conditional_logic: null, width: 'full', sort: 4 },
        { id: 'f_6', type: 'text', label: 'City', name: 'property_city', placeholder: 'City', help_text: null, required: true, validation_rules: null, options: null, conditional_logic: null, width: 'third', sort: 5 },
        { id: 'f_7', type: 'text', label: 'State', name: 'property_state', placeholder: 'State', help_text: null, required: true, validation_rules: null, options: null, conditional_logic: null, width: 'third', sort: 6 },
        { id: 'f_8', type: 'text', label: 'ZIP Code', name: 'property_zip', placeholder: 'ZIP', help_text: null, required: true, validation_rules: null, options: null, conditional_logic: null, width: 'third', sort: 7 },
        { id: 'f_9', type: 'select', label: 'Property Type', name: 'property_type', placeholder: 'Select property type', help_text: null, required: true, validation_rules: null, options: [{ label: 'Single Family Home', value: 'single_family' }, { label: 'Multi-Family (2-4 units)', value: 'multi_family' }, { label: 'Condo / Townhouse', value: 'condo' }, { label: 'Commercial Property', value: 'commercial' }], conditional_logic: null, width: 'half', sort: 8 },
        { id: 'f_10', type: 'date', label: 'Date Purchased', name: 'purchase_date', placeholder: null, help_text: null, required: true, validation_rules: null, options: null, conditional_logic: null, width: 'half', sort: 9 },
        { id: 'f_11', type: 'number', label: 'Purchase Price ($)', name: 'purchase_price', placeholder: '0', help_text: null, required: true, validation_rules: null, options: null, conditional_logic: null, width: 'half', sort: 10 },
        { id: 'f_12', type: 'number', label: 'Fair Market Value ($)', name: 'fair_market_value', placeholder: '0', help_text: 'Estimated current market value.', required: false, validation_rules: null, options: null, conditional_logic: null, width: 'half', sort: 11 },
        { id: 'f_13', type: 'heading', label: 'Rental Income', name: 'income_heading', placeholder: null, help_text: null, required: false, validation_rules: null, options: null, conditional_logic: null, width: 'full', sort: 12 },
        { id: 'f_14', type: 'number', label: 'Gross Rental Income ($)', name: 'gross_rental_income', placeholder: '0', help_text: 'Total rent received during the tax year.', required: true, validation_rules: null, options: null, conditional_logic: null, width: 'half', sort: 13 },
        { id: 'f_15', type: 'number', label: 'Other Income ($)', name: 'other_income', placeholder: '0', help_text: 'Late fees, laundry, parking, etc.', required: false, validation_rules: null, options: null, conditional_logic: null, width: 'half', sort: 14 },
        { id: 'f_16', type: 'number', label: 'Days Rented', name: 'days_rented', placeholder: '0', help_text: 'Number of days the property was rented during the tax year.', required: true, validation_rules: null, options: null, conditional_logic: null, width: 'half', sort: 15 },
        { id: 'f_17', type: 'number', label: 'Days Personal Use', name: 'days_personal', placeholder: '0', help_text: 'Number of days you personally used the property.', required: false, validation_rules: null, options: null, conditional_logic: null, width: 'half', sort: 16 },
        { id: 'f_18', type: 'heading', label: 'Rental Expenses', name: 'expenses_heading', placeholder: null, help_text: 'Enter total amounts for the tax year.', required: false, validation_rules: null, options: null, conditional_logic: null, width: 'full', sort: 17 },
        { id: 'f_19', type: 'number', label: 'Mortgage Interest ($)', name: 'mortgage_interest', placeholder: '0', help_text: null, required: false, validation_rules: null, options: null, conditional_logic: null, width: 'half', sort: 18 },
        { id: 'f_20', type: 'number', label: 'Property Taxes ($)', name: 'property_taxes', placeholder: '0', help_text: null, required: false, validation_rules: null, options: null, conditional_logic: null, width: 'half', sort: 19 },
        { id: 'f_21', type: 'number', label: 'Insurance ($)', name: 'insurance', placeholder: '0', help_text: null, required: false, validation_rules: null, options: null, conditional_logic: null, width: 'half', sort: 20 },
        { id: 'f_22', type: 'number', label: 'Repairs & Maintenance ($)', name: 'repairs_maintenance', placeholder: '0', help_text: null, required: false, validation_rules: null, options: null, conditional_logic: null, width: 'half', sort: 21 },
        { id: 'f_23', type: 'number', label: 'Property Management Fees ($)', name: 'management_fees', placeholder: '0', help_text: null, required: false, validation_rules: null, options: null, conditional_logic: null, width: 'half', sort: 22 },
        { id: 'f_24', type: 'number', label: 'Utilities ($)', name: 'utilities', placeholder: '0', help_text: 'Utilities paid by landlord.', required: false, validation_rules: null, options: null, conditional_logic: null, width: 'half', sort: 23 },
        { id: 'f_25', type: 'number', label: 'HOA / Condo Fees ($)', name: 'hoa_fees', placeholder: '0', help_text: null, required: false, validation_rules: null, options: null, conditional_logic: null, width: 'half', sort: 24 },
        { id: 'f_26', type: 'number', label: 'Other Expenses ($)', name: 'other_expenses', placeholder: '0', help_text: 'Advertising, legal fees, travel to property, etc.', required: false, validation_rules: null, options: null, conditional_logic: null, width: 'half', sort: 25 },
        { id: 'f_27', type: 'file', label: 'Supporting Documents', name: 'documents', placeholder: null, help_text: 'Upload mortgage statements, 1098 forms, receipts, etc.', required: false, validation_rules: null, options: null, conditional_logic: null, width: 'full', sort: 26 },
        { id: 'f_28', type: 'textarea', label: 'Additional Notes', name: 'notes', placeholder: 'Any improvements, capital expenditures, or other information...', help_text: null, required: false, validation_rules: null, options: null, conditional_logic: null, width: 'full', sort: 27 },
      ],
    },
    {
      key: 'tax-planning',
      title: 'Tax Planning Questionnaire',
      slug: `tax-planning-${Date.now()}`,
      description: 'Comprehensive questionnaire to help plan your upcoming tax year.',
      category: 'financial',
      icon: 'lucide:clipboard-list',
      iconColor: 'text-green-600',
      iconBg: 'bg-green-100',
      fields: [
        { id: 'f_1', type: 'heading', label: 'Tax Planning Questionnaire', name: 'heading', placeholder: null, help_text: 'Help us understand your tax situation for the upcoming year.', required: false, validation_rules: null, options: null, conditional_logic: null, width: 'full', sort: 0 },
        { id: 'f_2', type: 'text', label: 'Full Name', name: 'full_name', placeholder: 'Enter your full name', help_text: null, required: true, validation_rules: null, options: null, conditional_logic: null, width: 'half', sort: 1 },
        { id: 'f_3', type: 'email', label: 'Email Address', name: 'email', placeholder: 'you@example.com', help_text: null, required: true, validation_rules: null, options: null, conditional_logic: null, width: 'half', sort: 2 },
        { id: 'f_4', type: 'phone', label: 'Phone Number', name: 'phone', placeholder: '(555) 555-5555', help_text: null, required: false, validation_rules: null, options: null, conditional_logic: null, width: 'half', sort: 3 },
        { id: 'f_5', type: 'select', label: 'Filing Status', name: 'filing_status', placeholder: 'Select your filing status', help_text: null, required: true, validation_rules: null, options: [{ label: 'Single', value: 'single' }, { label: 'Married Filing Jointly', value: 'married_joint' }, { label: 'Married Filing Separately', value: 'married_separate' }, { label: 'Head of Household', value: 'head_of_household' }], conditional_logic: null, width: 'half', sort: 4 },
        { id: 'f_6', type: 'number', label: 'Estimated Annual Income ($)', name: 'annual_income', placeholder: '0', help_text: null, required: true, validation_rules: null, options: null, conditional_logic: null, width: 'half', sort: 5 },
        { id: 'f_7', type: 'checkbox', label: 'I own a home', name: 'owns_home', placeholder: null, help_text: null, required: false, validation_rules: null, options: null, conditional_logic: null, width: 'half', sort: 6 },
        { id: 'f_8', type: 'checkbox', label: 'I own a business', name: 'owns_business', placeholder: null, help_text: null, required: false, validation_rules: null, options: null, conditional_logic: null, width: 'half', sort: 7 },
        { id: 'f_9', type: 'checkbox', label: 'I have investment accounts', name: 'has_investments', placeholder: null, help_text: null, required: false, validation_rules: null, options: null, conditional_logic: null, width: 'half', sort: 8 },
        { id: 'f_10', type: 'checkbox', label: 'I have rental property income', name: 'has_rental_income', placeholder: null, help_text: null, required: false, validation_rules: null, options: null, conditional_logic: null, width: 'half', sort: 9 },
        { id: 'f_11', type: 'textarea', label: 'Additional Information', name: 'additional_info', placeholder: 'Any other details about your tax situation...', help_text: null, required: false, validation_rules: null, options: null, conditional_logic: null, width: 'full', sort: 10 },
      ],
    },
    {
      key: 'travel-expense',
      title: 'Travel Expense Worksheet',
      slug: `travel-expense-${Date.now()}`,
      description: 'Track business travel expenses for tax deductions and reimbursement.',
      category: 'financial',
      icon: 'lucide:plane',
      iconColor: 'text-indigo-600',
      iconBg: 'bg-indigo-100',
      fields: [
        { id: 'f_1', type: 'heading', label: 'Travel Expense Worksheet', name: 'heading', placeholder: null, help_text: 'Use this form to report business travel expenses. Attach all receipts and supporting documentation.', required: false, validation_rules: null, options: null, conditional_logic: null, width: 'full', sort: 0 },
        { id: 'f_2', type: 'text', label: 'Employee / Traveler Name', name: 'traveler_name', placeholder: 'Full name', help_text: null, required: true, validation_rules: null, options: null, conditional_logic: null, width: 'half', sort: 1 },
        { id: 'f_3', type: 'email', label: 'Email Address', name: 'email', placeholder: 'you@example.com', help_text: null, required: true, validation_rules: null, options: null, conditional_logic: null, width: 'half', sort: 2 },
        { id: 'f_4', type: 'heading', label: 'Trip Details', name: 'trip_heading', placeholder: null, help_text: null, required: false, validation_rules: null, options: null, conditional_logic: null, width: 'full', sort: 3 },
        { id: 'f_5', type: 'text', label: 'Business Purpose of Trip', name: 'business_purpose', placeholder: 'Describe the business reason for this trip', help_text: null, required: true, validation_rules: null, options: null, conditional_logic: null, width: 'full', sort: 4 },
        { id: 'f_6', type: 'text', label: 'Destination(s)', name: 'destination', placeholder: 'City, State or Country', help_text: null, required: true, validation_rules: null, options: null, conditional_logic: null, width: 'full', sort: 5 },
        { id: 'f_7', type: 'date', label: 'Departure Date', name: 'departure_date', placeholder: null, help_text: null, required: true, validation_rules: null, options: null, conditional_logic: null, width: 'half', sort: 6 },
        { id: 'f_8', type: 'date', label: 'Return Date', name: 'return_date', placeholder: null, help_text: null, required: true, validation_rules: null, options: null, conditional_logic: null, width: 'half', sort: 7 },
        { id: 'f_9', type: 'heading', label: 'Transportation', name: 'transport_heading', placeholder: null, help_text: null, required: false, validation_rules: null, options: null, conditional_logic: null, width: 'full', sort: 8 },
        { id: 'f_10', type: 'number', label: 'Airfare ($)', name: 'airfare', placeholder: '0.00', help_text: null, required: false, validation_rules: null, options: null, conditional_logic: null, width: 'half', sort: 9 },
        { id: 'f_11', type: 'number', label: 'Car Rental ($)', name: 'car_rental', placeholder: '0.00', help_text: null, required: false, validation_rules: null, options: null, conditional_logic: null, width: 'half', sort: 10 },
        { id: 'f_12', type: 'number', label: 'Taxi / Rideshare ($)', name: 'taxi_rideshare', placeholder: '0.00', help_text: null, required: false, validation_rules: null, options: null, conditional_logic: null, width: 'half', sort: 11 },
        { id: 'f_13', type: 'number', label: 'Parking & Tolls ($)', name: 'parking_tolls', placeholder: '0.00', help_text: null, required: false, validation_rules: null, options: null, conditional_logic: null, width: 'half', sort: 12 },
        { id: 'f_14', type: 'number', label: 'Mileage (miles driven)', name: 'mileage', placeholder: '0', help_text: 'If using personal vehicle. Current IRS rate will be applied.', required: false, validation_rules: null, options: null, conditional_logic: null, width: 'half', sort: 13 },
        { id: 'f_15', type: 'number', label: 'Gas / Fuel ($)', name: 'fuel', placeholder: '0.00', help_text: 'For rental or company vehicle only (do not combine with mileage).', required: false, validation_rules: null, options: null, conditional_logic: null, width: 'half', sort: 14 },
        { id: 'f_16', type: 'heading', label: 'Lodging & Meals', name: 'lodging_heading', placeholder: null, help_text: null, required: false, validation_rules: null, options: null, conditional_logic: null, width: 'full', sort: 15 },
        { id: 'f_17', type: 'number', label: 'Hotel / Lodging ($)', name: 'lodging', placeholder: '0.00', help_text: 'Total for all nights.', required: false, validation_rules: null, options: null, conditional_logic: null, width: 'half', sort: 16 },
        { id: 'f_18', type: 'number', label: 'Meals ($)', name: 'meals', placeholder: '0.00', help_text: 'Business meals only. Note: typically 50% deductible.', required: false, validation_rules: null, options: null, conditional_logic: null, width: 'half', sort: 17 },
        { id: 'f_19', type: 'heading', label: 'Other Expenses', name: 'other_heading', placeholder: null, help_text: null, required: false, validation_rules: null, options: null, conditional_logic: null, width: 'full', sort: 18 },
        { id: 'f_20', type: 'number', label: 'Internet / Phone ($)', name: 'internet_phone', placeholder: '0.00', help_text: 'Business-related charges only.', required: false, validation_rules: null, options: null, conditional_logic: null, width: 'half', sort: 19 },
        { id: 'f_21', type: 'number', label: 'Conference / Registration Fees ($)', name: 'conference_fees', placeholder: '0.00', help_text: null, required: false, validation_rules: null, options: null, conditional_logic: null, width: 'half', sort: 20 },
        { id: 'f_22', type: 'number', label: 'Tips & Gratuities ($)', name: 'tips', placeholder: '0.00', help_text: null, required: false, validation_rules: null, options: null, conditional_logic: null, width: 'half', sort: 21 },
        { id: 'f_23', type: 'number', label: 'Other Expenses ($)', name: 'other_expenses', placeholder: '0.00', help_text: null, required: false, validation_rules: null, options: null, conditional_logic: null, width: 'half', sort: 22 },
        { id: 'f_24', type: 'textarea', label: 'Other Expense Details', name: 'other_expense_details', placeholder: 'Describe any other business expenses...', help_text: null, required: false, validation_rules: null, options: null, conditional_logic: null, width: 'full', sort: 23 },
        { id: 'f_25', type: 'file', label: 'Receipts & Documentation', name: 'receipts', placeholder: null, help_text: 'Upload all receipts, boarding passes, and supporting documents.', required: false, validation_rules: null, options: null, conditional_logic: null, width: 'full', sort: 24 },
        { id: 'f_26', type: 'checkbox', label: 'I certify that these expenses were incurred for legitimate business purposes.', name: 'certification', placeholder: null, help_text: null, required: true, validation_rules: null, options: null, conditional_logic: null, width: 'full', sort: 25 },
      ],
    },
    {
      key: 'vehicle-expense',
      title: 'Vehicle Expense Form',
      slug: `vehicle-expense-${Date.now()}`,
      description: 'Track vehicle expenses and mileage for business tax deductions.',
      category: 'financial',
      icon: 'lucide:car',
      iconColor: 'text-rose-600',
      iconBg: 'bg-rose-100',
      fields: [
        { id: 'f_1', type: 'heading', label: 'Vehicle Expense Form', name: 'heading', placeholder: null, help_text: 'Report your vehicle usage and expenses for business tax deduction purposes.', required: false, validation_rules: null, options: null, conditional_logic: null, width: 'full', sort: 0 },
        { id: 'f_2', type: 'text', label: 'Full Name', name: 'full_name', placeholder: 'Enter your full name', help_text: null, required: true, validation_rules: null, options: null, conditional_logic: null, width: 'half', sort: 1 },
        { id: 'f_3', type: 'email', label: 'Email Address', name: 'email', placeholder: 'you@example.com', help_text: null, required: true, validation_rules: null, options: null, conditional_logic: null, width: 'half', sort: 2 },
        { id: 'f_4', type: 'heading', label: 'Vehicle Information', name: 'vehicle_heading', placeholder: null, help_text: null, required: false, validation_rules: null, options: null, conditional_logic: null, width: 'full', sort: 3 },
        { id: 'f_5', type: 'number', label: 'Year', name: 'vehicle_year', placeholder: '2024', help_text: null, required: true, validation_rules: null, options: null, conditional_logic: null, width: 'third', sort: 4 },
        { id: 'f_6', type: 'text', label: 'Make', name: 'vehicle_make', placeholder: 'e.g., Toyota', help_text: null, required: true, validation_rules: null, options: null, conditional_logic: null, width: 'third', sort: 5 },
        { id: 'f_7', type: 'text', label: 'Model', name: 'vehicle_model', placeholder: 'e.g., Camry', help_text: null, required: true, validation_rules: null, options: null, conditional_logic: null, width: 'third', sort: 6 },
        { id: 'f_8', type: 'date', label: 'Date Placed in Service', name: 'service_date', placeholder: null, help_text: 'Date you started using this vehicle for business.', required: true, validation_rules: null, options: null, conditional_logic: null, width: 'half', sort: 7 },
        { id: 'f_9', type: 'select', label: 'Ownership Type', name: 'ownership_type', placeholder: 'Select ownership type', help_text: null, required: true, validation_rules: null, options: [{ label: 'Owned', value: 'owned' }, { label: 'Leased', value: 'leased' }, { label: 'Company Vehicle', value: 'company' }], conditional_logic: null, width: 'half', sort: 8 },
        { id: 'f_10', type: 'heading', label: 'Mileage Log', name: 'mileage_heading', placeholder: null, help_text: null, required: false, validation_rules: null, options: null, conditional_logic: null, width: 'full', sort: 9 },
        { id: 'f_11', type: 'number', label: 'Total Miles Driven (year)', name: 'total_miles', placeholder: '0', help_text: 'Total miles driven on this vehicle during the tax year.', required: true, validation_rules: null, options: null, conditional_logic: null, width: 'half', sort: 10 },
        { id: 'f_12', type: 'number', label: 'Business Miles Driven', name: 'business_miles', placeholder: '0', help_text: 'Miles driven exclusively for business purposes.', required: true, validation_rules: null, options: null, conditional_logic: null, width: 'half', sort: 11 },
        { id: 'f_13', type: 'number', label: 'Commuting Miles', name: 'commuting_miles', placeholder: '0', help_text: 'Miles driven for regular commute (not deductible).', required: false, validation_rules: null, options: null, conditional_logic: null, width: 'half', sort: 12 },
        { id: 'f_14', type: 'number', label: 'Personal Miles', name: 'personal_miles', placeholder: '0', help_text: null, required: false, validation_rules: null, options: null, conditional_logic: null, width: 'half', sort: 13 },
        { id: 'f_15', type: 'radio', label: 'Deduction Method Preference', name: 'deduction_method', placeholder: null, help_text: 'Your tax preparer will advise on the best method for your situation.', required: true, validation_rules: null, options: [{ label: 'Standard Mileage Rate', value: 'standard_mileage' }, { label: 'Actual Expenses', value: 'actual_expenses' }, { label: 'Not Sure - Please Advise', value: 'unsure' }], conditional_logic: null, width: 'full', sort: 14 },
        { id: 'f_16', type: 'heading', label: 'Actual Vehicle Expenses', name: 'actual_expenses_heading', placeholder: null, help_text: 'Complete this section if using the actual expense method or if unsure.', required: false, validation_rules: null, options: null, conditional_logic: null, width: 'full', sort: 15 },
        { id: 'f_17', type: 'number', label: 'Gas & Oil ($)', name: 'gas_oil', placeholder: '0.00', help_text: null, required: false, validation_rules: null, options: null, conditional_logic: null, width: 'half', sort: 16 },
        { id: 'f_18', type: 'number', label: 'Repairs & Maintenance ($)', name: 'repairs', placeholder: '0.00', help_text: null, required: false, validation_rules: null, options: null, conditional_logic: null, width: 'half', sort: 17 },
        { id: 'f_19', type: 'number', label: 'Insurance ($)', name: 'insurance', placeholder: '0.00', help_text: null, required: false, validation_rules: null, options: null, conditional_logic: null, width: 'half', sort: 18 },
        { id: 'f_20', type: 'number', label: 'Registration & Fees ($)', name: 'registration_fees', placeholder: '0.00', help_text: null, required: false, validation_rules: null, options: null, conditional_logic: null, width: 'half', sort: 19 },
        { id: 'f_21', type: 'number', label: 'Lease / Loan Payments ($)', name: 'lease_payments', placeholder: '0.00', help_text: 'Total payments for the tax year.', required: false, validation_rules: null, options: null, conditional_logic: null, width: 'half', sort: 20 },
        { id: 'f_22', type: 'number', label: 'Parking & Tolls ($)', name: 'parking_tolls', placeholder: '0.00', help_text: 'Business-related only.', required: false, validation_rules: null, options: null, conditional_logic: null, width: 'half', sort: 21 },
        { id: 'f_23', type: 'number', label: 'Other Vehicle Expenses ($)', name: 'other_vehicle_expenses', placeholder: '0.00', help_text: null, required: false, validation_rules: null, options: null, conditional_logic: null, width: 'half', sort: 22 },
        { id: 'f_24', type: 'checkbox', label: 'I have written records to support my business mileage claims.', name: 'has_mileage_records', placeholder: null, help_text: null, required: false, validation_rules: null, options: null, conditional_logic: null, width: 'full', sort: 23 },
        { id: 'f_25', type: 'file', label: 'Supporting Documents', name: 'documents', placeholder: null, help_text: 'Upload mileage logs, repair receipts, insurance statements, etc.', required: false, validation_rules: null, options: null, conditional_logic: null, width: 'full', sort: 24 },
        { id: 'f_26', type: 'textarea', label: 'Additional Notes', name: 'notes', placeholder: 'Any additional vehicle-related information...', help_text: null, required: false, validation_rules: null, options: null, conditional_logic: null, width: 'full', sort: 25 },
      ],
    },
  ]

  const getTemplatesByCategory = (categoryKey: string) => {
    return templates.filter((t) => t.category === categoryKey)
  }

  const getTemplateByKey = (key: string) => {
    return templates.find((t) => t.key === key)
  }

  return {
    categories,
    templates,
    getTemplatesByCategory,
    getTemplateByKey,
  }
}
