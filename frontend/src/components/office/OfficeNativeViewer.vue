<template>
  <div class="office-native-router h-full w-full" :class="{ dark: darkMode }">
    <DocxViewer
      v-if="viewerType === 'docx'"
      :content-url="contentUrl"
      :filename="filename"
      :dark-mode="darkMode"
      :is-fullscreen="isFullscreen"
      @load="emit('load')"
      @error="emit('error', $event)"
    />
    <XlsxViewer
      v-else-if="viewerType === 'xlsx'"
      :content-url="contentUrl"
      :filename="filename"
      :dark-mode="darkMode"
      :is-fullscreen="isFullscreen"
      @load="emit('load')"
      @error="emit('error', $event)"
    />
    <PptxViewer
      v-else-if="viewerType === 'pptx'"
      :content-url="contentUrl"
      :filename="filename"
      :dark-mode="darkMode"
      :is-fullscreen="isFullscreen"
      @load="emit('load')"
      @error="emit('error', $event)"
    />

    <div v-else class="h-full w-full flex items-center justify-center">
      <div class="text-center p-4">
        <div class="text-sm text-gray-600 dark:text-gray-300">{{ unsupportedText }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from "vue";
import DocxViewer from "./DocxViewer.vue";
import XlsxViewer from "./XlsxViewer.vue";
import PptxViewer from "./PptxViewer.vue";

const props = defineProps({
  contentUrl: { type: String, required: true },
  filename: { type: String, required: true },
  darkMode: { type: Boolean, default: false },
  isFullscreen: { type: Boolean, default: false },
});

const emit = defineEmits(["load", "error", "unsupported"]);

const viewerType = computed(() => {
  const parts = (props.filename || "").split(".");
  const ext = parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
  if (ext === "docx") return "docx";
  if (ext === "xlsx") return "xlsx";
  if (ext === "pptx") return "pptx";
  return "";
});

const unsupportedText = computed(() => "该文件格式不支持本地预览，请切换到其他预览渠道。");

onMounted(() => {
  if (!viewerType.value) {
    emit("unsupported");
  }
});
</script>

<style scoped>
.office-native-router {
  background: #ffffff;
}

.office-native-router.dark {
  background: #111827;
}
</style>

