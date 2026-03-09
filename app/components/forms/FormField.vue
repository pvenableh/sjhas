<script setup lang="ts">
import { computed } from 'vue'
import { useField, useFormValues } from 'vee-validate'
import type { FormField, ConditionRule } from '~/types/directus'
import { cn } from '~/utils/cn'

const props = defineProps<{
  field: FormField
  showConditional?: boolean
}>()

const { value, errorMessage, handleBlur, handleChange } = useField(
  () => props.field.name,
  undefined,
  {
    validateOnValueUpdate: false,
    // Preserve the field value when the component unmounts (e.g. navigating
    // between steps in a multi-step form). Without this, vee-validate
    // destroys field values on unmount, which wipes selections like
    // "services" and causes conditional steps to disappear.
    keepValue: true,
  }
)

// Access all form values for conditional logic evaluation
const formValues = useFormValues()

const widthClass = computed(() => {
  switch (props.field.width) {
    case 'half':
      return 'md:col-span-1'
    case 'third':
      return 'md:col-span-1 lg:col-span-1'
    default:
      return 'md:col-span-2'
  }
})

// Shared condition evaluator
const evaluateCondition = (condition: ConditionRule): boolean => {
  if (!condition.field) return true
  const sourceValue = formValues.value[condition.field]

  switch (condition.operator) {
    case 'equals':
      if (typeof sourceValue === 'boolean') return sourceValue === (condition.value === 'true')
      return sourceValue === condition.value
    case 'not_equals':
      if (typeof sourceValue === 'boolean') return sourceValue !== (condition.value === 'true')
      return sourceValue !== condition.value
    case 'includes':
      if (Array.isArray(sourceValue)) return sourceValue.includes(condition.value)
      if (typeof sourceValue === 'string') return sourceValue.includes(condition.value)
      return false
    case 'includes_any': {
      if (!Array.isArray(sourceValue)) return false
      const values = condition.value.split(',').map((v: string) => v.trim())
      return values.some((v: string) => (sourceValue as string[]).includes(v))
    }
    default:
      return true
  }
}

// Visibility: prefer new `visibility` property, fall back to `conditional_logic`
const isVisible = computed(() => {
  const vis = props.field.visibility
  if (vis) {
    if (vis.mode === 'never') return false
    if (vis.mode === 'always') return true
    if (vis.mode === 'when' && vis.condition) return evaluateCondition(vis.condition)
    return true
  }
  // Backward compat with old conditional_logic
  const logic = props.field.conditional_logic as ConditionRule | null
  if (!logic || !logic.field) return true
  return evaluateCondition(logic)
})

// Requirement: prefer new `requirement` property, fall back to `required`
const isRequired = computed(() => {
  const req = props.field.requirement
  if (req) {
    if (req.mode === 'always') return true
    if (req.mode === 'never') return false
    if (req.mode === 'when' && req.condition) return evaluateCondition(req.condition)
    return false
  }
  return props.field.required
})

// Layout class for radio/checkbox_group options
const optionsLayoutClass = computed(() => {
  const layout = props.field.layout || 'stacked'
  switch (layout) {
    case 'two-columns': return 'grid grid-cols-2 gap-3'
    case 'three-columns': return 'grid grid-cols-3 gap-3'
    case 'four-columns': return 'grid grid-cols-4 gap-3'
    case 'side-by-side': return 'flex flex-wrap gap-x-6 gap-y-3'
    default: return 'space-y-3'
  }
})
</script>

<template>
  <Transition
    enter-active-class="transition-all duration-300 ease-out"
    leave-active-class="transition-all duration-200 ease-in"
    enter-from-class="opacity-0 translate-y-1"
    enter-to-class="opacity-100 translate-y-0"
    leave-from-class="opacity-100 translate-y-0"
    leave-to-class="opacity-0 translate-y-1"
  >
  <div v-if="isVisible" :class="cn('col-span-2', widthClass)">
    <!-- Heading field type -->
    <template v-if="field.type === 'heading'">
      <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1 tracking-tight">{{ field.label }}</h3>
      <p v-if="field.help_text" class="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{{ field.help_text }}</p>
    </template>

    <!-- Paragraph field type -->
    <template v-else-if="field.type === 'paragraph'">
      <p class="text-slate-600 dark:text-slate-300 leading-relaxed">{{ field.label }}</p>
    </template>

    <!-- Text input -->
    <template v-else-if="field.type === 'text'">
      <Label :for="field.name" class="label-base">
        {{ field.label }}
        <span v-if="isRequired" class="text-red-500 ml-0.5">*</span>
      </Label>
      <Input
        :id="field.name"
        :model-value="value as string"
        type="text"
        :placeholder="field.placeholder || ''"
        :class="{ 'border-red-500': errorMessage }"
        @update:model-value="handleChange"
        @blur="handleBlur"
      />
      <p v-if="field.help_text && !errorMessage" class="mt-2 text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
        {{ field.help_text }}
      </p>
      <p v-if="errorMessage" class="mt-2 text-xs text-red-500">{{ errorMessage }}</p>
    </template>

    <!-- Email input -->
    <template v-else-if="field.type === 'email'">
      <Label :for="field.name" class="label-base">
        {{ field.label }}
        <span v-if="isRequired" class="text-red-500 ml-0.5">*</span>
      </Label>
      <Input
        :id="field.name"
        :model-value="value as string"
        type="email"
        :placeholder="field.placeholder || 'email@example.com'"
        :class="{ 'border-red-500': errorMessage }"
        @update:model-value="handleChange"
        @blur="handleBlur"
      />
      <p v-if="field.help_text && !errorMessage" class="mt-2 text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
        {{ field.help_text }}
      </p>
      <p v-if="errorMessage" class="mt-2 text-xs text-red-500">{{ errorMessage }}</p>
    </template>

    <!-- Phone input -->
    <template v-else-if="field.type === 'phone'">
      <Label :for="field.name" class="label-base">
        {{ field.label }}
        <span v-if="isRequired" class="text-red-500 ml-0.5">*</span>
      </Label>
      <Input
        :id="field.name"
        :model-value="value as string"
        type="tel"
        :placeholder="field.placeholder || '(555) 555-5555'"
        :class="{ 'border-red-500': errorMessage }"
        @update:model-value="handleChange"
        @blur="handleBlur"
      />
      <p v-if="field.help_text && !errorMessage" class="mt-2 text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
        {{ field.help_text }}
      </p>
      <p v-if="errorMessage" class="mt-2 text-xs text-red-500">{{ errorMessage }}</p>
    </template>

    <!-- Number input -->
    <template v-else-if="field.type === 'number'">
      <Label :for="field.name" class="label-base">
        {{ field.label }}
        <span v-if="isRequired" class="text-red-500 ml-0.5">*</span>
      </Label>
      <Input
        :id="field.name"
        :model-value="value as string"
        type="number"
        :placeholder="field.placeholder || ''"
        :class="{ 'border-red-500': errorMessage }"
        @update:model-value="handleChange"
        @blur="handleBlur"
      />
      <p v-if="field.help_text && !errorMessage" class="mt-2 text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
        {{ field.help_text }}
      </p>
      <p v-if="errorMessage" class="mt-2 text-xs text-red-500">{{ errorMessage }}</p>
    </template>

    <!-- Date input -->
    <template v-else-if="field.type === 'date'">
      <Label :for="field.name" class="label-base">
        {{ field.label }}
        <span v-if="isRequired" class="text-red-500 ml-0.5">*</span>
      </Label>
      <Input
        :id="field.name"
        :model-value="value as string"
        type="date"
        :class="{ 'border-red-500': errorMessage }"
        @update:model-value="handleChange"
        @blur="handleBlur"
      />
      <p v-if="field.help_text && !errorMessage" class="mt-2 text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
        {{ field.help_text }}
      </p>
      <p v-if="errorMessage" class="mt-2 text-xs text-red-500">{{ errorMessage }}</p>
    </template>

    <!-- Textarea -->
    <template v-else-if="field.type === 'textarea'">
      <Label :for="field.name" class="label-base">
        {{ field.label }}
        <span v-if="isRequired" class="text-red-500 ml-0.5">*</span>
      </Label>
      <Textarea
        :id="field.name"
        :model-value="value as string"
        :placeholder="field.placeholder || ''"
        :class="{ 'border-red-500': errorMessage }"
        @update:model-value="handleChange"
        @blur="handleBlur"
      />
      <p v-if="field.help_text && !errorMessage" class="mt-2 text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
        {{ field.help_text }}
      </p>
      <p v-if="errorMessage" class="mt-2 text-xs text-red-500">{{ errorMessage }}</p>
    </template>

    <!-- Select -->
    <template v-else-if="field.type === 'select'">
      <Label :for="field.name" class="label-base">
        {{ field.label }}
        <span v-if="isRequired" class="text-red-500 ml-0.5">*</span>
      </Label>
      <Select
        :model-value="value as string"
        @update:model-value="handleChange"
      >
        <SelectTrigger :class="{ 'border-red-500': errorMessage }">
          <SelectValue :placeholder="field.placeholder || 'Select an option'" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem
            v-for="option in field.options"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </SelectItem>
        </SelectContent>
      </Select>
      <p v-if="field.help_text && !errorMessage" class="mt-2 text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
        {{ field.help_text }}
      </p>
      <p v-if="errorMessage" class="mt-2 text-xs text-red-500">{{ errorMessage }}</p>
    </template>

    <!-- Checkbox -->
    <template v-else-if="field.type === 'checkbox'">
      <div class="flex items-start gap-3">
        <Checkbox
          :id="field.name"
          :model-value="value as boolean"
          @update:model-value="handleChange"
        />
        <div class="space-y-1">
          <Label :for="field.name" class="text-sm font-medium text-slate-700 dark:text-slate-200 cursor-pointer">
            {{ field.label }}
            <span v-if="isRequired" class="text-red-500 ml-0.5">*</span>
          </Label>
          <p v-if="field.help_text" class="text-sm text-slate-500 dark:text-slate-400">
            {{ field.help_text }}
          </p>
        </div>
      </div>
      <p v-if="errorMessage" class="mt-2 text-xs text-red-500">{{ errorMessage }}</p>
    </template>

    <!-- Checkbox group (multi-select) -->
    <template v-else-if="field.type === 'checkbox_group'">
      <Label class="label-base">
        {{ field.label }}
        <span v-if="isRequired" class="text-red-500 ml-0.5">*</span>
      </Label>
      <div :class="['mt-3', optionsLayoutClass]">
        <div
          v-for="option in field.options"
          :key="option.value"
          class="flex items-start gap-3"
        >
          <Checkbox
            :id="`${field.name}-${option.value}`"
            :model-value="Array.isArray(value) && (value as string[]).includes(option.value)"
            @update:model-value="(checked: boolean) => {
              const current = Array.isArray(value) ? [...(value as string[])] : []
              if (checked) {
                current.push(option.value)
              } else {
                const idx = current.indexOf(option.value)
                if (idx > -1) current.splice(idx, 1)
              }
              handleChange(current)
            }"
          />
          <Label :for="`${field.name}-${option.value}`" class="text-sm text-slate-600 dark:text-slate-300 cursor-pointer">
            {{ option.label }}
          </Label>
        </div>
      </div>
      <p v-if="field.help_text && !errorMessage" class="mt-2 text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
        {{ field.help_text }}
      </p>
      <p v-if="errorMessage" class="mt-2 text-xs text-red-500">{{ errorMessage }}</p>
    </template>

    <!-- Radio group -->
    <template v-else-if="field.type === 'radio'">
      <Label class="label-base">
        {{ field.label }}
        <span v-if="isRequired" class="text-red-500 ml-0.5">*</span>
      </Label>
      <RadioGroup
        :model-value="value as string"
        @update:model-value="handleChange"
        :class="['mt-3', optionsLayoutClass]"
      >
        <div
          v-for="option in field.options"
          :key="option.value"
          class="flex items-center gap-3"
        >
          <RadioGroupItem :id="`${field.name}-${option.value}`" :value="option.value" />
          <Label :for="`${field.name}-${option.value}`" class="text-sm text-slate-600 dark:text-slate-300 cursor-pointer">
            {{ option.label }}
          </Label>
        </div>
      </RadioGroup>
      <p v-if="field.help_text && !errorMessage" class="mt-2 text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
        {{ field.help_text }}
      </p>
      <p v-if="errorMessage" class="mt-2 text-xs text-red-500">{{ errorMessage }}</p>
    </template>

    <!-- File upload -->
    <template v-else-if="field.type === 'file'">
      <FormsFileUpload
        :field="field"
        :model-value="value"
        @update:model-value="handleChange"
      />
      <p v-if="errorMessage" class="mt-2 text-xs text-red-500">{{ errorMessage }}</p>
    </template>
  </div>
  </Transition>
</template>
