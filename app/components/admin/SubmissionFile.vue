<script setup lang="ts">
// One uploaded file row with inline preview for images and PDFs.
// Files are served by the authenticated /api/files/[id] proxy.
const props = defineProps<{
  file: { file_id: string; filename: string }
}>()

const open = ref(false)

const kind = computed<'image' | 'pdf' | null>(() => {
  const ext = props.file.filename?.split('.').pop()?.toLowerCase() || ''
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'avif'].includes(ext)) return 'image'
  if (ext === 'pdf') return 'pdf'
  return null
})

const src = computed(() => `/api/files/${props.file.file_id}`)
</script>

<template>
  <div class="bg-white rounded-lg border border-slate-200">
    <div class="flex items-center gap-3 p-3">
      <Icon
        :name="kind === 'image' ? 'lucide:image' : 'lucide:file'"
        class="w-5 h-5 text-slate-400 flex-shrink-0"
      />
      <span class="text-sm text-slate-700 flex-1 min-w-0 break-all">{{ file.filename }}</span>
      <button
        v-if="kind"
        type="button"
        class="text-sm text-primary-600 hover:text-primary-700"
        :aria-expanded="open"
        @click="open = !open"
      >
        {{ open ? 'Hide preview' : 'Preview' }}
      </button>
      <a :href="src" target="_blank" rel="noopener" class="text-sm text-primary-600 hover:text-primary-700">
        View
      </a>
      <a :href="`${src}?download=1`" class="text-sm text-primary-600 hover:text-primary-700">
        Download
      </a>
    </div>
    <div v-if="open && kind" class="border-t border-slate-200 p-3 bg-slate-50">
      <img
        v-if="kind === 'image'"
        :src="src"
        :alt="file.filename"
        class="max-h-[600px] max-w-full mx-auto rounded"
        loading="lazy"
      />
      <iframe
        v-else
        :src="src"
        :title="`Preview of ${file.filename}`"
        class="w-full h-[600px] rounded bg-white"
      />
    </div>
  </div>
</template>
