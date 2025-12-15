<template>
  <div
    ref="containerRef"
    class="live-photo-viewer"
    :class="{
      'live-photo-viewer--playing': state.isPlaying,
      'live-photo-viewer--loading': state.isLoading,
      'live-photo-viewer--error': state.hasError,
      'live-photo-viewer--dark': darkMode,
    }"
    :style="containerStyle"
  >
    <!-- 媒体容器 -->
    <div class="live-photo-viewer__media">
      <!-- 视频层 -->
      <video
        ref="videoRef"
        class="live-photo-viewer__video"
        :src="lazyLoad ? undefined : videoSrc"
        :data-src="lazyLoad ? videoSrc : undefined"
        playsinline
        preload="metadata"
        :muted="muted"
        :loop="loop"
        @loadedmetadata="handleVideoLoadedMetadata"
      />

      <!-- 图片层 -->
      <img
        ref="imageRef"
        class="live-photo-viewer__image"
        :src="photoSrc"
        :alt="alt"
        loading="lazy"
        @load="handleImageLoad"
        @error="handleImageError"
      />
    </div>

    <!-- 进度条 -->
    <div v-if="showProgress && state.isLoading" class="live-photo-viewer__progress">
      <div class="live-photo-viewer__progress-bar" :style="{ width: `${state.progress}%` }" />
    </div>

    <!-- 徽章图标 -->
    <div
      v-if="showBadge"
      class="live-photo-viewer__badge"
      :class="{ 'live-photo-viewer__badge--static': staticBadge }"
      @mouseenter="!isMobileDevice && handleMouseEnter()"
      @mouseleave="!isMobileDevice && handleMouseLeave()"
    >
      <!-- 错误图标 -->
      <svg v-if="state.hasError" class="live-photo-viewer__badge-icon live-photo-viewer__badge-icon--error" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
      </svg>
      <!-- Live Photo 图标 -->
      <svg v-else class="live-photo-viewer__badge-icon" viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="12" r="3" />
        <path
          d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"
          opacity="0.3"
        />
      </svg>
      <span v-if="showBadgeText" class="live-photo-viewer__badge-text">{{ badgeText || t("livePhoto.badge") }}</span>
    </div>

    <!-- 触摸覆盖层（移动端） -->
    <div
      v-if="isMobileDevice"
      class="live-photo-viewer__overlay"
      @touchstart.prevent="handleTouchStart"
      @touchend="handleTouchEnd"
      @touchcancel="handleTouchEnd"
    />

    <!-- 警告提示 -->
    <Transition name="live-photo-warning">
      <div v-if="state.hasError && state.errorMessage" class="live-photo-viewer__warning">
        {{ warningMessage }}
      </div>
    </Transition>

    <!-- 加载指示器 -->
    <div v-if="state.isLoading && showLoadingIndicator" class="live-photo-viewer__loading">
      <div class="live-photo-viewer__loading-spinner" />
    </div>
  </div>
</template>

<script setup>
import { computed, watch, onMounted, toRef } from "vue";
import { useI18n } from "vue-i18n";
import { useLivePhoto, PlaybackStyle, LivePhotoErrorType } from "./useLivePhoto.js";

const { t } = useI18n();

// Props 定义
const props = defineProps({
  // 必需属性
  photoSrc: {
    type: String,
    required: true,
  },
  videoSrc: {
    type: String,
    required: true,
  },

  // 尺寸控制
  width: {
    type: [Number, String],
    default: null,
  },
  height: {
    type: [Number, String],
    default: null,
  },
  aspectRatio: {
    type: [Number, String],
    default: null,
  },
  maxWidth: {
    type: [Number, String],
    default: "100%",
  },
  maxHeight: {
    type: [Number, String],
    default: null,
  },

  // 行为控制
  autoplay: {
    type: Boolean,
    default: false,
  },
  lazyLoad: {
    type: Boolean,
    default: true,
  },
  longPressDelay: {
    type: Number,
    default: 300,
  },
  enableVibration: {
    type: Boolean,
    default: true,
  },
  muted: {
    type: Boolean,
    default: true,
  },
  loop: {
    type: Boolean,
    default: false,
  },
  playbackStyle: {
    type: String,
    default: PlaybackStyle.FULL,
    validator: (value) => Object.values(PlaybackStyle).includes(value),
  },
  stillImageTime: {
    type: Number,
    default: null,
  },

  // 外观控制
  darkMode: {
    type: Boolean,
    default: false,
  },
  borderRadius: {
    type: [Number, String],
    default: 8,
  },
  showBadge: {
    type: Boolean,
    default: true,
  },
  showBadgeText: {
    type: Boolean,
    default: true,
  },
  badgeText: {
    type: String,
    default: "",
  },
  staticBadge: {
    type: Boolean,
    default: false,
  },
  showProgress: {
    type: Boolean,
    default: true,
  },
  showLoadingIndicator: {
    type: Boolean,
    default: false,
  },
  alt: {
    type: String,
    default: "Live Photo",
  },

  // 样式定制
  imageStyle: {
    type: Object,
    default: () => ({}),
  },
  videoStyle: {
    type: Object,
    default: () => ({}),
  },
});

// Emits 定义
const emit = defineEmits(["play", "pause", "ended", "error", "load", "progress", "canplay", "click"]);

// 使用 composable
const {
  state,
  config,
  containerRef,
  videoRef,
  imageRef,
  canPlay,
  isMobileDevice,
  play,
  pause,
  stop,
  toggle,
  warmVideo,
  destroy,
  reset,
  handleTouchStart: baseTouchStart,
  handleTouchEnd: baseTouchEnd,
  handleMouseEnter,
  handleMouseLeave,
} = useLivePhoto({
  // 传入 Ref，确保 composable 内部 watch 能正确响应 prop 变化
  photoSrc: toRef(props, "photoSrc"),
  videoSrc: toRef(props, "videoSrc"),
  autoplay: props.autoplay,
  lazyLoad: props.lazyLoad,
  longPressDelay: props.longPressDelay,
  enableVibration: props.enableVibration,
  stillImageTime: props.stillImageTime,
  playbackStyle: props.playbackStyle,
  onPlay: () => emit("play"),
  onPause: () => emit("pause"),
  onEnded: () => emit("ended"),
  onError: (error) => emit("error", error),
  onProgress: (progress) => emit("progress", progress),
  onCanPlay: () => emit("canplay"),
  onClick: (e) => emit("click", e),
});

const warningMessage = computed(() => {
  if (!state.hasError || !state.errorMessage) return "";
  if (typeof state.errorMessage === "string" && state.errorMessage.startsWith("livePhoto.")) {
    return t(state.errorMessage);
  }
  return state.errorMessage;
});

// 计算样式
const containerStyle = computed(() => {
  const style = {};

  if (!props.width && !props.height) {
    style.width = "100%";
  }

  if (props.width) {
    style.width = typeof props.width === "number" ? `${props.width}px` : props.width;
  }

  if (props.height) {
    style.height = typeof props.height === "number" ? `${props.height}px` : props.height;
  }

  if (props.aspectRatio) {
    style.aspectRatio = props.aspectRatio.toString();
  }

  if (props.maxWidth) {
    style.maxWidth = typeof props.maxWidth === "number" ? `${props.maxWidth}px` : props.maxWidth;
  }

  if (props.maxHeight) {
    style.maxHeight = typeof props.maxHeight === "number" ? `${props.maxHeight}px` : props.maxHeight;
  }

  if (props.borderRadius) {
    style["--live-photo-border-radius"] = typeof props.borderRadius === "number" ? `${props.borderRadius}px` : props.borderRadius;
  }

  return style;
});

// 事件处理
const handleTouchStart = (e) => {
  baseTouchStart(e);
};

const handleTouchEnd = (e) => {
  baseTouchEnd(e);
};

const handleImageLoad = (e) => {
  // 自动计算宽高比
  if (!props.aspectRatio && imageRef.value) {
    const img = imageRef.value;
    const ratio = img.naturalWidth / img.naturalHeight;
    if (containerRef.value && !props.width && !props.height) {
      containerRef.value.style.aspectRatio = ratio.toString();
    }
  }
  emit("load", e);
};

const handleImageError = (e) => {
  state.hasError = true;
  state.isPlaying = false;
  state.isLoading = false;
  state.isLoaded = false;
  state.errorMessage = "livePhoto.errors.photoLoadFailed";
  emit("error", { type: LivePhotoErrorType.PHOTO_LOAD_ERROR, message: state.errorMessage, originalError: e });
};

const handleVideoLoadedMetadata = () => {
  // 视频元数据加载完成
};

// 自动播放：等视频可播后再触发，避免 mounted 时 canPlay 仍为 false
watch(
  () => [props.autoplay, canPlay.value],
  ([autoplay, ready]) => {
    if (autoplay && ready) {
      play();
    }
  },
  { immediate: true }
);

// 暴露方法给父组件
defineExpose({
  play,
  pause,
  stop,
  toggle,
  reset,
  destroy,
  warmVideo,
  state,
  canPlay,
});

// 自动播放
onMounted(() => {
  // 兼容旧逻辑：真正触发由上面的 watch 负责
});
</script>

<style src="./LivePhotoViewer.css"></style>
