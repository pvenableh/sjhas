<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import * as z from 'zod'
import { gsap } from 'gsap'
import type { Form, FormField } from '~/types/directus'

const props = defineProps<{
  form: Form
}>()

const emit = defineEmits<{
  submitted: [data: Record<string, unknown>]
}>()

// Build Zod schema from form fields
const buildValidationSchema = (fields: FormField[]) => {
  const schemaShape: Record<string, z.ZodTypeAny> = {}

  fields.forEach((field) => {
    if (field.type === 'heading' || field.type === 'paragraph') {
      return
    }

    let fieldSchema: z.ZodTypeAny

    switch (field.type) {
      case 'email':
        fieldSchema = z.string().email('Please enter a valid email address')
        break
      case 'number':
        fieldSchema = z.coerce.number()
        break
      case 'checkbox':
        fieldSchema = z.boolean()
        break
      case 'file':
        fieldSchema = z.any()
        break
      default:
        fieldSchema = z.string()
    }

    // Apply validation rules
    if (field.validation_rules) {
      field.validation_rules.forEach((rule) => {
        if (fieldSchema instanceof z.ZodString) {
          switch (rule.type) {
            case 'min':
              fieldSchema = fieldSchema.min(Number(rule.value), rule.message)
              break
            case 'max':
              fieldSchema = fieldSchema.max(Number(rule.value), rule.message)
              break
            case 'minLength':
              fieldSchema = fieldSchema.min(Number(rule.value), rule.message)
              break
            case 'maxLength':
              fieldSchema = fieldSchema.max(Number(rule.value), rule.message)
              break
            case 'pattern':
              fieldSchema = fieldSchema.regex(new RegExp(String(rule.value)), rule.message)
              break
          }
        }
      })
    }

    // Make optional if not required
    if (!field.required) {
      fieldSchema = fieldSchema.optional()
    } else if (field.type !== 'checkbox') {
      if (fieldSchema instanceof z.ZodString) {
        fieldSchema = fieldSchema.min(1, `${field.label} is required`)
      }
    }

    schemaShape[field.name] = fieldSchema
  })

  return z.object(schemaShape)
}

const validationSchema = computed(() => {
  return toTypedSchema(buildValidationSchema(props.form.fields))
})

const { handleSubmit, isSubmitting, resetForm } = useForm({
  validationSchema,
})

const formRef = ref<HTMLFormElement | null>(null)
const isSuccess = ref(false)
const submitError = ref<string | null>(null)

// Sort fields by sort order
const sortedFields = computed(() => {
  return [...props.form.fields].sort((a, b) => a.sort - b.sort)
})

const onSubmit = handleSubmit(async (values) => {
  submitError.value = null

  try {
    // Create FormData for file uploads
    const formData = new FormData()
    const jsonData: Record<string, unknown> = {}

    for (const [key, value] of Object.entries(values)) {
      if (value instanceof File) {
        formData.append(key, value)
      } else if (Array.isArray(value) && value[0] instanceof File) {
        value.forEach((file: File) => {
          formData.append(key, file)
        })
      } else {
        jsonData[key] = value
      }
    }

    formData.append('data', JSON.stringify(jsonData))
    formData.append('form_id', String(props.form.id))

    // Submit to API
    const response = await $fetch('/api/forms/submit', {
      method: 'POST',
      body: formData,
    })

    if (response.success) {
      isSuccess.value = true
      emit('submitted', values)

      // Animate success state
      if (formRef.value) {
        gsap.to(formRef.value, {
          opacity: 0,
          y: -20,
          duration: 0.3,
          onComplete: () => {
            gsap.fromTo(
              '.success-message',
              { opacity: 0, y: 20 },
              { opacity: 1, y: 0, duration: 0.5 }
            )
          },
        })
      }
    }
  } catch (error) {
    submitError.value = 'Something went wrong. Please try again.'
    console.error('Form submission error:', error)
  }
})

const handleReset = () => {
  isSuccess.value = false
  submitError.value = null
  resetForm()

  if (formRef.value) {
    gsap.fromTo(
      formRef.value,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.3 }
    )
  }
}

// Animate form on mount
onMounted(() => {
  if (formRef.value) {
    gsap.fromTo(
      formRef.value.querySelectorAll('.form-field'),
      { opacity: 0, y: 20 },
      {
        opacity: 1,
        y: 0,
        duration: 0.4,
        stagger: 0.05,
        ease: 'power2.out',
      }
    )
  }
})
</script>

<template>
  <div class="dynamic-form">
    <!-- Success message -->
    <div
      v-if="isSuccess"
      class="success-message text-center py-16 px-8"
    >
      <div class="w-16 h-16 rounded-2xl bg-primary-50 mx-auto mb-6 flex items-center justify-center">
        <Icon name="lucide:check" class="w-7 h-7 text-primary-600" />
      </div>
      <h3 class="text-2xl font-serif text-slate-900 mb-3 tracking-tight">
        {{ form.success_message || 'Thank you for your submission!' }}
      </h3>
      <p class="text-slate-500 mb-8 max-w-md mx-auto leading-relaxed">
        We've received your information and will be in touch soon.
      </p>
      <Button variant="secondary" @click="handleReset">
        Submit Another Response
      </Button>
    </div>

    <!-- Form -->
    <form
      v-else
      ref="formRef"
      class="space-y-8"
      @submit.prevent="onSubmit"
    >
      <!-- Form description -->
      <p v-if="form.description" class="text-slate-500 leading-relaxed">
        {{ form.description }}
      </p>

      <!-- Error message -->
      <div
        v-if="submitError"
        class="p-5 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm"
      >
        <div class="flex items-center gap-3">
          <Icon name="lucide:alert-circle" class="w-5 h-5 flex-shrink-0" />
          <span>{{ submitError }}</span>
        </div>
      </div>

      <!-- Fields -->
      <div class="grid grid-cols-2 gap-x-8 gap-y-7">
        <FormsFormField
          v-for="field in sortedFields"
          :key="field.id"
          :field="field"
          class="form-field"
        />
      </div>

      <!-- Submit button -->
      <div class="pt-6">
        <Button
          type="submit"
          :disabled="isSubmitting"
          class="w-full sm:w-auto min-w-[200px]"
        >
          <Icon
            v-if="isSubmitting"
            name="lucide:loader-2"
            class="w-4 h-4 animate-spin"
          />
          {{ isSubmitting ? 'Submitting...' : 'Submit' }}
        </Button>
      </div>
    </form>
  </div>
</template>
