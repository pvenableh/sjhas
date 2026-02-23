<script setup lang="ts">
import { ref, computed } from 'vue'
import { toast } from 'vue-sonner'
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-vue-next'

definePageMeta({
  middleware: 'guest',
  layout: 'auth',
})

useSeoMeta({
  title: 'Reset Password - SJHAS, Inc.',
})

const route = useRoute()
const { resetPassword } = useDirectusAuth()

const token = computed(() => (route.query.token as string) || '')
const isInvalidToken = ref(!token.value)

const password = ref('')
const confirmPassword = ref('')
const isLoading = ref(false)
const isSuccess = ref(false)
const errorMessage = ref('')

const handleSubmit = async () => {
  errorMessage.value = ''

  if (!password.value) {
    errorMessage.value = 'Please enter a new password'
    return
  }

  if (password.value.length < 8) {
    errorMessage.value = 'Password must be at least 8 characters'
    return
  }

  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'Passwords do not match'
    return
  }

  isLoading.value = true

  try {
    await resetPassword(token.value, password.value)
    isSuccess.value = true
    toast.success('Password reset successfully!')
  } catch (error: any) {
    errorMessage.value = error.message || 'Failed to reset password. The link may have expired.'
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
        <NuxtLink to="/" class="inline-flex items-center gap-2">
          <div class="w-12 h-12 rounded-lg bg-primary-600 flex items-center justify-center">
            <span class="text-white font-bold text-xl">S</span>
          </div>
          <span class="font-sans text-2xl text-slate-900">SJHAS, Inc.</span>
        </NuxtLink>
      </div>

      <!-- Invalid token -->
      <template v-if="isInvalidToken">
        <div class="bg-card text-card-foreground rounded-lg border shadow-sm p-6 text-center">
          <AlertCircle class="w-12 h-12 mx-auto text-red-400 mb-4" />
          <h3 class="text-lg font-semibold mb-2">Invalid Reset Link</h3>
          <p class="text-sm text-muted-foreground mb-6">
            This password reset link is invalid or has expired. Please request a new one.
          </p>
          <NuxtLink
            to="/auth/forgot-password"
            class="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Request new link
          </NuxtLink>
        </div>
      </template>

      <!-- Success state -->
      <template v-else-if="isSuccess">
        <div class="bg-card text-card-foreground rounded-lg border shadow-sm p-6 text-center">
          <CheckCircle2 class="w-12 h-12 mx-auto text-green-500 mb-4" />
          <h3 class="text-lg font-semibold mb-2">Password Reset</h3>
          <p class="text-sm text-muted-foreground mb-6">
            Your password has been reset successfully. You can now sign in with your new password.
          </p>
          <NuxtLink
            to="/auth/login"
            class="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Sign in
          </NuxtLink>
        </div>
      </template>

      <!-- Reset form -->
      <template v-else>
        <div class="bg-card text-card-foreground rounded-lg border shadow-sm">
          <div class="flex flex-col space-y-1.5 p-6">
            <h3 class="text-2xl font-semibold leading-none tracking-tight">Reset password</h3>
            <p class="text-sm text-muted-foreground">Enter your new password below</p>
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
                  <AlertCircle class="h-4 w-4 flex-shrink-0" />
                  <span>{{ errorMessage }}</span>
                </div>
              </Transition>

              <div class="space-y-2">
                <label for="password" class="text-sm font-medium leading-none">New password</label>
                <input
                  id="password"
                  v-model="password"
                  type="password"
                  placeholder="At least 8 characters"
                  class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                />
              </div>

              <div class="space-y-2">
                <label for="confirm-password" class="text-sm font-medium leading-none">Confirm password</label>
                <input
                  id="confirm-password"
                  v-model="confirmPassword"
                  type="password"
                  placeholder="Re-enter your password"
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
                {{ isLoading ? 'Resetting...' : 'Reset password' }}
              </button>
            </form>
          </div>
        </div>
      </template>

      <p class="mt-6 text-center text-sm text-slate-500">
        <NuxtLink to="/auth/login" class="text-primary-600 hover:text-primary-700">
          &larr; Back to login
        </NuxtLink>
      </p>
    </div>
  </div>
</template>
