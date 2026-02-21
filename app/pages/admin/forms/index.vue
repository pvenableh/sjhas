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

const openSendDialog = (form: Form) => {
  sendFormTarget.value = form
  sendEmail.value = ''
  sendName.value = ''
  sendMessage.value = ''
  showSendDialog.value = true
}

const handleSendForm = async () => {
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
    toast.error(error.data?.message || 'Failed to send email')
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
    <Card class="p-6">
      <h2 class="text-lg font-semibold text-slate-900 mb-4">Quick Start Templates</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <button
          class="flex items-start gap-3 p-4 rounded-lg border border-slate-200 hover:border-primary-200 hover:bg-primary-50 transition-colors text-left"
        >
          <div class="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <Icon name="lucide:upload" class="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p class="font-medium text-slate-900">Document Upload</p>
            <p class="text-sm text-slate-500">Simple file upload form</p>
          </div>
        </button>

        <button
          class="flex items-start gap-3 p-4 rounded-lg border border-slate-200 hover:border-primary-200 hover:bg-primary-50 transition-colors text-left"
        >
          <div class="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
            <Icon name="lucide:clipboard-list" class="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p class="font-medium text-slate-900">Tax Planning</p>
            <p class="text-sm text-slate-500">Comprehensive questionnaire</p>
          </div>
        </button>

        <button
          class="flex items-start gap-3 p-4 rounded-lg border border-slate-200 hover:border-primary-200 hover:bg-primary-50 transition-colors text-left"
        >
          <div class="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
            <Icon name="lucide:user" class="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p class="font-medium text-slate-900">Client Intake</p>
            <p class="text-sm text-slate-500">New client information</p>
          </div>
        </button>
      </div>
    </Card>
  </div>
</template>
