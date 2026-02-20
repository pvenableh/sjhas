<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { format } from 'date-fns'

definePageMeta({
  middleware: 'auth',
  layout: 'forms',
  title: 'My Files',
})

useSeoMeta({
  title: 'My Files - SJHAS, Inc.',
})

const { user } = useDirectusAuth()
const { list: listFiles, getUrl } = useDirectusFiles()

const files = ref<any[]>([])
const isLoading = ref(true)

onMounted(async () => {
  try {
    const result = await listFiles({
      filter: {
        uploaded_by: { _eq: user.value?.id },
      },
      sort: ['-uploaded_on'],
      fields: ['id', 'filename_download', 'uploaded_on', 'type', 'filesize'],
    })
    files.value = result as any[]
  } catch (error) {
    console.error('Failed to load files:', error)
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
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-semibold text-slate-900">My Files</h1>
      <p class="text-slate-600 mt-1">View all your uploaded files.</p>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="space-y-3">
      <div v-for="i in 5" :key="i" class="h-16 bg-slate-100 rounded-lg animate-pulse" />
    </div>

    <!-- Empty -->
    <Card v-else-if="files.length === 0" class="p-12 text-center">
      <Icon name="lucide:folder-open" class="w-12 h-12 mx-auto mb-3 text-slate-300" />
      <p class="text-slate-500">No files uploaded yet.</p>
    </Card>

    <!-- List -->
    <Card v-else>
      <div class="divide-y divide-slate-100">
        <a
          v-for="file in files"
          :key="file.id"
          :href="getUrl(file.id)"
          target="_blank"
          class="flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors"
        >
          <div class="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center">
            <Icon name="lucide:file" class="w-5 h-5 text-slate-500" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-medium text-slate-900 truncate">
              {{ file.filename_download }}
            </p>
            <p class="text-sm text-slate-500">
              {{ formatFileSize(file.filesize) }} &middot; {{ formatDate(file.uploaded_on) }}
            </p>
          </div>
          <Icon name="lucide:download" class="w-5 h-5 text-slate-400" />
        </a>
      </div>
    </Card>
  </div>
</template>
