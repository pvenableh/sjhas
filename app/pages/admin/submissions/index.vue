<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { format } from 'date-fns'
import { toast } from 'vue-sonner'
import type { FormSubmission, Form } from '~/types/directus'

definePageMeta({
  middleware: 'auth',
  layout: 'admin',
})

useSeoMeta({
  title: 'Submissions - Admin - SJHAS, Inc.',
})

const submissions = useDirectusItems<FormSubmission>('form_submissions')
const formsApi = useDirectusItems<Form>('forms')

const submissionList = ref<any[]>([])
const formsList = ref<Form[]>([])
const isLoading = ref(true)
const searchQuery = ref('')
const selectedStatus = ref<string>('all')
const selectedForm = ref<string>('all')
const expandedId = ref<number | null>(null)

const fetchData = async () => {
  isLoading.value = true
  try {
    const [subs, forms] = await Promise.all([
      submissions.list({
        sort: ['-id'],
        fields: ['id', 'form.id', 'form.title', 'form.slug', 'status', 'data', 'submitter_email', 'submitter_name', 'notes'],
        limit: 100,
      }),
      formsApi.list({
        fields: ['id', 'title', 'slug'],
        sort: ['title'],
      }),
    ])
    submissionList.value = subs
    formsList.value = forms
  } catch (error) {
    console.error('Failed to fetch submissions:', error)
    toast.error('Failed to load submissions')
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchData)

const filteredSubmissions = computed(() => {
  let result = submissionList.value

  if (selectedStatus.value !== 'all') {
    result = result.filter((s) => s.status === selectedStatus.value)
  }

  if (selectedForm.value !== 'all') {
    result = result.filter((s) => String(s.form?.id) === selectedForm.value)
  }

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(
      (s) =>
        (s.submitter_name?.toLowerCase().includes(q)) ||
        (s.submitter_email?.toLowerCase().includes(q)) ||
        (s.form?.title?.toLowerCase().includes(q))
    )
  }

  return result
})

const statusCounts = computed(() => ({
  all: submissionList.value.length,
  new: submissionList.value.filter((s) => s.status === 'new').length,
  reviewed: submissionList.value.filter((s) => s.status === 'reviewed').length,
  archived: submissionList.value.filter((s) => s.status === 'archived').length,
}))

const formatDate = (date: string) => format(new Date(date), 'MMM d, yyyy h:mm a')

const getStatusColor = (status: string) => {
  switch (status) {
    case 'new': return 'bg-blue-100 text-blue-700'
    case 'reviewed': return 'bg-green-100 text-green-700'
    case 'archived': return 'bg-slate-100 text-slate-700'
    default: return 'bg-slate-100 text-slate-700'
  }
}

const toggleExpand = (id: number) => {
  expandedId.value = expandedId.value === id ? null : id
}

const updateStatus = async (id: number, status: string) => {
  try {
    await submissions.update(id, { status } as any)
    const sub = submissionList.value.find((s) => s.id === id)
    if (sub) sub.status = status
    toast.success(`Marked as ${status}`)
  } catch (error) {
    toast.error('Failed to update status')
  }
}

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
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900">Submissions</h1>
        <p class="text-slate-600 mt-1">View and manage form responses</p>
      </div>
      <Button variant="secondary" @click="fetchData">
        <Icon name="lucide:refresh-cw" class="w-4 h-4" />
        Refresh
      </Button>
    </div>

    <!-- Status tabs -->
    <div class="flex gap-2">
      <button
        v-for="tab in (['all', 'new', 'reviewed', 'archived'] as const)"
        :key="tab"
        :class="[
          'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
          selectedStatus === tab
            ? 'bg-primary-600 text-white'
            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
        ]"
        @click="selectedStatus = tab"
      >
        {{ tab === 'all' ? 'All' : tab.charAt(0).toUpperCase() + tab.slice(1) }}
        <span class="ml-1.5 text-xs opacity-70">({{ statusCounts[tab] }})</span>
      </button>
    </div>

    <!-- Search and filter -->
    <Card class="p-4">
      <div class="flex flex-col sm:flex-row gap-4">
        <div class="relative flex-1">
          <Icon name="lucide:search" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input v-model="searchQuery" placeholder="Search by name, email, or form..." class="pl-10" />
        </div>
        <select
          v-model="selectedForm"
          class="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 bg-white"
        >
          <option value="all">All Forms</option>
          <option v-for="form in formsList" :key="form.id" :value="String(form.id)">
            {{ form.title }}
          </option>
        </select>
      </div>
    </Card>

    <!-- Submissions list -->
    <Card>
      <div v-if="isLoading" class="p-8">
        <div class="space-y-4">
          <div v-for="i in 5" :key="i" class="h-20 bg-slate-100 rounded-lg animate-pulse" />
        </div>
      </div>

      <div v-else-if="filteredSubmissions.length === 0" class="p-8 text-center">
        <Icon name="lucide:inbox" class="w-12 h-12 mx-auto text-slate-300 mb-4" />
        <p class="text-slate-500">
          {{ searchQuery || selectedStatus !== 'all' || selectedForm !== 'all' ? 'No submissions match your filters' : 'No submissions yet' }}
        </p>
      </div>

      <div v-else class="divide-y divide-slate-200">
        <div v-for="sub in filteredSubmissions" :key="sub.id">
          <!-- Row header -->
          <button
            class="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left"
            @click="toggleExpand(sub.id)"
          >
            <div class="flex items-center gap-4 flex-1 min-w-0">
              <div class="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                <Icon name="lucide:file-text" class="w-5 h-5 text-primary-600" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-3">
                  <p class="font-medium text-slate-900 truncate">
                    {{ sub.submitter_name || sub.submitter_email || 'Anonymous' }}
                  </p>
                  <span
                    :class="['px-2 py-0.5 text-xs font-medium rounded-full', getStatusColor(sub.status)]"
                  >
                    {{ sub.status }}
                  </span>
                </div>
                <div class="flex items-center gap-3 mt-1 text-sm text-slate-500">
                  <span>{{ sub.form?.title || 'Unknown Form' }}</span>
                  <span>&middot;</span>
                  <span>#{{ sub.id }}</span>
                </div>
              </div>
            </div>
            <Icon
              name="lucide:chevron-down"
              :class="['w-5 h-5 text-slate-400 transition-transform', expandedId === sub.id ? 'rotate-180' : '']"
            />
          </button>

          <!-- Expanded details -->
          <div v-if="expandedId === sub.id" class="px-4 pb-4">
            <div class="ml-14 bg-slate-50 rounded-xl p-6 space-y-6">
              <!-- Submitter info -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div v-if="sub.submitter_name">
                  <p class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Name</p>
                  <p class="text-sm text-slate-900">{{ sub.submitter_name }}</p>
                </div>
                <div v-if="sub.submitter_email">
                  <p class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Email</p>
                  <a :href="`mailto:${sub.submitter_email}`" class="text-sm text-primary-600 hover:text-primary-700">
                    {{ sub.submitter_email }}
                  </a>
                </div>
              </div>

              <!-- Form data -->
              <div v-if="sub.data">
                <p class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Responses</p>
                <div class="space-y-2">
                  <div
                    v-for="item in getDisplayableData(sub.data)"
                    :key="item.key"
                    class="flex justify-between gap-4 py-2 border-b border-slate-200 last:border-0"
                  >
                    <span class="text-sm font-medium text-slate-600">{{ item.label }}</span>
                    <span class="text-sm text-slate-900 text-right">{{ item.value }}</span>
                  </div>
                </div>
              </div>

              <!-- Files -->
              <div v-if="sub.data?.uploaded_files?.length">
                <p class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Uploaded Files</p>
                <div class="space-y-2">
                  <div
                    v-for="file in (sub.data.uploaded_files as any[])"
                    :key="file.file_id"
                    class="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200"
                  >
                    <Icon name="lucide:file" class="w-5 h-5 text-slate-400" />
                    <span class="text-sm text-slate-700 flex-1">{{ file.filename }}</span>
                    <a
                      :href="`${$config.public.directus.url}/assets/${file.file_id}`"
                      target="_blank"
                      class="text-sm text-primary-600 hover:text-primary-700"
                    >
                      Download
                    </a>
                  </div>
                </div>
              </div>

              <!-- Actions -->
              <div class="flex items-center gap-3 pt-2">
                <Button
                  v-if="sub.status === 'new'"
                  size="sm"
                  @click="updateStatus(sub.id, 'reviewed')"
                >
                  <Icon name="lucide:check" class="w-4 h-4" />
                  Mark Reviewed
                </Button>
                <Button
                  v-if="sub.status !== 'archived'"
                  variant="secondary"
                  size="sm"
                  @click="updateStatus(sub.id, 'archived')"
                >
                  <Icon name="lucide:archive" class="w-4 h-4" />
                  Archive
                </Button>
                <Button
                  v-if="sub.status === 'archived'"
                  variant="secondary"
                  size="sm"
                  @click="updateStatus(sub.id, 'new')"
                >
                  <Icon name="lucide:rotate-ccw" class="w-4 h-4" />
                  Restore
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  </div>
</template>
