<script setup lang="ts">
import { ref } from 'vue'
import { toast } from 'vue-sonner'

definePageMeta({
  middleware: 'guest',
  layout: 'auth',
})

useSeoMeta({
  title: 'Accept Invitation - SJHAS, Inc.',
})

const route = useRoute()
const router = useRouter()
const { acceptInvite } = useDirectusUser()

const token = computed(() => (route.query.token as string) || '')
const email = computed(() => (route.query.email as string) || '')
const isError = ref(!token.value)
const formRef = ref<{ setSuccess: () => void } | null>(null)

const handleSubmit = async (values: {
  firstName: string
  lastName: string
  password: string
  token: string
}) => {
  try {
    // Accept the invitation (sets the password in Directus)
    await acceptInvite(values.token, values.password)

    // Log in with the new credentials so we can update the profile
    const { login } = useDirectusAuth()
    await login({ email: email.value, password: values.password })

    // Update user profile with first/last name
    const { updateProfile } = useDirectusUser()
    await updateProfile({
      first_name: values.firstName,
      last_name: values.lastName,
    })

    // Log out so the user goes through the normal login flow
    const { logout } = useDirectusAuth()
    await logout()

    formRef.value?.setSuccess()
    toast.success('Your account is ready!')
  } catch (error: any) {
    console.error('Accept invite error:', error)
    toast.error(error.data?.message || error.message || 'Failed to accept invitation. The link may have expired.')
  }
}

const handleLogin = () => {
  router.push('/auth/login')
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

      <!-- Invalid/missing token -->
      <template v-if="isError">
        <div class="bg-card text-card-foreground rounded-lg border shadow-sm p-6 text-center">
          <Icon name="lucide:alert-circle" class="w-12 h-12 mx-auto text-red-400 mb-4" />
          <h3 class="text-lg font-semibold mb-2">Invalid Invitation</h3>
          <p class="text-sm text-muted-foreground mb-6">
            This invitation link is invalid or has expired. Please contact us if you need a new invitation.
          </p>
          <NuxtLink
            to="/auth/login"
            class="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Go to login
          </NuxtLink>
        </div>
      </template>

      <!-- Accept invite form -->
      <AuthAcceptInviteForm
        v-else
        ref="formRef"
        :token="token"
        :email="email"
        @submit="handleSubmit"
        @login="handleLogin"
      />

      <p class="mt-6 text-center text-sm text-slate-500">
        <NuxtLink to="/" class="text-primary-600 hover:text-primary-700">
          &larr; Back to website
        </NuxtLink>
      </p>
    </div>
  </div>
</template>
