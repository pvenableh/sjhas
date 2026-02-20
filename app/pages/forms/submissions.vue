<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { format } from 'date-fns'

definePageMeta({
  middleware: 'auth',
  layout: 'forms',
  title: 'My Submissions',
})

useSeoMeta({
  title: 'My Submissions - SJHAS, Inc.',
})

const { user } = useDirectusAuth()
const submissions = useDirectusItems('form_submissions')

const items = ref<any[]>([])
const isLoading = ref(true)

onMounted(async () => {
  try {
    items.value = await submissions.list({
      filter: {
        submitter_email: { _eq: user.value?.email },
      },
      sort: ['-date_created'],
      fields: ['id', 'date_created', 'form.title', 'status', 'data'],
    })
  } catch (error) {
    console.error('Failed to load submissions:', error)
  } finally {
    isLoading.value = false
  }
})

const formatDate = (date: string) => {
  return format(new Date(date), 'MMM d, yyyy')
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
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-semibold text-slate-900">My Submissions</h1>
      <p class="text-slate-600 mt-1">View all your form submissions.</p>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="space-y-3">
      <div v-for="i in 5" :key="i" class="h-16 bg-slate-100 rounded-lg animate-pulse" />
    </div>

    <!-- Empty -->
    <Card v-else-if="items.length === 0" class="p-12 text-center">
      <Icon name="lucide:inbox" class="w-12 h-12 mx-auto mb-3 text-slate-300" />
      <p class="text-slate-500">No submissions yet.</p>
    </Card>

    <!-- List -->
    <Card v-else>
      <div class="divide-y divide-slate-100">
        <div
          v-for="submission in items"
          :key="submission.id"
          class="flex items-center justify-between p-4"
        >
          <div>
            <p class="font-medium text-slate-900">
              {{ submission.form?.title || 'Form Submission' }}
            </p>
            <p class="text-sm text-slate-500">
              {{ formatDate(submission.date_created) }}
            </p>
          </div>
          <span
            :class="[
              'px-2.5 py-1 text-xs font-medium rounded-full',
              getStatusColor(submission.status)
            ]"
          >
            {{ submission.status }}
          </span>
        </div>
      </div>
    </Card>
  </div>
</template>
