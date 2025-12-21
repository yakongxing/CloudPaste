<template>
  <div class="pdf-preview rounded-lg overflow-hidden mb-2 flex-grow w-full relative">
    <div class="flex items-center justify-end px-2 py-1 bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
      <!-- 多渠道时允许用户选择预览方式（Browser Native / pdfjs 等） -->
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
    <iframe
      :src="currentPreviewUrl"
      frameborder="0"
      class="w-full h-[calc(100vh-350px)] min-h-[300px]"
      @load="handleLoad"
      @error="handleError"
      v-show="!!currentPreviewUrl && !loading && !error"
    ></iframe>
    <!-- PDF加载状态 -->
    <div v-if="loading" class="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg">
      <LoadingIndicator
        :text="t('fileView.preview.pdf.loading')"
        size="xl"
        icon-class="text-blue-500 dark:text-blue-400"
        text-class="text-blue-600 dark:text-blue-400"
      />
    </div>
    <!-- PDF错误状态 -->
    <div v-if="error" class="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg">
      <div class="text-center p-4">
        <IconExclamation class="h-12 w-12 text-red-500 mx-auto mb-2" />
        <p class="text-red-600 dark:text-red-400 mb-2">{{ t("fileView.preview.pdf.error") }}</p>
        <p class="text-gray-500 dark:text-gray-400 text-sm">{{ t("fileView.preview.downloadToView") }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { useI18n } from "vue-i18n";
import { IconExclamation } from "@/components/icons";
import LoadingIndicator from "@/components/common/LoadingIndicator.vue";

const { t } = useI18n();

const props = defineProps({
  // 为保持兼容保留 previewUrl，但推荐使用 providers + nativeUrl
  previewUrl: {
    type: String,
    default: "",
  },
  // DocumentApp providers，例如 { pdfjs: 'https://...' }
  providers: {
    type: Object,
    default: () => ({}),
  },
  // 原生浏览器预览 URL（直链 / 代理）
  nativeUrl: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["load", "error"]);

const loading = ref(true);
const error = ref(false);

// 可用预览渠道（包含原生）
const providerOptions = computed(() => {
  const options = [];

  const providers = props.providers || {};
  const hasNativePlaceholder = Object.values(providers).some((v) => v === "native");

  // 默认原生预览（当规则没有显式声明 native 占位时）
  if (!hasNativePlaceholder && (props.nativeUrl || props.previewUrl)) {
    options.push({
      key: "native",
      label: t("fileView.preview.pdf.browserNative"),
      url: props.nativeUrl || props.previewUrl,
    });
  }

  // providers 中允许出现 url === "native" 的占位：表示走浏览器原生（与默认 native 同一条 URL）
  for (const [key, url] of Object.entries(providers)) {
    if (!url) continue;
    if (url === "native") {
      const native = props.nativeUrl || props.previewUrl;
      if (!native) continue;
      options.push({
        key,
        label: key === "native" ? t("fileView.preview.pdf.browserNative") : key,
        url: native,
      });
      continue;
    }
    options.push({ key, label: key, url });
  }

  return options;
});

const selectedProviderKey = ref("native");

const currentPreviewUrl = computed(() => {
  const options = providerOptions.value;
  if (!options.length) return "";
  const current = options.find((opt) => opt.key === selectedProviderKey.value) || options[0];
  return current.url || "";
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
  providerOptions,
  (options) => {
    if (!options.length) {
      selectedProviderKey.value = "";
      return;
    }
    const exists = options.some((opt) => opt.key === selectedProviderKey.value);
    if (exists) return;
    // 优先 native（如果存在），否则选第一个
    selectedProviderKey.value = options.some((opt) => opt.key === "native") ? "native" : options[0].key;
  },
  { immediate: true },
);
</script>
