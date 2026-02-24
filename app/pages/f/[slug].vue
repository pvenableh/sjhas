<script setup lang="ts">
import { ref, onMounted } from "vue";
import type { Form } from "~/types/directus";

const route = useRoute();
const slug = route.params.slug as string;

const form = ref<Form | null>(null);
const isLoading = ref(true);
const error = ref<string | null>(null);

useSeoMeta({
  title: computed(() =>
    form.value ? `${form.value.title} - SJHAS, Inc.` : "Form - SJHAS, Inc.",
  ),
});

onMounted(async () => {
  try {
    const data = await $fetch<Form>(`/api/forms/${slug}`);
    form.value = data;
  } catch (e: any) {
    if (e.statusCode === 404) {
      error.value = "not_found";
    } else {
      error.value = "error";
    }
  } finally {
    isLoading.value = false;
  }
});

const handleSubmitted = () => {
  // Scroll to top on successful submission
  window.scrollTo({ top: 0, behavior: "smooth" });
};
</script>

<template>
  <div
    class="min-h-screen"
    style="
      background: linear-gradient(
        170deg,
        var(--theme-bg-secondary) 0%,
        var(--theme-bg-elevated) 40%,
        var(--theme-bg-secondary) 100%
      );
    "
  >
    <!-- Header bar -->
    <!-- <header class="t-header-scrolled border-b t-border">
      <div class="container-narrow section-padding">
        <nav class="flex items-center justify-between h-16">
          <NuxtLink to="/" class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl t-bg-accent flex items-center justify-center">
              <span class="t-text-inverse font-extralight text-base t-heading">S</span>
            </div>
            <span class="t-heading text-lg t-text tracking-[0.04em]">SJHAS, Inc.</span>
          </NuxtLink>
          <LayoutDarkModeToggle />
        </nav>
      </div>
    </header> -->

    <!-- Content -->
    <main class="container-narrow section-padding py-12 lg:py-20">
      <!-- Loading -->
      <div v-if="isLoading" class="flex items-center justify-center py-32">
        <div class="text-center">
          <Icon
            name="lucide:loader-2"
            class="w-8 h-8 animate-spin t-text-accent mx-auto mb-4"
          />
          <p class="t-text-muted text-sm tracking-wide">Loading form...</p>
        </div>
      </div>

      <!-- Not found -->
      <div v-else-if="error === 'not_found'" class="text-center py-32">
        <div
          class="w-16 h-16 rounded-2xl t-icon-box mx-auto mb-6 flex items-center justify-center"
        >
          <Icon name="lucide:file-x" class="w-7 h-7" />
        </div>
        <h1 class="text-2xl t-heading t-text tracking-tight mb-3">
          Form Not Found
        </h1>
        <p class="t-text-secondary mb-8 max-w-md mx-auto leading-relaxed">
          This form may have been removed or is no longer available.
        </p>
        <Button as="a" href="/" variant="secondary">
          <Icon name="lucide:arrow-left" class="w-4 h-4" />
          Back to Website
        </Button>
      </div>

      <!-- Error -->
      <div v-else-if="error === 'error'" class="text-center py-32">
        <div
          class="w-16 h-16 rounded-2xl bg-red-50 mx-auto mb-6 flex items-center justify-center"
        >
          <Icon name="lucide:alert-circle" class="w-7 h-7 text-red-500" />
        </div>
        <h1 class="text-2xl t-heading t-text tracking-tight mb-3">
          Something Went Wrong
        </h1>
        <p class="t-text-secondary mb-8 max-w-md mx-auto leading-relaxed">
          We couldn't load this form. Please try again later.
        </p>
        <Button @click="() => window.location.reload()"> Try Again </Button>
      </div>

      <!-- Form -->
      <div v-else-if="form" class="max-w-2xl mx-auto">
        <div
          class="t-bg-elevated rounded-3xl t-shadow-lg border t-border p-8 md:p-12"
        >
          <div class="mb-10">
            <h1
              class="text-3xl t-heading t-text tracking-tight leading-[1.15] mb-3"
            >
              {{ form.title }}
            </h1>
            <p v-if="form.description" class="t-text-secondary leading-[1.7]">
              {{ form.description }}
            </p>
          </div>

          <FormsDynamicForm :form="form" @submitted="handleSubmitted" />
        </div>

        <!-- Footer note -->
        <!-- <p class="text-center mt-8 text-xs t-text-muted tracking-[0.04em]">
          Powered by <NuxtLink to="/" class="t-text-accent">SJHAS, Inc.</NuxtLink>
        </p> -->
      </div>
    </main>
  </div>
</template>
