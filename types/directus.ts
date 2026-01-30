// Directus Collections Type Definitions
// Run `pnpm generate:types` to regenerate from your Directus instance

export interface DirectusUser {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  password: string | null
  location: string | null
  title: string | null
  description: string | null
  avatar: string | null
  language: string | null
  theme: string | null
  status: 'active' | 'invited' | 'draft' | 'suspended' | 'archived'
}

export interface DirectusFile {
  id: string
  storage: string
  filename_disk: string | null
  filename_download: string
  title: string | null
  type: string | null
  folder: string | null
  uploaded_by: string | null
  uploaded_on: string
  modified_by: string | null
  modified_on: string
  charset: string | null
  filesize: number | null
  width: number | null
  height: number | null
  duration: number | null
  embed: string | null
  description: string | null
  location: string | null
  tags: string[] | null
  metadata: Record<string, unknown> | null
}

// Custom Collections

export interface SiteSettings {
  id: number
  site_name: string
  site_description: string | null
  logo: string | DirectusFile | null
  contact_email: string
  contact_phone: string | null
  address_line_1: string | null
  address_line_2: string | null
  city: string | null
  state: string | null
  zip_code: string | null
  hours_monday: string | null
  hours_tuesday: string | null
  hours_wednesday: string | null
  hours_thursday: string | null
  hours_friday: string | null
  hours_saturday: string | null
  hours_sunday: string | null
}

export interface HomePage {
  id: number
  hero_title: string
  hero_subtitle: string | null
  hero_cta_text: string | null
  hero_cta_link: string | null
  about_title: string
  about_content: string
  about_image: string | DirectusFile | null
  services_title: string
  testimonials_title: string
  contact_title: string
}

export interface Service {
  id: number
  status: 'published' | 'draft' | 'archived'
  sort: number | null
  title: string
  short_description: string
  full_description: string | null
  icon: string | null
  cta_text: string | null
  cta_link: string | null
}

export interface Testimonial {
  id: number
  status: 'published' | 'draft' | 'archived'
  sort: number | null
  quote: string
  author_name: string
  author_title: string | null
  author_image: string | DirectusFile | null
  featured: boolean
}

export interface Form {
  id: number
  status: 'published' | 'draft' | 'archived'
  date_created: string
  date_updated: string | null
  title: string
  slug: string
  description: string | null
  success_message: string | null
  notify_email: string | null
  notify_on_submission: boolean
  allow_file_uploads: boolean
  max_file_size_mb: number
  allowed_file_types: string | null
  fields: FormField[]
}

export interface FormField {
  id: string
  type: 'text' | 'email' | 'phone' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'file' | 'date' | 'number' | 'heading' | 'paragraph'
  label: string
  name: string
  placeholder: string | null
  help_text: string | null
  required: boolean
  validation_rules: ValidationRule[] | null
  options: FieldOption[] | null
  conditional_logic: ConditionalLogic | null
  width: 'full' | 'half' | 'third'
  sort: number
}

export interface ValidationRule {
  type: 'min' | 'max' | 'pattern' | 'minLength' | 'maxLength'
  value: string | number
  message: string
}

export interface FieldOption {
  label: string
  value: string
}

export interface ConditionalLogic {
  show_when: {
    field: string
    operator: 'equals' | 'not_equals' | 'contains' | 'not_empty'
    value: string
  }
}

export interface FormSubmission {
  id: number
  date_created: string
  form: number | Form
  data: Record<string, unknown>
  files: SubmissionFile[]
  submitter_email: string | null
  submitter_name: string | null
  ip_address: string | null
  user_agent: string | null
  status: 'new' | 'reviewed' | 'archived'
  notes: string | null
}

export interface SubmissionFile {
  id: number
  submission: number | FormSubmission
  file: string | DirectusFile
  field_name: string
  original_filename: string
}

export interface Page {
  id: number
  status: 'published' | 'draft' | 'archived'
  date_created: string
  date_updated: string | null
  title: string
  slug: string
  meta_description: string | null
  content: string | null
}

// Collections Map for SDK
export interface Collections {
  directus_users: DirectusUser
  directus_files: DirectusFile
  site_settings: SiteSettings
  home_page: HomePage
  services: Service[]
  testimonials: Testimonial[]
  forms: Form[]
  form_submissions: FormSubmission[]
  submission_files: SubmissionFile[]
  pages: Page[]
}
