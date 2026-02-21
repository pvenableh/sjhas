<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { format } from 'date-fns'
import { toast } from 'vue-sonner'

definePageMeta({
  middleware: 'auth',
  layout: 'admin',
})

useSeoMeta({
  title: 'Files - Admin - SJHAS, Inc.',
})

const config = useRuntimeConfig()
const { list: listFiles } = useDirectusFiles()

const files = ref<any[]>([])
const isLoading = ref(true)
const searchQuery = ref('')
const selectedType = ref<string>('all')

const fetchFiles = async () => {
  isLoading.value = true
  try {
    const result = await listFiles({
      sort: ['-uploaded_on'],
      fields: ['id', 'filename_download', 'uploaded_on', 'type', 'filesize', 'uploaded_by.id', 'uploaded_by.first_name', 'uploaded_by.last_name', 'uploaded_by.email'],
      limit: -1,
    })
    files.value = result as any[]
  } catch (error) {
    console.error('Failed to fetch files:', error)
    toast.error('Failed to load files')
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchFiles)

const filteredFiles = computed(() => {
  let result = files.value

  if (selectedType.value !== 'all') {
    result = result.filter((f) => {
      if (selectedType.value === 'images') return f.type?.startsWith('image/')
      if (selectedType.value === 'documents') return f.type?.includes('pdf') || f.type?.includes('document') || f.type?.includes('spreadsheet') || f.type?.includes('text/')
      return true
    })
  }

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(
      (f) =>
        f.filename_download?.toLowerCase().includes(q) ||
        f.uploaded_by?.first_name?.toLowerCase().includes(q) ||
        f.uploaded_by?.last_name?.toLowerCase().includes(q) ||
        f.uploaded_by?.email?.toLowerCase().includes(q)
    )
  }

  return result
})

const formatDate = (date: string | null) => {
  if (!date) return '—'
  return format(new Date(date), 'MMM d, yyyy h:mm a')
}

const formatFileSize = (bytes: number | null) => {
  if (!bytes) return '—'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

const getFileIcon = (type: string | null) => {
  if (!type) return 'lucide:file'
  if (type.startsWith('image/')) return 'lucide:image'
  if (type.includes('pdf')) return 'lucide:file-text'
  if (type.includes('spreadsheet') || type.includes('csv')) return 'lucide:file-spreadsheet'
  if (type.includes('document') || type.includes('word')) return 'lucide:file-text'
  return 'lucide:file'
}

const getUploaderName = (file: any) => {
  if (!file.uploaded_by) return 'System'
  const name = [file.uploaded_by.first_name, file.uploaded_by.last_name].filter(Boolean).join(' ')
  return name || file.uploaded_by.email || 'Unknown'
}

const getAssetUrl = (fileId: string) => {
  return `${config.public.directus.url}/assets/${fileId}`
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900">Files</h1>
        <p class="text-slate-600 mt-1">View all uploaded files across clients</p>
      </div>
      <Button variant="secondary" @click="fetchFiles">
        <Icon name="lucide:refresh-cw" class="w-4 h-4" />
        Refresh
      </Button>
    </div>

    <!-- Search and filter -->
    <Card class="p-4">
      <div class="flex flex-col sm:flex-row gap-4">
        <div class="relative flex-1">
          <Icon name="lucide:search" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input v-model="searchQuery" placeholder="Search files by name or uploader..." class="pl-10" />
        </div>
        <select
          v-model="selectedType"
          class="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 bg-white"
        >
          <option value="all">All Types</option>
          <option value="documents">Documents</option>
          <option value="images">Images</option>
        </select>
      </div>
    </Card>

    <!-- Stats -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Card class="p-4">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-primary-100 flex items-center justify-center">
            <Icon name="lucide:folder" class="w-4 h-4 text-primary-600" />
          </div>
          <div>
            <p class="text-xl font-semibold text-slate-900">{{ files.length }}</p>
            <p class="text-xs text-slate-500">Total Files</p>
          </div>
        </div>
      </Card>
      <Card class="p-4">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
            <Icon name="lucide:file-text" class="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p class="text-xl font-semibold text-slate-900">{{ files.filter(f => f.type?.includes('pdf') || f.type?.includes('document')).length }}</p>
            <p class="text-xs text-slate-500">Documents</p>
          </div>
        </div>
      </Card>
      <Card class="p-4">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center">
            <Icon name="lucide:image" class="w-4 h-4 text-green-600" />
          </div>
          <div>
            <p class="text-xl font-semibold text-slate-900">{{ files.filter(f => f.type?.startsWith('image/')).length }}</p>
            <p class="text-xs text-slate-500">Images</p>
          </div>
        </div>
      </Card>
    </div>

    <!-- Files list -->
    <Card>
      <div v-if="isLoading" class="p-8">
        <div class="space-y-4">
          <div v-for="i in 5" :key="i" class="h-16 bg-slate-100 rounded-lg animate-pulse" />
        </div>
      </div>

      <div v-else-if="filteredFiles.length === 0" class="p-8 text-center">
        <Icon name="lucide:folder-open" class="w-12 h-12 mx-auto text-slate-300 mb-4" />
        <p class="text-slate-500">
          {{ searchQuery || selectedType !== 'all' ? 'No files match your filters' : 'No files uploaded yet' }}
        </p>
      </div>

      <div v-else class="divide-y divide-slate-200">
        <a
          v-for="file in filteredFiles"
          :key="file.id"
          :href="getAssetUrl(file.id)"
          target="_blank"
          class="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors"
        >
          <div class="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0">
            <Icon :name="getFileIcon(file.type)" class="w-5 h-5 text-slate-500" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-medium text-slate-900 truncate">{{ file.filename_download }}</p>
            <div class="flex items-center gap-3 mt-0.5 text-sm text-slate-500">
              <span>{{ formatFileSize(file.filesize) }}</span>
              <span>&middot;</span>
              <span>{{ getUploaderName(file) }}</span>
              <span>&middot;</span>
              <span>{{ formatDate(file.uploaded_on) }}</span>
            </div>
          </div>
          <Icon name="lucide:download" class="w-5 h-5 text-slate-400 flex-shrink-0" />
        </a>
      </div>
    </Card>
  </div>
</template>
