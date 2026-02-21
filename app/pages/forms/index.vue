<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { format } from 'date-fns'

definePageMeta({
  middleware: 'auth',
  layout: 'forms',
})

useSeoMeta({
  title: 'My Forms - SJHAS, Inc.',
})

const { user } = useDirectusAuth()
const submissions = useDirectusItems('form_submissions')
const { list: listFiles, getUrl } = useDirectusFiles()

// State
const recentSubmissions = ref<any[]>([])
const recentFiles = ref<any[]>([])
const isLoading = ref(true)
const stats = ref({
  totalSubmissions: 0,
  totalFiles: 0,
  pendingReview: 0,
})

// Fetch dashboard data
onMounted(async () => {
  try {
    // Get user's submissions
    const userSubmissions = await submissions.list({
      filter: {
        submitter_email: { _eq: user.value?.email },
      },
      sort: ['-id'],
      limit: 5,
      fields: ['id', 'form.title', 'status', 'data'],
    })
    recentSubmissions.value = userSubmissions

    // Get user's files
    const userFiles = await listFiles({
      filter: {
        uploaded_by: { _eq: user.value?.id },
      },
      sort: ['-uploaded_on'],
      limit: 5,
      fields: ['id', 'filename_download', 'uploaded_on', 'type', 'filesize'],
    })
    recentFiles.value = userFiles as any[]

    // Calculate stats
    const allSubmissions = await submissions.count({
      submitter_email: { _eq: user.value?.email },
    })
    stats.value.totalSubmissions = allSubmissions
    stats.value.pendingReview = userSubmissions.filter(
      (s: any) => s.status === 'new'
    ).length
    stats.value.totalFiles = (userFiles as any[]).length
  } catch (error) {
    console.error('Failed to load dashboard data:', error)
  } finally {
    isLoading.value = false
  }
})

const formatDate = (date: string) => {
  return format(new Date(date), 'MMM d, yyyy')
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'new':
      return 'bg-blue-100 text-blue-700'
    case 'reviewed':
      return 'bg-green-100 text-green-700'
    case 'archived':
      return 'bg-slate-100 text-slate-700'
    default:
      return 'bg-slate-100 text-slate-700'
  }
}
</script>

<template>
  <div class="space-y-8">
    <!-- Welcome header -->
    <div>
      <h1 class="text-2xl font-semibold text-slate-900">
        Welcome back, {{ user?.first_name || 'Client' }}!
      </h1>
      <p class="text-slate-600 mt-1">
        Here's an overview of your account activity.
      </p>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card class="p-6">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center">
            <Icon name="lucide:file-text" class="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <p class="text-2xl font-bold text-slate-900">{{ stats.totalSubmissions }}</p>
            <p class="text-sm text-slate-500">Total Submissions</p>
          </div>
        </div>
      </Card>

      <Card class="p-6">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-lg bg-accent-100 flex items-center justify-center">
            <Icon name="lucide:folder" class="w-6 h-6 text-accent-600" />
          </div>
          <div>
            <p class="text-2xl font-bold text-slate-900">{{ stats.totalFiles }}</p>
            <p class="text-sm text-slate-500">Files Uploaded</p>
          </div>
        </div>
      </Card>

      <Card class="p-6">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
            <Icon name="lucide:clock" class="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p class="text-2xl font-bold text-slate-900">{{ stats.pendingReview }}</p>
            <p class="text-sm text-slate-500">Pending Review</p>
          </div>
        </div>
      </Card>
    </div>

    <!-- Quick Actions -->
    <Card class="p-6">
      <h2 class="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <NuxtLink
          to="/upload"
          class="flex items-center gap-3 p-4 rounded-lg border border-slate-200 hover:border-primary-200 hover:bg-primary-50 transition-colors"
        >
          <div class="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
            <Icon name="lucide:upload" class="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <p class="font-medium text-slate-900">Upload Documents</p>
            <p class="text-sm text-slate-500">Send files securely</p>
          </div>
        </NuxtLink>

        <NuxtLink
          to="/tax-planning"
          class="flex items-center gap-3 p-4 rounded-lg border border-slate-200 hover:border-primary-200 hover:bg-primary-50 transition-colors"
        >
          <div class="w-10 h-10 rounded-lg bg-accent-100 flex items-center justify-center">
            <Icon name="lucide:clipboard-list" class="w-5 h-5 text-accent-600" />
          </div>
          <div>
            <p class="font-medium text-slate-900">Tax Planning</p>
            <p class="text-sm text-slate-500">Complete questionnaire</p>
          </div>
        </NuxtLink>

        <a
          href="https://app.reclaim.ai/m/sjhas/quick-meeting"
          target="_blank"
          class="flex items-center gap-3 p-4 rounded-lg border border-slate-200 hover:border-primary-200 hover:bg-primary-50 transition-colors"
        >
          <div class="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
            <Icon name="lucide:calendar" class="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p class="font-medium text-slate-900">Book Appointment</p>
            <p class="text-sm text-slate-500">Schedule a meeting</p>
          </div>
        </a>
      </div>
    </Card>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Recent Submissions -->
      <Card>
        <CardHeader>
          <div class="flex items-center justify-between">
            <CardTitle>Recent Submissions</CardTitle>
            <NuxtLink
              to="/forms/submissions"
              class="text-sm text-primary-600 hover:text-primary-700"
            >
              View all →
            </NuxtLink>
          </div>
        </CardHeader>
        <CardContent>
          <div v-if="isLoading" class="space-y-3">
            <div v-for="i in 3" :key="i" class="h-16 bg-slate-100 rounded-lg animate-pulse" />
          </div>
          <div v-else-if="recentSubmissions.length === 0" class="text-center py-8 text-slate-500">
            <Icon name="lucide:inbox" class="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No submissions yet</p>
          </div>
          <div v-else class="space-y-3">
            <div
              v-for="submission in recentSubmissions"
              :key="submission.id"
              class="flex items-center justify-between p-3 rounded-lg bg-slate-50"
            >
              <div>
                <p class="font-medium text-slate-900">
                  {{ submission.form?.title || 'Form Submission' }}
                </p>
                <p class="text-sm text-slate-500">
                  Submission #{{ submission.id }}
                </p>
              </div>
              <span
                :class="[
                  'px-2 py-1 text-xs font-medium rounded-full',
                  getStatusColor(submission.status)
                ]"
              >
                {{ submission.status }}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Recent Files -->
      <Card>
        <CardHeader>
          <div class="flex items-center justify-between">
            <CardTitle>Recent Files</CardTitle>
            <NuxtLink
              to="/forms/files"
              class="text-sm text-primary-600 hover:text-primary-700"
            >
              View all →
            </NuxtLink>
          </div>
        </CardHeader>
        <CardContent>
          <div v-if="isLoading" class="space-y-3">
            <div v-for="i in 3" :key="i" class="h-16 bg-slate-100 rounded-lg animate-pulse" />
          </div>
          <div v-else-if="recentFiles.length === 0" class="text-center py-8 text-slate-500">
            <Icon name="lucide:folder-open" class="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No files uploaded yet</p>
          </div>
          <div v-else class="space-y-3">
            <a
              v-for="file in recentFiles"
              :key="file.id"
              :href="getUrl(file.id)"
              target="_blank"
              class="flex items-center gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <div class="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                <Icon name="lucide:file" class="w-5 h-5 text-slate-500" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-medium text-slate-900 truncate">
                  {{ file.filename_download }}
                </p>
                <p class="text-sm text-slate-500">
                  {{ formatFileSize(file.filesize) }} • {{ formatDate(file.uploaded_on) }}
                </p>
              </div>
              <Icon name="lucide:download" class="w-5 h-5 text-slate-400" />
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
