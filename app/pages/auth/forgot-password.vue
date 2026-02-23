<script setup lang="ts">
import { ref } from 'vue'
import { toast } from 'vue-sonner'
import { Loader2, ArrowLeft, CheckCircle2 } from 'lucide-vue-next'

definePageMeta({
  middleware: 'guest',
  layout: 'auth',
})

useSeoMeta({
  title: 'Forgot Password - SJHAS, Inc.',
})

const { requestPasswordReset } = useDirectusAuth()

const email = ref('')
const isLoading = ref(false)
const isSubmitted = ref(false)
const errorMessage = ref('')

const handleSubmit = async () => {
  errorMessage.value = ''

  if (!email.value.trim()) {
    errorMessage.value = 'Please enter your email address'
    return
  }

  isLoading.value = true

  try {
    await requestPasswordReset(email.value.trim())
    isSubmitted.value = true
    toast.success('Check your email for a reset link')
  } catch (error: any) {
    // Always show success to avoid revealing if email exists
    isSubmitted.value = true
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="w-full max-w-md">
      <!-- Logo -->
      <div class="text-center mb-8">
        <NuxtLink to="/" class="inline-flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl t-bg-accent flex items-center justify-center">
            <span class="t-text-inverse font-extralight text-lg t-heading">S</span>
          </div>
          <span class="t-heading text-xl t-text tracking-[0.04em]">SJHAS, Inc.</span>
        </NuxtLink>
      </div>

      <!-- Success state -->
      <div v-if="isSubmitted" class="bg-card text-card-foreground rounded-lg border shadow-sm p-6 text-center">
        <CheckCircle2 class="w-12 h-12 mx-auto text-green-500 mb-4" />
        <h3 class="text-lg font-semibold mb-2">Check your email</h3>
        <p class="text-sm text-muted-foreground mb-6">
          If an account exists for <span class="font-medium">{{ email }}</span>,
          we've sent a password reset link. Please check your inbox and spam folder.
        </p>
        <NuxtLink
          to="/auth/login"
          class="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Back to login
        </NuxtLink>
      </div>

      <!-- Form state -->
      <div v-else class="bg-card text-card-foreground rounded-lg border shadow-sm">
        <div class="flex flex-col space-y-1.5 p-6">
          <h3 class="text-2xl font-semibold leading-none tracking-tight">Forgot password</h3>
          <p class="text-sm text-muted-foreground">
            Enter your email and we'll send you a link to reset your password
          </p>
        </div>
        <div class="p-6 pt-0">
          <form class="space-y-4" @submit.prevent="handleSubmit">
            <Transition
              enter-active-class="transition-all duration-300 ease-out"
              leave-active-class="transition-all duration-200 ease-in"
              enter-from-class="opacity-0 -translate-y-2"
              enter-to-class="opacity-100 translate-y-0"
              leave-from-class="opacity-100 translate-y-0"
              leave-to-class="opacity-0 -translate-y-2"
            >
              <div
                v-if="errorMessage"
                class="flex items-center gap-2 p-3 mb-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md"
              >
                <span>{{ errorMessage }}</span>
              </div>
            </Transition>

            <div class="space-y-2">
              <label for="email" class="text-sm font-medium leading-none">Email</label>
              <input
                id="email"
                v-model="email"
                type="email"
                placeholder="m@example.com"
                class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
              />
            </div>

            <button
              type="submit"
              :disabled="isLoading"
              class="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
            >
              <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
              {{ isLoading ? 'Sending...' : 'Send reset link' }}
            </button>
          </form>
        </div>
      </div>

      <p class="mt-6 text-center text-sm text-slate-500">
        <NuxtLink to="/auth/login" class="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700">
          <ArrowLeft class="h-3.5 w-3.5" />
          Back to login
        </NuxtLink>
      </p>
    </div>
  </div>
</template>
