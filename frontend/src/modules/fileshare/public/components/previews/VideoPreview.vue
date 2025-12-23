<template>
  <div
    ref="previewContainerRef"
    class="video-preview rounded-lg overflow-hidden mb-2 w-full relative border border-gray-200 dark:border-gray-700 flex flex-col"
    :class="isFullscreen ? 'h-screen' : ''"
  >
    <PreviewProviderHeader
      :title="filename || t('fileView.preview.video.title')"
      :options="providerOptions"
      :show-select="providerOptions.length > 1"
      :show-fullscreen="true"
      :fullscreen-target="previewContainerRef"
      v-model="selectedProviderKey"
      @fullscreen-change="handleFullscreenChange"
    />

    <!-- 视频预览内容 -->
    <div
      class="relative bg-gray-900"
      :class="isFullscreen ? 'flex-1 min-h-0' : 'h-[calc(100vh-350px)] min-h-[300px]'"
    >
      <VideoPlayer
        ref="videoPlayerRef"
        v-if="currentPreviewUrl && videoData"
        :video="videoData"
        :dark-mode="darkMode"
        :autoplay="false"
        :volume="0.7"
        :muted="false"
        :loop="false"
        :custom-controls="[]"
        class="w-full h-full"
        @play="handlePlay"
        @pause="handlePause"
        @error="handleError"
        @canplay="handleCanPlay"
        @ended="handleVideoEnded"
        @timeupdate="handleTimeUpdate"
        @fullscreen="handlePlayerFullscreen"
        @fullscreenExit="handleFullscreenExit"
        @ready="handlePlayerReady"
      />

      <!-- 加载状态 -->
      <div
        v-if="!videoData"
        class="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700"
      >
        <LoadingIndicator
          :text="t('fileView.preview.video.loading')"
          :dark-mode="darkMode"
          size="2xl"
          :icon-class="darkMode ? 'text-primary-500' : 'text-primary-600'"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onBeforeUnmount, watch } from "vue";
import { useI18n } from "vue-i18n";
import VideoPlayer from "@/components/common/VideoPlayer.vue";
import LoadingIndicator from "@/components/common/LoadingIndicator.vue";
import { useProviderSelector } from "@/composables/file-preview/useProviderSelector.js";
import PreviewProviderHeader from "@/components/common/preview/PreviewProviderHeader.vue";

const { t } = useI18n();

// Props 定义
const props = defineProps({
  // 多源预览架构
  providers: {
    type: Object,
    default: () => ({}),
  },
  nativeUrl: {
    type: String,
    default: "",
  },
  // 兼容旧调用
  previewUrl: {
    type: String,
    default: "",
  },
  linkType: {
    type: String,
    default: null,
  },
  mimetype: {
    type: String,
    required: true,
  },
  filename: {
    type: String,
    default: "",
  },
  darkMode: {
    type: Boolean,
    default: false,
  },
});

// Emits 定义
const emit = defineEmits(["load", "error", "play", "pause", "fullscreen", "fullscreenExit"]);

// 容器 ref 和全屏状态
const previewContainerRef = ref(null);
const isFullscreen = ref(false);

const handleFullscreenChange = (val) => {
  isFullscreen.value = val;
};

// 解析 nativeUrl
const resolvedNativeUrl = computed(() => props.nativeUrl || props.previewUrl || "");

// 使用统一的 provider 选择器
const {
  providerOptions,
  selectedKey: selectedProviderKey,
  currentUrl: currentPreviewUrl,
} = useProviderSelector({
  providers: computed(() => props.providers || {}),
  nativeUrl: resolvedNativeUrl,
  nativeLabel: computed(() => t("fileView.preview.video.browserNative")),
});

// 响应式数据
const videoPlayerRef = ref(null);
const isPlaying = ref(false);
const originalTitle = ref("");
const currentTime = ref(0);
const duration = ref(0);

// 当前视频数据（响应式）
const currentVideoData = ref(null);

// 为了兼容性，保留 videoData 计算属性
const videoData = computed(() => currentVideoData.value);

// 更新页面标题
const updatePageTitle = (playing = false, fileName = null) => {
  const title = fileName || "视频预览";
  document.title = playing ? `🎬 ${title}` : `${title}`;
};

// 恢复原始页面标题
const restoreOriginalTitle = () => {
  if (originalTitle.value) {
    document.title = originalTitle.value;
  }
};

// 生成默认海报
const generateDefaultPoster = (fileName) => {
  const canvas = document.createElement("canvas");
  canvas.width = 320;
  canvas.height = 180;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#1f2937";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#ffffff";
  ctx.font = "16px Arial";
  ctx.textAlign = "center";
  ctx.fillText("🎬", canvas.width / 2, canvas.height / 2 - 10);
  ctx.font = "12px Arial";
  ctx.fillText(fileName || "视频文件", canvas.width / 2, canvas.height / 2 + 15);

  return canvas.toDataURL();
};

// 事件处理函数
const handlePlay = (data) => {
  isPlaying.value = true;
  const videoName = data?.video?.name || props.filename;
  updatePageTitle(true, videoName);
  emit("play", data);
};

const handlePause = (data) => {
  isPlaying.value = false;
  const videoName = data?.video?.name || props.filename;
  updatePageTitle(false, videoName);
  emit("pause", data);
};

const handleError = (error) => {
  // 忽略Service Worker相关的误报错误
  if (error?.target?.src?.includes(window.location.origin) && currentVideoData.value?.url) {
    console.log("🎬 忽略Service Worker相关的误报错误，视频实际可以正常播放");
    return;
  }

  isPlaying.value = false;
  console.error("视频播放错误:", error);
  emit("error", error);
};

const handleCanPlay = () => {
  emit("load");
};

const handleTimeUpdate = (data) => {
  currentTime.value = data.currentTime;
  duration.value = data.duration;
};

// 处理视频播放结束
const handleVideoEnded = () => {
  isPlaying.value = false;
  updatePageTitle(false, props.filename);
};

// 处理全屏事件（来自播放器内部）
const handlePlayerFullscreen = () => {
  emit("fullscreen");
};

const handleFullscreenExit = () => {
  emit("fullscreenExit");
};

// 处理播放器准备就绪
const handlePlayerReady = () => {
  // 播放器准备就绪
};

// 初始化当前视频数据
const initializeCurrentVideo = async () => {
  const url = currentPreviewUrl.value;
  if (!url) {
    return;
  }

  // 构建视频数据对象
  currentVideoData.value = {
    name: props.filename || "视频文件",
    title: props.filename || "视频预览",
    url: url,
    linkType: props.linkType || null,
    poster: generateDefaultPoster(props.filename),
    contentType: props.mimetype,
    mimetype: props.mimetype,
  };
};

// 监听 currentPreviewUrl 变化
watch(
  currentPreviewUrl,
  async (newUrl) => {
    if (newUrl) {
      await initializeCurrentVideo();
    }
  },
  { immediate: true }
);

// 快捷键处理
const handleKeydown = (event) => {
  // 如果用户正在输入框中输入，不处理快捷键
  if (event.target.tagName === "INPUT" || event.target.tagName === "TEXTAREA") {
    return;
  }

  const player = videoPlayerRef.value?.getInstance();
  if (!player) return;

  switch (event.code) {
    case "Space":
      event.preventDefault();
      player.toggle();
      break;
    case "ArrowLeft":
      event.preventDefault();
      player.seek = Math.max(0, player.currentTime - 10);
      break;
    case "ArrowRight":
      event.preventDefault();
      player.seek = Math.min(player.duration, player.currentTime + 10);
      break;
    case "ArrowUp":
      event.preventDefault();
      player.volume = Math.min(1, player.volume + 0.1);
      break;
    case "ArrowDown":
      event.preventDefault();
      player.volume = Math.max(0, player.volume - 0.1);
      break;
    case "KeyF":
      event.preventDefault();
      player.fullscreen = !player.fullscreen;
      break;
  }
};

// 生命周期钩子
onMounted(() => {
  originalTitle.value = document.title;
  document.addEventListener("keydown", handleKeydown);
});

onBeforeUnmount(() => {
  restoreOriginalTitle();
  document.removeEventListener("keydown", handleKeydown);
});
</script>

<style scoped>
/* 全屏时预览容器填满屏幕 */
.video-preview :deep(:fullscreen),
.video-preview :deep(:-webkit-full-screen),
.video-preview :deep(:-moz-full-screen) {
  width: 100vw !important;
  height: 100vh !important;
  background: #000;
}

/* 确保 VideoPlayer 和 Artplayer 填满容器 */
.video-preview :deep(.video-player-container),
.video-preview :deep(.artplayer-container),
.video-preview :deep(.art-video-player) {
  width: 100% !important;
  height: 100% !important;
}

/* 移动端优化 */
@media (max-width: 768px) {
  .video-preview {
    min-height: 200px;
  }
}
</style>
