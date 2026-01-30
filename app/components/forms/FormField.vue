<script setup lang="ts">
import { computed } from 'vue'
import { useField } from 'vee-validate'
import type { FormField } from '~/types/directus'
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
  }
)

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

const isVisible = computed(() => {
  if (!props.field.conditional_logic || !props.showConditional) {
    return true
  }
  // Conditional logic would be evaluated here based on form state
  return true
})
</script>

<template>
  <div v-if="isVisible" :class="cn('col-span-2', widthClass)">
    <!-- Heading field type -->
    <template v-if="field.type === 'heading'">
      <h3 class="text-lg font-semibold text-slate-900 mb-2">{{ field.label }}</h3>
      <p v-if="field.help_text" class="text-sm text-slate-500">{{ field.help_text }}</p>
    </template>

    <!-- Paragraph field type -->
    <template v-else-if="field.type === 'paragraph'">
      <p class="text-slate-700">{{ field.label }}</p>
    </template>

    <!-- Text input -->
    <template v-else-if="field.type === 'text'">
      <Label :for="field.name" class="label-base">
        {{ field.label }}
        <span v-if="field.required" class="text-red-500 ml-0.5">*</span>
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
      <p v-if="field.help_text && !errorMessage" class="mt-1 text-sm text-slate-500">
        {{ field.help_text }}
      </p>
      <p v-if="errorMessage" class="mt-1 text-sm text-red-500">{{ errorMessage }}</p>
    </template>

    <!-- Email input -->
    <template v-else-if="field.type === 'email'">
      <Label :for="field.name" class="label-base">
        {{ field.label }}
        <span v-if="field.required" class="text-red-500 ml-0.5">*</span>
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
      <p v-if="field.help_text && !errorMessage" class="mt-1 text-sm text-slate-500">
        {{ field.help_text }}
      </p>
      <p v-if="errorMessage" class="mt-1 text-sm text-red-500">{{ errorMessage }}</p>
    </template>

    <!-- Phone input -->
    <template v-else-if="field.type === 'phone'">
      <Label :for="field.name" class="label-base">
        {{ field.label }}
        <span v-if="field.required" class="text-red-500 ml-0.5">*</span>
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
      <p v-if="field.help_text && !errorMessage" class="mt-1 text-sm text-slate-500">
        {{ field.help_text }}
      </p>
      <p v-if="errorMessage" class="mt-1 text-sm text-red-500">{{ errorMessage }}</p>
    </template>

    <!-- Number input -->
    <template v-else-if="field.type === 'number'">
      <Label :for="field.name" class="label-base">
        {{ field.label }}
        <span v-if="field.required" class="text-red-500 ml-0.5">*</span>
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
      <p v-if="field.help_text && !errorMessage" class="mt-1 text-sm text-slate-500">
        {{ field.help_text }}
      </p>
      <p v-if="errorMessage" class="mt-1 text-sm text-red-500">{{ errorMessage }}</p>
    </template>

    <!-- Date input -->
    <template v-else-if="field.type === 'date'">
      <Label :for="field.name" class="label-base">
        {{ field.label }}
        <span v-if="field.required" class="text-red-500 ml-0.5">*</span>
      </Label>
      <Input
        :id="field.name"
        :model-value="value as string"
        type="date"
        :class="{ 'border-red-500': errorMessage }"
        @update:model-value="handleChange"
        @blur="handleBlur"
      />
      <p v-if="field.help_text && !errorMessage" class="mt-1 text-sm text-slate-500">
        {{ field.help_text }}
      </p>
      <p v-if="errorMessage" class="mt-1 text-sm text-red-500">{{ errorMessage }}</p>
    </template>

    <!-- Textarea -->
    <template v-else-if="field.type === 'textarea'">
      <Label :for="field.name" class="label-base">
        {{ field.label }}
        <span v-if="field.required" class="text-red-500 ml-0.5">*</span>
      </Label>
      <Textarea
        :id="field.name"
        :model-value="value as string"
        :placeholder="field.placeholder || ''"
        :class="{ 'border-red-500': errorMessage }"
        @update:model-value="handleChange"
        @blur="handleBlur"
      />
      <p v-if="field.help_text && !errorMessage" class="mt-1 text-sm text-slate-500">
        {{ field.help_text }}
      </p>
      <p v-if="errorMessage" class="mt-1 text-sm text-red-500">{{ errorMessage }}</p>
    </template>

    <!-- Select -->
    <template v-else-if="field.type === 'select'">
      <Label :for="field.name" class="label-base">
        {{ field.label }}
        <span v-if="field.required" class="text-red-500 ml-0.5">*</span>
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
      <p v-if="field.help_text && !errorMessage" class="mt-1 text-sm text-slate-500">
        {{ field.help_text }}
      </p>
      <p v-if="errorMessage" class="mt-1 text-sm text-red-500">{{ errorMessage }}</p>
    </template>

    <!-- Checkbox -->
    <template v-else-if="field.type === 'checkbox'">
      <div class="flex items-start gap-3">
        <Checkbox
          :id="field.name"
          :checked="value as boolean"
          @update:checked="handleChange"
        />
        <div class="space-y-1">
          <Label :for="field.name" class="text-sm font-medium text-slate-700 cursor-pointer">
            {{ field.label }}
            <span v-if="field.required" class="text-red-500 ml-0.5">*</span>
          </Label>
          <p v-if="field.help_text" class="text-sm text-slate-500">
            {{ field.help_text }}
          </p>
        </div>
      </div>
      <p v-if="errorMessage" class="mt-1 text-sm text-red-500">{{ errorMessage }}</p>
    </template>

    <!-- Radio group -->
    <template v-else-if="field.type === 'radio'">
      <Label class="label-base">
        {{ field.label }}
        <span v-if="field.required" class="text-red-500 ml-0.5">*</span>
      </Label>
      <RadioGroup
        :model-value="value as string"
        @update:model-value="handleChange"
        class="mt-2"
      >
        <div
          v-for="option in field.options"
          :key="option.value"
          class="flex items-center gap-3"
        >
          <RadioGroupItem :id="`${field.name}-${option.value}`" :value="option.value" />
          <Label :for="`${field.name}-${option.value}`" class="text-sm text-slate-700 cursor-pointer">
            {{ option.label }}
          </Label>
        </div>
      </RadioGroup>
      <p v-if="field.help_text && !errorMessage" class="mt-2 text-sm text-slate-500">
        {{ field.help_text }}
      </p>
      <p v-if="errorMessage" class="mt-1 text-sm text-red-500">{{ errorMessage }}</p>
    </template>

    <!-- File upload -->
    <template v-else-if="field.type === 'file'">
      <FormsFileUpload
        :field="field"
        :model-value="value"
        @update:model-value="handleChange"
      />
      <p v-if="errorMessage" class="mt-1 text-sm text-red-500">{{ errorMessage }}</p>
    </template>
  </div>
</template>
