<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { ref, computed, watch } from "vue";
import { useForm, Field as VeeField } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import { z } from "zod";
import { refDebounced } from "@vueuse/core";
import { cn } from "@/lib/utils";
import { Loader2, Check, X, PartyPopper } from "lucide-vue-next";

export interface AcceptInvitePayload {
  firstName: string;
  lastName: string;
  password: string;
  token: string;
}

const props = defineProps<{
  class?: HTMLAttributes["class"];
  token?: string;
  email?: string;
}>();

const emit = defineEmits<{
  (e: "submit", values: AcceptInvitePayload): void;
  (e: "login"): void;
}>();

const formSchema = toTypedSchema(
  z
    .object({
      firstName: z.string().min(1, "First name is required"),
      lastName: z.string().min(1, "Last name is required"),
      password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[a-z]/, "Password must contain at least one lowercase letter")
        .regex(/[0-9]/, "Password must contain at least one number"),
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    })
);

const { handleSubmit, isSubmitting, values } = useForm({
  validationSchema: formSchema,
  initialValues: {
    firstName: "",
    lastName: "",
    password: "",
    confirmPassword: "",
  },
});

const isSuccess = ref(false);

/**
 * Set success state from parent after async operation completes.
 */
const setSuccess = () => {
  isSuccess.value = true;
};

defineExpose({ setSuccess });

// Password validation state
const passwordValue = computed(() => values.password || "");
const debouncedPassword = refDebounced(passwordValue, 300);
const showPasswordRequirements = ref(false);

const passwordRequirements = computed(() => [
  { met: debouncedPassword.value.length >= 8, label: "At least 8 characters" },
  { met: /[A-Z]/.test(debouncedPassword.value), label: "One uppercase letter" },
  { met: /[a-z]/.test(debouncedPassword.value), label: "One lowercase letter" },
  { met: /[0-9]/.test(debouncedPassword.value), label: "One number" },
]);

watch(passwordValue, (val) => {
  showPasswordRequirements.value = val.length > 0;
});

const onSubmit = handleSubmit(async (values) => {
  if (!props.token) return;
  emit("submit", {
    firstName: values.firstName!,
    lastName: values.lastName!,
    password: values.password!,
    token: props.token,
  });
});
</script>

<template>
  <div :class="cn('flex flex-col gap-6', props.class)">
    <div class="bg-white dark:bg-secondary-800 text-slate-900 dark:text-slate-100 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
      <div class="flex flex-col space-y-1.5 p-6">
        <h3 class="text-2xl font-semibold leading-none tracking-tight">
          Accept invitation
        </h3>
        <p class="text-sm text-slate-500 dark:text-slate-400">
          <template v-if="email">
            Complete your account setup for <strong>{{ email }}</strong>
          </template>
          <template v-else>
            Complete your account setup
          </template>
        </p>
      </div>
      <div class="p-6 pt-0">
        <template v-if="isSuccess">
          <div class="flex flex-col items-center justify-center py-8 text-center">
            <PartyPopper class="h-12 w-12 text-green-500 mb-4" />
            <h4 class="text-lg font-medium mb-2">Welcome aboard!</h4>
            <p class="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Your account has been set up successfully.
            </p>
            <button
              type="button"
              class="inline-flex items-center justify-center rounded-md bg-primary-600 dark:bg-primary-500 px-4 py-2 text-sm font-medium text-white dark:text-secondary-900 hover:bg-primary-700 dark:hover:bg-primary-400"
              @click="emit('login')"
            >
              Continue to login
            </button>
          </div>
        </template>
        <template v-else>
          <form @submit="onSubmit" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <VeeField v-slot="{ field, errors }" name="firstName">
                <div class="space-y-2">
                  <label for="firstName" class="text-sm font-medium leading-none text-slate-700 dark:text-slate-200">
                    First name
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    v-bind="field"
                    class="flex h-10 w-full rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-secondary-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600/15 dark:focus-visible:ring-primary-400/20 focus-visible:border-primary-600 dark:focus-visible:border-primary-400 disabled:cursor-not-allowed disabled:opacity-50"
                    :class="{ 'border-red-500': errors.length }"
                  />
                  <p v-if="errors.length" class="text-sm text-red-500">
                    {{ errors[0] }}
                  </p>
                </div>
              </VeeField>

              <VeeField v-slot="{ field, errors }" name="lastName">
                <div class="space-y-2">
                  <label for="lastName" class="text-sm font-medium leading-none text-slate-700 dark:text-slate-200">
                    Last name
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    v-bind="field"
                    class="flex h-10 w-full rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-secondary-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600/15 dark:focus-visible:ring-primary-400/20 focus-visible:border-primary-600 dark:focus-visible:border-primary-400 disabled:cursor-not-allowed disabled:opacity-50"
                    :class="{ 'border-red-500': errors.length }"
                  />
                  <p v-if="errors.length" class="text-sm text-red-500">
                    {{ errors[0] }}
                  </p>
                </div>
              </VeeField>
            </div>

            <VeeField v-slot="{ field, errors }" name="password">
              <div class="space-y-2">
                <label for="password" class="text-sm font-medium leading-none text-slate-700 dark:text-slate-200">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  v-bind="field"
                  class="flex h-10 w-full rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-secondary-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600/15 dark:focus-visible:ring-primary-400/20 focus-visible:border-primary-600 dark:focus-visible:border-primary-400 disabled:cursor-not-allowed disabled:opacity-50"
                  :class="{ 'border-red-500': errors.length }"
                />
                <p v-if="errors.length" class="text-sm text-red-500">
                  {{ errors[0] }}
                </p>

                <!-- Password requirements -->
                <template v-if="showPasswordRequirements">
                  <div class="mt-2 space-y-1 text-xs">
                    <TransitionGroup name="list">
                      <div
                        v-for="req in passwordRequirements"
                        :key="req.label"
                        class="flex items-center gap-1"
                        :class="req.met ? 'text-green-600 dark:text-green-400' : 'text-slate-500 dark:text-slate-400'"
                      >
                        <Check v-if="req.met" class="h-3 w-3" />
                        <X v-else class="h-3 w-3" />
                        <span>{{ req.label }}</span>
                      </div>
                    </TransitionGroup>
                  </div>
                </template>
              </div>
            </VeeField>

            <VeeField v-slot="{ field, errors }" name="confirmPassword">
              <div class="space-y-2">
                <label for="confirmPassword" class="text-sm font-medium leading-none text-slate-700 dark:text-slate-200">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  v-bind="field"
                  class="flex h-10 w-full rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-secondary-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600/15 dark:focus-visible:ring-primary-400/20 focus-visible:border-primary-600 dark:focus-visible:border-primary-400 disabled:cursor-not-allowed disabled:opacity-50"
                  :class="{ 'border-red-500': errors.length }"
                />
                <p v-if="errors.length" class="text-sm text-red-500">
                  {{ errors[0] }}
                </p>
              </div>
            </VeeField>

            <div class="flex flex-col gap-3 pt-2">
              <button
                type="submit"
                :disabled="isSubmitting"
                class="inline-flex items-center justify-center rounded-md bg-primary-600 dark:bg-primary-500 px-4 py-2 text-sm font-medium text-white dark:text-secondary-900 transition-colors hover:bg-primary-700 dark:hover:bg-primary-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600/20 disabled:pointer-events-none disabled:opacity-50"
              >
                <Loader2 v-if="isSubmitting" class="mr-2 h-4 w-4 animate-spin" />
                {{ isSubmitting ? "Setting up..." : "Complete setup" }}
              </button>
            </div>
          </form>
        </template>
      </div>
    </div>
  </div>
</template>
