<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { toast } from 'vue-sonner'
import type { Form, FormSubmission } from '~/types/directus'

definePageMeta({
  middleware: 'auth',
  layout: 'admin',
})

useSeoMeta({
  title: 'Dashboard - Admin - SJHAS, Inc.',
})

const forms = useDirectusItems<Form>('forms')
const submissions = useDirectusItems<FormSubmission>('form_submissions')

const isLoading = ref(true)
const stats = ref({
  totalForms: 0,
  publishedForms: 0,
  totalSubmissions: 0,
  newSubmissions: 0,
})
const recentSubmissions = ref<any[]>([])

const fetchDashboardData = async () => {
  isLoading.value = true
  try {
    const [formsList, submissionsList] = await Promise.all([
      forms.list({ fields: ['id', 'status'], limit: -1 }),
      submissions.list({
        sort: ['-id'],
        fields: ['id', 'form.id', 'form.title', 'status', 'submitter_name', 'submitter_email'],
        limit: 5,
      }),
    ])

    stats.value = {
      totalForms: formsList.length,
      publishedForms: formsList.filter((f) => f.status === 'published').length,
      totalSubmissions: submissionsList.length,
      newSubmissions: submissionsList.filter((s) => s.status === 'new').length,
    }

    recentSubmissions.value = submissionsList
  } catch (error) {
    console.error('Failed to load dashboard data:', error)
    toast.error('Failed to load dashboard data')
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchDashboardData)

const getStatusColor = (status: string) => {
  switch (status) {
    case 'new': return 'bg-blue-100 text-blue-700'
    case 'reviewed': return 'bg-green-100 text-green-700'
    case 'archived': return 'bg-slate-100 text-slate-700'
    default: return 'bg-slate-100 text-slate-700'
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-semibold text-slate-900">Dashboard</h1>
      <p class="text-slate-600 mt-1">Overview of your forms and submissions</p>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div v-for="i in 4" :key="i" class="h-28 bg-white rounded-xl border border-slate-200 animate-pulse" />
    </div>

    <template v-else>
      <!-- Stats cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card class="p-5">
          <div class="flex items-center gap-4">
            <div class="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
              <Icon name="lucide:file-text" class="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p class="text-2xl font-semibold text-slate-900">{{ stats.totalForms }}</p>
              <p class="text-sm text-slate-500">Total Forms</p>
            </div>
          </div>
        </Card>

        <Card class="p-5">
          <div class="flex items-center gap-4">
            <div class="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Icon name="lucide:check-circle" class="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p class="text-2xl font-semibold text-slate-900">{{ stats.publishedForms }}</p>
              <p class="text-sm text-slate-500">Published</p>
            </div>
          </div>
        </Card>

        <Card class="p-5">
          <div class="flex items-center gap-4">
            <div class="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Icon name="lucide:inbox" class="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p class="text-2xl font-semibold text-slate-900">{{ stats.totalSubmissions }}</p>
              <p class="text-sm text-slate-500">Submissions</p>
            </div>
          </div>
        </Card>

        <Card class="p-5">
          <div class="flex items-center gap-4">
            <div class="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
              <Icon name="lucide:bell" class="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p class="text-2xl font-semibold text-slate-900">{{ stats.newSubmissions }}</p>
              <p class="text-sm text-slate-500">New / Unreviewed</p>
            </div>
          </div>
        </Card>
      </div>

      <!-- Quick actions + Recent submissions -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Quick Actions -->
        <Card class="p-6">
          <h2 class="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
          <div class="space-y-3">
            <NuxtLink
              to="/admin/forms/new"
              class="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-primary-200 hover:bg-primary-50 transition-colors"
            >
              <div class="w-9 h-9 rounded-lg bg-primary-100 flex items-center justify-center">
                <Icon name="lucide:plus" class="w-4 h-4 text-primary-600" />
              </div>
              <div>
                <p class="text-sm font-medium text-slate-900">Create Form</p>
                <p class="text-xs text-slate-500">Build a new custom form</p>
              </div>
            </NuxtLink>

            <NuxtLink
              to="/admin/submissions"
              class="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-primary-200 hover:bg-primary-50 transition-colors"
            >
              <div class="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
                <Icon name="lucide:inbox" class="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p class="text-sm font-medium text-slate-900">View Submissions</p>
                <p class="text-xs text-slate-500">Review form responses</p>
              </div>
            </NuxtLink>

            <NuxtLink
              to="/admin/chat"
              class="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-primary-200 hover:bg-primary-50 transition-colors"
            >
              <div class="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center">
                <Icon name="lucide:message-circle" class="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p class="text-sm font-medium text-slate-900">Chat Dashboard</p>
                <p class="text-xs text-slate-500">Manage visitor conversations</p>
              </div>
            </NuxtLink>
          </div>
        </Card>

        <!-- Recent Submissions -->
        <Card class="p-6 lg:col-span-2">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-slate-900">Recent Submissions</h2>
            <NuxtLink to="/admin/submissions" class="text-sm text-primary-600 hover:text-primary-700 font-medium">
              View all
            </NuxtLink>
          </div>

          <div v-if="recentSubmissions.length === 0" class="text-center py-8">
            <Icon name="lucide:inbox" class="w-10 h-10 mx-auto text-slate-300 mb-3" />
            <p class="text-sm text-slate-500">No submissions yet</p>
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="sub in recentSubmissions"
              :key="sub.id"
              class="flex items-center justify-between p-3 rounded-lg bg-slate-50"
            >
              <div class="flex items-center gap-3 min-w-0">
                <div class="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                  <Icon name="lucide:file-text" class="w-4 h-4 text-primary-600" />
                </div>
                <div class="min-w-0">
                  <p class="text-sm font-medium text-slate-900 truncate">
                    {{ sub.submitter_name || sub.submitter_email || 'Anonymous' }}
                  </p>
                  <p class="text-xs text-slate-500 truncate">{{ sub.form?.title || 'Unknown Form' }}</p>
                </div>
              </div>
              <span
                :class="['px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0', getStatusColor(sub.status)]"
              >
                {{ sub.status }}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </template>
  </div>
</template>
