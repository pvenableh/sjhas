<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { ref, onMounted, computed } from "vue";
import { useForm, Field as VeeField } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { toast } from "vue-sonner";
import { Loader2, AlertCircle } from "lucide-vue-next";

const props = defineProps<{
  class?: HTMLAttributes["class"];
  isLoading?: boolean;
}>();

const emit = defineEmits<{
  (e: "submit", values: { email: string; password: string }): void;
  (e: "forgot-password"): void;
  (e: "register"): void;
}>();

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const formSchema = toTypedSchema(loginSchema);

const { handleSubmit, isSubmitting, resetForm, setFieldError } =
  useForm<LoginFormValues>({
    validationSchema: formSchema,
    initialValues: {
      email: "",
      password: "",
    },
  });

// Track form-level error
const formError = ref<string | null>(null);

// Expose method to set errors from parent
const setFormError = (
  message: string | null,
  fieldErrors?: { email?: string; password?: string }
) => {
  formError.value = message;
  if (fieldErrors) {
    if (fieldErrors.email) setFieldError("email", fieldErrors.email);
    if (fieldErrors.password) setFieldError("password", fieldErrors.password);
  }
};

const clearFormError = () => {
  formError.value = null;
};

defineExpose({ setFormError, resetForm });

const isProcessing = computed(() => isSubmitting.value || props.isLoading);

const onSubmit = handleSubmit(async (values) => {
  clearFormError();
  emit("submit", { email: values.email!, password: values.password! });
});
</script>

<template>
  <div :class="cn('flex flex-col gap-6', props.class)">
    <div class="bg-white dark:bg-secondary-800 text-slate-900 dark:text-slate-100 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
      <div class="flex flex-col space-y-1.5 p-6">
        <h3 class="text-2xl font-semibold leading-none tracking-tight">Login</h3>
        <p class="text-sm text-slate-500 dark:text-slate-400">
          Enter your email below to login to your account
        </p>
      </div>
      <div class="p-6 pt-0">
        <form @submit="onSubmit" class="space-y-4">
          <!-- Form-level error alert -->
          <Transition
            enter-active-class="transition-all duration-300 ease-out"
            leave-active-class="transition-all duration-200 ease-in"
            enter-from-class="opacity-0 -translate-y-2"
            enter-to-class="opacity-100 translate-y-0"
            leave-from-class="opacity-100 translate-y-0"
            leave-to-class="opacity-0 -translate-y-2"
          >
            <div
              v-if="formError"
              class="flex items-center gap-2 p-3 mb-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-md"
            >
              <AlertCircle class="h-4 w-4 flex-shrink-0" />
              <span>{{ formError }}</span>
            </div>
          </Transition>

          <VeeField v-slot="{ field, errors }" name="email">
            <div class="space-y-2">
              <label for="email" class="text-sm font-medium leading-none text-slate-700 dark:text-slate-200">
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="m@example.com"
                v-bind="field"
                @input="clearFormError"
                class="flex h-10 w-full rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-secondary-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600/15 dark:focus-visible:ring-primary-400/20 focus-visible:border-primary-600 dark:focus-visible:border-primary-400 disabled:cursor-not-allowed disabled:opacity-50"
                :class="{ 'border-red-500': errors.length }"
              />
              <p v-if="errors.length" class="text-sm text-red-500">
                {{ errors[0] }}
              </p>
            </div>
          </VeeField>

          <VeeField v-slot="{ field, errors }" name="password">
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <label for="password" class="text-sm font-medium leading-none text-slate-700 dark:text-slate-200">
                  Password
                </label>
                <button
                  type="button"
                  class="text-sm text-primary-600 dark:text-primary-400 underline-offset-4 hover:underline"
                  @click="emit('forgot-password')"
                >
                  Forgot password?
                </button>
              </div>
              <input
                id="password"
                type="password"
                v-bind="field"
                @input="clearFormError"
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
              :disabled="isProcessing"
              class="inline-flex items-center justify-center rounded-md bg-primary-600 dark:bg-primary-500 px-4 py-2 text-sm font-medium text-white dark:text-secondary-900 transition-colors hover:bg-primary-700 dark:hover:bg-primary-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600/20 disabled:pointer-events-none disabled:opacity-50"
            >
              <Loader2 v-if="isProcessing" class="mr-2 h-4 w-4 animate-spin" />
              {{ isProcessing ? "Signing in..." : "Sign in" }}
            </button>

            <p class="text-center text-sm text-slate-500 dark:text-slate-400">
              Don't have an account?
              <button
                type="button"
                class="text-slate-900 dark:text-slate-100 underline-offset-4 hover:underline font-medium"
                @click="emit('register')"
              >
                Sign up
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
