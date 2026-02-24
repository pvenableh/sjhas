<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import * as z from 'zod'
import { gsap } from 'gsap'
import { toast } from 'vue-sonner'
import type { Form, FormField } from '~/types/directus'

export interface FormStep {
  label: string
  icon?: string
  /** Sort range [min, max] inclusive — fields with sort values in this range belong to this step */
  fieldRange: [number, number]
}

const props = defineProps<{
  form: Form
  steps?: FormStep[]
}>()

const emit = defineEmits<{
  submitted: [data: Record<string, unknown>]
  'update:currentStep': [step: number]
}>()

// Build Zod schema from form fields
const buildValidationSchema = (fields: FormField[]) => {
  const schemaShape: Record<string, z.ZodTypeAny> = {}

  if (!fields || !Array.isArray(fields)) return z.object(schemaShape)

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
  return toTypedSchema(buildValidationSchema(props.form.fields || []))
})

const { handleSubmit, isSubmitting, resetForm, validate } = useForm({
  validationSchema,
})

const { trackFormSubmission, trackFormStepComplete, trackFormError, trackFormView } = useAnalytics()

const formRef = ref<HTMLFormElement | null>(null)
const isSuccess = ref(false)
const submitError = ref<string | null>(null)
const currentStep = ref(0)

// Sort fields by sort order
const sortedFields = computed(() => {
  const fields = props.form.fields || []
  return [...fields].sort((a, b) => a.sort - b.sort)
})

// Multi-step support
const isMultiStep = computed(() => !!props.steps && props.steps.length > 1)
const totalSteps = computed(() => props.steps?.length || 1)
const isLastStep = computed(() => currentStep.value >= totalSteps.value - 1)

// Fields visible in the current step
const visibleFields = computed(() => {
  if (!isMultiStep.value) return sortedFields.value
  const step = props.steps![currentStep.value]
  if (!step) return sortedFields.value
  return sortedFields.value.filter(
    (f) => f.sort >= step.fieldRange[0] && f.sort <= step.fieldRange[1]
  )
})

// Field names for the current step (used for validation)
const currentStepFieldNames = computed(() => {
  return visibleFields.value
    .filter((f) => f.type !== 'heading' && f.type !== 'paragraph')
    .map((f) => f.name)
})

// Navigate to next step with validation
const goToNextStep = async () => {
  // Validate only the current step's fields
  const result = await validate()
  const stepFieldNames = currentStepFieldNames.value
  const hasStepErrors = Object.keys(result.errors).some((name) =>
    stepFieldNames.includes(name)
  )

  if (hasStepErrors) return

  if (!isLastStep.value) {
    trackFormStepComplete(
      props.form.title || 'Unknown Form',
      currentStep.value + 1,
      props.steps?.[currentStep.value]?.label,
    )
    currentStep.value++
    emit('update:currentStep', currentStep.value)
    animateStepTransition()
  }
}

const goToPrevStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--
    emit('update:currentStep', currentStep.value)
    animateStepTransition()
  }
}

const animateStepTransition = () => {
  nextTick(() => {
    if (formRef.value) {
      gsap.fromTo(
        formRef.value.querySelectorAll('.form-field'),
        { opacity: 0, y: 15 },
        {
          opacity: 1,
          y: 0,
          duration: 0.3,
          stagger: 0.04,
          ease: 'power2.out',
        }
      )
    }
  })
}

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
      trackFormSubmission(props.form.title || 'Unknown Form', props.form.id)
      toast.success(props.form.success_message || 'Form submitted successfully!')
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
    trackFormError(props.form.title || 'Unknown Form', 'Submission failed')
    toast.error('Something went wrong. Please try again.')
    console.error('Form submission error:', error)
  }
})

const handleReset = () => {
  isSuccess.value = false
  submitError.value = null
  currentStep.value = 0
  emit('update:currentStep', 0)
  resetForm()

  if (formRef.value) {
    gsap.fromTo(
      formRef.value,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.3 }
    )
  }
}

// Animate form on mount + track form view
onMounted(() => {
  trackFormView(props.form.title || 'Unknown Form', props.form.id)

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
      <h3 class="text-2xl font-semibold text-slate-900 mb-3 tracking-tight">
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
      <!-- Form description (only on first step for multi-step forms) -->
      <p v-if="form.description && (!isMultiStep || currentStep === 0)" class="text-slate-500 leading-relaxed">
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
          v-for="field in visibleFields"
          :key="field.id"
          :field="field"
          class="form-field"
        />
      </div>

      <!-- Navigation buttons (multi-step) -->
      <div v-if="isMultiStep" class="pt-6 flex items-center justify-between gap-4">
        <Button
          v-if="currentStep > 0"
          type="button"
          variant="secondary"
          @click="goToPrevStep"
        >
          <Icon name="lucide:arrow-left" class="w-4 h-4" />
          Previous
        </Button>
        <div v-else />

        <Button
          v-if="!isLastStep"
          type="button"
          @click="goToNextStep"
          class="min-w-[200px]"
        >
          Next
          <Icon name="lucide:arrow-right" class="w-4 h-4" />
        </Button>
        <Button
          v-else
          type="submit"
          :disabled="isSubmitting"
          class="min-w-[200px]"
        >
          <Icon
            v-if="isSubmitting"
            name="lucide:loader-2"
            class="w-4 h-4 animate-spin"
          />
          {{ isSubmitting ? 'Submitting...' : 'Submit' }}
        </Button>
      </div>

      <!-- Submit button (single-step forms) -->
      <div v-else class="pt-6">
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
