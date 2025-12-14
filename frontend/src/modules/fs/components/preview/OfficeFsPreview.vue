<template>
  <div class="office-fs-preview-wrapper h-full">
    <!-- native 预览区 -->
    <div v-if="isNativeProvider" class="office-native-container h-full">
      <OfficeNativeViewer
        v-if="contentUrl && filename"
        :content-url="contentUrl"
        :filename="filename"
        :dark-mode="darkMode"
        :is-fullscreen="isFullscreen"
        @load="emit('load')"
        @error="emit('error', $event)"
        @unsupported="handleNativeUnsupported"
      />

      <div v-else class="h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
        <div class="text-center p-4">
          <p class="text-gray-600 dark:text-gray-300 mb-2">
            {{ t("mount.filePreview.nativeRenderFailed") || "本地预览失败" }}
          </p>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {{ t("mount.filePreview.tryExternalProvider") || "请尝试切换到其他预览渠道" }}
          </p>
        </div>
      </div>
    </div>

    <!-- iframe 预览区 -->
    <div v-else-if="previewUrl && previewUrl !== 'native'" class="office-iframe-container h-full relative">
      <iframe
        :src="previewUrl"
        frameborder="0"
        class="w-full h-full"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation"
        @load="handleIframeLoad"
        @error="handleIframeError"
      ></iframe>

      <div v-if="iframeLoading" class="absolute inset-0 bg-white dark:bg-gray-800 bg-opacity-70 flex items-center justify-center">
        <svg class="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 0 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      </div>
    </div>

    <!-- 无预览 URL 时的占位 -->
    <div v-else class="h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
      <div class="text-center p-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-16 w-16 mx-auto mb-4 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.5"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <p class="text-gray-600 dark:text-gray-300 mb-2">{{ $t("mount.filePreview.noOfficePreview") || "无法加载 Office 预览" }}</p>
        <p class="text-sm text-gray-500 dark:text-gray-400">{{ errorMessage || $t("mount.filePreview.downloadToView") || "请下载文件后在本地查看" }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { OfficeNativeViewer } from "@/components/office";

const { t } = useI18n();

const props = defineProps({
  previewUrl: {
    type: String,
    default: "",
  },
  contentUrl: {
    type: String,
    default: "",
  },
  filename: {
    type: String,
    default: "",
  },
  darkMode: {
    type: Boolean,
    default: false,
  },
  providerKey: {
    type: String,
    default: "",
  },
  errorMessage: {
    type: String,
    default: "",
  },
  isFullscreen: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["load", "error"]);

//用于 iframe 的 loading 状态
const iframeLoading = ref(true);

const isNativeProvider = computed(() => props.providerKey === "native" || props.previewUrl === "native");

const handleIframeLoad = () => {
  iframeLoading.value = false;
  emit("load");
};

const handleIframeError = (event) => {
  iframeLoading.value = false;
  emit("error", event);
};

const handleNativeUnsupported = () => {
  emit("error", new Error(t("mount.filePreview.tryExternalProvider") || "请尝试切换到其他预览渠道"));
};

// 重置加载状态
watch(
  () => props.previewUrl,
  () => {
    if (!isNativeProvider.value) {
      iframeLoading.value = true;
    }
  },
);
</script>

<style scoped>
.office-fs-preview-wrapper {
  min-height: 400px;
}

.office-iframe-container {
  background-color: white;
}

.dark .office-iframe-container {
  background-color: #1f2937;
}
</style>
