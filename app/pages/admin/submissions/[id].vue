<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { format } from 'date-fns'
import { toast } from 'vue-sonner'
import type { FormSubmission } from '~/types/directus'

definePageMeta({
  middleware: 'auth',
  layout: 'admin',
})

const route = useRoute()
const submissions = useDirectusItems<FormSubmission>('form_submissions')

const submissionId = computed(() => String(route.params.id))

useSeoMeta({
  title: () => `Submission #${submissionId.value} - Admin - SJHAS, Inc.`,
})

const submission = ref<any | null>(null)
const isLoading = ref(true)
const notFound = ref(false)
const notes = ref('')
const isSavingNotes = ref(false)

const fetchSubmission = async () => {
  isLoading.value = true
  notFound.value = false
  try {
    const sub: any = await submissions.get(submissionId.value, {
      fields: [
        'id', 'form.id', 'form.title', 'form.slug', 'status', 'data',
        'submitter_email', 'submitter_name', 'notes', 'date_created',
      ],
    })
    submission.value = sub
    notes.value = sub?.notes || ''
  } catch (error: any) {
    console.error('Failed to fetch submission:', error)
    submission.value = null
    notFound.value = true
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchSubmission)

const formatDate = (date?: string | null) =>
  date ? format(new Date(date), 'MMM d, yyyy h:mm a') : '—'

const getStatusColor = (status: string) => {
  switch (status) {
    case 'new': return 'bg-blue-100 text-blue-700'
    case 'reviewed': return 'bg-green-100 text-green-700'
    default: return 'bg-slate-100 text-slate-700'
  }
}

const updateStatus = async (status: string) => {
  if (!submission.value) return
  try {
    await submissions.update(submission.value.id, { status } as any)
    submission.value.status = status
    toast.success(`Marked as ${status}`)
  } catch (error) {
    toast.error('Failed to update status')
  }
}

const saveNotes = async () => {
  if (!submission.value) return
  isSavingNotes.value = true
  try {
    await submissions.update(submission.value.id, { notes: notes.value } as any)
    submission.value.notes = notes.value
    toast.success('Notes saved')
  } catch (error) {
    toast.error('Failed to save notes')
  } finally {
    isSavingNotes.value = false
  }
}

const notesChanged = computed(() => notes.value !== (submission.value?.notes || ''))

const formatDataKey = (key: string) => {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
}

const getDisplayableData = (data: Record<string, unknown>) => {
  if (!data) return []
  return Object.entries(data)
    .filter(([key]) => key !== 'uploaded_files')
    .map(([key, value]) => ({
      key,
      label: formatDataKey(key),
      value: typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value || '—'),
    }))
}
</script>

<template>
  <div class="space-y-6 max-w-4xl">
    <NuxtLink
      to="/admin/submissions"
      class="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900"
    >
      <Icon name="lucide:arrow-left" class="w-4 h-4" />
      All submissions
    </NuxtLink>

    <Card v-if="isLoading" class="p-8">
      <div class="space-y-4">
        <div v-for="i in 4" :key="i" class="h-16 bg-slate-100 rounded-lg animate-pulse" />
      </div>
    </Card>

    <Card v-else-if="notFound || !submission" class="p-8 text-center">
      <Icon name="lucide:inbox" class="w-12 h-12 mx-auto text-slate-300 mb-4" />
      <p class="text-slate-700 font-medium">Submission not found</p>
      <p class="text-slate-500 text-sm mt-1">It may have been deleted, or the link is incorrect.</p>
    </Card>

    <template v-else>
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div class="flex items-center gap-3 flex-wrap">
            <h1 class="text-2xl font-semibold text-slate-900">
              {{ submission.submitter_name || submission.submitter_email || 'Anonymous' }}
            </h1>
            <span :class="['px-2 py-0.5 text-xs font-medium rounded-full', getStatusColor(submission.status)]">
              {{ submission.status }}
            </span>
          </div>
          <p class="text-slate-600 mt-1">
            {{ submission.form?.title || 'Unknown Form' }} &middot; #{{ submission.id }}
          </p>
        </div>
        <div class="flex items-center gap-3">
          <Button
            v-if="submission.status === 'new'"
            size="sm"
            @click="updateStatus('reviewed')"
          >
            <Icon name="lucide:check" class="w-4 h-4" />
            Mark Reviewed
          </Button>
          <Button
            v-if="submission.status !== 'archived'"
            variant="secondary"
            size="sm"
            @click="updateStatus('archived')"
          >
            <Icon name="lucide:archive" class="w-4 h-4" />
            Archive
          </Button>
          <Button
            v-if="submission.status === 'archived'"
            variant="secondary"
            size="sm"
            @click="updateStatus('new')"
          >
            <Icon name="lucide:rotate-ccw" class="w-4 h-4" />
            Restore
          </Button>
        </div>
      </div>

      <Card class="p-6 space-y-6">
        <!-- Submitter info -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div v-if="submission.submitter_name">
            <p class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Name</p>
            <p class="text-sm text-slate-900">{{ submission.submitter_name }}</p>
          </div>
          <div v-if="submission.submitter_email">
            <p class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Email</p>
            <a :href="`mailto:${submission.submitter_email}`" class="text-sm text-primary-600 hover:text-primary-700">
              {{ submission.submitter_email }}
            </a>
          </div>
          <div>
            <p class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Received</p>
            <p class="text-sm text-slate-900">{{ formatDate(submission.date_created) }}</p>
          </div>
        </div>

        <!-- Form data -->
        <div v-if="submission.data">
          <p class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Responses</p>
          <div class="space-y-2">
            <div
              v-for="item in getDisplayableData(submission.data)"
              :key="item.key"
              class="flex justify-between gap-4 py-2 border-b border-slate-200 last:border-0"
            >
              <span class="text-sm font-medium text-slate-600">{{ item.label }}</span>
              <span class="text-sm text-slate-900 text-right whitespace-pre-wrap break-words">{{ item.value }}</span>
            </div>
          </div>
        </div>

        <!-- Files -->
        <div v-if="submission.data?.uploaded_files?.length">
          <p class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Uploaded Files</p>
          <div class="space-y-2">
            <div
              v-for="file in (submission.data.uploaded_files as any[])"
              :key="file.file_id"
              class="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200"
            >
              <Icon name="lucide:file" class="w-5 h-5 text-slate-400" />
              <span class="text-sm text-slate-700 flex-1 break-all">{{ file.filename }}</span>
              <a
                :href="`/api/files/${file.file_id}`"
                target="_blank"
                class="text-sm text-primary-600 hover:text-primary-700"
              >
                View
              </a>
              <a
                :href="`/api/files/${file.file_id}?download=1`"
                class="text-sm text-primary-600 hover:text-primary-700"
              >
                Download
              </a>
            </div>
          </div>
        </div>

        <!-- Notes -->
        <div>
          <p class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Internal Notes</p>
          <textarea
            v-model="notes"
            rows="4"
            placeholder="Add notes for your team (not visible to the submitter)"
            class="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <div class="mt-2 flex justify-end">
            <Button size="sm" :disabled="!notesChanged || isSavingNotes" @click="saveNotes">
              {{ isSavingNotes ? 'Saving...' : 'Save notes' }}
            </Button>
          </div>
        </div>
      </Card>
    </template>
  </div>
</template>
