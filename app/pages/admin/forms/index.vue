<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { format } from 'date-fns'
import { toast } from 'vue-sonner'
import type { Form } from '~/types/directus'

definePageMeta({
  middleware: 'auth',
  layout: 'admin',
})

useSeoMeta({
  title: 'Form Builder - Admin - SJHAS, Inc.',
})

const forms = useDirectusItems<Form>('forms')

const formsList = ref<Form[]>([])
const isLoading = ref(true)
const searchQuery = ref('')

const fetchForms = async () => {
  isLoading.value = true
  try {
    const result = await forms.list({
      sort: ['-id'],
      fields: ['id', 'title', 'slug', 'status'],
    })
    formsList.value = result
  } catch (error) {
    console.error('Failed to fetch forms:', error)
    toast.error('Failed to load forms')
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchForms)

const filteredForms = computed(() => {
  if (!searchQuery.value) return formsList.value
  const query = searchQuery.value.toLowerCase()
  return formsList.value.filter(
    (form) =>
      form.title.toLowerCase().includes(query) ||
      form.slug.toLowerCase().includes(query)
  )
})

const formatDate = (date: string) => {
  return format(new Date(date), 'MMM d, yyyy')
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'published':
      return 'bg-green-100 text-green-700'
    case 'draft':
      return 'bg-yellow-100 text-yellow-700'
    case 'archived':
      return 'bg-slate-100 text-slate-700'
    default:
      return 'bg-slate-100 text-slate-700'
  }
}

const duplicateForm = async (form: Form) => {
  try {
    await forms.create({
      ...form,
      title: `${form.title} (Copy)`,
      slug: `${form.slug}-copy-${Date.now()}`,
      status: 'draft',
    })
    toast.success('Form duplicated')
    await fetchForms()
  } catch (error) {
    toast.error('Failed to duplicate form')
  }
}

const deleteForm = async (id: number) => {
  if (!confirm('Are you sure you want to delete this form?')) return

  try {
    await forms.remove(id)
    toast.success('Form deleted')
    await fetchForms()
  } catch (error) {
    toast.error('Failed to delete form')
  }
}

// Send to client
const showSendDialog = ref(false)
const sendFormTarget = ref<Form | null>(null)
const sendEmail = ref('')
const sendName = ref('')
const sendMessage = ref('')
const isSending = ref(false)
const sendError = ref<string | null>(null)

const openSendDialog = (form: Form) => {
  sendFormTarget.value = form
  sendEmail.value = ''
  sendName.value = ''
  sendMessage.value = ''
  sendError.value = null
  showSendDialog.value = true
}

// Quick start templates
const { categories, templates: formTemplates, getTemplatesByCategory, getTemplateByKey } = useFormTemplates()
const isCreatingTemplate = ref(false)
const templateSearchQuery = ref('')

const filteredTemplates = computed(() => {
  if (!templateSearchQuery.value) return formTemplates
  const query = templateSearchQuery.value.toLowerCase()
  return formTemplates.filter(
    (t) =>
      t.title.toLowerCase().includes(query) ||
      t.description.toLowerCase().includes(query)
  )
})

const filteredCategories = computed(() => {
  return categories.filter((cat) =>
    filteredTemplates.value.some((t) => t.category === cat.key)
  )
})

const createFromTemplate = async (templateKey: string) => {
  if (isCreatingTemplate.value) return
  isCreatingTemplate.value = true

  const template = getTemplateByKey(templateKey)
  if (!template) {
    isCreatingTemplate.value = false
    return
  }

  try {
    const created = await forms.create({
      title: template.title,
      slug: `${template.key}-${Date.now()}`,
      description: template.description,
      status: 'draft',
      fields: template.fields,
      success_message: 'Thank you for your submission!',
      notify_on_submission: true,
      allow_file_uploads: true,
      max_file_size_mb: 10,
      allowed_file_types: '.pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png',
    } as any)
    toast.success(`"${template.title}" form created`)
    navigateTo(`/admin/forms/${created.id}`)
  } catch (error: any) {
    toast.error(error.message || 'Failed to create form from template')
  } finally {
    isCreatingTemplate.value = false
  }
}

const handleSendForm = async () => {
  sendError.value = null

  if (!sendEmail.value || !sendFormTarget.value) {
    toast.error('Please enter a recipient email')
    return
  }

  isSending.value = true
  try {
    await $fetch('/api/forms/send', {
      method: 'POST',
      body: {
        formId: sendFormTarget.value.id,
        recipientEmail: sendEmail.value,
        recipientName: sendName.value,
        message: sendMessage.value,
      },
    })
    toast.success(`Form sent to ${sendEmail.value}`)
    showSendDialog.value = false
  } catch (error: any) {
    const msg = error.data?.message || error.message || 'Failed to send email'
    sendError.value = msg
    toast.error(msg)
    console.error('Send form error:', error)
  } finally {
    isSending.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900">Form Builder</h1>
        <p class="text-slate-600 mt-1">Create and manage custom forms</p>
      </div>
      <NuxtLink to="/admin/forms/new">
        <Button>
          <Icon name="lucide:plus" class="w-4 h-4" />
          Create Form
        </Button>
      </NuxtLink>
    </div>

    <!-- Search and filters -->
    <Card class="p-4">
      <div class="flex flex-col sm:flex-row gap-4">
        <div class="relative flex-1">
          <Icon
            name="lucide:search"
            class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
          />
          <Input
            v-model="searchQuery"
            placeholder="Search forms..."
            class="pl-10"
          />
        </div>
      </div>
    </Card>

    <!-- Forms list -->
    <Card>
      <div v-if="isLoading" class="p-8">
        <div class="space-y-4">
          <div v-for="i in 3" :key="i" class="h-20 bg-slate-100 rounded-lg animate-pulse" />
        </div>
      </div>

      <div v-else-if="filteredForms.length === 0" class="p-8 text-center">
        <Icon name="lucide:file-x" class="w-12 h-12 mx-auto text-slate-300 mb-4" />
        <p class="text-slate-500">
          {{ searchQuery ? 'No forms match your search' : 'No forms created yet' }}
        </p>
        <NuxtLink v-if="!searchQuery" to="/admin/forms/new" class="mt-4 inline-block">
          <Button variant="secondary">Create your first form</Button>
        </NuxtLink>
      </div>

      <div v-else class="divide-y divide-slate-200">
        <div
          v-for="form in filteredForms"
          :key="form.id"
          class="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
        >
          <div class="flex items-center gap-4 flex-1 min-w-0">
            <div class="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
              <Icon name="lucide:file-text" class="w-5 h-5 text-primary-600" />
            </div>
            <div class="flex-1 min-w-0">
              <NuxtLink
                :to="`/admin/forms/${form.id}`"
                class="font-medium text-slate-900 hover:text-primary-600 truncate block"
              >
                {{ form.title }}
              </NuxtLink>
              <div class="flex items-center gap-3 mt-1">
                <span class="text-sm text-slate-500">/{{ form.slug }}</span>
                <span
                  :class="[
                    'px-2 py-0.5 text-xs font-medium rounded-full',
                    getStatusColor(form.status)
                  ]"
                >
                  {{ form.status }}
                </span>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <span class="text-sm text-slate-500 hidden sm:block">
              /{{ form.slug }}
            </span>

            <!-- Actions dropdown -->
            <div class="relative group">
              <Button variant="ghost" size="icon">
                <Icon name="lucide:more-vertical" class="w-4 h-4" />
              </Button>
              <div class="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                <NuxtLink
                  :to="`/admin/forms/${form.id}`"
                  class="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                >
                  <Icon name="lucide:edit" class="w-4 h-4" />
                  Edit Form
                </NuxtLink>
                <a
                  :href="`/f/${form.slug}`"
                  target="_blank"
                  class="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                >
                  <Icon name="lucide:external-link" class="w-4 h-4" />
                  View Form
                </a>
                <button
                  v-if="form.status === 'published'"
                  class="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                  @click="openSendDialog(form)"
                >
                  <Icon name="lucide:send" class="w-4 h-4" />
                  Send to Client
                </button>
                <button
                  class="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                  @click="duplicateForm(form)"
                >
                  <Icon name="lucide:copy" class="w-4 h-4" />
                  Duplicate
                </button>
                <hr class="my-1 border-slate-200" />
                <button
                  class="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  @click="deleteForm(form.id)"
                >
                  <Icon name="lucide:trash-2" class="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>

    <!-- Send to Client Dialog -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="showSendDialog"
          class="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div class="absolute inset-0 bg-black/50" @click="showSendDialog = false" />
          <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-5">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold text-slate-900">Send Form to Client</h3>
              <button class="p-1 rounded-lg hover:bg-slate-100" @click="showSendDialog = false">
                <Icon name="lucide:x" class="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <p class="text-sm text-slate-500">
              Send <span class="font-medium text-slate-700">{{ sendFormTarget?.title }}</span> to a client via email.
            </p>

            <!-- Inline error alert -->
            <div
              v-if="sendError"
              class="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2"
            >
              <Icon name="lucide:alert-circle" class="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{{ sendError }}</span>
            </div>

            <div class="space-y-4">
              <div>
                <Label class="mb-1.5">Recipient Email *</Label>
                <Input v-model="sendEmail" type="email" placeholder="client@example.com" />
              </div>
              <div>
                <Label class="mb-1.5">Recipient Name</Label>
                <Input v-model="sendName" placeholder="John Doe" />
              </div>
              <div>
                <Label class="mb-1.5">Personal Message (optional)</Label>
                <Textarea v-model="sendMessage" placeholder="Hi, please complete this form at your earliest convenience..." rows="3" />
              </div>
            </div>

            <div class="flex justify-end gap-3 pt-2">
              <Button variant="secondary" @click="showSendDialog = false">Cancel</Button>
              <Button :disabled="isSending || !sendEmail" @click="handleSendForm">
                <Icon v-if="isSending" name="lucide:loader-2" class="w-4 h-4 animate-spin" />
                <Icon v-else name="lucide:send" class="w-4 h-4" />
                {{ isSending ? 'Sending...' : 'Send Email' }}
              </Button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Form Templates -->
    <div class="space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h2 class="text-xl font-semibold text-slate-900">Quick Start Templates</h2>
          <p class="text-slate-500 mt-1 text-sm">
            Use these pre-built templates to quickly create forms for collecting client information. Customize fields after creation.
          </p>
        </div>
        <div class="relative w-full sm:w-64">
          <Icon
            name="lucide:search"
            class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
          />
          <Input
            v-model="templateSearchQuery"
            placeholder="Search templates..."
            class="pl-10"
          />
        </div>
      </div>

      <div
        v-for="category in filteredCategories"
        :key="category.key"
      >
        <Card class="p-6">
          <div class="mb-5">
            <div class="flex items-center gap-2 mb-1">
              <Icon
                :name="category.key === 'financial' ? 'lucide:landmark' : 'lucide:layout-template'"
                class="w-5 h-5 text-slate-400"
              />
              <h3 class="text-lg font-semibold text-slate-900">{{ category.label }}</h3>
            </div>
            <p class="text-sm text-slate-500 ml-7">{{ category.description }}</p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <button
              v-for="template in filteredTemplates.filter(t => t.category === category.key)"
              :key="template.key"
              :disabled="isCreatingTemplate"
              class="flex items-start gap-3 p-4 rounded-xl border border-slate-200 hover:border-primary-300 hover:bg-primary-50/50 hover:shadow-sm transition-all text-left disabled:opacity-50 group"
              @click="createFromTemplate(template.key)"
            >
              <div :class="['w-10 h-10 rounded-lg flex items-center justify-center shrink-0', template.iconBg]">
                <Icon :name="template.icon" :class="['w-5 h-5', template.iconColor]" />
              </div>
              <div class="min-w-0">
                <p class="font-medium text-slate-900 group-hover:text-primary-700 transition-colors">{{ template.title }}</p>
                <p class="text-sm text-slate-500 mt-0.5 line-clamp-2">{{ template.description }}</p>
                <p class="text-xs text-slate-400 mt-1.5">{{ template.fields.filter(f => f.type !== 'heading' && f.type !== 'paragraph').length }} fields</p>
              </div>
            </button>
          </div>
        </Card>
      </div>

      <p v-if="filteredTemplates.length === 0" class="text-center text-slate-400 py-8 text-sm">
        No templates match your search.
      </p>

      <p class="text-xs text-slate-400 leading-relaxed">
        These templates are provided for informational purposes only and do not constitute tax advice. We recommend seeking advice from a tax professional for information regarding your personal tax situation.
      </p>
    </div>
  </div>
</template>
