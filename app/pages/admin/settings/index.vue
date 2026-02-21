<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { toast } from 'vue-sonner'

definePageMeta({
  middleware: 'auth',
  layout: 'admin',
})

useSeoMeta({
  title: 'Settings - Admin - SJHAS, Inc.',
})

const { user } = useDirectusAuth()
const { updateProfile } = useDirectusUser()

const activeTab = ref<'profile' | 'site' | 'notifications'>('profile')

// Profile settings
const profileForm = ref({
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
})
const isSavingProfile = ref(false)

// Site settings
const siteSettings = useDirectusItems('site_settings', { requireAuth: true })
const siteForm = ref({
  site_name: '',
  site_description: '',
  contact_email: '',
  contact_phone: '',
  address_line_1: '',
  address_line_2: '',
  city: '',
  state: '',
  zip_code: '',
})
const siteSettingsId = ref<number | null>(null)
const isSavingSite = ref(false)
const isLoadingSite = ref(true)

// Notification settings
const notificationForm = ref({
  notify_email: '',
  notify_on_submission: true,
})
const isSavingNotifications = ref(false)

onMounted(async () => {
  // Load profile
  if (user.value) {
    profileForm.value.first_name = user.value.first_name || ''
    profileForm.value.last_name = user.value.last_name || ''
    profileForm.value.email = user.value.email || ''
    profileForm.value.phone = (user.value as any).phone || ''
  }

  // Load site settings
  try {
    const settings = await siteSettings.list({
      limit: 1,
      fields: ['id', 'site_name', 'site_description', 'contact_email', 'contact_phone', 'address_line_1', 'address_line_2', 'city', 'state', 'zip_code'],
    })
    if (settings.length > 0) {
      const s = settings[0] as any
      siteSettingsId.value = s.id
      siteForm.value = {
        site_name: s.site_name || '',
        site_description: s.site_description || '',
        contact_email: s.contact_email || '',
        contact_phone: s.contact_phone || '',
        address_line_1: s.address_line_1 || '',
        address_line_2: s.address_line_2 || '',
        city: s.city || '',
        state: s.state || '',
        zip_code: s.zip_code || '',
      }
    }
  } catch (error) {
    console.error('Failed to load site settings:', error)
  } finally {
    isLoadingSite.value = false
  }
})

const saveProfile = async () => {
  isSavingProfile.value = true
  try {
    await updateProfile({
      first_name: profileForm.value.first_name,
      last_name: profileForm.value.last_name,
      phone: profileForm.value.phone,
    })
    toast.success('Profile updated successfully')
  } catch (error) {
    console.error('Failed to update profile:', error)
    toast.error('Failed to update profile')
  } finally {
    isSavingProfile.value = false
  }
}

const saveSiteSettings = async () => {
  if (!siteSettingsId.value) {
    toast.error('Site settings not found')
    return
  }

  isSavingSite.value = true
  try {
    await siteSettings.update(siteSettingsId.value, siteForm.value as any)
    toast.success('Site settings updated successfully')
  } catch (error) {
    console.error('Failed to update site settings:', error)
    toast.error('Failed to update site settings')
  } finally {
    isSavingSite.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-semibold text-slate-900">Settings</h1>
      <p class="text-slate-600 mt-1">Manage your profile and site configuration</p>
    </div>

    <!-- Tabs -->
    <div class="border-b border-slate-200">
      <nav class="flex gap-6">
        <button
          v-for="tab in [
            { key: 'profile', label: 'Profile' },
            { key: 'site', label: 'Site Settings' },
          ] as const"
          :key="tab.key"
          :class="[
            'py-3 text-sm font-medium border-b-2 transition-colors',
            activeTab === tab.key
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          ]"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
        </button>
      </nav>
    </div>

    <!-- Profile Tab -->
    <div v-show="activeTab === 'profile'" class="max-w-2xl">
      <Card class="p-6">
        <h3 class="text-lg font-semibold text-slate-900 mb-6">Profile Information</h3>
        <form class="space-y-5" @submit.prevent="saveProfile">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label class="mb-1.5">First Name</Label>
              <Input v-model="profileForm.first_name" />
            </div>
            <div>
              <Label class="mb-1.5">Last Name</Label>
              <Input v-model="profileForm.last_name" />
            </div>
          </div>

          <div>
            <Label class="mb-1.5">Email</Label>
            <Input v-model="profileForm.email" type="email" disabled class="bg-slate-50" />
            <p class="text-xs text-slate-400 mt-1">Email cannot be changed here.</p>
          </div>

          <div>
            <Label class="mb-1.5">Phone</Label>
            <Input v-model="profileForm.phone" type="tel" />
          </div>

          <div class="pt-2">
            <Button type="submit" :disabled="isSavingProfile">
              <Icon v-if="isSavingProfile" name="lucide:loader-2" class="w-4 h-4 animate-spin" />
              {{ isSavingProfile ? 'Saving...' : 'Save Profile' }}
            </Button>
          </div>
        </form>
      </Card>
    </div>

    <!-- Site Settings Tab -->
    <div v-show="activeTab === 'site'" class="max-w-2xl">
      <div v-if="isLoadingSite" class="space-y-4">
        <div v-for="i in 3" :key="i" class="h-20 bg-slate-100 rounded-lg animate-pulse" />
      </div>

      <Card v-else class="p-6">
        <h3 class="text-lg font-semibold text-slate-900 mb-6">Site Configuration</h3>
        <form class="space-y-5" @submit.prevent="saveSiteSettings">
          <div>
            <Label class="mb-1.5">Site Name</Label>
            <Input v-model="siteForm.site_name" placeholder="SJHAS, Inc." />
          </div>

          <div>
            <Label class="mb-1.5">Site Description</Label>
            <Textarea v-model="siteForm.site_description" placeholder="A brief description of your business..." />
          </div>

          <hr class="border-slate-200" />

          <h4 class="text-base font-medium text-slate-900">Contact Information</h4>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label class="mb-1.5">Contact Email</Label>
              <Input v-model="siteForm.contact_email" type="email" />
            </div>
            <div>
              <Label class="mb-1.5">Contact Phone</Label>
              <Input v-model="siteForm.contact_phone" type="tel" />
            </div>
          </div>

          <hr class="border-slate-200" />

          <h4 class="text-base font-medium text-slate-900">Address</h4>

          <div>
            <Label class="mb-1.5">Address Line 1</Label>
            <Input v-model="siteForm.address_line_1" />
          </div>

          <div>
            <Label class="mb-1.5">Address Line 2</Label>
            <Input v-model="siteForm.address_line_2" />
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <Label class="mb-1.5">City</Label>
              <Input v-model="siteForm.city" />
            </div>
            <div>
              <Label class="mb-1.5">State</Label>
              <Input v-model="siteForm.state" />
            </div>
            <div>
              <Label class="mb-1.5">ZIP Code</Label>
              <Input v-model="siteForm.zip_code" />
            </div>
          </div>

          <div class="pt-2">
            <Button type="submit" :disabled="isSavingSite">
              <Icon v-if="isSavingSite" name="lucide:loader-2" class="w-4 h-4 animate-spin" />
              {{ isSavingSite ? 'Saving...' : 'Save Site Settings' }}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  </div>
</template>
