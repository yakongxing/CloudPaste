<template>
  <div class="office-native-viewer h-full w-full">
    <div ref="containerRef" class="docx-container h-full w-full overflow-auto"></div>

    <div v-if="loading" class="absolute inset-0 flex items-center justify-center bg-white/70">
      <svg class="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>

    <div v-else-if="errorMessage" class="absolute inset-0 flex items-center justify-center bg-white/70">
      <div class="text-center p-4">
        <div class="text-sm text-red-600">{{ errorMessage }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { nextTick, onMounted, onUnmounted, ref } from "vue";
import { fetchFileBinaryWithAuth } from "@/api/services/fileDownloadService.js";

const props = defineProps({
  contentUrl: { type: String, required: true },
  filename: { type: String, default: "" },
  darkMode: { type: Boolean, default: false },
  isFullscreen: { type: Boolean, default: false },
});

const emit = defineEmits(["load", "error"]);

const containerRef = ref(null);
const loading = ref(true);
const errorMessage = ref("");

const cleanupContainer = () => {
  if (containerRef.value) {
    containerRef.value.innerHTML = "";
  }
};

onMounted(async () => {
  try {
    loading.value = true;
    errorMessage.value = "";

    if (!props.contentUrl) {
      throw new Error("缺少 contentUrl");
    }

    const [{ buffer }, docxPreview] = await Promise.all([
      fetchFileBinaryWithAuth(props.contentUrl),
      import("docx-preview"),
    ]);

    await nextTick();
    if (!containerRef.value) {
      throw new Error("预览容器未就绪");
    }

    cleanupContainer();

    const renderAsync = docxPreview?.renderAsync;
    if (typeof renderAsync !== "function") {
      throw new Error("docx-preview renderAsync 不可用");
    }

    await renderAsync(buffer, containerRef.value, null, {
      className: "docx-preview",
      breakPages: true,
    });

    loading.value = false;
    emit("load");
  } catch (err) {
    console.error("DOCX 本地预览失败:", err);
    loading.value = false;
    errorMessage.value = err?.message || String(err);
    emit("error", err);
  }
});

onUnmounted(() => {
  cleanupContainer();
});
</script>

<style scoped>
.office-native-viewer {
  position: relative;
  background: #ffffff;
}

.docx-container {
  background: transparent;
  overscroll-behavior: contain;
}
</style>
