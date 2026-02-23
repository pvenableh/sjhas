<script setup lang="ts">
import { ref } from 'vue'
import { toast } from 'vue-sonner'

definePageMeta({
  middleware: 'guest',
  layout: 'auth',
})

useSeoMeta({
  title: 'Client Login - SJHAS, Inc.',
})

const { login, user } = useDirectusAuth()
const router = useRouter()
const route = useRoute()

const isLoading = ref(false)
const loginFormRef = ref<any>(null)

const handleLogin = async (credentials: { email: string; password: string }) => {
  isLoading.value = true

  try {
    await login(credentials)
    toast.success('Welcome back!')

    // Allow the session cookie and reactive state to fully settle
    // before navigating to authenticated pages.
    await nextTick()

    // Honor redirect query param from auth middleware
    const redirectTo = route.query.redirect as string | undefined
    if (redirectTo) {
      await navigateTo(redirectTo)
      return
    }

    // Role-aware redirect: admins go to /admin, clients go to /forms
    const role = (user.value as any)?.role
    const isAdmin = typeof role === 'object' && role !== null
      && (role.admin_access === true || role.name?.toLowerCase().includes('admin'))
    await navigateTo(isAdmin ? '/admin' : '/forms')
  } catch (error: any) {
    console.error('Login error:', error)
    loginFormRef.value?.setFormError(
      error.message || 'Invalid email or password'
    )
  } finally {
    isLoading.value = false
  }
}

const handleForgotPassword = () => {
  router.push('/auth/forgot-password')
}

const handleRegister = () => {
  router.push('/auth/register')
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
        <p class="mt-2 text-slate-600">Sign in to your account</p>
      </div>

      <AuthLoginForm
        ref="loginFormRef"
        :is-loading="isLoading"
        @submit="handleLogin"
        @forgot-password="handleForgotPassword"
        @register="handleRegister"
      />

      <p class="mt-6 text-center text-sm text-slate-500">
        <NuxtLink to="/" class="text-primary-600 hover:text-primary-700">
          ← Back to website
        </NuxtLink>
      </p>
    </div>
  </div>
</template>
