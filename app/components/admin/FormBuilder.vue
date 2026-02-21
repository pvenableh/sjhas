<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useDraggable } from '@vueuse/core'
import type { FormField } from '~/types/directus'

const props = defineProps<{
  modelValue: FormField[]
}>()

const emit = defineEmits<{
  'update:modelValue': [fields: FormField[]]
}>()

// Available field types
const fieldTypes = [
  { type: 'text', label: 'Text Input', icon: 'lucide:type' },
  { type: 'email', label: 'Email', icon: 'lucide:mail' },
  { type: 'phone', label: 'Phone', icon: 'lucide:phone' },
  { type: 'number', label: 'Number', icon: 'lucide:hash' },
  { type: 'date', label: 'Date', icon: 'lucide:calendar' },
  { type: 'textarea', label: 'Long Text', icon: 'lucide:align-left' },
  { type: 'select', label: 'Dropdown', icon: 'lucide:chevron-down' },
  { type: 'checkbox', label: 'Checkbox', icon: 'lucide:check-square' },
  { type: 'radio', label: 'Radio Group', icon: 'lucide:circle-dot' },
  { type: 'file', label: 'File Upload', icon: 'lucide:upload' },
  { type: 'heading', label: 'Heading', icon: 'lucide:heading' },
  { type: 'paragraph', label: 'Paragraph', icon: 'lucide:pilcrow' },
]

// Local state
const fields = ref<FormField[]>([...props.modelValue])
const selectedFieldId = ref<string | null>(null)
const draggedFieldType = ref<string | null>(null)
const isSyncing = ref(false)

// Watch for external changes
watch(() => props.modelValue, (newValue) => {
  if (isSyncing.value) return
  fields.value = [...newValue]
}, { deep: true })

// Emit changes to parent without triggering circular updates
const emitFields = () => {
  isSyncing.value = true
  emit('update:modelValue', [...fields.value])
  nextTick(() => {
    isSyncing.value = false
  })
}

// Selected field
const selectedField = computed(() => {
  if (!selectedFieldId.value) return null
  return fields.value.find((f) => f.id === selectedFieldId.value) || null
})

// Generate unique ID
const generateId = () => `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

// Generate field name from label
const generateName = (label: string) => {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
}

// Add field
const addField = (type: string, index?: number) => {
  const fieldType = fieldTypes.find((f) => f.type === type)
  if (!fieldType) return

  const newField: FormField = {
    id: generateId(),
    type: type as FormField['type'],
    label: fieldType.label,
    name: generateName(fieldType.label + '_' + fields.value.length),
    placeholder: null,
    help_text: null,
    required: false,
    validation_rules: null,
    options: type === 'select' || type === 'radio' ? [
      { label: 'Option 1', value: 'option_1' },
      { label: 'Option 2', value: 'option_2' },
    ] : null,
    conditional_logic: null,
    width: 'full',
    sort: fields.value.length,
  }

  if (typeof index === 'number') {
    fields.value.splice(index, 0, newField)
  } else {
    fields.value.push(newField)
  }

  // Update sort order
  fields.value.forEach((f, i) => {
    f.sort = i
  })

  selectedFieldId.value = newField.id
  emitFields()
}

// Remove field
const removeField = (id: string) => {
  const index = fields.value.findIndex((f) => f.id === id)
  if (index > -1) {
    fields.value.splice(index, 1)
    if (selectedFieldId.value === id) {
      selectedFieldId.value = null
    }
    emitFields()
  }
}

// Duplicate field
const duplicateField = (id: string) => {
  const field = fields.value.find((f) => f.id === id)
  if (!field) return

  const index = fields.value.findIndex((f) => f.id === id)
  const newField: FormField = {
    ...JSON.parse(JSON.stringify(field)),
    id: generateId(),
    name: field.name + '_copy',
    sort: index + 1,
  }

  fields.value.splice(index + 1, 0, newField)
  fields.value.forEach((f, i) => {
    f.sort = i
  })

  selectedFieldId.value = newField.id
  emitFields()
}

// Move field
const moveField = (id: string, direction: 'up' | 'down') => {
  const index = fields.value.findIndex((f) => f.id === id)
  if (index === -1) return

  const newIndex = direction === 'up' ? index - 1 : index + 1
  if (newIndex < 0 || newIndex >= fields.value.length) return

  const temp = fields.value[index]
  fields.value[index] = fields.value[newIndex]
  fields.value[newIndex] = temp

  fields.value.forEach((f, i) => {
    f.sort = i
  })
  emitFields()
}

// Update field property
const updateField = (id: string, updates: Partial<FormField>) => {
  const field = fields.value.find((f) => f.id === id)
  if (field) {
    Object.assign(field, updates)
    emitFields()
  }
}

// Handle drag start from palette
const handleDragStart = (type: string) => {
  draggedFieldType.value = type
}

// Handle drop on canvas
const handleDrop = (event: DragEvent, index?: number) => {
  event.preventDefault()
  if (draggedFieldType.value) {
    addField(draggedFieldType.value, index)
    draggedFieldType.value = null
  }
}

// Handle drag over
const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
}

// Add option to select/radio field
const addOption = () => {
  if (!selectedField.value) return
  if (!selectedField.value.options) {
    selectedField.value.options = []
  }
  const optionNum = selectedField.value.options.length + 1
  selectedField.value.options.push({
    label: `Option ${optionNum}`,
    value: `option_${optionNum}`,
  })
  emitFields()
}

// Remove option
const removeOption = (index: number) => {
  if (!selectedField.value?.options) return
  selectedField.value.options.splice(index, 1)
  emitFields()
}
</script>

<template>
  <div class="flex h-[calc(100vh-10rem)] bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
    <!-- Field Palette -->
    <div class="w-64 border-r border-slate-200/80 bg-slate-50/60 overflow-y-auto">
      <div class="p-5">
        <h3 class="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">Add Fields</h3>
        <div class="space-y-1.5">
          <button
            v-for="fieldType in fieldTypes"
            :key="fieldType.type"
            draggable="true"
            class="flex items-center gap-3 w-full p-3 rounded-xl border border-slate-200/80 bg-white hover:border-primary-300 hover:bg-primary-50 transition-all duration-200 cursor-grab active:cursor-grabbing"
            @dragstart="handleDragStart(fieldType.type)"
            @click="addField(fieldType.type)"
          >
            <Icon :name="fieldType.icon" class="w-4 h-4 text-slate-400" />
            <span class="text-sm text-slate-600">{{ fieldType.label }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Form Canvas -->
    <div
      class="flex-1 overflow-y-auto p-8"
      @drop="handleDrop($event)"
      @dragover="handleDragOver"
    >
      <div v-if="fields.length === 0" class="h-full flex items-center justify-center">
        <div class="text-center">
          <Icon name="lucide:mouse-pointer-click" class="w-12 h-12 mx-auto text-slate-200 mb-5" />
          <p class="text-slate-400 text-sm">Drag fields here or click to add</p>
        </div>
      </div>

      <div v-else class="space-y-4 max-w-2xl mx-auto">
        <div
          v-for="(field, index) in fields"
          :key="field.id"
          :class="[
            'relative p-5 rounded-xl border-2 transition-all duration-200 cursor-pointer',
            selectedFieldId === field.id
              ? 'border-primary-500 bg-primary-50/30 shadow-sm'
              : 'border-slate-200/80 hover:border-slate-300'
          ]"
          @click="selectedFieldId = field.id"
        >
          <!-- Field preview -->
          <div class="pointer-events-none">
            <!-- Heading -->
            <template v-if="field.type === 'heading'">
              <h3 class="text-lg font-semibold text-slate-900">{{ field.label }}</h3>
              <p v-if="field.help_text" class="text-sm text-slate-500 mt-1">{{ field.help_text }}</p>
            </template>

            <!-- Paragraph -->
            <template v-else-if="field.type === 'paragraph'">
              <p class="text-slate-700">{{ field.label }}</p>
            </template>

            <!-- Other fields -->
            <template v-else>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">
                {{ field.label }}
                <span v-if="field.required" class="text-red-500 ml-0.5">*</span>
              </label>

              <!-- Text/Email/Phone/Number inputs -->
              <input
                v-if="['text', 'email', 'phone', 'number', 'date'].includes(field.type)"
                :type="field.type"
                :placeholder="field.placeholder || ''"
                disabled
                class="w-full h-10 rounded-lg border border-slate-300 bg-slate-50 px-3 text-sm"
              />

              <!-- Textarea -->
              <textarea
                v-else-if="field.type === 'textarea'"
                :placeholder="field.placeholder || ''"
                disabled
                class="w-full h-24 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm resize-none"
              />

              <!-- Select -->
              <select
                v-else-if="field.type === 'select'"
                disabled
                class="w-full h-10 rounded-lg border border-slate-300 bg-slate-50 px-3 text-sm"
              >
                <option>{{ field.placeholder || 'Select an option' }}</option>
              </select>

              <!-- Checkbox -->
              <div v-else-if="field.type === 'checkbox'" class="flex items-center gap-2">
                <div class="w-5 h-5 rounded border border-slate-300 bg-slate-50" />
                <span class="text-sm text-slate-700">{{ field.label }}</span>
              </div>

              <!-- Radio -->
              <div v-else-if="field.type === 'radio'" class="space-y-2">
                <div
                  v-for="option in field.options"
                  :key="option.value"
                  class="flex items-center gap-2"
                >
                  <div class="w-5 h-5 rounded-full border border-slate-300 bg-slate-50" />
                  <span class="text-sm text-slate-700">{{ option.label }}</span>
                </div>
              </div>

              <!-- File -->
              <div
                v-else-if="field.type === 'file'"
                class="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center"
              >
                <Icon name="lucide:upload-cloud" class="w-8 h-8 mx-auto text-slate-400 mb-2" />
                <p class="text-sm text-slate-500">Click to upload or drag and drop</p>
              </div>

              <p v-if="field.help_text" class="text-sm text-slate-500 mt-1.5">
                {{ field.help_text }}
              </p>
            </template>
          </div>

          <!-- Field actions -->
          <div
            v-if="selectedFieldId === field.id"
            class="absolute top-2 right-2 flex items-center gap-1"
          >
            <button
              class="p-1.5 rounded hover:bg-slate-200 transition-colors"
              title="Move up"
              @click.stop="moveField(field.id, 'up')"
            >
              <Icon name="lucide:chevron-up" class="w-4 h-4 text-slate-500" />
            </button>
            <button
              class="p-1.5 rounded hover:bg-slate-200 transition-colors"
              title="Move down"
              @click.stop="moveField(field.id, 'down')"
            >
              <Icon name="lucide:chevron-down" class="w-4 h-4 text-slate-500" />
            </button>
            <button
              class="p-1.5 rounded hover:bg-slate-200 transition-colors"
              title="Duplicate"
              @click.stop="duplicateField(field.id)"
            >
              <Icon name="lucide:copy" class="w-4 h-4 text-slate-500" />
            </button>
            <button
              class="p-1.5 rounded hover:bg-red-100 transition-colors"
              title="Delete"
              @click.stop="removeField(field.id)"
            >
              <Icon name="lucide:trash-2" class="w-4 h-4 text-red-500" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Field Settings Panel -->
    <div class="w-80 border-l border-slate-200/80 bg-white overflow-y-auto">
      <div v-if="!selectedField" class="p-8 text-center text-slate-400">
        <Icon name="lucide:settings-2" class="w-10 h-10 mx-auto text-slate-200 mb-5" />
        <p class="text-sm">Select a field to edit its settings</p>
      </div>

      <div v-else class="p-5 space-y-5">
        <h3 class="text-xs font-semibold text-slate-400 uppercase tracking-widest">Field Settings</h3>

        <!-- Label -->
        <div>
          <Label class="text-xs text-slate-500 mb-1">Label</Label>
          <Input
            :model-value="selectedField.label"
            @update:model-value="updateField(selectedField.id, { label: $event })"
          />
        </div>

        <!-- Name -->
        <div>
          <Label class="text-xs text-slate-500 mb-1">Field Name (ID)</Label>
          <Input
            :model-value="selectedField.name"
            @update:model-value="updateField(selectedField.id, { name: $event })"
          />
        </div>

        <!-- Placeholder -->
        <div v-if="!['heading', 'paragraph', 'checkbox', 'radio', 'file'].includes(selectedField.type)">
          <Label class="text-xs text-slate-500 mb-1">Placeholder</Label>
          <Input
            :model-value="selectedField.placeholder || ''"
            @update:model-value="updateField(selectedField.id, { placeholder: $event || null })"
          />
        </div>

        <!-- Help Text -->
        <div>
          <Label class="text-xs text-slate-500 mb-1">Help Text</Label>
          <Textarea
            :model-value="selectedField.help_text || ''"
            @update:model-value="updateField(selectedField.id, { help_text: $event || null })"
            class="h-20"
          />
        </div>

        <!-- Required -->
        <div v-if="!['heading', 'paragraph'].includes(selectedField.type)" class="flex items-center gap-2">
          <Checkbox
            :checked="selectedField.required"
            @update:checked="updateField(selectedField.id, { required: $event })"
          />
          <Label class="text-sm text-slate-700">Required field</Label>
        </div>

        <!-- Width -->
        <div>
          <Label class="text-xs text-slate-500 mb-1">Field Width</Label>
          <Select
            :model-value="selectedField.width"
            @update:model-value="updateField(selectedField.id, { width: $event as FormField['width'] })"
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="full">Full Width</SelectItem>
              <SelectItem value="half">Half Width</SelectItem>
              <SelectItem value="third">One Third</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- Options for select/radio -->
        <div v-if="['select', 'radio'].includes(selectedField.type)">
          <Label class="text-xs text-slate-500 mb-2">Options</Label>
          <div class="space-y-2">
            <div
              v-for="(option, index) in selectedField.options"
              :key="index"
              class="flex items-center gap-2"
            >
              <Input
                :model-value="option.label"
                @update:model-value="selectedField.options![index].label = $event; selectedField.options![index].value = generateName($event)"
                class="flex-1"
              />
              <button
                class="p-2 rounded hover:bg-red-100 transition-colors"
                @click="removeOption(index)"
              >
                <Icon name="lucide:x" class="w-4 h-4 text-red-500" />
              </button>
            </div>
            <Button variant="secondary" size="sm" class="w-full" @click="addOption">
              <Icon name="lucide:plus" class="w-4 h-4" />
              Add Option
            </Button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
