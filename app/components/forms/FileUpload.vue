<script setup lang="ts">
import { ref, computed } from 'vue'
import { useDropZone } from '@vueuse/core'
import type { FormField } from '~/types/directus'
import { cn } from '~/utils/cn'

const props = defineProps<{
  field: FormField
  modelValue?: File | File[] | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: File | File[] | null]
}>()

const dropZoneRef = ref<HTMLElement | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const uploadProgress = ref<Record<string, number>>({})

const files = computed(() => {
  if (!props.modelValue) return []
  return Array.isArray(props.modelValue) ? props.modelValue : [props.modelValue]
})

const { isOverDropZone } = useDropZone(dropZoneRef, {
  onDrop: (droppedFiles) => {
    if (droppedFiles) {
      handleFiles(droppedFiles)
    }
    isDragging.value = false
  },
  onEnter: () => {
    isDragging.value = true
  },
  onLeave: () => {
    isDragging.value = false
  },
})

const allowedTypes = computed(() => {
  // Default allowed file types for accounting documents
  return '.pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png,.gif,.txt'
})

const handleFileInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files) {
    handleFiles(Array.from(target.files))
  }
}

const handleFiles = (newFiles: File[]) => {
  // Filter valid files
  const validFiles = newFiles.filter((file) => {
    // Check file size (default 10MB max)
    const maxSize = 10 * 1024 * 1024
    return file.size <= maxSize
  })

  if (validFiles.length > 0) {
    // For now, we'll just handle single file or multiple files
    emit('update:modelValue', validFiles.length === 1 ? validFiles[0] : validFiles)

    // Simulate upload progress
    validFiles.forEach((file) => {
      uploadProgress.value[file.name] = 0
      const interval = setInterval(() => {
        uploadProgress.value[file.name] += 10
        if (uploadProgress.value[file.name] >= 100) {
          clearInterval(interval)
        }
      }, 100)
    })
  }
}

const removeFile = (index: number) => {
  const currentFiles = [...files.value]
  const removed = currentFiles.splice(index, 1)[0]
  if (removed) {
    delete uploadProgress.value[removed.name]
  }
  emit('update:modelValue', currentFiles.length === 0 ? null : currentFiles.length === 1 ? currentFiles[0] : currentFiles)
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const getFileIcon = (type: string): string => {
  if (type.includes('pdf')) return 'lucide:file-text'
  if (type.includes('image')) return 'lucide:image'
  if (type.includes('spreadsheet') || type.includes('excel') || type.includes('csv')) return 'lucide:file-spreadsheet'
  if (type.includes('word') || type.includes('document')) return 'lucide:file-text'
  return 'lucide:file'
}

const openFilePicker = () => {
  fileInputRef.value?.click()
}
</script>

<template>
  <div class="space-y-2">
    <Label class="label-base">
      {{ field.label }}
      <span v-if="field.required" class="text-red-500 ml-0.5">*</span>
    </Label>

    <!-- Drop zone -->
    <div
      ref="dropZoneRef"
      :class="cn(
        'relative border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 cursor-pointer',
        isDragging || isOverDropZone
          ? 'border-primary-500 bg-primary-50'
          : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'
      )"
      @click="openFilePicker"
    >
      <input
        ref="fileInputRef"
        type="file"
        :accept="allowedTypes"
        multiple
        class="hidden"
        @change="handleFileInput"
      />

      <div class="flex flex-col items-center gap-2">
        <div class="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
          <Icon name="lucide:upload-cloud" class="w-6 h-6 text-primary-600" />
        </div>
        <div>
          <p class="text-sm font-medium text-slate-700">
            <span class="text-primary-600">Click to upload</span> or drag and drop
          </p>
          <p class="text-xs text-slate-500 mt-1">
            PDF, DOC, DOCX, XLS, XLSX, CSV, or images (max 10MB)
          </p>
        </div>
      </div>
    </div>

    <!-- Help text -->
    <p v-if="field.help_text" class="text-sm text-slate-500">
      {{ field.help_text }}
    </p>

    <!-- File list -->
    <div v-if="files.length > 0" class="space-y-2 mt-3">
      <div
        v-for="(file, index) in files"
        :key="file.name"
        class="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200"
      >
        <div class="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
          <Icon :name="getFileIcon(file.type)" class="w-5 h-5 text-slate-500" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-slate-700 truncate">{{ file.name }}</p>
          <p class="text-xs text-slate-500">{{ formatFileSize(file.size) }}</p>
          <!-- Progress bar -->
          <div
            v-if="uploadProgress[file.name] !== undefined && uploadProgress[file.name] < 100"
            class="mt-1 h-1 bg-slate-200 rounded-full overflow-hidden"
          >
            <div
              class="h-full bg-primary-500 transition-all duration-300"
              :style="{ width: `${uploadProgress[file.name]}%` }"
            />
          </div>
        </div>
        <button
          type="button"
          class="p-1.5 rounded-md hover:bg-slate-200 transition-colors"
          @click.stop="removeFile(index)"
        >
          <Icon name="lucide:x" class="w-4 h-4 text-slate-500" />
        </button>
      </div>
    </div>
  </div>
</template>
