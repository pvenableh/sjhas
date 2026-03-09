<script setup lang="ts">
import type { FormStep } from '~/components/forms/DynamicForm.vue'
import { taxServicesDefaultForm, taxServicesDefaultSteps } from '~/composables/useTaxServicesForm'

// Fetch the tax planning form from Directus CMS
// Falls back to the hardcoded default if CMS form is unavailable
const { data: cmsForm } = await useAsyncData('tax-planning-form', async () => {
  try {
    return await useDirectusForm('tax-planning')
  } catch (error) {
    console.error('Failed to fetch tax planning form:', error)
    return null
  }
})

// Use CMS form if available, otherwise fall back to hardcoded default
const displayForm = computed(() => cmsForm.value || taxServicesDefaultForm)

// Steps: use CMS steps if the form has them, otherwise use the hardcoded defaults
const formSteps = computed<FormStep[]>(() => {
  const cmsSteps = cmsForm.value?.steps
  if (cmsSteps && cmsSteps.length > 0) {
    return cmsSteps.map((step) => ({
      label: step.label,
      icon: step.icon,
      fieldRange: step.fieldRange,
      condition: step.condition && step.condition.field ? step.condition : undefined,
    }))
  }
  return taxServicesDefaultSteps
})

const dynamicFormRef = ref<{ activeSteps: FormStep[]; currentStep: number; isSuccess: boolean } | null>(null)

const isFormSuccess = computed(() => dynamicFormRef.value?.isSuccess ?? false)

const currentStep = ref(0)

const displayedSteps = computed(() => {
  if (!dynamicFormRef.value) {
    // Before mount, show only unconditional steps
    return formSteps.value.filter((s) => !s.condition)
  }
  return dynamicFormRef.value.activeSteps as FormStep[]
})

const onStepChange = (step: number) => {
  currentStep.value = step
}

const handleSubmitted = (data: Record<string, unknown>) => {
  console.log('Tax services questionnaire submitted:', data)
}

// SEO
useSeoMeta({
  title: 'Tax Services Questionnaire - SJHAS, Inc.',
  description: 'Complete our Tax Services Questionnaire so we can best serve your tax and payroll needs.',
  ogTitle: 'Tax Services Questionnaire - SJHAS, Inc.',
  ogDescription: 'Complete our Tax Services Questionnaire so we can best serve your tax and payroll needs.',
  ogType: 'website',
  ogSiteName: 'SJHAS, Inc.',
  twitterCard: 'summary_large_image',
  twitterTitle: 'Tax Services Questionnaire - SJHAS, Inc.',
  twitterDescription: 'Complete our Tax Services Questionnaire so we can best serve your tax and payroll needs.',
})

defineOgImage({
  component: 'Sjhas',
  title: 'Tax Services Questionnaire',
  description: 'SJHAS, Inc. - Accounting & Tax Services',
})
</script>

<template>
  <div class="min-h-screen t-bg">
    <!-- Hero -->
    <Transition name="fade-slide">
      <section v-if="!isFormSuccess" class="t-hero py-20 lg:py-28">
        <div class="container-wide section-padding text-center">
          <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full t-hero-badge text-sm font-medium mb-6">
            <Icon name="lucide:clipboard-list" class="w-4 h-4" />
            <span>Tax Services</span>
          </div>
          <h1 class="text-3xl sm:text-4xl lg:text-5xl t-heading t-hero-text mb-4">
            {{ displayForm.title }}
          </h1>
          <p class="text-lg t-hero-text-secondary max-w-2xl mx-auto">
            {{ displayForm.description }}
          </p>
        </div>
      </section>
    </Transition>

    <!-- Progress indicator -->
    <Transition name="fade-slide">
      <section v-if="!isFormSuccess" class="t-bg-elevated border-b t-border py-4">
        <div class="container-wide section-padding">
          <div class="flex items-center justify-center gap-4 sm:gap-8 text-sm flex-wrap">
            <template v-for="(step, index) in displayedSteps" :key="step.label">
              <div
                class="flex items-center gap-2"
                :class="index <= currentStep ? 't-text-accent' : 't-text-muted'"
              >
                <div
                  class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium"
                  :class="index <= currentStep ? 't-btn' : 't-bg-alt'"
                >
                  <Icon v-if="index < currentStep" name="lucide:check" class="w-3.5 h-3.5" />
                  <span v-else>{{ index + 1 }}</span>
                </div>
                <span class="hidden sm:inline" :class="index <= currentStep ? 'font-medium' : ''">
                  {{ step.label }}
                </span>
              </div>
              <div
                v-if="index < displayedSteps.length - 1"
                class="w-8 h-px hidden sm:block"
                :style="{ backgroundColor: index < currentStep ? 'var(--theme-accent, var(--theme-primary))' : 'var(--theme-border-secondary)' }"
              />
            </template>
          </div>
        </div>
      </section>
    </Transition>

    <!-- Form section -->
    <section class="py-12 lg:py-20">
      <div class="container-narrow section-padding">
        <Card class="p-6 sm:p-8 lg:p-10">
          <FormsDynamicForm
            ref="dynamicFormRef"
            :form="displayForm"
            :steps="formSteps"
            @submitted="handleSubmitted"
            @update:current-step="onStepChange"
          />
        </Card>

        <!-- Help text -->
        <div class="mt-8 t-section-card rounded-xl p-6 border">
          <div class="flex items-start gap-4">
            <div class="w-10 h-10 rounded-lg t-icon-box flex items-center justify-center flex-shrink-0">
              <Icon name="lucide:help-circle" class="w-5 h-5" />
            </div>
            <div>
              <h3 class="font-semibold t-text mb-1">Need Help?</h3>
              <p class="text-sm t-text-secondary mb-3">
                If you have questions about this questionnaire or need assistance, we're here to help.
              </p>
              <div class="flex flex-wrap gap-4">
                <a
                  href="mailto:sjh@sjhas.com"
                  class="inline-flex items-center gap-2 text-sm t-text-accent font-medium t-link"
                >
                  <Icon name="lucide:mail" class="w-4 h-4" />
                  sjh@sjhas.com
                </a>
                <a
                  href="tel:6072168033"
                  class="inline-flex items-center gap-2 text-sm t-text-accent font-medium t-link"
                >
                  <Icon name="lucide:phone" class="w-4 h-4" />
                  (607) 216-8033
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
