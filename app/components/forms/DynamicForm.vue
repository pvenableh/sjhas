<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import * as z from 'zod'
import { gsap } from 'gsap'
import { toast } from 'vue-sonner'
import type { Form, FormField, ConditionRule } from '~/types/directus'

export interface FormStepCondition {
  /** The field name to check */
  field: string
  /** Operator for comparison */
  operator: 'includes' | 'includes_any' | 'equals' | 'not_equals'
  /** The value to compare against (comma-separated for includes_any) */
  value: string
}

export interface FormStep {
  label: string
  icon?: string
  /** Sort range [min, max] inclusive — fields with sort values in this range belong to this step */
  fieldRange: [number, number]
  /** Optional condition — step is only shown when the condition is met */
  condition?: FormStepCondition
}

const props = defineProps<{
  form: Form
  steps?: FormStep[]
}>()

const emit = defineEmits<{
  submitted: [data: Record<string, unknown>]
  'update:currentStep': [step: number]
}>()

// ──────────────────────────────────────────────
// Shared condition evaluator (works with raw data or reactive formValues)
// ──────────────────────────────────────────────
const evalCondition = (condition: ConditionRule | FormStepCondition, data: Record<string, unknown>): boolean => {
  if (!condition.field) return true
  const fieldValue = data[condition.field]
  switch (condition.operator) {
    case 'equals':
      if (typeof fieldValue === 'boolean') return fieldValue === (condition.value === 'true')
      return fieldValue === condition.value
    case 'not_equals':
      if (typeof fieldValue === 'boolean') return fieldValue !== (condition.value === 'true')
      return fieldValue !== condition.value
    case 'includes':
      if (Array.isArray(fieldValue)) return fieldValue.includes(condition.value)
      if (typeof fieldValue === 'string') return fieldValue.includes(condition.value)
      return false
    case 'includes_any': {
      if (!Array.isArray(fieldValue)) return false
      const values = condition.value.split(',').map(v => v.trim())
      return values.some(v => (fieldValue as string[]).includes(v))
    }
    default:
      return true
  }
}

// ──────────────────────────────────────────────
// Resolve field visibility & requirement (backward-compatible)
// ──────────────────────────────────────────────
const resolveFieldVisible = (field: FormField, data: Record<string, unknown>): boolean => {
  const vis = field.visibility
  if (vis) {
    if (vis.mode === 'never') return false
    if (vis.mode === 'always') return true
    if (vis.mode === 'when' && vis.condition) return evalCondition(vis.condition, data)
    return true
  }
  // Backward compat: use conditional_logic
  const logic = field.conditional_logic as ConditionRule | null
  if (!logic || !logic.field) return true
  return evalCondition(logic, data)
}

const resolveFieldRequired = (field: FormField, data: Record<string, unknown>): boolean => {
  const req = field.requirement
  if (req) {
    if (req.mode === 'always') return true
    if (req.mode === 'never') return false
    if (req.mode === 'when' && req.condition) return evalCondition(req.condition, data)
    return false
  }
  // Backward compat: use required boolean
  return field.required
}

// ──────────────────────────────────────────────
// Build Zod schema from form fields
// ──────────────────────────────────────────────
const buildValidationSchema = (fields: FormField[], steps?: FormStep[]) => {
  const schemaShape: Record<string, z.ZodTypeAny> = {}
  // Track fields whose requirement must be evaluated at validation time
  const dynamicallyRequired: FormField[] = []

  if (!fields || !Array.isArray(fields)) return z.object(schemaShape)

  // Build a lookup: does this field live on a conditional step?
  const isFieldOnConditionalStep = (field: FormField): boolean => {
    if (!steps) return false
    const step = steps.find(
      (s) => field.sort >= s.fieldRange[0] && field.sort <= s.fieldRange[1]
    )
    return !!(step?.condition)
  }

  // Check whether a field could be conditionally hidden (step OR field-level logic)
  const isFieldConditionallyVisible = (field: FormField): boolean => {
    if (isFieldOnConditionalStep(field)) return true
    if (field.visibility?.mode === 'when') return true
    // Backward compat: field has conditional_logic
    const logic = field.conditional_logic as ConditionRule | null
    return !!(logic && logic.field)
  }

  fields.forEach((field) => {
    if (field.type === 'heading' || field.type === 'paragraph') return

    // Skip fields that are never visible
    if (field.visibility?.mode === 'never') return

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
      case 'checkbox_group':
        fieldSchema = z.array(z.string())
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

    // Determine requirement strategy
    const reqMode = field.requirement?.mode
    const isConditionalReqMode = reqMode === 'when'
    const isStaticRequired = reqMode === 'always' || (!field.requirement && field.required)

    // Any field that is required AND could be hidden (by step condition or
    // field-level conditional_logic/visibility) must be validated dynamically
    // via superRefine instead of statically in the Zod schema.
    const needsDynamicValidation =
      isConditionalReqMode || (isStaticRequired && isFieldConditionallyVisible(field))

    if (needsDynamicValidation) {
      // Make optional in base schema; superRefine handles the dynamic check
      fieldSchema = fieldSchema.optional()
      dynamicallyRequired.push(field)
    } else if (!isStaticRequired) {
      fieldSchema = fieldSchema.optional()
    } else if (field.type === 'checkbox_group') {
      if (fieldSchema instanceof z.ZodArray) {
        fieldSchema = fieldSchema.min(1, `${field.label} is required`)
      }
    } else if (field.type !== 'checkbox') {
      if (fieldSchema instanceof z.ZodString) {
        fieldSchema = fieldSchema.min(1, `${field.label} is required`)
      }
    }

    schemaShape[field.name] = fieldSchema
  })

  let schema = z.object(schemaShape)

  // Dynamic required validation — runs at validation time so it can
  // check current form values for field visibility & step visibility
  if (dynamicallyRequired.length > 0) {
    schema = schema.superRefine((data, ctx) => {
      for (const field of dynamicallyRequired) {
        // Skip if the field's parent step is currently hidden
        if (steps) {
          const step = steps.find(
            (s) => field.sort >= s.fieldRange[0] && field.sort <= s.fieldRange[1]
          )
          if (step?.condition && !evalCondition(step.condition, data)) continue
        }

        // Skip if the field itself is hidden
        if (!resolveFieldVisible(field, data)) continue
        // Skip if the field is not currently required
        if (!resolveFieldRequired(field, data)) continue

        const val = data[field.name as keyof typeof data]
        const isEmpty =
          val === undefined ||
          val === null ||
          val === '' ||
          (Array.isArray(val) && val.length === 0)

        if (isEmpty) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `${field.label} is required`,
            path: [field.name],
          })
        }
      }
    }) as any
  }

  return schema
}

const validationSchema = computed(() => {
  return toTypedSchema(buildValidationSchema(props.form.fields || [], props.steps))
})

// Build initial values from field defaults
const initialValues = computed(() => {
  const values: Record<string, unknown> = {}
  for (const field of (props.form.fields || [])) {
    if (field.default_value !== undefined && field.default_value !== null) {
      values[field.name] = field.default_value
    }
  }
  return values
})

const { handleSubmit, isSubmitting, resetForm, validate, values: formValues } = useForm({
  validationSchema,
  initialValues,
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

// Evaluate whether a step condition is met based on current form values
const evaluateCondition = (condition: FormStepCondition): boolean => {
  return evalCondition(condition, formValues as Record<string, unknown>)
}

// Evaluate whether a field is visible (uses new visibility + backward compat)
const isFieldVisible = (field: FormField): boolean => {
  return resolveFieldVisible(field, formValues as Record<string, unknown>)
}

// Multi-step support — compute the list of active (visible) steps
const activeSteps = computed(() => {
  if (!props.steps) return []
  return props.steps.filter((step) => {
    if (!step.condition) return true
    return evaluateCondition(step.condition)
  })
})

const isMultiStep = computed(() => activeSteps.value.length > 1)
const totalSteps = computed(() => activeSteps.value.length || 1)
const isLastStep = computed(() => currentStep.value >= totalSteps.value - 1)

// Fields visible in the current step
const visibleFields = computed(() => {
  if (!isMultiStep.value && activeSteps.value.length === 0) return sortedFields.value
  const step = activeSteps.value[currentStep.value]
  if (!step) return sortedFields.value
  return sortedFields.value.filter(
    (f) => f.sort >= step.fieldRange[0] && f.sort <= step.fieldRange[1]
  )
})

// Field names for the current step (used for validation)
// Excludes fields hidden by conditional_logic so they don't block step navigation
const currentStepFieldNames = computed(() => {
  return visibleFields.value
    .filter((f) => f.type !== 'heading' && f.type !== 'paragraph' && isFieldVisible(f))
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
      activeSteps.value[currentStep.value]?.label,
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

// Clamp currentStep if active steps shrink (e.g. user un-checks a service)
watch(activeSteps, (steps) => {
  if (currentStep.value >= steps.length && steps.length > 0) {
    currentStep.value = steps.length - 1
    emit('update:currentStep', currentStep.value)
  }
})

// Find the first active step index that contains any of the given error field names
const findFirstStepWithErrors = (errorFieldNames: string[]): number => {
  const fields = props.form.fields || []
  for (let i = 0; i < activeSteps.value.length; i++) {
    const step = activeSteps.value[i]
    const stepFields = fields.filter(
      (f) => f.sort >= step.fieldRange[0] && f.sort <= step.fieldRange[1]
    )
    if (stepFields.some((f) => errorFieldNames.includes(f.name))) {
      return i
    }
  }
  return -1
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
  console.log('[DynamicForm] Submit handler invoked — validation passed')
  console.log('[DynamicForm] Form ID:', props.form.id, '| Title:', props.form.title)
  console.log('[DynamicForm] Submitted values:', JSON.stringify(values, null, 2))

  try {
    // Create FormData for file uploads
    const formData = new FormData()
    const jsonData: Record<string, unknown> = {}

    for (const [key, value] of Object.entries(values)) {
      if (value instanceof File) {
        formData.append(key, value)
        console.log(`[DynamicForm] File field "${key}":`, value.name, `(${value.size} bytes)`)
      } else if (Array.isArray(value) && value[0] instanceof File) {
        value.forEach((file: File) => {
          formData.append(key, file)
        })
        console.log(`[DynamicForm] File array field "${key}":`, value.length, 'files')
      } else {
        jsonData[key] = value
      }
    }

    formData.append('data', JSON.stringify(jsonData))
    formData.append('form_id', String(props.form.id))

    console.log('[DynamicForm] Sending POST /api/forms/submit with form_id:', props.form.id)

    // Submit to API
    const response = await $fetch('/api/forms/submit', {
      method: 'POST',
      body: formData,
    })

    console.log('[DynamicForm] API response:', JSON.stringify(response))

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
    } else {
      // API returned a response but success was not true
      console.error('[DynamicForm] API returned non-success response:', response)
      submitError.value = (response as any).message || 'Submission failed. Please try again.'
      trackFormError(props.form.title || 'Unknown Form', 'API returned non-success')
      toast.error(submitError.value!)
    }
  } catch (error: any) {
    // Extract meaningful error details from $fetch errors
    const statusCode = error?.statusCode || error?.response?.status || 'unknown'
    const serverMessage = error?.data?.message || error?.message || 'Unknown error'
    console.error('[DynamicForm] Submission error:', { statusCode, serverMessage, error })

    submitError.value = `Submission failed (${statusCode}): ${serverMessage}`
    trackFormError(props.form.title || 'Unknown Form', `Submission failed: ${statusCode}`)
    toast.error(submitError.value)
  }
}, (ctx) => {
  // Called when vee-validate validation fails — form never reaches the submit handler
  // ctx shape: { values, evt, errors, results }
  const errors = ctx.errors || {}
  console.warn('[DynamicForm] Validation failed — form NOT submitted')
  console.warn('[DynamicForm] Validation errors:', JSON.stringify(errors, null, 2))
  console.warn('[DynamicForm] Current form values:', JSON.stringify(formValues, null, 2))

  // Build field name → label lookup for user-friendly messages
  const fieldLabelMap: Record<string, string> = {}
  for (const f of (props.form.fields || [])) {
    fieldLabelMap[f.name] = f.label
  }

  const errorFieldNames = Object.keys(errors)
  const errorCount = errorFieldNames.length
  const errorLabels = errorFieldNames.map((name) => fieldLabelMap[name] || name)

  // Navigate to the first step that contains an error field
  if (isMultiStep.value && props.steps) {
    const firstErrorStep = findFirstStepWithErrors(errorFieldNames)
    if (firstErrorStep !== -1 && firstErrorStep !== currentStep.value) {
      console.warn(`[DynamicForm] Navigating from step ${currentStep.value} to step ${firstErrorStep} (has errors)`)
      currentStep.value = firstErrorStep
      emit('update:currentStep', firstErrorStep)
      animateStepTransition()
    }
  }

  const stepLabel = activeSteps.value[currentStep.value]?.label
  const stepHint = stepLabel ? ` in "${stepLabel}"` : ''
  const message = `Please fix ${errorCount} error${errorCount > 1 ? 's' : ''}${stepHint}: ${errorLabels.join(', ')}`

  submitError.value = message
  trackFormError(props.form.title || 'Unknown Form', `Validation failed: ${errorFieldNames.join(', ')}`)
  toast.error(message)
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

defineExpose({
  activeSteps,
  currentStep,
})
</script>

<template>
  <div class="dynamic-form">
    <!-- Success message -->
    <div
      v-if="isSuccess"
      class="success-message text-center py-16 px-8"
    >
      <div class="w-16 h-16 rounded-2xl bg-primary-50 dark:bg-primary-900/30 mx-auto mb-6 flex items-center justify-center">
        <Icon name="lucide:check" class="w-7 h-7 text-primary-600 dark:text-primary-400" />
      </div>
      <h3 class="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-3 tracking-tight">
        {{ form.success_message || 'Thank you for your submission!' }}
      </h3>
      <p class="text-slate-500 dark:text-slate-400 mb-8 max-w-md mx-auto leading-relaxed">
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
      <p v-if="form.description && (!isMultiStep || currentStep === 0)" class="text-slate-500 dark:text-slate-400 leading-relaxed">
        {{ form.description }}
      </p>

      <!-- Error message -->
      <div
        v-if="submitError"
        class="p-5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 text-red-700 dark:text-red-400 text-sm"
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
