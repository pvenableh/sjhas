<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { format } from 'date-fns'
import { toast } from 'vue-sonner'
import type { DirectusUser } from '~/types/directus'

definePageMeta({
  middleware: 'auth',
  layout: 'admin',
})

useSeoMeta({
  title: 'Clients - Admin - SJHAS, Inc.',
})

const { inviteUser } = useDirectusUser()
const config = useRuntimeConfig()

const isLoading = ref(true)
const clients = ref<any[]>([])
const searchQuery = ref('')
const showInviteDialog = ref(false)
const inviteEmail = ref('')
const inviteFirstName = ref('')
const inviteLastName = ref('')
const isInviting = ref(false)

const fetchClients = async () => {
  isLoading.value = true
  try {
    // Use the dedicated users endpoint (readUsers SDK function).
    // The generic /api/directus/items endpoint uses readItems() which
    // doesn't work with system collections like directus_users.
    const users = await $fetch('/api/directus/users', {
      method: 'GET',
      query: {
        fields: 'id,first_name,last_name,email,status,last_access,role.name,role.admin_access',
        sort: 'first_name',
        limit: -1,
      },
    })
    clients.value = (users as any[]).filter((u: any) => {
      // Exclude admin users — show only clients
      const role = u.role
      if (typeof role === 'object' && role !== null) {
        return !role.admin_access
      }
      return true
    })
  } catch (error) {
    console.error('Failed to fetch clients:', error)
    toast.error('Failed to load clients')
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchClients)

const filteredClients = computed(() => {
  if (!searchQuery.value) return clients.value
  const q = searchQuery.value.toLowerCase()
  return clients.value.filter(
    (c) =>
      c.first_name?.toLowerCase().includes(q) ||
      c.last_name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q)
  )
})

const formatDate = (date: string | null) => {
  if (!date) return 'Never'
  return format(new Date(date), 'MMM d, yyyy')
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-700'
    case 'invited': return 'bg-blue-100 text-blue-700'
    case 'suspended': return 'bg-red-100 text-red-700'
    case 'draft': return 'bg-yellow-100 text-yellow-700'
    default: return 'bg-slate-100 text-slate-700'
  }
}

const handleInvite = async () => {
  if (!inviteEmail.value) {
    toast.error('Please enter an email address')
    return
  }

  const roleId = config.public.clientRoleId
  if (!roleId) {
    toast.error('Client role is not configured. Set CLIENT_ROLE_ID in your environment.')
    return
  }

  isInviting.value = true
  try {
    await inviteUser(inviteEmail.value, roleId as string, {
      first_name: inviteFirstName.value || undefined,
      last_name: inviteLastName.value || undefined,
    })
    toast.success(`Invitation sent to ${inviteEmail.value}`)
    showInviteDialog.value = false
    inviteEmail.value = ''
    inviteFirstName.value = ''
    inviteLastName.value = ''
    await fetchClients()
  } catch (error: any) {
    toast.error(error.data?.message || 'Failed to send invitation')
  } finally {
    isInviting.value = false
  }
}

const getInitials = (user: any) => {
  const first = user.first_name?.[0] || ''
  const last = user.last_name?.[0] || ''
  return (first + last).toUpperCase() || user.email?.[0]?.toUpperCase() || '?'
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900">Clients</h1>
        <p class="text-slate-600 mt-1">Manage your client accounts</p>
      </div>
      <Button @click="showInviteDialog = true">
        <Icon name="lucide:user-plus" class="w-4 h-4" />
        Invite Client
      </Button>
    </div>

    <!-- Search -->
    <Card class="p-4">
      <div class="relative">
        <Icon name="lucide:search" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input v-model="searchQuery" placeholder="Search clients by name or email..." class="pl-10" />
      </div>
    </Card>

    <!-- Clients list -->
    <Card>
      <div v-if="isLoading" class="p-8">
        <div class="space-y-4">
          <div v-for="i in 5" :key="i" class="h-16 bg-slate-100 rounded-lg animate-pulse" />
        </div>
      </div>

      <div v-else-if="filteredClients.length === 0" class="p-8 text-center">
        <Icon name="lucide:users" class="w-12 h-12 mx-auto text-slate-300 mb-4" />
        <p class="text-slate-500">
          {{ searchQuery ? 'No clients match your search' : 'No clients yet' }}
        </p>
      </div>

      <div v-else class="divide-y divide-slate-200">
        <div
          v-for="client in filteredClients"
          :key="client.id"
          class="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
        >
          <div class="flex items-center gap-4 min-w-0">
            <div class="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
              <span class="text-sm font-medium text-primary-700">{{ getInitials(client) }}</span>
            </div>
            <div class="min-w-0">
              <p class="font-medium text-slate-900 truncate">
                {{ [client.first_name, client.last_name].filter(Boolean).join(' ') || client.email }}
              </p>
              <p class="text-sm text-slate-500 truncate">{{ client.email }}</p>
            </div>
          </div>

          <div class="flex items-center gap-4">
            <span class="text-sm text-slate-500 hidden sm:block">
              Last active: {{ formatDate(client.last_access) }}
            </span>
            <span
              :class="['px-2 py-0.5 text-xs font-medium rounded-full', getStatusColor(client.status)]"
            >
              {{ client.status }}
            </span>
          </div>
        </div>
      </div>
    </Card>

    <!-- Invite Dialog -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="showInviteDialog"
          class="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div class="absolute inset-0 bg-black/50" @click="showInviteDialog = false" />
          <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-5">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold text-slate-900">Invite Client</h3>
              <button class="p-1 rounded-lg hover:bg-slate-100" @click="showInviteDialog = false">
                <Icon name="lucide:x" class="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <p class="text-sm text-slate-500">
              Send an invitation email to a new client. They'll be able to create an account and access the client portal.
            </p>

            <div class="space-y-4">
              <div>
                <Label class="mb-1.5">Email Address *</Label>
                <Input v-model="inviteEmail" type="email" placeholder="client@example.com" />
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <Label class="mb-1.5">First Name</Label>
                  <Input v-model="inviteFirstName" placeholder="John" />
                </div>
                <div>
                  <Label class="mb-1.5">Last Name</Label>
                  <Input v-model="inviteLastName" placeholder="Doe" />
                </div>
              </div>
            </div>

            <div class="flex justify-end gap-3 pt-2">
              <Button variant="secondary" @click="showInviteDialog = false">Cancel</Button>
              <Button :disabled="isInviting || !inviteEmail" @click="handleInvite">
                <Icon v-if="isInviting" name="lucide:loader-2" class="w-4 h-4 animate-spin" />
                <Icon v-else name="lucide:send" class="w-4 h-4" />
                {{ isInviting ? 'Sending...' : 'Send Invite' }}
              </Button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
