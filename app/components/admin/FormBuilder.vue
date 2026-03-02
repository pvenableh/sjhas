<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import type { FormField, FormStepConfig, ConditionRule } from '~/types/directus'

// ──────────────────────────────────────────────
// Props & Emits
// ──────────────────────────────────────────────
const props = defineProps<{
  modelValue: FormField[]
  steps?: FormStepConfig[] | null
}>()

const emit = defineEmits<{
  'update:modelValue': [fields: FormField[]]
  'update:steps': [steps: FormStepConfig[] | null]
}>()

// ──────────────────────────────────────────────
// Field type palette
// ──────────────────────────────────────────────
const fieldTypes = [
  { type: 'text', label: 'Text Input', icon: 'lucide:type' },
  { type: 'email', label: 'Email', icon: 'lucide:mail' },
  { type: 'phone', label: 'Phone', icon: 'lucide:phone' },
  { type: 'number', label: 'Number', icon: 'lucide:hash' },
  { type: 'date', label: 'Date', icon: 'lucide:calendar' },
  { type: 'textarea', label: 'Long Text', icon: 'lucide:align-left' },
  { type: 'select', label: 'Dropdown', icon: 'lucide:chevron-down' },
  { type: 'checkbox', label: 'Checkbox', icon: 'lucide:check-square' },
  { type: 'checkbox_group', label: 'Checkbox Group', icon: 'lucide:list-checks' },
  { type: 'radio', label: 'Radio Group', icon: 'lucide:circle-dot' },
  { type: 'file', label: 'File Upload', icon: 'lucide:upload' },
  { type: 'heading', label: 'Heading', icon: 'lucide:heading' },
  { type: 'paragraph', label: 'Paragraph', icon: 'lucide:pilcrow' },
]

const getFieldIcon = (type: string) => fieldTypes.find(f => f.type === type)?.icon || 'lucide:file'
const getFieldTypeLabel = (type: string) => fieldTypes.find(f => f.type === type)?.label || type

// Step accent colours (cycles)
const stepAccents = [
  { border: 'border-l-blue-400', bg: 'bg-blue-50/50', badge: 'bg-blue-100 text-blue-700' },
  { border: 'border-l-emerald-400', bg: 'bg-emerald-50/50', badge: 'bg-emerald-100 text-emerald-700' },
  { border: 'border-l-amber-400', bg: 'bg-amber-50/50', badge: 'bg-amber-100 text-amber-700' },
  { border: 'border-l-violet-400', bg: 'bg-violet-50/50', badge: 'bg-violet-100 text-violet-700' },
  { border: 'border-l-rose-400', bg: 'bg-rose-50/50', badge: 'bg-rose-100 text-rose-700' },
  { border: 'border-l-cyan-400', bg: 'bg-cyan-50/50', badge: 'bg-cyan-100 text-cyan-700' },
]
const accent = (i: number) => stepAccents[i % stepAccents.length]

// ──────────────────────────────────────────────
// Core state
// ──────────────────────────────────────────────
interface StepGroup {
  step: FormStepConfig
  fields: FormField[]
  collapsed: boolean
}

const fields = ref<FormField[]>([])
const stepGroups = ref<StepGroup[]>([])
const isStepsMode = ref(false)

const selectedFieldId = ref<string | null>(null)
const selectedStepIndex = ref<number | null>(null)
const isSyncing = ref(false)

// ──────────────────────────────────────────────
// Drag & drop state
// ──────────────────────────────────────────────
const dragState = ref<{
  type: 'palette' | 'field' | 'step'
  fieldType?: string
  fieldId?: string
  sourceStepIndex?: number
  stepIndex?: number
} | null>(null)

// Drop position indicators
const flatDropIndex = ref<number | null>(null)
const fieldDropTarget = ref<{ stepIndex: number; fieldIndex: number } | null>(null)
const stepDropIndex = ref<number | null>(null)

// ──────────────────────────────────────────────
// Initialisation & sync
// ──────────────────────────────────────────────
const initFromProps = () => {
  const propsFields = props.modelValue ? [...props.modelValue] : []
  const propsSteps = props.steps

  if (propsSteps && propsSteps.length > 0) {
    isStepsMode.value = true
    const sorted = [...propsFields].sort((a, b) => a.sort - b.sort)

    // Preserve collapsed state from existing groups
    const existingCollapsed = new Map<number, boolean>()
    stepGroups.value.forEach((g, i) => existingCollapsed.set(i, g.collapsed))

    stepGroups.value = propsSteps.map((step, i) => ({
      step: { ...step },
      fields: sorted.filter(f => f.sort >= step.fieldRange[0] && f.sort <= step.fieldRange[1]),
      collapsed: existingCollapsed.get(i) ?? false,
    }))

    // Assign orphan fields to last step
    const assignedIds = new Set(stepGroups.value.flatMap(g => g.fields.map(f => f.id)))
    const unassigned = sorted.filter(f => !assignedIds.has(f.id))
    if (unassigned.length > 0 && stepGroups.value.length > 0) {
      stepGroups.value[stepGroups.value.length - 1].fields.push(...unassigned)
    }
  } else {
    isStepsMode.value = false
    fields.value = propsFields
    stepGroups.value = []
  }
}

initFromProps()

watch([() => props.modelValue, () => props.steps], () => {
  if (isSyncing.value) return
  initFromProps()
}, { deep: true })

// ──────────────────────────────────────────────
// Emit helpers
// ──────────────────────────────────────────────
const emitAll = () => {
  isSyncing.value = true

  if (isStepsMode.value && stepGroups.value.length > 0) {
    let sortIndex = 0
    const allFieldsOut: FormField[] = []
    const stepsOut: FormStepConfig[] = []

    for (const group of stepGroups.value) {
      const startSort = sortIndex
      for (const field of group.fields) {
        field.sort = sortIndex++
        allFieldsOut.push({ ...field })
      }
      const endSort = Math.max(startSort, sortIndex - 1)
      stepsOut.push({
        ...group.step,
        fieldRange: [startSort, endSort] as [number, number],
      })
    }

    emit('update:modelValue', allFieldsOut)
    emit('update:steps', stepsOut)
  } else {
    fields.value.forEach((f, i) => { f.sort = i })
    emit('update:modelValue', [...fields.value])
    emit('update:steps', null)
  }

  nextTick(() => { isSyncing.value = false })
  pushHistoryDebounced()
}

// Flat-mode only emit (same as original)
const emitFields = () => {
  isSyncing.value = true
  fields.value.forEach((f, i) => { f.sort = i })
  emit('update:modelValue', [...fields.value])
  nextTick(() => { isSyncing.value = false })
  pushHistoryDebounced()
}

// ──────────────────────────────────────────────
// Selection
// ──────────────────────────────────────────────
const allFields = computed(() => {
  if (isStepsMode.value) return stepGroups.value.flatMap(g => g.fields)
  return fields.value
})

const selectedField = computed(() => {
  if (!selectedFieldId.value) return null
  return allFields.value.find(f => f.id === selectedFieldId.value) || null
})

const selectedStep = computed(() => {
  if (selectedStepIndex.value === null) return null
  return stepGroups.value[selectedStepIndex.value]?.step || null
})

const selectField = (fieldId: string) => {
  selectedFieldId.value = fieldId
  selectedStepIndex.value = null
}

const selectStep = (stepIndex: number) => {
  selectedStepIndex.value = stepIndex
  selectedFieldId.value = null
}

// ──────────────────────────────────────────────
// ID & name generators
// ──────────────────────────────────────────────
const generateId = () => `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

const generateName = (label: string) =>
  label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')

// ──────────────────────────────────────────────
// Create a new field object
// ──────────────────────────────────────────────
const createField = (type: string): FormField => {
  const ft = fieldTypes.find(f => f.type === type)!
  return {
    id: generateId(),
    type: type as FormField['type'],
    label: ft.label,
    name: generateName(ft.label + '_' + allFields.value.length),
    placeholder: null,
    help_text: null,
    required: false,
    validation_rules: null,
    options: ['select', 'radio', 'checkbox_group'].includes(type)
      ? [{ label: 'Option 1', value: 'option_1' }, { label: 'Option 2', value: 'option_2' }]
      : null,
    conditional_logic: null,
    width: 'full',
    sort: allFields.value.length,
    layout: ['radio', 'checkbox_group'].includes(type) ? 'stacked' : undefined,
    visibility: { mode: 'always', condition: null },
    requirement: { mode: 'never', condition: null },
    default_value: null,
  }
}

// ──────────────────────────────────────────────
// Flat-mode field operations
// ──────────────────────────────────────────────
const addField = (type: string, index?: number) => {
  const newField = createField(type)
  if (typeof index === 'number') {
    fields.value.splice(index, 0, newField)
  } else {
    fields.value.push(newField)
  }
  fields.value.forEach((f, i) => { f.sort = i })
  selectedFieldId.value = newField.id
  selectedStepIndex.value = null
  emitFields()
}

const removeField = (id: string) => {
  const index = fields.value.findIndex(f => f.id === id)
  if (index > -1) {
    fields.value.splice(index, 1)
    if (selectedFieldId.value === id) selectedFieldId.value = null
    emitFields()
  }
}

const duplicateField = (id: string) => {
  const field = fields.value.find(f => f.id === id)
  if (!field) return
  const index = fields.value.findIndex(f => f.id === id)
  const newField: FormField = {
    ...JSON.parse(JSON.stringify(field)),
    id: generateId(),
    name: field.name + '_copy',
    sort: index + 1,
  }
  fields.value.splice(index + 1, 0, newField)
  fields.value.forEach((f, i) => { f.sort = i })
  selectedFieldId.value = newField.id
  emitFields()
}

const moveField = (id: string, direction: 'up' | 'down') => {
  const index = fields.value.findIndex(f => f.id === id)
  if (index === -1) return
  const newIndex = direction === 'up' ? index - 1 : index + 1
  if (newIndex < 0 || newIndex >= fields.value.length) return
  const temp = fields.value[index]
  fields.value[index] = fields.value[newIndex]
  fields.value[newIndex] = temp
  fields.value.forEach((f, i) => { f.sort = i })
  emitFields()
}

// ──────────────────────────────────────────────
// Step-mode field operations
// ──────────────────────────────────────────────
const addFieldToStep = (type: string, stepIndex: number, position?: number) => {
  const newField = createField(type)
  const group = stepGroups.value[stepIndex]
  if (!group) return
  const pos = position ?? group.fields.length
  group.fields.splice(pos, 0, newField)
  selectedFieldId.value = newField.id
  selectedStepIndex.value = null
  emitAll()
}

const removeFieldFromStep = (fieldId: string, stepIndex: number) => {
  const group = stepGroups.value[stepIndex]
  if (!group) return
  const idx = group.fields.findIndex(f => f.id === fieldId)
  if (idx > -1) {
    group.fields.splice(idx, 1)
    if (selectedFieldId.value === fieldId) selectedFieldId.value = null
    emitAll()
  }
}

const duplicateFieldInStep = (fieldId: string, stepIndex: number) => {
  const group = stepGroups.value[stepIndex]
  if (!group) return
  const idx = group.fields.findIndex(f => f.id === fieldId)
  if (idx === -1) return
  const field = group.fields[idx]
  const newField: FormField = {
    ...JSON.parse(JSON.stringify(field)),
    id: generateId(),
    name: field.name + '_copy',
    sort: 0,
  }
  group.fields.splice(idx + 1, 0, newField)
  selectedFieldId.value = newField.id
  emitAll()
}

const moveFieldInStep = (fieldId: string, stepIndex: number, direction: 'up' | 'down') => {
  const group = stepGroups.value[stepIndex]
  if (!group) return
  const idx = group.fields.findIndex(f => f.id === fieldId)
  if (idx === -1) return

  if (direction === 'up') {
    if (idx > 0) {
      // Swap within step
      ;[group.fields[idx], group.fields[idx - 1]] = [group.fields[idx - 1], group.fields[idx]]
      emitAll()
    } else if (stepIndex > 0) {
      // Move to previous step (at end)
      const [field] = group.fields.splice(idx, 1)
      stepGroups.value[stepIndex - 1].fields.push(field)
      emitAll()
    }
  } else {
    if (idx < group.fields.length - 1) {
      ;[group.fields[idx], group.fields[idx + 1]] = [group.fields[idx + 1], group.fields[idx]]
      emitAll()
    } else if (stepIndex < stepGroups.value.length - 1) {
      // Move to next step (at start)
      const [field] = group.fields.splice(idx, 1)
      stepGroups.value[stepIndex + 1].fields.unshift(field)
      emitAll()
    }
  }
}

// ──────────────────────────────────────────────
// Step operations
// ──────────────────────────────────────────────
const toggleStepsMode = (enabled: boolean) => {
  isStepsMode.value = enabled
  if (enabled) {
    stepGroups.value = [{
      step: { label: 'Step 1', fieldRange: [0, Math.max(0, fields.value.length - 1)] as [number, number], condition: null },
      fields: [...fields.value],
      collapsed: false,
    }]
    fields.value = []
  } else {
    const flat: FormField[] = []
    for (const group of stepGroups.value) flat.push(...group.fields)
    flat.forEach((f, i) => { f.sort = i })
    fields.value = flat
    stepGroups.value = []
    selectedStepIndex.value = null
  }
  emitAll()
}

const addNewStep = () => {
  stepGroups.value.push({
    step: { label: `Step ${stepGroups.value.length + 1}`, fieldRange: [0, 0] as [number, number], condition: null },
    fields: [],
    collapsed: false,
  })
  emitAll()
}

const removeStepGroup = (index: number) => {
  const group = stepGroups.value[index]
  if (group.fields.length > 0) {
    const targetIdx = index > 0 ? index - 1 : stepGroups.value.length > 1 ? 1 : -1
    if (targetIdx >= 0 && targetIdx !== index) {
      stepGroups.value[targetIdx].fields.push(...group.fields)
    }
  }
  stepGroups.value.splice(index, 1)
  if (stepGroups.value.length === 0) toggleStepsMode(false)
  if (selectedStepIndex.value === index) selectedStepIndex.value = null
  else if (selectedStepIndex.value !== null && selectedStepIndex.value > index) selectedStepIndex.value--
  emitAll()
}

const moveStepDirection = (index: number, direction: 'up' | 'down') => {
  const newIndex = direction === 'up' ? index - 1 : index + 1
  if (newIndex < 0 || newIndex >= stepGroups.value.length) return
  ;[stepGroups.value[index], stepGroups.value[newIndex]] = [stepGroups.value[newIndex], stepGroups.value[index]]
  if (selectedStepIndex.value === index) selectedStepIndex.value = newIndex
  else if (selectedStepIndex.value === newIndex) selectedStepIndex.value = index
  emitAll()
}

// ──────────────────────────────────────────────
// Drag & drop — palette
// ──────────────────────────────────────────────
const handlePaletteDragStart = (event: DragEvent, type: string) => {
  dragState.value = { type: 'palette', fieldType: type }
  event.dataTransfer!.effectAllowed = 'copy'
  event.dataTransfer!.setData('text/plain', type)
}

const handlePaletteClick = (type: string) => {
  if (isStepsMode.value) {
    const targetStep = selectedStepIndex.value !== null
      ? selectedStepIndex.value
      : stepGroups.value.length - 1
    if (targetStep >= 0) addFieldToStep(type, targetStep)
  } else {
    addField(type)
  }
}

// ──────────────────────────────────────────────
// Drag & drop — flat mode
// ──────────────────────────────────────────────
const handleFlatFieldDragStart = (event: DragEvent, fieldId: string) => {
  dragState.value = { type: 'field', fieldId }
  event.dataTransfer!.effectAllowed = 'move'
  event.dataTransfer!.setData('text/plain', fieldId)
}

const handleFlatFieldDragOver = (event: DragEvent, fieldIndex: number) => {
  event.preventDefault()
  if (!dragState.value) return
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const isAbove = event.clientY < rect.top + rect.height / 2
  flatDropIndex.value = isAbove ? fieldIndex : fieldIndex + 1
}

const handleFlatCanvasDragOver = (event: DragEvent) => {
  event.preventDefault()
  // If dragging over empty space below fields, set drop at end
  if (dragState.value && flatDropIndex.value === null) {
    flatDropIndex.value = fields.value.length
  }
}

const handleFlatCanvasDrop = (event: DragEvent) => {
  event.preventDefault()
  if (!dragState.value) { clearDrag(); return }

  const dropIdx = flatDropIndex.value ?? fields.value.length

  if (dragState.value.type === 'palette') {
    addField(dragState.value.fieldType!, dropIdx)
  } else if (dragState.value.type === 'field' && dragState.value.fieldId) {
    const fromIdx = fields.value.findIndex(f => f.id === dragState.value!.fieldId)
    if (fromIdx === -1) { clearDrag(); return }
    let toIdx = dropIdx
    if (fromIdx < toIdx) toIdx--
    if (fromIdx !== toIdx) {
      const [field] = fields.value.splice(fromIdx, 1)
      fields.value.splice(toIdx, 0, field)
      fields.value.forEach((f, i) => { f.sort = i })
      emitFields()
    }
  }
  clearDrag()
}

// ──────────────────────────────────────────────
// Drag & drop — step mode (fields)
// ──────────────────────────────────────────────
const handleStepFieldDragStart = (event: DragEvent, fieldId: string, stepIndex: number) => {
  event.stopPropagation()
  dragState.value = { type: 'field', fieldId, sourceStepIndex: stepIndex }
  event.dataTransfer!.effectAllowed = 'move'
  event.dataTransfer!.setData('text/plain', fieldId)
}

const handleFieldRowDragOver = (event: DragEvent, stepIndex: number, fieldIndex: number) => {
  event.preventDefault()
  event.stopPropagation()
  if (!dragState.value || dragState.value.type === 'step') return
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const isAbove = event.clientY < rect.top + rect.height / 2
  fieldDropTarget.value = { stepIndex, fieldIndex: isAbove ? fieldIndex : fieldIndex + 1 }
}

const handleStepBodyDragOver = (event: DragEvent, stepIndex: number) => {
  event.preventDefault()
  if (!dragState.value || dragState.value.type === 'step') return
  // Only set if we're not already over a field row
  fieldDropTarget.value = { stepIndex, fieldIndex: stepGroups.value[stepIndex].fields.length }
}

const handleStepBodyDrop = (event: DragEvent, stepIndex: number) => {
  event.preventDefault()
  event.stopPropagation()
  if (!dragState.value || !fieldDropTarget.value) { clearDrag(); return }

  const { stepIndex: targetStep, fieldIndex: targetPos } = fieldDropTarget.value

  if (dragState.value.type === 'palette') {
    addFieldToStep(dragState.value.fieldType!, targetStep, targetPos)
  } else if (dragState.value.type === 'field' && dragState.value.fieldId) {
    const srcStep = dragState.value.sourceStepIndex!
    const srcGroup = stepGroups.value[srcStep]
    const srcIdx = srcGroup.fields.findIndex(f => f.id === dragState.value!.fieldId)
    if (srcIdx === -1) { clearDrag(); return }

    let adjustedPos = targetPos
    if (srcStep === targetStep && srcIdx < targetPos) adjustedPos--
    if (srcStep === targetStep && srcIdx === adjustedPos) { clearDrag(); return }

    const [field] = srcGroup.fields.splice(srcIdx, 1)
    stepGroups.value[targetStep].fields.splice(adjustedPos, 0, field)
    emitAll()
  }

  clearDrag()
}

// ──────────────────────────────────────────────
// Drag & drop — step reordering
// ──────────────────────────────────────────────
const handleStepDragStart = (event: DragEvent, stepIndex: number) => {
  dragState.value = { type: 'step', stepIndex }
  event.dataTransfer!.effectAllowed = 'move'
  event.dataTransfer!.setData('text/plain', String(stepIndex))
}

const handleStepHeaderDragOver = (event: DragEvent, stepIndex: number) => {
  event.preventDefault()
  if (!dragState.value || dragState.value.type !== 'step') return
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const isAbove = event.clientY < rect.top + rect.height / 2
  stepDropIndex.value = isAbove ? stepIndex : stepIndex + 1
}

const handleCanvasDrop = (event: DragEvent) => {
  event.preventDefault()
  if (!dragState.value) { clearDrag(); return }

  if (dragState.value.type === 'step' && stepDropIndex.value !== null) {
    const from = dragState.value.stepIndex!
    let to = stepDropIndex.value
    if (from === to || from === to - 1) { clearDrag(); return }
    const [moved] = stepGroups.value.splice(from, 1)
    const adjustedTo = to > from ? to - 1 : to
    stepGroups.value.splice(adjustedTo, 0, moved)
    if (selectedStepIndex.value === from) selectedStepIndex.value = adjustedTo
    emitAll()
  } else if (dragState.value.type === 'palette' && isStepsMode.value) {
    // Dropped on canvas but not inside a step — add to last step
    const lastIdx = stepGroups.value.length - 1
    if (lastIdx >= 0) addFieldToStep(dragState.value.fieldType!, lastIdx)
  }

  clearDrag()
}

const clearDrag = () => {
  dragState.value = null
  flatDropIndex.value = null
  fieldDropTarget.value = null
  stepDropIndex.value = null
}

const isFieldDropIndicator = (stepIndex: number, fieldIndex: number) => {
  return fieldDropTarget.value?.stepIndex === stepIndex && fieldDropTarget.value?.fieldIndex === fieldIndex
}

// ──────────────────────────────────────────────
// Update field property (works for both modes)
// ──────────────────────────────────────────────
const updateField = (id: string, updates: Partial<FormField>) => {
  const field = allFields.value.find(f => f.id === id)
  if (field) {
    Object.assign(field, updates)
    if (isStepsMode.value) emitAll()
    else emitFields()
  }
}

// ──────────────────────────────────────────────
// Step settings helpers
// ──────────────────────────────────────────────
const updateStepProp = (updates: Partial<FormStepConfig>) => {
  if (selectedStepIndex.value === null) return
  const step = stepGroups.value[selectedStepIndex.value]?.step
  if (!step) return
  Object.assign(step, updates)
  emitAll()
}

const toggleSelectedStepCondition = (enabled: boolean) => {
  if (selectedStepIndex.value === null) return
  const step = stepGroups.value[selectedStepIndex.value]?.step
  if (!step) return
  step.condition = enabled ? { field: '', operator: 'equals', value: '' } : null
  emitAll()
}

const updateStepCondition = (key: string, value: string) => {
  if (selectedStepIndex.value === null) return
  const cond = stepGroups.value[selectedStepIndex.value]?.step?.condition
  if (!cond) return
  ;(cond as any)[key] = value
  if (key === 'field') cond.value = ''
  emitAll()
}

// ──────────────────────────────────────────────
// Field settings helpers
// ──────────────────────────────────────────────
const otherFields = computed(() =>
  allFields.value.filter(f => f.id !== selectedFieldId.value && f.type !== 'heading' && f.type !== 'paragraph')
)

const conditionableFields = computed(() =>
  allFields.value.filter(f => f.type !== 'heading' && f.type !== 'paragraph')
)

const getFieldValues = (fieldName: string): Array<{ label: string; value: string }> => {
  const f = allFields.value.find(field => field.name === fieldName)
  if (!f) return []
  if (f.type === 'checkbox') return [{ label: 'Checked (true)', value: 'true' }, { label: 'Unchecked (false)', value: 'false' }]
  if (f.options && f.options.length > 0) return f.options
  return []
}

// ── Visibility helpers ──
const getVisibilityMode = computed((): 'always' | 'when' | 'never' => {
  if (!selectedField.value) return 'always'
  if (selectedField.value.visibility) return selectedField.value.visibility.mode
  // Backward compat
  const cl = selectedField.value.conditional_logic as ConditionRule | null
  if (cl && cl.field) return 'when'
  return 'always'
})

const getVisibilityCondition = computed((): ConditionRule | null => {
  if (!selectedField.value) return null
  if (selectedField.value.visibility?.condition) return selectedField.value.visibility.condition
  const cl = selectedField.value.conditional_logic as ConditionRule | null
  if (cl && cl.field) return cl
  return null
})

const setVisibilityMode = (mode: string) => {
  if (!selectedField.value) return
  const condition: ConditionRule | null = mode === 'when'
    ? (getVisibilityCondition.value || { field: '', operator: 'equals', value: '' })
    : null
  updateField(selectedField.value.id, {
    visibility: { mode: mode as any, condition },
    conditional_logic: mode === 'when' && condition ? { ...condition } : null,
  })
}

const updateVisibilityCondition = (key: string, val: string) => {
  if (!selectedField.value?.visibility?.condition) return
  const updated = { ...selectedField.value.visibility.condition, [key]: val } as ConditionRule
  if (key === 'field') updated.value = ''
  updateField(selectedField.value.id, {
    visibility: { mode: 'when', condition: updated },
    conditional_logic: { ...updated },
  })
}

// ── Requirement helpers ──
const getRequirementMode = computed((): 'always' | 'when' | 'never' => {
  if (!selectedField.value) return 'never'
  if (selectedField.value.requirement) return selectedField.value.requirement.mode
  return selectedField.value.required ? 'always' : 'never'
})

const getRequirementCondition = computed((): ConditionRule | null => {
  if (!selectedField.value?.requirement?.condition) return null
  return selectedField.value.requirement.condition
})

const setRequirementMode = (mode: string) => {
  if (!selectedField.value) return
  const condition: ConditionRule | null = mode === 'when'
    ? (getRequirementCondition.value || { field: '', operator: 'equals', value: '' })
    : null
  updateField(selectedField.value.id, {
    requirement: { mode: mode as any, condition },
    required: mode === 'always',
  })
}

const updateRequirementCondition = (key: string, val: string) => {
  if (!selectedField.value?.requirement?.condition) return
  const updated = { ...selectedField.value.requirement.condition, [key]: val } as ConditionRule
  if (key === 'field') updated.value = ''
  updateField(selectedField.value.id, {
    requirement: { mode: 'when', condition: updated },
    required: false,
  })
}

// ── Options helpers ──
const addOption = () => {
  if (!selectedField.value) return
  if (!selectedField.value.options) selectedField.value.options = []
  const n = selectedField.value.options.length + 1
  selectedField.value.options.push({ label: `Option ${n}`, value: `option_${n}` })
  if (isStepsMode.value) emitAll()
  else emitFields()
}

const removeOption = (index: number) => {
  if (!selectedField.value?.options) return
  selectedField.value.options.splice(index, 1)
  if (isStepsMode.value) emitAll()
  else emitFields()
}

// Find which step a field is in
const findFieldStep = (fieldId: string): number => {
  for (let i = 0; i < stepGroups.value.length; i++) {
    if (stepGroups.value[i].fields.some(f => f.id === fieldId)) return i
  }
  return -1
}

// Resolve whether a field shows as required (for preview indicators)
const isFieldEffectivelyRequired = (field: FormField): boolean => {
  if (field.requirement) return field.requirement.mode === 'always' || field.requirement.mode === 'when'
  return field.required
}

// ──────────────────────────────────────────────
// Search & filter
// ──────────────────────────────────────────────
const searchQuery = ref('')

const matchesSearch = (field: FormField): boolean => {
  if (!searchQuery.value) return true
  const q = searchQuery.value.toLowerCase()
  return field.label.toLowerCase().includes(q)
    || field.name.toLowerCase().includes(q)
    || field.type.toLowerCase().includes(q)
}

// ──────────────────────────────────────────────
// Undo / Redo
// ──────────────────────────────────────────────
interface HistorySnapshot {
  fields: string
  stepGroups: string
  isStepsMode: boolean
}

const history = ref<HistorySnapshot[]>([])
const historyIndex = ref(0)
const isRestoring = ref(false)
const maxHistory = 50

const takeSnapshot = (): HistorySnapshot => ({
  fields: JSON.stringify(fields.value),
  stepGroups: JSON.stringify(stepGroups.value),
  isStepsMode: isStepsMode.value,
})

// Initial snapshot
history.value = [takeSnapshot()]

let historyTimer: ReturnType<typeof setTimeout> | null = null
const pushHistoryDebounced = () => {
  if (isRestoring.value) return
  if (historyTimer) clearTimeout(historyTimer)
  historyTimer = setTimeout(() => {
    const snap = takeSnapshot()
    // Don't push if identical to last
    if (historyIndex.value >= 0 && historyIndex.value < history.value.length) {
      const last = history.value[historyIndex.value]
      if (last.fields === snap.fields && last.stepGroups === snap.stepGroups && last.isStepsMode === snap.isStepsMode) return
    }
    // Trim future entries if we undid then made a new change
    if (historyIndex.value < history.value.length - 1) {
      history.value = history.value.slice(0, historyIndex.value + 1)
    }
    history.value.push(snap)
    if (history.value.length > maxHistory) history.value.shift()
    historyIndex.value = history.value.length - 1
  }, 300)
}

const canUndo = computed(() => historyIndex.value > 0)
const canRedo = computed(() => historyIndex.value < history.value.length - 1)

const restoreSnapshot = (snap: HistorySnapshot) => {
  isRestoring.value = true
  isSyncing.value = true
  fields.value = JSON.parse(snap.fields)
  stepGroups.value = JSON.parse(snap.stepGroups)
  isStepsMode.value = snap.isStepsMode

  // Re-emit to parent
  if (isStepsMode.value && stepGroups.value.length > 0) {
    let sortIndex = 0
    const allFieldsOut: FormField[] = []
    const stepsOut: FormStepConfig[] = []
    for (const group of stepGroups.value) {
      const startSort = sortIndex
      for (const field of group.fields) {
        field.sort = sortIndex++
        allFieldsOut.push({ ...field })
      }
      const endSort = Math.max(startSort, sortIndex - 1)
      stepsOut.push({ ...group.step, fieldRange: [startSort, endSort] as [number, number] })
    }
    emit('update:modelValue', allFieldsOut)
    emit('update:steps', stepsOut)
  } else {
    fields.value.forEach((f, i) => { f.sort = i })
    emit('update:modelValue', [...fields.value])
    emit('update:steps', null)
  }

  nextTick(() => {
    isSyncing.value = false
    isRestoring.value = false
  })
}

const undo = () => {
  if (!canUndo.value) return
  historyIndex.value--
  restoreSnapshot(history.value[historyIndex.value])
}

const redo = () => {
  if (!canRedo.value) return
  historyIndex.value++
  restoreSnapshot(history.value[historyIndex.value])
}

// Keyboard shortcuts
const handleKeyboard = (e: KeyboardEvent) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
    e.preventDefault()
    undo()
  }
  if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
    e.preventDefault()
    redo()
  }
}

onMounted(() => window.addEventListener('keydown', handleKeyboard))
onUnmounted(() => window.removeEventListener('keydown', handleKeyboard))

// ──────────────────────────────────────────────
// Bulk selection
// ──────────────────────────────────────────────
const bulkSelectedIds = ref<Set<string>>(new Set())

const toggleBulkSelect = (fieldId: string) => {
  const s = new Set(bulkSelectedIds.value)
  if (s.has(fieldId)) s.delete(fieldId)
  else s.add(fieldId)
  bulkSelectedIds.value = s
}

const selectAllVisible = () => {
  bulkSelectedIds.value = new Set(allFields.value.filter(matchesSearch).map(f => f.id))
}

const clearBulkSelection = () => {
  bulkSelectedIds.value = new Set()
}

const bulkDelete = () => {
  if (isStepsMode.value) {
    for (const group of stepGroups.value) {
      group.fields = group.fields.filter(f => !bulkSelectedIds.value.has(f.id))
    }
    emitAll()
  } else {
    fields.value = fields.value.filter(f => !bulkSelectedIds.value.has(f.id))
    emitFields()
  }
  if (selectedFieldId.value && bulkSelectedIds.value.has(selectedFieldId.value)) {
    selectedFieldId.value = null
  }
  clearBulkSelection()
}

const bulkSetVisibility = (mode: 'always' | 'never') => {
  for (const field of allFields.value) {
    if (bulkSelectedIds.value.has(field.id)) {
      field.visibility = { mode, condition: null }
      field.conditional_logic = null
    }
  }
  if (isStepsMode.value) emitAll()
  else emitFields()
}

const bulkSetRequirement = (mode: 'always' | 'never') => {
  for (const field of allFields.value) {
    if (bulkSelectedIds.value.has(field.id)) {
      field.requirement = { mode, condition: null }
      field.required = mode === 'always'
    }
  }
  if (isStepsMode.value) emitAll()
  else emitFields()
}

// Ctrl/Cmd + Click for multi-select
const handleFieldClick = (fieldId: string, event: MouseEvent) => {
  if (event.ctrlKey || event.metaKey) {
    toggleBulkSelect(fieldId)
    return
  }
  bulkSelectedIds.value = new Set()
  selectField(fieldId)
}

// ──────────────────────────────────────────────
// Condition summary & validation
// ──────────────────────────────────────────────
const conditionSummary = (condition: ConditionRule | null | undefined): string => {
  if (!condition || !condition.field) return ''
  const sourceField = allFields.value.find(f => f.name === condition.field)
  const fieldLabel = sourceField?.label || condition.field
  const opMap: Record<string, string> = {
    equals: '=', not_equals: '\u2260', includes: 'includes', includes_any: 'includes any of',
  }
  const op = opMap[condition.operator] || condition.operator
  let valueLabel = condition.value
  if (sourceField?.options) {
    const opt = sourceField.options.find(o => o.value === condition.value)
    if (opt) valueLabel = opt.label
  }
  if (sourceField?.type === 'checkbox') {
    valueLabel = condition.value === 'true' ? 'checked' : 'unchecked'
  }
  return `${fieldLabel} ${op} ${valueLabel}`
}

const getFieldConditionWarnings = (field: FormField): string[] => {
  const warnings: string[] = []
  const check = (cond: ConditionRule | null | undefined, label: string) => {
    if (!cond || !cond.field) return
    const exists = allFields.value.some(f => f.name === cond.field)
    if (!exists) warnings.push(`${label} references missing field "${cond.field}"`)
    else if (!cond.value) warnings.push(`${label} has no value set`)
  }
  check(field.visibility?.condition, 'Visibility')
  check(field.requirement?.condition, 'Requirement')
  return warnings
}

// ──────────────────────────────────────────────
// Field dependency map
// ──────────────────────────────────────────────
const fieldDependents = computed(() => {
  const map: Record<string, string[]> = {}
  for (const field of allFields.value) {
    const visCond = field.visibility?.condition
    if (visCond?.field) {
      if (!map[visCond.field]) map[visCond.field] = []
      map[visCond.field].push(field.label)
    }
    const reqCond = field.requirement?.condition
    if (reqCond?.field) {
      if (!map[reqCond.field]) map[reqCond.field] = []
      map[reqCond.field].push(field.label)
    }
  }
  return map
})

// ──────────────────────────────────────────────
// Layout preview helper
// ──────────────────────────────────────────────
const getPreviewLayoutClass = (field: FormField): string => {
  const layout = field.layout || 'stacked'
  switch (layout) {
    case 'two-columns': return 'grid grid-cols-2 gap-2'
    case 'three-columns': return 'grid grid-cols-3 gap-2'
    case 'four-columns': return 'grid grid-cols-4 gap-2'
    case 'side-by-side': return 'flex flex-wrap gap-x-4 gap-y-2'
    default: return 'space-y-2'
  }
}
</script>

<template>
  <div class="flex h-[calc(100vh-10rem)] bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
    <!-- ════════════ Left Panel: Field Palette ════════════ -->
    <div class="w-64 border-r border-slate-200/80 bg-slate-50/60 flex flex-col">
      <!-- Multi-step toggle -->
      <div class="p-4 border-b border-slate-200/60">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <Icon name="lucide:layers" class="w-4 h-4 text-slate-400" />
            <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Multi-Step</span>
          </div>
          <Switch
            :checked="isStepsMode"
            @update:checked="toggleStepsMode"
          />
        </div>
      </div>

      <!-- Field types -->
      <div class="flex-1 overflow-y-auto p-5">
        <h3 class="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">Add Fields</h3>
        <div class="space-y-1.5">
          <button
            v-for="fieldType in fieldTypes"
            :key="fieldType.type"
            draggable="true"
            class="flex items-center gap-3 w-full p-3 rounded-xl border border-slate-200/80 bg-white hover:border-primary-300 hover:bg-primary-50 transition-all duration-200 cursor-grab active:cursor-grabbing"
            @dragstart="handlePaletteDragStart($event, fieldType.type)"
            @click="handlePaletteClick(fieldType.type)"
          >
            <Icon :name="fieldType.icon" class="w-4 h-4 text-slate-400" />
            <span class="text-sm text-slate-600">{{ fieldType.label }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- ════════════ Center Panel: Canvas ════════════ -->
    <div
      class="flex-1 overflow-y-auto p-8"
      @dragend="clearDrag"
    >

      <!-- Search bar + undo/redo -->
      <div class="flex items-center gap-2 mb-4 max-w-2xl mx-auto">
        <div class="relative flex-1">
          <Icon name="lucide:search" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
          <Input
            :model-value="searchQuery"
            @update:model-value="searchQuery = $event"
            placeholder="Search fields..."
            class="pl-9 h-9 text-sm"
          />
          <button v-if="searchQuery" class="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-slate-100" @click="searchQuery = ''">
            <Icon name="lucide:x" class="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
        <div class="flex items-center gap-0.5">
          <button
            :disabled="!canUndo"
            :class="['p-2 rounded-lg transition-colors', canUndo ? 'hover:bg-slate-100 text-slate-600' : 'text-slate-300 cursor-not-allowed']"
            title="Undo (Ctrl+Z)"
            @click="undo"
          >
            <Icon name="lucide:undo-2" class="w-4 h-4" />
          </button>
          <button
            :disabled="!canRedo"
            :class="['p-2 rounded-lg transition-colors', canRedo ? 'hover:bg-slate-100 text-slate-600' : 'text-slate-300 cursor-not-allowed']"
            title="Redo (Ctrl+Y)"
            @click="redo"
          >
            <Icon name="lucide:redo-2" class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- Bulk actions toolbar -->
      <Transition
        enter-active-class="transition-all duration-200 ease-out"
        leave-active-class="transition-all duration-150 ease-in"
        enter-from-class="opacity-0 -translate-y-1"
        enter-to-class="opacity-100 translate-y-0"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 -translate-y-1"
      >
        <div v-if="bulkSelectedIds.size > 0" class="flex items-center gap-2 mb-4 max-w-2xl mx-auto p-3 bg-primary-50 border border-primary-200 rounded-xl">
          <span class="text-sm font-medium text-primary-700">{{ bulkSelectedIds.size }} selected</span>
          <button class="text-xs text-primary-500 hover:underline" @click="selectAllVisible">Select all</button>
          <div class="flex-1" />
          <Button variant="secondary" size="sm" @click="bulkSetVisibility('always')">
            <Icon name="lucide:eye" class="w-3.5 h-3.5" />
            Show
          </Button>
          <Button variant="secondary" size="sm" @click="bulkSetVisibility('never')">
            <Icon name="lucide:eye-off" class="w-3.5 h-3.5" />
            Hide
          </Button>
          <Button variant="secondary" size="sm" @click="bulkSetRequirement('always')">Require</Button>
          <Button variant="secondary" size="sm" @click="bulkSetRequirement('never')">Optional</Button>
          <Button variant="secondary" size="sm" class="text-red-600 hover:bg-red-50" @click="bulkDelete">
            <Icon name="lucide:trash-2" class="w-3.5 h-3.5" />
          </Button>
          <button class="p-1 rounded hover:bg-primary-100 transition-colors" @click="clearBulkSelection">
            <Icon name="lucide:x" class="w-4 h-4 text-primary-500" />
          </button>
        </div>
      </Transition>

      <!-- ──── FLAT MODE (no steps) ──── -->
      <template v-if="!isStepsMode">
        <div
          v-if="fields.length === 0"
          class="h-full flex items-center justify-center"
          @drop="handleFlatCanvasDrop"
          @dragover.prevent
        >
          <div class="text-center">
            <Icon name="lucide:mouse-pointer-click" class="w-12 h-12 mx-auto text-slate-200 mb-5" />
            <p class="text-slate-400 text-sm">Drag fields here or click to add</p>
          </div>
        </div>

        <div
          v-else
          class="space-y-3 max-w-2xl mx-auto"
          @drop="handleFlatCanvasDrop"
          @dragover="handleFlatCanvasDragOver"
        >
          <template v-for="(field, index) in fields" :key="field.id">
            <!-- Drop indicator -->
            <div
              v-if="flatDropIndex === index"
              class="h-1 bg-primary-400 rounded-full mx-4 transition-all"
            />

            <!-- Field card -->
            <div
              v-show="matchesSearch(field)"
              :class="[
                'relative p-5 rounded-xl border-2 transition-all duration-200 cursor-pointer',
                dragState?.type === 'field' && dragState.fieldId === field.id
                  ? 'opacity-40'
                  : '',
                bulkSelectedIds.has(field.id)
                  ? 'border-primary-400 bg-primary-50/50 ring-2 ring-primary-200'
                  : selectedFieldId === field.id
                    ? 'border-primary-500 bg-primary-50/30 shadow-sm'
                    : 'border-slate-200/80 hover:border-slate-300'
              ]"
              draggable="true"
              @dragstart="handleFlatFieldDragStart($event, field.id)"
              @dragover="handleFlatFieldDragOver($event, index)"
              @click="handleFieldClick(field.id, $event)"
            >
              <!-- Drag handle indicator -->
              <div class="absolute left-1.5 top-1/2 -translate-y-1/2 opacity-30 hover:opacity-60 transition-opacity">
                <Icon name="lucide:grip-vertical" class="w-4 h-4 text-slate-400" />
              </div>

              <!-- Field preview -->
              <div class="pointer-events-none pl-4">
                <template v-if="field.type === 'heading'">
                  <h3 class="text-lg font-semibold text-slate-900">{{ field.label }}</h3>
                  <p v-if="field.help_text" class="text-sm text-slate-500 mt-1">{{ field.help_text }}</p>
                </template>
                <template v-else-if="field.type === 'paragraph'">
                  <p class="text-slate-700">{{ field.label }}</p>
                </template>
                <template v-else>
                  <div class="flex items-start justify-between gap-2 mb-1.5">
                    <label class="block text-sm font-medium text-slate-700">
                      {{ field.label }}
                      <span v-if="isFieldEffectivelyRequired(field)" class="text-red-500 ml-0.5">*</span>
                    </label>
                    <div class="flex items-center gap-1 flex-shrink-0">
                      <!-- Dependency indicator -->
                      <span
                        v-if="fieldDependents[field.name]?.length"
                        class="text-[10px] font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded inline-flex items-center gap-0.5"
                        :title="`Controls: ${fieldDependents[field.name].join(', ')}`"
                      >
                        <Icon name="lucide:git-branch" class="w-3 h-3" />
                        {{ fieldDependents[field.name].length }}
                      </span>
                      <!-- Visibility badge -->
                      <span
                        v-if="field.visibility?.mode === 'when' && field.visibility.condition?.field"
                        class="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded truncate max-w-[140px]"
                        :title="'Shown when ' + conditionSummary(field.visibility.condition)"
                      >
                        <Icon name="lucide:eye" class="w-3 h-3 inline" />
                        {{ conditionSummary(field.visibility.condition) }}
                      </span>
                      <span
                        v-else-if="field.visibility?.mode === 'never'"
                        class="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded"
                      >
                        <Icon name="lucide:eye-off" class="w-3 h-3 inline" /> Hidden
                      </span>
                      <!-- Requirement badge -->
                      <span
                        v-if="field.requirement?.mode === 'when' && field.requirement.condition?.field"
                        class="text-[10px] text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded truncate max-w-[140px]"
                        :title="'Required when ' + conditionSummary(field.requirement.condition)"
                      >
                        Required*
                      </span>
                    </div>
                  </div>
                  <input
                    v-if="['text', 'email', 'phone', 'number', 'date'].includes(field.type)"
                    :type="field.type"
                    :placeholder="field.placeholder || ''"
                    disabled
                    class="w-full h-10 rounded-lg border border-slate-300 bg-slate-50 px-3 text-sm"
                  />
                  <textarea
                    v-else-if="field.type === 'textarea'"
                    :placeholder="field.placeholder || ''"
                    disabled
                    class="w-full h-24 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm resize-none"
                  />
                  <select
                    v-else-if="field.type === 'select'"
                    disabled
                    class="w-full h-10 rounded-lg border border-slate-300 bg-slate-50 px-3 text-sm"
                  >
                    <option>{{ field.placeholder || 'Select an option' }}</option>
                  </select>
                  <div v-else-if="field.type === 'checkbox'" class="flex items-center gap-2">
                    <div class="w-5 h-5 rounded border border-slate-300 bg-slate-50" />
                    <span class="text-sm text-slate-700">{{ field.label }}</span>
                  </div>
                  <div v-else-if="field.type === 'checkbox_group'" :class="getPreviewLayoutClass(field)">
                    <div v-for="option in field.options" :key="option.value" class="flex items-center gap-2">
                      <div class="w-5 h-5 rounded border border-slate-300 bg-slate-50 flex-shrink-0" />
                      <span class="text-sm text-slate-700">{{ option.label }}</span>
                    </div>
                  </div>
                  <div v-else-if="field.type === 'radio'" :class="getPreviewLayoutClass(field)">
                    <div v-for="option in field.options" :key="option.value" class="flex items-center gap-2">
                      <div class="w-5 h-5 rounded-full border border-slate-300 bg-slate-50 flex-shrink-0" />
                      <span class="text-sm text-slate-700">{{ option.label }}</span>
                    </div>
                  </div>
                  <div v-else-if="field.type === 'file'" class="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
                    <Icon name="lucide:upload-cloud" class="w-8 h-8 mx-auto text-slate-400 mb-2" />
                    <p class="text-sm text-slate-500">Click to upload or drag and drop</p>
                  </div>
                  <p v-if="field.help_text" class="text-sm text-slate-500 mt-1.5">{{ field.help_text }}</p>
                </template>
              </div>

              <!-- Field actions -->
              <div v-if="selectedFieldId === field.id" class="absolute top-2 right-2 flex items-center gap-1">
                <button class="p-1.5 rounded hover:bg-slate-200 transition-colors" title="Move up" @click.stop="moveField(field.id, 'up')">
                  <Icon name="lucide:chevron-up" class="w-4 h-4 text-slate-500" />
                </button>
                <button class="p-1.5 rounded hover:bg-slate-200 transition-colors" title="Move down" @click.stop="moveField(field.id, 'down')">
                  <Icon name="lucide:chevron-down" class="w-4 h-4 text-slate-500" />
                </button>
                <button class="p-1.5 rounded hover:bg-slate-200 transition-colors" title="Duplicate" @click.stop="duplicateField(field.id)">
                  <Icon name="lucide:copy" class="w-4 h-4 text-slate-500" />
                </button>
                <button class="p-1.5 rounded hover:bg-red-100 transition-colors" title="Delete" @click.stop="removeField(field.id)">
                  <Icon name="lucide:trash-2" class="w-4 h-4 text-red-500" />
                </button>
              </div>
            </div>
          </template>

          <!-- Drop indicator at end -->
          <div
            v-if="flatDropIndex === fields.length"
            class="h-1 bg-primary-400 rounded-full mx-4 transition-all"
          />
        </div>
      </template>

      <!-- ──── STEP MODE ──── -->
      <template v-else>
        <div
          class="space-y-4 max-w-2xl mx-auto"
          @drop="handleCanvasDrop"
          @dragover.prevent
        >
          <!-- Empty state -->
          <div
            v-if="stepGroups.length === 0"
            class="h-64 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl"
          >
            <div class="text-center">
              <Icon name="lucide:layers" class="w-12 h-12 mx-auto text-slate-200 mb-4" />
              <p class="text-slate-400 text-sm mb-3">No steps yet</p>
              <Button variant="secondary" size="sm" @click="addNewStep">
                <Icon name="lucide:plus" class="w-4 h-4" />
                Add First Step
              </Button>
            </div>
          </div>

          <template v-for="(group, stepIndex) in stepGroups" :key="stepIndex">
            <!-- Step drop indicator (between steps) -->
            <div
              v-if="stepDropIndex === stepIndex"
              class="h-1 bg-primary-500 rounded-full mx-2 transition-all"
            />

            <!-- Step container -->
            <div
              :class="[
                'rounded-xl border-2 border-l-4 overflow-hidden transition-all duration-200',
                accent(stepIndex).border,
                dragState?.type === 'step' && dragState.stepIndex === stepIndex
                  ? 'opacity-40'
                  : '',
                selectedStepIndex === stepIndex && selectedFieldId === null
                  ? 'border-primary-500 shadow-sm'
                  : 'border-slate-200/80',
              ]"
            >
              <!-- Step header -->
              <div
                :class="[
                  'flex items-center gap-2 px-3 py-2.5 cursor-pointer select-none transition-colors',
                  accent(stepIndex).bg,
                ]"
                draggable="true"
                @dragstart="handleStepDragStart($event, stepIndex)"
                @dragover="handleStepHeaderDragOver($event, stepIndex)"
                @click="selectStep(stepIndex)"
              >
                <Icon name="lucide:grip-vertical" class="w-4 h-4 text-slate-300 cursor-grab flex-shrink-0" />

                <span
                  :class="[
                    'text-[10px] font-bold rounded px-1.5 py-0.5 flex-shrink-0',
                    accent(stepIndex).badge,
                  ]"
                >
                  {{ stepIndex + 1 }}
                </span>

                <span class="font-medium text-sm text-slate-700 flex-1 truncate">
                  {{ group.step.label }}
                </span>

                <span v-if="group.step.condition" class="text-amber-500 flex-shrink-0" title="Has condition">
                  <Icon name="lucide:eye" class="w-3.5 h-3.5" />
                </span>

                <span class="text-xs text-slate-400 flex-shrink-0">
                  {{ group.fields.length }} field{{ group.fields.length !== 1 ? 's' : '' }}
                </span>

                <div class="flex items-center gap-0.5 flex-shrink-0">
                  <button
                    class="p-1 rounded hover:bg-white/60 transition-colors"
                    title="Move up"
                    @click.stop="moveStepDirection(stepIndex, 'up')"
                  >
                    <Icon name="lucide:chevron-up" class="w-3.5 h-3.5 text-slate-400" />
                  </button>
                  <button
                    class="p-1 rounded hover:bg-white/60 transition-colors"
                    title="Move down"
                    @click.stop="moveStepDirection(stepIndex, 'down')"
                  >
                    <Icon name="lucide:chevron-down" class="w-3.5 h-3.5 text-slate-400" />
                  </button>
                  <button
                    class="p-1 rounded hover:bg-white/60 transition-colors"
                    @click.stop="group.collapsed = !group.collapsed"
                  >
                    <Icon
                      :name="group.collapsed ? 'lucide:chevron-down' : 'lucide:chevron-up'"
                      class="w-3.5 h-3.5 text-slate-400"
                    />
                  </button>
                  <button
                    v-if="stepGroups.length > 1"
                    class="p-1 rounded hover:bg-red-100 transition-colors"
                    title="Remove step"
                    @click.stop="removeStepGroup(stepIndex)"
                  >
                    <Icon name="lucide:trash-2" class="w-3.5 h-3.5 text-red-400" />
                  </button>
                </div>
              </div>

              <!-- Step body (fields) -->
              <div
                v-show="!group.collapsed"
                class="p-2.5 space-y-1.5 min-h-[48px]"
                @dragover.prevent="handleStepBodyDragOver($event, stepIndex)"
                @drop="handleStepBodyDrop($event, stepIndex)"
              >
                <template v-for="(field, fieldIndex) in group.fields" :key="field.id">
                  <!-- Field drop indicator -->
                  <div
                    v-if="isFieldDropIndicator(stepIndex, fieldIndex)"
                    class="h-1 bg-primary-400 rounded-full mx-3 transition-all"
                  />

                  <!-- Compact field row -->
                  <div
                    v-show="matchesSearch(field)"
                    :class="[
                      'group flex items-center gap-2 p-2.5 rounded-lg border transition-all duration-150 cursor-pointer',
                      dragState?.type === 'field' && dragState.fieldId === field.id
                        ? 'opacity-40'
                        : '',
                      bulkSelectedIds.has(field.id)
                        ? 'border-primary-400 bg-primary-50/50 ring-1 ring-primary-200'
                        : selectedFieldId === field.id
                          ? 'border-primary-400 bg-primary-50/50 shadow-sm'
                          : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50/50',
                    ]"
                    draggable="true"
                    @dragstart="handleStepFieldDragStart($event, field.id, stepIndex)"
                    @dragover="handleFieldRowDragOver($event, stepIndex, fieldIndex)"
                    @click="handleFieldClick(field.id, $event)"
                  >
                    <Icon name="lucide:grip-vertical" class="w-3.5 h-3.5 text-slate-300 cursor-grab flex-shrink-0" />

                    <Icon :name="getFieldIcon(field.type)" class="w-4 h-4 text-slate-400 flex-shrink-0" />

                    <span class="text-sm text-slate-700 flex-1 truncate">{{ field.label }}</span>

                    <!-- Dependency indicator -->
                    <span
                      v-if="fieldDependents[field.name]?.length"
                      class="text-[10px] font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded flex-shrink-0 inline-flex items-center gap-0.5"
                      :title="`Controls: ${fieldDependents[field.name].join(', ')}`"
                    >
                      <Icon name="lucide:git-branch" class="w-3 h-3" />
                      {{ fieldDependents[field.name].length }}
                    </span>

                    <span
                      v-if="field.requirement?.mode === 'always' || (!field.requirement && field.required)"
                      class="text-[10px] font-medium text-red-500 bg-red-50 px-1.5 py-0.5 rounded flex-shrink-0"
                    >
                      Required
                    </span>
                    <span
                      v-else-if="field.requirement?.mode === 'when'"
                      class="text-[10px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded flex-shrink-0"
                      :title="'Required when ' + conditionSummary(field.requirement.condition)"
                    >
                      Required*
                    </span>

                    <span
                      v-if="field.visibility?.mode === 'when' || (!field.visibility && field.conditional_logic)"
                      class="text-amber-500 flex-shrink-0"
                      :title="field.visibility?.condition ? 'Shown when ' + conditionSummary(field.visibility.condition) : 'Conditionally visible'"
                    >
                      <Icon name="lucide:eye" class="w-3 h-3" />
                    </span>
                    <span
                      v-else-if="field.visibility?.mode === 'never'"
                      class="text-slate-400 flex-shrink-0"
                      title="Always hidden"
                    >
                      <Icon name="lucide:eye-off" class="w-3 h-3" />
                    </span>

                    <span class="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded flex-shrink-0">
                      {{ getFieldTypeLabel(field.type) }}
                    </span>

                    <!-- Actions (visible on hover) -->
                    <div class="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <button
                        class="p-1 rounded hover:bg-slate-200 transition-colors"
                        title="Move up"
                        @click.stop="moveFieldInStep(field.id, stepIndex, 'up')"
                      >
                        <Icon name="lucide:chevron-up" class="w-3.5 h-3.5 text-slate-400" />
                      </button>
                      <button
                        class="p-1 rounded hover:bg-slate-200 transition-colors"
                        title="Move down"
                        @click.stop="moveFieldInStep(field.id, stepIndex, 'down')"
                      >
                        <Icon name="lucide:chevron-down" class="w-3.5 h-3.5 text-slate-400" />
                      </button>
                      <button
                        class="p-1 rounded hover:bg-slate-200 transition-colors"
                        title="Duplicate"
                        @click.stop="duplicateFieldInStep(field.id, stepIndex)"
                      >
                        <Icon name="lucide:copy" class="w-3.5 h-3.5 text-slate-400" />
                      </button>
                      <button
                        class="p-1 rounded hover:bg-red-100 transition-colors"
                        title="Delete"
                        @click.stop="removeFieldFromStep(field.id, stepIndex)"
                      >
                        <Icon name="lucide:trash-2" class="w-3.5 h-3.5 text-red-400" />
                      </button>
                    </div>
                  </div>
                </template>

                <!-- Field drop indicator at end -->
                <div
                  v-if="isFieldDropIndicator(stepIndex, group.fields.length)"
                  class="h-1 bg-primary-400 rounded-full mx-3 transition-all"
                />

                <!-- Empty step placeholder -->
                <div
                  v-if="group.fields.length === 0 && !isFieldDropIndicator(stepIndex, 0)"
                  class="flex items-center justify-center py-6 border-2 border-dashed border-slate-200 rounded-lg"
                >
                  <p class="text-xs text-slate-400">Drag fields here or click a field type to add</p>
                </div>
              </div>
            </div>
          </template>

          <!-- Step drop indicator at end -->
          <div
            v-if="stepDropIndex === stepGroups.length"
            class="h-1 bg-primary-500 rounded-full mx-2 transition-all"
          />

          <!-- Add step button -->
          <button
            class="w-full p-3 border-2 border-dashed border-slate-200 rounded-xl text-sm text-slate-400 hover:border-primary-300 hover:text-primary-500 hover:bg-primary-50/30 transition-all duration-200 flex items-center justify-center gap-2"
            @click="addNewStep"
          >
            <Icon name="lucide:plus" class="w-4 h-4" />
            Add Step
          </button>
        </div>
      </template>
    </div>

    <!-- ════════════ Right Panel: Settings ════════════ -->
    <div class="w-80 border-l border-slate-200/80 bg-white overflow-y-auto">

      <!-- Nothing selected -->
      <div v-if="!selectedField && selectedStepIndex === null" class="p-8 text-center text-slate-400">
        <Icon name="lucide:settings-2" class="w-10 h-10 mx-auto text-slate-200 mb-5" />
        <p class="text-sm">Select a field or step to edit its settings</p>
      </div>

      <!-- ── Step settings ── -->
      <div v-else-if="selectedStepIndex !== null && !selectedField && selectedStep" class="p-5 space-y-5">
        <h3 class="text-xs font-semibold text-slate-400 uppercase tracking-widest">Step Settings</h3>

        <!-- Label -->
        <div>
          <Label class="text-xs text-slate-500 mb-1">Step Label</Label>
          <Input
            :model-value="selectedStep.label"
            @update:model-value="updateStepProp({ label: $event })"
            placeholder="e.g., Personal Information"
          />
        </div>

        <!-- Icon (optional) -->
        <div>
          <Label class="text-xs text-slate-500 mb-1">Step Icon (optional)</Label>
          <Input
            :model-value="selectedStep.icon || ''"
            @update:model-value="updateStepProp({ icon: $event || undefined })"
            placeholder="e.g., lucide:user"
          />
        </div>

        <!-- Fields in this step (read-only summary) -->
        <div>
          <Label class="text-xs text-slate-500 mb-2">Fields in This Step</Label>
          <div class="space-y-1">
            <div
              v-for="field in stepGroups[selectedStepIndex!]?.fields || []"
              :key="field.id"
              class="flex items-center gap-2 text-xs text-slate-500 py-1"
            >
              <Icon :name="getFieldIcon(field.type)" class="w-3.5 h-3.5 text-slate-400" />
              <span class="truncate">{{ field.label }}</span>
            </div>
            <p v-if="(stepGroups[selectedStepIndex!]?.fields || []).length === 0" class="text-xs text-slate-400 italic">
              No fields in this step
            </p>
          </div>
        </div>

        <!-- Conditional visibility -->
        <div class="border-t border-slate-200 pt-5">
          <div class="flex items-center justify-between mb-3">
            <Label class="text-xs text-slate-500">Conditional Visibility</Label>
            <Switch
              :checked="!!selectedStep.condition"
              @update:checked="toggleSelectedStepCondition"
            />
          </div>

          <div v-if="selectedStep.condition" class="space-y-3 bg-slate-50 rounded-lg p-3">
            <p class="text-xs text-slate-500">Show this step when:</p>

            <!-- Source field -->
            <Select
              :model-value="selectedStep.condition.field"
              @update:model-value="updateStepCondition('field', $event)"
            >
              <SelectTrigger class="text-xs">
                <SelectValue placeholder="Select a field..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="f in conditionableFields"
                  :key="f.id"
                  :value="f.name"
                >
                  {{ f.label }}
                </SelectItem>
              </SelectContent>
            </Select>

            <!-- Operator -->
            <Select
              :model-value="selectedStep.condition.operator"
              @update:model-value="updateStepCondition('operator', $event)"
            >
              <SelectTrigger class="text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="equals">equals</SelectItem>
                <SelectItem value="not_equals">does not equal</SelectItem>
                <SelectItem value="includes">includes</SelectItem>
                <SelectItem value="includes_any">includes any of</SelectItem>
              </SelectContent>
            </Select>

            <!-- Value -->
            <template v-if="selectedStep.condition.field">
              <Select
                v-if="getFieldValues(selectedStep.condition.field).length > 0"
                :model-value="selectedStep.condition.value"
                @update:model-value="updateStepCondition('value', $event)"
              >
                <SelectTrigger class="text-xs">
                  <SelectValue placeholder="Select a value..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="opt in getFieldValues(selectedStep.condition.field)"
                    :key="opt.value"
                    :value="opt.value"
                  >
                    {{ opt.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
              <Input
                v-else
                :model-value="selectedStep.condition.value"
                @update:model-value="updateStepCondition('value', $event)"
                placeholder="Enter a value..."
                class="text-xs"
              />
            </template>
          </div>
        </div>
      </div>

      <!-- ── Field settings ── -->
      <div v-else-if="selectedField" class="p-5 space-y-5">
        <h3 class="text-xs font-semibold text-slate-400 uppercase tracking-widest">Field Settings</h3>

        <!-- Step assignment (only in step mode) -->
        <div v-if="isStepsMode" class="text-xs text-slate-400">
          In: <span class="font-medium text-slate-600">{{ stepGroups[findFieldStep(selectedField.id)]?.step.label || 'Unknown' }}</span>
        </div>

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

        <!-- Default Value -->
        <div v-if="!['heading', 'paragraph', 'file'].includes(selectedField.type)">
          <Label class="text-xs text-slate-500 mb-1">Default Value</Label>
          <template v-if="selectedField.type === 'checkbox'">
            <div class="flex items-center gap-2 mt-1">
              <Checkbox
                :checked="selectedField.default_value === true"
                @update:checked="updateField(selectedField.id, { default_value: $event || null })"
              />
              <span class="text-sm text-slate-600">Checked by default</span>
            </div>
          </template>
          <template v-else-if="selectedField.type === 'select' || selectedField.type === 'radio'">
            <Select
              :model-value="(selectedField.default_value as string) || ''"
              @update:model-value="updateField(selectedField.id, { default_value: $event || null })"
            >
              <SelectTrigger class="text-xs">
                <SelectValue placeholder="No default" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No default</SelectItem>
                <SelectItem v-for="opt in selectedField.options" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </template>
          <template v-else>
            <Input
              :model-value="(selectedField.default_value as string) || ''"
              @update:model-value="updateField(selectedField.id, { default_value: $event || null })"
              placeholder="No default value"
              class="text-sm"
            />
          </template>
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

        <!-- Options for select/radio/checkbox_group -->
        <div v-if="['select', 'radio', 'checkbox_group'].includes(selectedField.type)">
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

        <!-- Options Layout (radio / checkbox_group only) -->
        <div v-if="['radio', 'checkbox_group'].includes(selectedField.type)">
          <Label class="text-xs text-slate-500 mb-1">Options Layout</Label>
          <Select
            :model-value="selectedField.layout || 'stacked'"
            @update:model-value="updateField(selectedField.id, { layout: $event as FormField['layout'] })"
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="stacked">Stacked (1 Column)</SelectItem>
              <SelectItem value="two-columns">2 Columns</SelectItem>
              <SelectItem value="three-columns">3 Columns</SelectItem>
              <SelectItem value="four-columns">4 Columns</SelectItem>
              <SelectItem value="side-by-side">Side by Side</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- ── Show This Field ── -->
        <div v-if="!['heading', 'paragraph'].includes(selectedField.type)" class="border-t border-slate-200 pt-5">
          <Label class="text-xs text-slate-500 mb-2">Show This Field</Label>
          <Select
            :model-value="getVisibilityMode"
            @update:model-value="setVisibilityMode($event)"
          >
            <SelectTrigger class="text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="always">Always</SelectItem>
              <SelectItem value="when">When...</SelectItem>
              <SelectItem value="never">Never</SelectItem>
            </SelectContent>
          </Select>

          <div v-if="getVisibilityMode === 'when'" class="space-y-3 bg-slate-50 rounded-lg p-3 mt-3">
            <p class="text-xs text-slate-500">Show this field when:</p>

            <Select
              :model-value="getVisibilityCondition?.field || ''"
              @update:model-value="updateVisibilityCondition('field', $event)"
            >
              <SelectTrigger class="text-xs">
                <SelectValue placeholder="Select a field..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="f in otherFields" :key="f.id" :value="f.name">
                  {{ f.label }}
                </SelectItem>
              </SelectContent>
            </Select>

            <Select
              :model-value="getVisibilityCondition?.operator || 'equals'"
              @update:model-value="updateVisibilityCondition('operator', $event)"
            >
              <SelectTrigger class="text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="equals">equals</SelectItem>
                <SelectItem value="not_equals">does not equal</SelectItem>
                <SelectItem value="includes">includes</SelectItem>
                <SelectItem value="includes_any">includes any of</SelectItem>
              </SelectContent>
            </Select>

            <template v-if="getVisibilityCondition?.field">
              <Select
                v-if="getFieldValues(getVisibilityCondition.field).length > 0"
                :model-value="getVisibilityCondition?.value || ''"
                @update:model-value="updateVisibilityCondition('value', $event)"
              >
                <SelectTrigger class="text-xs">
                  <SelectValue placeholder="Select a value..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="opt in getFieldValues(getVisibilityCondition!.field)"
                    :key="opt.value"
                    :value="opt.value"
                  >
                    {{ opt.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
              <Input
                v-else
                :model-value="getVisibilityCondition?.value || ''"
                @update:model-value="updateVisibilityCondition('value', $event)"
                placeholder="Enter a value..."
                class="text-xs"
              />
            </template>
          </div>
        </div>

        <!-- ── Require This Field ── -->
        <div v-if="!['heading', 'paragraph'].includes(selectedField.type)" class="border-t border-slate-200 pt-5">
          <Label class="text-xs text-slate-500 mb-2">Require This Field</Label>
          <Select
            :model-value="getRequirementMode"
            @update:model-value="setRequirementMode($event)"
          >
            <SelectTrigger class="text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="always">Always</SelectItem>
              <SelectItem value="when">When...</SelectItem>
              <SelectItem value="never">Never</SelectItem>
            </SelectContent>
          </Select>

          <div v-if="getRequirementMode === 'when'" class="space-y-3 bg-slate-50 rounded-lg p-3 mt-3">
            <p class="text-xs text-slate-500">Require this field when:</p>

            <Select
              :model-value="getRequirementCondition?.field || ''"
              @update:model-value="updateRequirementCondition('field', $event)"
            >
              <SelectTrigger class="text-xs">
                <SelectValue placeholder="Select a field..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="f in otherFields" :key="f.id" :value="f.name">
                  {{ f.label }}
                </SelectItem>
              </SelectContent>
            </Select>

            <Select
              :model-value="getRequirementCondition?.operator || 'equals'"
              @update:model-value="updateRequirementCondition('operator', $event)"
            >
              <SelectTrigger class="text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="equals">equals</SelectItem>
                <SelectItem value="not_equals">does not equal</SelectItem>
                <SelectItem value="includes">includes</SelectItem>
                <SelectItem value="includes_any">includes any of</SelectItem>
              </SelectContent>
            </Select>

            <template v-if="getRequirementCondition?.field">
              <Select
                v-if="getFieldValues(getRequirementCondition.field).length > 0"
                :model-value="getRequirementCondition?.value || ''"
                @update:model-value="updateRequirementCondition('value', $event)"
              >
                <SelectTrigger class="text-xs">
                  <SelectValue placeholder="Select a value..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="opt in getFieldValues(getRequirementCondition!.field)"
                    :key="opt.value"
                    :value="opt.value"
                  >
                    {{ opt.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
              <Input
                v-else
                :model-value="getRequirementCondition?.value || ''"
                @update:model-value="updateRequirementCondition('value', $event)"
                placeholder="Enter a value..."
                class="text-xs"
              />
            </template>
          </div>
        </div>

        <!-- Condition validation warnings -->
        <div v-if="getFieldConditionWarnings(selectedField).length > 0" class="border-t border-amber-200 pt-4">
          <div class="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-1.5">
            <div class="flex items-center gap-1.5 text-amber-700">
              <Icon name="lucide:alert-triangle" class="w-3.5 h-3.5 flex-shrink-0" />
              <span class="text-xs font-medium">Condition Warnings</span>
            </div>
            <p
              v-for="(warning, wIdx) in getFieldConditionWarnings(selectedField)"
              :key="wIdx"
              class="text-xs text-amber-600 pl-5"
            >
              {{ warning }}
            </p>
          </div>
        </div>

        <!-- Field dependencies info -->
        <div v-if="fieldDependents[selectedField.name]?.length" class="border-t border-slate-200 pt-4">
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div class="flex items-center gap-1.5 text-blue-700 mb-1.5">
              <Icon name="lucide:git-branch" class="w-3.5 h-3.5 flex-shrink-0" />
              <span class="text-xs font-medium">Controls {{ fieldDependents[selectedField.name].length }} field{{ fieldDependents[selectedField.name].length !== 1 ? 's' : '' }}</span>
            </div>
            <p class="text-xs text-blue-600 pl-5">
              {{ fieldDependents[selectedField.name].join(', ') }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
