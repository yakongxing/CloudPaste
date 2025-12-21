<template>
  <div class="iframe-preview rounded-lg overflow-hidden mb-2 flex-grow w-full relative border border-gray-200 dark:border-gray-700">
    <div class="flex items-center justify-end px-2 py-1 bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
      <select
        v-if="providerOptions.length > 1"
        v-model="selectedProviderKey"
        class="text-xs px-2 py-1 rounded border bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
      >
        <option v-for="opt in providerOptions" :key="opt.key" :value="opt.key">
          {{ opt.label }}
        </option>
      </select>
    </div>
    <div class="iframe-container relative w-full h-[calc(100vh-350px)] min-h-[300px]">
      <iframe
        :src="currentPreviewUrl"
        frameborder="0"
        class="w-full h-full"
        @load="handleLoad"
        @error="handleError"
        v-show="!!currentPreviewUrl && !loading && !error"
      ></iframe>
      <div v-if="loading" class="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700">
        <LoadingIndicator
          :text="loadingText || t('fileView.preview.loading')"
          :dark-mode="darkMode"
          size="xl"
          icon-class="text-blue-500"
          :text-class="darkMode ? 'text-blue-400' : 'text-blue-600'"
        />
      </div>
      <div v-else-if="error" class="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700">
        <p class="text-red-600 dark:text-red-400 text-sm">{{ errorText || t("fileView.preview.error") }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { useI18n } from "vue-i18n";
import LoadingIndicator from "@/components/common/LoadingIndicator.vue";
import { useProviderSelector } from "@/composables/file-preview/useProviderSelector.js";

const { t } = useI18n();

const props = defineProps({
  providers: {
    type: Object,
    default: () => ({}),
  },
  darkMode: {
    type: Boolean,
    default: false,
  },
  loadingText: {
    type: String,
    default: "",
  },
  errorText: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["load", "error"]);

const loading = ref(true);
const error = ref(false);

const { providerOptions, selectedKey: selectedProviderKey, currentUrl: currentPreviewUrl } = useProviderSelector({
  providers: computed(() => props.providers || {}),
  nativeUrl: "",
  filter: ({ url }) => url !== "native",
});

const handleLoad = () => {
  loading.value = false;
  error.value = false;
  emit("load");
};

const handleError = () => {
  loading.value = false;
  error.value = true;
  emit("error");
};

watch(
  currentPreviewUrl,
  (url) => {
    if (!url) return;
    loading.value = true;
    error.value = false;
  },
  { immediate: true },
);
</script>
