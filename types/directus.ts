/**
 * Custom type extensions for Directus schema.
 *
 * The base schema is auto-generated into ./directus-schema.ts by:
 *   pnpm generate:types
 *
 * This file re-exports everything from the generated schema and adds
 * hand-maintained types that the generator does not produce (e.g. FormField,
 * the Collections alias).
 */

// Re-export all generated types
export * from './directus-schema'

// Re-export Schema under the alias used by the Directus SDK client
export { Schema as Collections } from './directus-schema'

// Import Form so we can augment it
import type { Form as GeneratedForm } from './directus-schema'

/**
 * A single field definition inside a Form's `fields` JSON column.
 */
export interface FormField {
	id: string
	type:
		| 'text'
		| 'email'
		| 'phone'
		| 'number'
		| 'date'
		| 'textarea'
		| 'select'
		| 'checkbox'
		| 'checkbox_group'
		| 'radio'
		| 'file'
		| 'heading'
		| 'paragraph'
	label: string
	name: string
	placeholder: string | null
	help_text: string | null
	required: boolean
	validation_rules: Array<{
		type: string
		value: string | number
		message: string
	}> | null
	options: Array<{
		label: string
		value: string
	}> | null
	conditional_logic: Record<string, unknown> | null
	width: 'full' | 'half' | 'third'
	sort: number
}

/**
 * A step condition that controls whether a step is visible.
 */
export interface FormStepConfig {
	label: string
	icon?: string
	/** Sort range [min, max] inclusive — fields with sort values in this range belong to this step */
	fieldRange: [number, number]
	/** Optional condition — step is only shown when the condition is met */
	condition?: {
		field: string
		operator: 'includes' | 'includes_any' | 'equals' | 'not_equals'
		value: string
	} | null
}

/**
 * Override the generated Form interface so `fields` and `steps` are properly typed.
 */
export interface Form extends Omit<GeneratedForm, 'fields' | 'steps'> {
	fields: FormField[] | null
	steps?: FormStepConfig[] | null
}
