<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { ref } from "vue";
import { useForm, Field as VeeField } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Loader2, CheckCircle2, ArrowLeft } from "lucide-vue-next";

const props = defineProps<{
  class?: HTMLAttributes["class"];
}>();

const emit = defineEmits<{
  (e: "submit", values: { email: string }): void;
  (e: "back"): void;
}>();

const formSchema = toTypedSchema(
  z.object({
    email: z.string().email("Please enter a valid email address"),
  })
);

const { handleSubmit, isSubmitting } = useForm({
  validationSchema: formSchema,
  initialValues: {
    email: "",
  },
});

const isSuccess = ref(false);

const onSubmit = handleSubmit(async (values) => {
  emit("submit", { email: values.email! });
  isSuccess.value = true;
});
</script>

<template>
  <div :class="cn('flex flex-col gap-6', props.class)">
    <div class="bg-white dark:bg-secondary-800 text-slate-900 dark:text-slate-100 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
      <div class="flex flex-col space-y-1.5 p-6">
        <h3 class="text-2xl font-semibold leading-none tracking-tight">
          Reset password
        </h3>
        <p class="text-sm text-slate-500 dark:text-slate-400">
          Enter your email address and we'll send you a reset link
        </p>
      </div>
      <div class="p-6 pt-0">
        <template v-if="isSuccess">
          <div class="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle2 class="h-12 w-12 text-green-500 mb-4" />
            <h4 class="text-lg font-medium mb-2">Check your email</h4>
            <p class="text-sm text-slate-500 dark:text-slate-400 mb-6">
              If an account exists with that email, we've sent a password reset link.
            </p>
            <button
              type="button"
              class="inline-flex items-center text-sm text-primary-600 dark:text-primary-400 hover:underline"
              @click="emit('back')"
            >
              <ArrowLeft class="h-4 w-4 mr-1" />
              Back to login
            </button>
          </div>
        </template>
        <template v-else>
          <form @submit="onSubmit" class="space-y-4">
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
                {{ isSubmitting ? "Sending..." : "Send reset link" }}
              </button>

              <button
                type="button"
                class="inline-flex items-center justify-center text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                @click="emit('back')"
              >
                <ArrowLeft class="h-4 w-4 mr-1" />
                Back to login
              </button>
            </div>
          </form>
        </template>
      </div>
    </div>
  </div>
</template>
