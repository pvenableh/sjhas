<script setup lang="ts">
import { ref } from 'vue'
import { toast } from 'vue-sonner'
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-vue-next'

definePageMeta({
  middleware: 'guest',
  layout: 'auth',
})

useSeoMeta({
  title: 'Create Account - SJHAS, Inc.',
})

const { register } = useDirectusAuth()
const { trackSignUp } = useAnalytics()
const router = useRouter()

const form = ref({
  first_name: '',
  last_name: '',
  email: '',
  password: '',
  confirmPassword: '',
  phone: '',
})

const isLoading = ref(false)
const errorMessage = ref('')

const handleSubmit = async () => {
  errorMessage.value = ''

  if (!form.value.first_name.trim() || !form.value.last_name.trim()) {
    errorMessage.value = 'First and last name are required'
    return
  }

  if (!form.value.email.trim()) {
    errorMessage.value = 'Email is required'
    return
  }

  if (!form.value.password) {
    errorMessage.value = 'Password is required'
    return
  }

  if (form.value.password.length < 8) {
    errorMessage.value = 'Password must be at least 8 characters'
    return
  }

  if (form.value.password !== form.value.confirmPassword) {
    errorMessage.value = 'Passwords do not match'
    return
  }

  isLoading.value = true

  try {
    await register({
      first_name: form.value.first_name.trim(),
      last_name: form.value.last_name.trim(),
      email: form.value.email.trim(),
      password: form.value.password,
      phone: form.value.phone.trim() || undefined,
    })

    trackSignUp()
    toast.success('Account created! Please sign in.')
    router.push('/auth/login')
  } catch (error: any) {
    const msg = error.message || 'Registration failed. Please try again.'
    errorMessage.value = msg
    toast.error(msg)
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
        <p class="mt-2 text-slate-600">Create your account</p>
      </div>

      <div class="bg-card text-card-foreground rounded-lg border shadow-sm">
        <div class="flex flex-col space-y-1.5 p-6">
          <h3 class="text-2xl font-semibold leading-none tracking-tight">Sign up</h3>
          <p class="text-sm text-muted-foreground">
            Enter your information to create an account
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
                <AlertCircle class="h-4 w-4 flex-shrink-0" />
                <span>{{ errorMessage }}</span>
              </div>
            </Transition>

            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <label for="first_name" class="text-sm font-medium leading-none">First name</label>
                <input
                  id="first_name"
                  v-model="form.first_name"
                  type="text"
                  placeholder="John"
                  class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                />
              </div>
              <div class="space-y-2">
                <label for="last_name" class="text-sm font-medium leading-none">Last name</label>
                <input
                  id="last_name"
                  v-model="form.last_name"
                  type="text"
                  placeholder="Doe"
                  class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                />
              </div>
            </div>

            <div class="space-y-2">
              <label for="email" class="text-sm font-medium leading-none">Email</label>
              <input
                id="email"
                v-model="form.email"
                type="email"
                placeholder="m@example.com"
                class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
              />
            </div>

            <div class="space-y-2">
              <label for="phone" class="text-sm font-medium leading-none">
                Phone <span class="text-muted-foreground font-normal">(optional)</span>
              </label>
              <input
                id="phone"
                v-model="form.phone"
                type="tel"
                placeholder="(555) 123-4567"
                class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div class="space-y-2">
              <label for="password" class="text-sm font-medium leading-none">Password</label>
              <input
                id="password"
                v-model="form.password"
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
                v-model="form.confirmPassword"
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
              {{ isLoading ? 'Creating account...' : 'Create account' }}
            </button>

            <p class="text-center text-sm text-muted-foreground">
              Already have an account?
              <NuxtLink to="/auth/login" class="text-foreground underline-offset-4 hover:underline font-medium">
                Sign in
              </NuxtLink>
            </p>
          </form>
        </div>
      </div>

      <p class="mt-6 text-center text-sm text-slate-500">
        <NuxtLink to="/" class="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700">
          <ArrowLeft class="h-3.5 w-3.5" />
          Back to website
        </NuxtLink>
      </p>
    </div>
  </div>
</template>
