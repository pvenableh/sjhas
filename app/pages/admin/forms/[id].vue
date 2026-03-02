<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { toast } from 'vue-sonner'
import type { Form, FormField, FormStepConfig } from '~/types/directus'

const route = useRoute()
const router = useRouter()

const isNew = computed(() => route.params.id === 'new')

definePageMeta({
  middleware: 'auth',
  layout: 'admin',
})

useSeoMeta({
  title: computed(() => isNew.value ? 'Create Form' : 'Edit Form') as any,
})

const forms = useDirectusItems<Form>('forms')

// Form state
const formData = ref<Partial<Form>>({
  title: '',
  slug: '',
  description: '',
  status: 'draft',
  success_message: 'Thank you for your submission!',
  notify_email: '',
  notify_on_submission: true,
  allow_file_uploads: true,
  max_file_size_mb: 10,
  allowed_file_types: '.pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png',
  fields: [],
})

const isLoading = ref(false)
const isSaving = ref(false)
const activeTab = ref<'builder' | 'settings' | 'preview'>('builder')

// Load form data
onMounted(async () => {
  if (!isNew.value) {
    isLoading.value = true
    try {
      const form = await forms.get(route.params.id as string)
      formData.value = form
    } catch (error) {
      toast.error('Failed to load form')
      router.push('/admin/forms')
    } finally {
      isLoading.value = false
    }
  }
})

// Auto-generate slug from title
watch(() => formData.value.title, (newTitle) => {
  if (isNew.value && newTitle) {
    formData.value.slug = newTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }
})

// Save form
const saveForm = async (publish = false) => {
  if (!formData.value.title) {
    toast.error('Please enter a form title')
    return
  }

  if (!formData.value.slug) {
    toast.error('Please enter a form slug')
    return
  }

  isSaving.value = true

  try {
    const data = {
      ...formData.value,
      status: publish ? 'published' : formData.value.status,
    }

    if (isNew.value) {
      const created = await forms.create(data as any)
      toast.success('Form created successfully')
      router.push(`/admin/forms/${created.id}`)
    } else {
      await forms.update(route.params.id as string, data as any)
      toast.success('Form saved successfully')
    }
  } catch (error: any) {
    toast.error(error.message || 'Failed to save form')
  } finally {
    isSaving.value = false
  }
}

// Preview form
const previewForm = () => {
  activeTab.value = 'preview'
}

// Steps configuration
const isMultiStepEnabled = computed({
  get: () => Array.isArray(formData.value.steps) && formData.value.steps.length > 0,
  set: (enabled: boolean) => {
    if (enabled) {
      const maxSort = (formData.value.fields || []).reduce((max, f) => Math.max(max, f.sort), 0)
      formData.value.steps = [{
        label: 'Step 1',
        fieldRange: [0, maxSort] as [number, number],
        condition: null,
      }]
    } else {
      formData.value.steps = null
    }
  },
})

const addStep = () => {
  if (!formData.value.steps) formData.value.steps = []
  const prevStep = formData.value.steps[formData.value.steps.length - 1]
  const startSort = prevStep ? prevStep.fieldRange[1] + 1 : 0
  formData.value.steps.push({
    label: `Step ${formData.value.steps.length + 1}`,
    fieldRange: [startSort, startSort + 99] as [number, number],
    condition: null,
  })
}

const removeStep = (index: number) => {
  if (!formData.value.steps) return
  formData.value.steps.splice(index, 1)
  if (formData.value.steps.length === 0) {
    formData.value.steps = null
  }
}

const updateStep = (index: number, updates: Partial<FormStepConfig>) => {
  if (!formData.value.steps?.[index]) return
  Object.assign(formData.value.steps[index], updates)
}

const toggleStepCondition = (index: number, enabled: boolean) => {
  if (!formData.value.steps?.[index]) return
  if (enabled) {
    formData.value.steps[index].condition = { field: '', operator: 'equals', value: '' }
  } else {
    formData.value.steps[index].condition = null
  }
}

// Available form fields for step conditions (excludes headings/paragraphs)
const conditionFields = computed(() => {
  return (formData.value.fields || []).filter(
    (f) => f.type !== 'heading' && f.type !== 'paragraph'
  )
})

// Get available values for condition field
const getConditionFieldValues = (fieldName: string): Array<{ label: string; value: string }> => {
  const f = (formData.value.fields || []).find((field) => field.name === fieldName)
  if (!f) return []
  if (f.type === 'checkbox') {
    return [{ label: 'Checked (true)', value: 'true' }, { label: 'Unchecked (false)', value: 'false' }]
  }
  if (f.options && f.options.length > 0) {
    return f.options
  }
  return []
}

// Convert steps to the format DynamicForm expects
const previewSteps = computed(() => {
  if (!formData.value.steps || formData.value.steps.length === 0) return undefined
  return formData.value.steps.map((step) => ({
    label: step.label,
    icon: step.icon,
    fieldRange: step.fieldRange,
    condition: step.condition && step.condition.field ? step.condition : undefined,
  }))
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div class="flex items-center gap-4">
        <NuxtLink
          to="/admin/forms"
          class="p-2 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <Icon name="lucide:arrow-left" class="w-5 h-5 text-slate-600" />
        </NuxtLink>
        <div>
          <h1 class="text-2xl font-semibold text-slate-900">
            {{ isNew ? 'Create Form' : formData.title || 'Edit Form' }}
          </h1>
          <p v-if="!isNew && formData.slug" class="text-slate-500 text-sm">
            /{{ formData.slug }}
          </p>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <Button variant="secondary" :disabled="isSaving" @click="previewForm">
          <Icon name="lucide:eye" class="w-4 h-4" />
          Preview
        </Button>
        <Button variant="secondary" :disabled="isSaving" @click="saveForm(false)">
          <Icon v-if="isSaving" name="lucide:loader-2" class="w-4 h-4 animate-spin" />
          Save Draft
        </Button>
        <Button :disabled="isSaving" @click="saveForm(true)">
          <Icon v-if="isSaving" name="lucide:loader-2" class="w-4 h-4 animate-spin" />
          {{ formData.status === 'published' ? 'Update' : 'Publish' }}
        </Button>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="isLoading" class="h-96 flex items-center justify-center">
      <Icon name="lucide:loader-2" class="w-8 h-8 animate-spin text-primary-600" />
    </div>

    <template v-else>
      <!-- Tabs -->
      <div class="border-b border-slate-200">
        <nav class="flex gap-6">
          <button
            :class="[
              'py-3 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'builder'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            ]"
            @click="activeTab = 'builder'"
          >
            Form Builder
          </button>
          <button
            :class="[
              'py-3 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'settings'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            ]"
            @click="activeTab = 'settings'"
          >
            Settings
          </button>
          <button
            :class="[
              'py-3 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'preview'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            ]"
            @click="activeTab = 'preview'"
          >
            Preview
          </button>
        </nav>
      </div>

      <!-- Tab content -->
      <div v-show="activeTab === 'builder'">
        <AdminFormBuilder v-model="formData.fields as FormField[]" />
      </div>

      <div v-show="activeTab === 'settings'" class="max-w-2xl space-y-6">
        <Card class="p-6 space-y-6">
          <div>
            <h3 class="text-lg font-semibold text-slate-900 mb-4">Basic Settings</h3>
            <div class="space-y-4">
              <div>
                <Label class="mb-1.5">Form Title</Label>
                <Input v-model="formData.title" placeholder="e.g., Tax Planning Questionnaire" />
              </div>

              <div>
                <Label class="mb-1.5">URL Slug</Label>
                <div class="flex items-center gap-2">
                  <span class="text-slate-500">/f/</span>
                  <Input v-model="formData.slug" placeholder="tax-planning" />
                </div>
                <p class="text-sm text-slate-500 mt-1">
                  This will be the URL: {{ formData.slug ? `/f/${formData.slug}` : '/f/your-form-slug' }}
                </p>
              </div>

              <div>
                <Label class="mb-1.5">Description</Label>
                <Textarea
                  v-model="formData.description"
                  placeholder="Brief description shown at the top of the form..."
                />
              </div>

              <div>
                <Label class="mb-1.5">Success Message</Label>
                <Textarea
                  v-model="formData.success_message"
                  placeholder="Message shown after successful submission..."
                />
              </div>
            </div>
          </div>

          <hr class="border-slate-200" />

          <div>
            <h3 class="text-lg font-semibold text-slate-900 mb-4">Notifications</h3>
            <div class="space-y-4">
              <div class="flex items-center gap-2">
                <Checkbox
                  :checked="formData.notify_on_submission"
                  @update:checked="formData.notify_on_submission = $event"
                />
                <Label>Send email notification on new submissions</Label>
              </div>

              <div v-if="formData.notify_on_submission">
                <Label class="mb-1.5">Notification Email</Label>
                <Input
                  v-model="formData.notify_email"
                  type="email"
                  placeholder="email@example.com"
                />
                <p class="text-sm text-slate-500 mt-1">
                  Leave blank to use the default notification email.
                </p>
              </div>
            </div>
          </div>

          <hr class="border-slate-200" />

          <div>
            <h3 class="text-lg font-semibold text-slate-900 mb-4">File Uploads</h3>
            <div class="space-y-4">
              <div class="flex items-center gap-2">
                <Checkbox
                  :checked="formData.allow_file_uploads"
                  @update:checked="formData.allow_file_uploads = $event"
                />
                <Label>Allow file uploads</Label>
              </div>

              <div v-if="formData.allow_file_uploads" class="pl-6 space-y-4">
                <div>
                  <Label class="mb-1.5">Maximum File Size (MB)</Label>
                  <Input
                    v-model.number="formData.max_file_size_mb"
                    type="number"
                    min="1"
                    max="50"
                  />
                </div>

                <div>
                  <Label class="mb-1.5">Allowed File Types</Label>
                  <Input
                    v-model="formData.allowed_file_types"
                    placeholder=".pdf,.doc,.docx,.jpg,.png"
                  />
                  <p class="text-sm text-slate-500 mt-1">
                    Comma-separated list of file extensions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <!-- Steps Configuration -->
        <Card class="p-6 space-y-6">
          <div>
            <div class="flex items-center justify-between mb-4">
              <div>
                <h3 class="text-lg font-semibold text-slate-900">Multi-Step Form</h3>
                <p class="text-sm text-slate-500 mt-1">Split the form into multiple steps with optional conditional visibility.</p>
              </div>
              <Switch
                :checked="isMultiStepEnabled"
                @update:checked="isMultiStepEnabled = $event"
              />
            </div>

            <div v-if="isMultiStepEnabled && formData.steps" class="space-y-4">
              <div
                v-for="(step, index) in formData.steps"
                :key="index"
                class="border border-slate-200 rounded-xl p-4 space-y-4"
              >
                <div class="flex items-center justify-between">
                  <span class="text-xs font-semibold text-slate-400 uppercase tracking-widest">Step {{ index + 1 }}</span>
                  <button
                    v-if="formData.steps!.length > 1"
                    class="p-1.5 rounded hover:bg-red-100 transition-colors"
                    title="Remove step"
                    @click="removeStep(index)"
                  >
                    <Icon name="lucide:trash-2" class="w-4 h-4 text-red-500" />
                  </button>
                </div>

                <!-- Step label -->
                <div>
                  <Label class="text-xs text-slate-500 mb-1">Step Label</Label>
                  <Input
                    :model-value="step.label"
                    @update:model-value="updateStep(index, { label: $event })"
                    placeholder="e.g., Personal Information"
                  />
                </div>

                <!-- Field sort range -->
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <Label class="text-xs text-slate-500 mb-1">Field Sort From</Label>
                    <Input
                      :model-value="step.fieldRange[0]"
                      type="number"
                      min="0"
                      @update:model-value="updateStep(index, { fieldRange: [Number($event), step.fieldRange[1]] })"
                    />
                  </div>
                  <div>
                    <Label class="text-xs text-slate-500 mb-1">Field Sort To</Label>
                    <Input
                      :model-value="step.fieldRange[1]"
                      type="number"
                      min="0"
                      @update:model-value="updateStep(index, { fieldRange: [step.fieldRange[0], Number($event)] })"
                    />
                  </div>
                </div>
                <p class="text-xs text-slate-400">
                  Fields with sort values {{ step.fieldRange[0] }}–{{ step.fieldRange[1] }} will appear in this step.
                </p>

                <!-- Step condition -->
                <div class="border-t border-slate-100 pt-4">
                  <div class="flex items-center justify-between mb-3">
                    <Label class="text-xs text-slate-500">Conditional Visibility</Label>
                    <Switch
                      :checked="!!step.condition"
                      @update:checked="toggleStepCondition(index, $event)"
                    />
                  </div>

                  <div v-if="step.condition" class="space-y-3 bg-slate-50 rounded-lg p-3">
                    <p class="text-xs text-slate-500">Show this step when:</p>

                    <!-- Source field -->
                    <Select
                      :model-value="step.condition.field"
                      @update:model-value="step.condition!.field = $event; step.condition!.value = ''"
                    >
                      <SelectTrigger class="text-xs">
                        <SelectValue placeholder="Select a field..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem
                          v-for="f in conditionFields"
                          :key="f.id"
                          :value="f.name"
                        >
                          {{ f.label }}
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    <!-- Operator -->
                    <Select
                      :model-value="step.condition.operator"
                      @update:model-value="step.condition!.operator = $event as any"
                    >
                      <SelectTrigger class="text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="equals">equals</SelectItem>
                        <SelectItem value="not_equals">does not equal</SelectItem>
                        <SelectItem value="includes">includes</SelectItem>
                      </SelectContent>
                    </Select>

                    <!-- Value -->
                    <template v-if="step.condition.field">
                      <Select
                        v-if="getConditionFieldValues(step.condition.field).length > 0"
                        :model-value="step.condition.value"
                        @update:model-value="step.condition!.value = $event"
                      >
                        <SelectTrigger class="text-xs">
                          <SelectValue placeholder="Select a value..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem
                            v-for="opt in getConditionFieldValues(step.condition.field)"
                            :key="opt.value"
                            :value="opt.value"
                          >
                            {{ opt.label }}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        v-else
                        :model-value="step.condition.value"
                        @update:model-value="step.condition!.value = $event"
                        placeholder="Enter a value..."
                        class="text-xs"
                      />
                    </template>
                  </div>
                </div>
              </div>

              <Button variant="secondary" size="sm" class="w-full" @click="addStep">
                <Icon name="lucide:plus" class="w-4 h-4" />
                Add Step
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <div v-show="activeTab === 'preview'" class="max-w-2xl mx-auto">
        <Card class="p-6">
          <div class="mb-6">
            <h2 class="text-2xl font-semibold text-slate-900">{{ formData.title || 'Untitled Form' }}</h2>
            <p v-if="formData.description" class="text-slate-600 mt-2">
              {{ formData.description }}
            </p>
          </div>

          <FormsDynamicForm
            v-if="formData.fields && formData.fields.length > 0"
            :form="formData as Form"
            :steps="previewSteps"
            @submitted="toast.success('Preview: Form would be submitted')"
          />

          <div v-else class="text-center py-12 text-slate-500">
            <Icon name="lucide:file-x" class="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <p>Add fields to preview the form</p>
          </div>
        </Card>
      </div>
    </template>
  </div>
</template>
