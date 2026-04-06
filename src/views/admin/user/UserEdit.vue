<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { ArrowLeft, Save, Loader2, UserCog } from 'lucide-vue-next'
import { userService } from '@/services/user/user.service'
import { roleService } from '@/services/role/role.service'
import type { Role } from '@/types'
import { toast } from 'vue-sonner'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()

const loading = ref(false)
const fetchingData = ref(true)
const fetchingRoles = ref(false)
const roles = ref<Role[]>([])
const userId = Number(route.params.id)

const formData = ref({
  username: '',
  email: '',
  password: '',
  roleId: null as number | null,
  status: true,
})

const fetchRoles = async () => {
  fetchingRoles.value = true
  try {
    const response = await roleService.getAll()
    if (response.success && response.data) {
      roles.value = response.data
    }
  } catch (error) {
    console.error('Failed to fetch roles:', error)
  } finally {
    fetchingRoles.value = false
  }
}

const fetchUser = async () => {
  if (!userId) return
  fetchingData.value = true
  try {
    const response = await userService.getDetail(userId)
    if (response.success && response.data) {
      const user = response.data
      formData.value.username = user.username
      formData.value.email = user.email
      formData.value.status = user.status
      formData.value.roleId = user.role ? user.role.id : null
    } else {
      toast.error(t('crud.errorFetch', { module: t('modules.user') }))
      router.push('/admin/users')
    }
  } catch (error) {
    console.error('Failed to fetch user configuration:', error)
    toast.error(t('crud.errorFetch', { module: t('modules.user') }))
  } finally {
    fetchingData.value = false
  }
}

onMounted(async () => {
  await Promise.all([fetchRoles(), fetchUser()])
})

const isFormValid = () => {
  if (!formData.value.username.trim() || !formData.value.email.trim()) {
    toast.error('Please fill in all required fields (username, email)')
    return false
  }
  return true
}

const handleSubmit = async () => {
  if (!isFormValid()) return

  loading.value = true
  try {
    const payload: any = {
      id: userId,
      username: formData.value.username,
      email: formData.value.email,
      roleId: formData.value.roleId || undefined,
      status: formData.value.status
    }
    
    // Only send password if the admin typed a new one
    if (formData.value.password.trim()) {
      payload.password = formData.value.password.trim()
    }

    const response = await userService.update(payload)

    if (response.success) {
      toast.success(t('crud.successUpdate', { module: t('modules.user') }))
      router.push('/admin/users')
    } else {
      toast.error(response.message || t('crud.errorUpdate', { module: t('modules.user') }))
    }
  } catch (error) {
    console.error('Failed to update user:', error)
    toast.error(t('crud.errorUpdate', { module: t('modules.user') }))
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="space-y-6 max-w-4xl mx-auto py-6" v-if="!fetchingData">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <Button variant="outline" size="icon" @click="router.push('/admin/users')" class="h-9 w-9">
          <ArrowLeft class="h-4 w-4" />
        </Button>
        <h2 class="text-2xl font-bold tracking-tight">{{ $t('crud.edit') }} {{ $t('modules.user') }}</h2>
      </div>
      <div class="flex items-center gap-3">
        <Button variant="outline" @click="router.push('/admin/users')">{{ $t('crud.cancel') }}</Button>
        <Button type="button" @click="handleSubmit" :disabled="loading">
          <Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
          <Save v-else class="mr-2 h-4 w-4" />
          {{ $t('crud.save') }}
        </Button>
      </div>
    </div>

    <!-- Main Content -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      
      <!-- General Form Area -->
      <Card class="md:col-span-2 shadow-sm border-border/50">
        <CardHeader class="pb-4 border-b bg-muted/10">
          <CardTitle class="flex items-center gap-2 text-lg">
            <UserCog class="h-5 w-5 text-primary" />
            {{ $t('crud.generalInfo') }}
          </CardTitle>
        </CardHeader>
        <CardContent class="space-y-6 pt-6">
          
          <div class="space-y-2">
            <Label for="username" class="text-sm font-semibold">{{ $t('auth.username') }} <span class="text-destructive">*</span></Label>
            <Input id="username" v-model="formData.username" placeholder="johndoe123" />
          </div>

          <div class="space-y-2">
            <Label for="email" class="text-sm font-semibold">{{ $t('auth.email') }} <span class="text-destructive">*</span></Label>
            <Input id="email" type="email" v-model="formData.email" placeholder="johndoe@example.com" />
          </div>

          <div class="space-y-2">
            <Label for="password" class="text-sm font-semibold">New Password</Label>
            <Input id="password" type="password" v-model="formData.password" placeholder="••••••••" />
            <p class="text-xs text-muted-foreground">Leave password blank if you do not want to change it.</p>
          </div>

        </CardContent>
      </Card>

      <!-- Sidebar Form Area -->
      <div class="space-y-6 md:col-span-1">
        
        <Card class="shadow-sm border-border/50">
          <CardHeader class="pb-4 border-b bg-muted/10">
            <CardTitle class="text-lg">{{ $t('crud.systemInfo') }}</CardTitle>
          </CardHeader>
          <CardContent class="space-y-6 pt-6">
            
            <div class="space-y-2">
              <Label class="text-sm font-semibold">User Role</Label>
              <Select v-model="formData.roleId" :disabled="fetchingRoles">
                <SelectTrigger>
                  <SelectValue placeholder="Select a role...">
                    <span v-if="formData.roleId && roles.find((r) => r.id === formData.roleId)">
                      {{ roles.find((r) => r.id === formData.roleId)?.name }}
                    </span>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem :value="null">None</SelectItem>
                  <SelectItem v-for="ro in roles" :key="ro.id" :value="ro.id">{{ ro.name }}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <!-- Active Status Toggle -->
            <div class="flex flex-row items-center justify-between rounded-lg border p-4 bg-background transition-colors hover:bg-muted/50">
              <div class="space-y-0.5">
                <Label class="text-base font-semibold">{{ $t('fields.activeStatus') }}</Label>
                <p class="text-sm text-muted-foreground">{{ $t('fields.statusDescription', { module: $t('modules.user') }) }}</p>
              </div>
              <Switch v-model:checked="formData.status" />
            </div>

          </CardContent>
        </Card>
      </div>

    </div>
  </div>
  
  <div v-else class="flex flex-col items-center justify-center min-h-[400px] gap-4">
    <Loader2 class="h-8 w-8 animate-spin text-primary" />
    <p class="text-muted-foreground font-medium">{{ $t('crud.fetchingData') }}</p>
  </div>
</template>
