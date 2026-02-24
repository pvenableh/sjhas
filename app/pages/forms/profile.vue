<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { toast } from 'vue-sonner'

definePageMeta({
  middleware: 'auth',
  layout: 'forms',
  title: 'Profile Settings',
})

useSeoMeta({
  title: 'Profile Settings - SJHAS, Inc.',
})

const { user } = useDirectusAuth()
const { updateProfile } = useDirectusUser()

const form = ref({
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
})
const isSaving = ref(false)
const saveMessage = ref('')

onMounted(() => {
  if (user.value) {
    form.value.first_name = user.value.first_name || ''
    form.value.last_name = user.value.last_name || ''
    form.value.email = user.value.email || ''
    form.value.phone = (user.value as any).phone || ''
  }
})

const handleSave = async () => {
  isSaving.value = true
  saveMessage.value = ''
  try {
    await updateProfile({
      first_name: form.value.first_name,
      last_name: form.value.last_name,
      phone: form.value.phone,
    })
    saveMessage.value = 'Profile updated successfully.'
    toast.success('Profile updated successfully')
  } catch (error) {
    console.error('Failed to update profile:', error)
    saveMessage.value = 'Failed to update profile. Please try again.'
    toast.error('Failed to update profile')
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <div class="space-y-6 max-w-2xl">
    <div>
      <h1 class="text-2xl font-semibold text-slate-900">Profile Settings</h1>
      <p class="text-slate-600 mt-1">Manage your account information.</p>
    </div>

    <Card class="p-6">
      <form class="space-y-5" @submit.prevent="handleSave">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label for="first_name" class="block text-sm font-medium text-slate-700 mb-1">First Name</label>
            <Input id="first_name" v-model="form.first_name" />
          </div>
          <div>
            <label for="last_name" class="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
            <Input id="last_name" v-model="form.last_name" />
          </div>
        </div>

        <div>
          <label for="email" class="block text-sm font-medium text-slate-700 mb-1">Email</label>
          <Input id="email" v-model="form.email" type="email" disabled class="bg-slate-50" />
          <p class="text-xs text-slate-400 mt-1">Email cannot be changed here.</p>
        </div>

        <div>
          <label for="phone" class="block text-sm font-medium text-slate-700 mb-1">Phone</label>
          <Input id="phone" v-model="form.phone" type="tel" />
        </div>

        <div v-if="saveMessage" :class="saveMessage.includes('Failed') ? 'text-red-600' : 'text-green-600'" class="text-sm">
          {{ saveMessage }}
        </div>

        <div class="pt-2">
          <Button type="submit" :disabled="isSaving">
            {{ isSaving ? 'Saving...' : 'Save Changes' }}
          </Button>
        </div>
      </form>
    </Card>
  </div>
</template>
