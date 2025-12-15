/**
 * PhotoSwipe图片预览组合式函数
 * 基于PhotoSwipe v5
 */

import { ref, nextTick } from "vue";
import PhotoSwipeLightbox from "photoswipe/lightbox";
import "photoswipe/style.css";
import "@/styles/photoswipe-custom.css";

export function usePhotoSwipe() {
  // PhotoSwipe实例
  const lightbox = ref(null);
  const isInitialized = ref(false);

  // 当前打开会话（每次 openPhotoSwipe 会刷新）
  const session = {
    images: /** @type {Array<any>} */ ([]),
    imageStates: /** @type {Map<string, any> | null} */ (null),
    loadImageUrl: /** @type {Function | null} */ (null),
    abortController: /** @type {AbortController | null} */ (null),
  };

  /**
   * 初始化PhotoSwipe
   *
   */
  const initPhotoSwipe = () => {
    if (isInitialized.value) return;

    try {
      lightbox.value = new PhotoSwipeLightbox({
        // 动态模式不需要gallery和children选择器
        // 我们使用loadAndOpen方法直接传递数据

        // 动态导入PhotoSwipe核心模块
        pswpModule: () => import("photoswipe"),

        // 基础配置
        showHideAnimationType: "zoom",

        // 移动端优化
        pinchToClose: true,
        closeOnVerticalDrag: true,

        // 界面配置
        padding: { top: 20, bottom: 40, left: 100, right: 100 },

        // 缩放配置 - 允许任意缩放大小
        initialZoomLevel: (zoomLevelObject) => {
          // 打开时显示适合视口的65%大小，这样用户可以缩小到更小或放大到更大
          return zoomLevelObject.fit * 0.65;
        },
        secondaryZoomLevel: "fit", // 点击缩放按钮时回到适合视口大小
        maxZoomLevel: (zoomLevelObject) => {
          // 最大可以放大到8倍fit大小
          return zoomLevelObject.fit * 8;
        },

        // 键盘导航
        arrowKeys: true,

        // 鼠标滚轮缩放
        wheelToZoom: true,

        // 背景点击关闭
        bgOpacity: 0.8,

        // 动画配置
        showAnimationDuration: 333,
        hideAnimationDuration: 333,

        // 预加载邻近图片（官方推荐用于大图廊：只预加载相邻 slide，而不是全量预取）
        preload: [1, 2],
      });

      // 监听PhotoSwipe事件
      setupPhotoSwipeEvents();

      // ✅ dataSource + itemData filter：避免打开时全量构建 slide 数据（按需生成）
      setupPhotoSwipeFilters();

      // 初始化
      lightbox.value.init();
      isInitialized.value = true;
    } catch (error) {
      console.error("❌ PhotoSwipe初始化失败:", error);
    }
  };

  /**
   * 注册过滤器：按 index 生成 slide itemData
   */
  const setupPhotoSwipeFilters = () => {
    if (!lightbox.value) return;

    lightbox.value.addFilter("itemData", (itemData, index) => {
      const image = session.images[index] || itemData;
      const state = session.imageStates ? session.imageStates.get(image?.path) : null;

      const width = state?.naturalWidth || 1200;
      const height = state?.naturalHeight || 800;
      const src = state?.status === "loaded" ? state?.url || "" : "";

      return {
        src,
        width,
        height,
        alt: image?.name || "",
        title: image?.name || "",
        __cloudpasteImage: image,
      };
    });
  };

  /**
   * 设置PhotoSwipe事件监听器
   */
  const setupPhotoSwipeEvents = () => {
    if (!lightbox.value) return;

    // 关闭：控制会话 Abort（避免关闭后继续请求）
    lightbox.value.on("close", () => {
      session.abortController?.abort();
      session.abortController = null;
      session.images = [];
      session.imageStates = null;
      session.loadImageUrl = null;
    });

    // 按需加载：拦截 contentLoad，自行异步填充 src（避免 open 时全量 await）
    lightbox.value.on("contentLoad", (e) => {
      const content = e?.content;
      const image = content?.data?.__cloudpasteImage;
      if (!content || !image) return;

      e.preventDefault();

      const img = document.createElement("img");
      img.className = "pswp__img";
      img.decoding = "async";
      img.alt = image?.name || "";

      content.element = img;
      content.state = "loading";

      const signal = session.abortController?.signal;

      void (async () => {
        try {
          const src = await ensureImageSrc(image, { signal });
          if (signal?.aborted) return;

          img.onload = () => {
            // 回写尺寸，改善后续 zoom/布局
            if (session.imageStates && image?.path) {
              const prev = session.imageStates.get(image.path) || null;
              session.imageStates.set(image.path, {
                ...(prev || { status: "loaded", url: src }),
                status: "loaded",
                url: src,
                naturalWidth: img.naturalWidth,
                naturalHeight: img.naturalHeight,
                aspectRatio: img.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : undefined,
              });
            }
            content.onLoaded();
          };

          img.onerror = () => {
            content.onError();
          };

          img.src = src;
        } catch (error) {
          content.onError();
        }
      })();
    });

    // 索引变化：预取相邻项（配合 preload，让用户滑动更顺）
    lightbox.value.on("change", () => {
      const pswp = lightbox.value.pswp;
      if (!pswp) return;
      void prefetchAround(pswp.currIndex);
    });

    // 注册自定义UI元素
    lightbox.value.on("uiRegister", () => {
      registerCustomUIElements();
    });
  };

  /**
   * 注册自定义UI元素
   * 使用PhotoSwipe官方API，保持原生风格
   */
  const registerCustomUIElements = () => {
    const pswp = lightbox.value.pswp;
    if (!pswp) {
      console.warn("⚠️ PhotoSwipe实例不可用，无法注册自定义UI元素");
      return;
    }

    try {
      // 注册旋转按钮
      registerRotateButton(pswp);

      // 注册翻转按钮
      registerFlipButton(pswp);

      // 注册图片信息显示
      registerImageInfo(pswp);
    } catch (error) {
      console.error("❌ PhotoSwipe自定义UI元素注册失败:", error);
    }
  };

  /**
   * 打开PhotoSwipe预览
   * @param {Array} images - 图片数组
   * @param {number} startIndex - 起始索引
   * @param {Map} imageStates - 图片状态管理Map（可选）
   * @param {Function} loadImageUrl - 图片URL加载函数（可选）
   */
  const openPhotoSwipe = async (images, startIndex = 0, imageStates = null, loadImageUrl = null) => {
    if (!images || images.length === 0) {
      console.warn("⚠️ PhotoSwipe: 没有图片可预览");
      return;
    }

    // 确保PhotoSwipe已初始化
    if (!isInitialized.value) {
      initPhotoSwipe();
      // 等待初始化完成
      await nextTick();
    }

    // 更新会话上下文（供 filter/contentLoad/change 使用）
    session.images = images;
    session.imageStates = imageStates;
    session.loadImageUrl = loadImageUrl;
    session.abortController?.abort();
    session.abortController = new AbortController();

    const validStartIndex = Math.max(0, Math.min(startIndex, images.length - 1));

    // 先确保“当前图片”可立即展示（避免打开后长时间空白）
    const image = images[validStartIndex];
    if (image) {
      try {
        await ensureImageSrc(image, { signal: session.abortController.signal, priority: "high" });
      } catch (error) {
        // 即便失败也允许打开，交给 contentLoad error UI 处理
      }
    }

    // 打开（dataSource 直接传 images，由 itemData filter 转换）
    lightbox.value.loadAndOpen(validStartIndex, images);

    // 后台预取邻近项
    void prefetchAround(validStartIndex);
  };

  /**
   * 确保某张图片具备可渲染的 src（按需触发 loadImageUrl）
   * @param {any} image
   * @param {{ signal?: AbortSignal; priority?: "high" | "normal" }} [options]
   * @returns {Promise<string>}
   */
  const ensureImageSrc = async (image, options = {}) => {
    const signal = options.signal;
    if (signal?.aborted) throw new Error("aborted");

    const state = session.imageStates ? session.imageStates.get(image?.path) : null;
    if (state?.status === "loaded" && state?.url) return state.url;

    if (typeof session.loadImageUrl === "function") {
      await session.loadImageUrl(image, { priority: options.priority || "high", signal });
    }

    const nextState = session.imageStates ? session.imageStates.get(image?.path) : null;
    if (nextState?.status === "loaded" && nextState?.url) return nextState.url;
    throw new Error("image src unavailable");
  };

  const prefetchAround = async (index) => {
    const signal = session.abortController?.signal;
    if (!Array.isArray(session.images) || session.images.length === 0) return;
    if (signal?.aborted) return;

    // 与 preload 配合：主观再补一层预取
    const candidates = [index - 2, index - 1, index + 1, index + 2];
    for (const i of candidates) {
      if (i < 0 || i >= session.images.length) continue;
      const image = session.images[i];
      if (!image) continue;
      void ensureImageSrc(image, { signal, priority: "normal" });
    }
  };

  /**
   * 销毁PhotoSwipe实例
   */
  const destroyPhotoSwipe = () => {
    if (lightbox.value) {
      lightbox.value.destroy();
      lightbox.value = null;
      isInitialized.value = false;
    }
  };

  /**
   * 注册旋转按钮
   * 使用PhotoSwipe官方API，保持原生风格
   */
  const registerRotateButton = (pswp) => {
    // 存储每张图片的旋转角度
    const imageRotations = new Map();

    pswp.ui.registerElement({
      name: "rotate-button",
      title: "旋转",
      ariaLabel: "旋转图片",
      order: 7, // 在缩放按钮(order: 10)之前
      isButton: true,
      // ✅ 还原到最开始的简单旋转样式
      html: {
        isCustomSVG: true,
        inner:
          '<path d="M12 6v3l4-4-4-4v3c-4.42 0-8 3.58-8 8 0 1.57.46 3.03 1.24 4.26L6.7 14.8c-.45-.83-.7-1.79-.7-2.8 0-3.31 2.69-6 6-6zm6.76 1.74L17.3 9.2c.44.84.7 1.79.7 2.8 0 3.31-2.69 6-6 6v-3l-4 4 4 4v-3c4.42 0 8-3.58 8-8 0-1.57-.46-3.03-1.24-4.26z" id="pswp__icn-rotate"/>',
        outlineID: "pswp__icn-rotate",
      },
      onClick: (_, __, pswp) => {
        try {
          const currentSlide = pswp.currSlide;
          if (!currentSlide || !currentSlide.content) {
            console.warn("⚠️ 旋转按钮: 当前幻灯片不可用");
            return;
          }

          // 获取当前图片的唯一标识
          const imageKey = currentSlide.data.src;
          if (!imageKey) {
            console.warn("⚠️ 旋转按钮: 图片URL不可用");
            return;
          }

          const currentRotation = imageRotations.get(imageKey) || 0;
          const newRotation = (currentRotation + 90) % 360;

          // 更新旋转角度
          imageRotations.set(imageKey, newRotation);

          // 应用CSS变换到图片元素，保持翻转状态
          const imageElement = currentSlide.content.element;
          if (imageElement) {
            // 获取当前的transform值，保持翻转状态
            const currentTransform = imageElement.style.transform || "";
            const scaleMatch = currentTransform.match(/scaleY\([^)]*\)/);
            const scaleTransform = scaleMatch ? scaleMatch[0] : "";

            // 组合变换：翻转 + 旋转
            const rotateTransform = `rotate(${newRotation}deg)`;
            const combinedTransform = [scaleTransform, rotateTransform].filter(Boolean).join(" ");

            imageElement.style.transform = combinedTransform;
            imageElement.style.transition = "transform 0.3s ease";

          } else {
            console.warn("⚠️ 旋转按钮: 图片元素不可用");
          }
        } catch (error) {
          console.error("❌ 旋转按钮操作失败:", error);
        }
      },
    });
  };

  /**
   * 注册翻转按钮
   * 使用PhotoSwipe官方API，保持原生风格
   */
  const registerFlipButton = (pswp) => {
    // 存储每张图片的翻转状态
    const imageFlips = new Map();

    pswp.ui.registerElement({
      name: "flip-button",
      title: "翻转",
      ariaLabel: "上下翻转图片",
      order: 7.5, // 在旋转按钮之后，下载按钮之前
      isButton: true,
      html: {
        isCustomSVG: true,
        inner: '<path d="M16 4l4 4h-3v8h-2V8h-3l4-4zm0 24l-4-4h3v-8h2v8h3l-4 4zM8 14h2v4H8v-4zm14 0h2v4h-2v-4z" id="pswp__icn-flip"/>',
        outlineID: "pswp__icn-flip",
      },
      onClick: (_, __, pswp) => {
        try {
          const currentSlide = pswp.currSlide;
          if (!currentSlide || !currentSlide.content) {
            console.warn("⚠️ 翻转按钮: 当前幻灯片不可用");
            return;
          }

          // 获取当前图片的唯一标识
          const imageKey = currentSlide.data.src;
          if (!imageKey) {
            console.warn("⚠️ 翻转按钮: 图片URL不可用");
            return;
          }

          const currentFlip = imageFlips.get(imageKey) || false;
          const newFlip = !currentFlip;

          // 更新翻转状态
          imageFlips.set(imageKey, newFlip);

          // 应用CSS变换到图片元素
          const imageElement = currentSlide.content.element;
          if (imageElement) {
            // 获取当前的transform值，保持旋转状态
            const currentTransform = imageElement.style.transform || "";
            const rotateMatch = currentTransform.match(/rotate\([^)]*\)/);
            const rotateTransform = rotateMatch ? rotateMatch[0] : "";

            // 组合变换：翻转 + 旋转
            const flipTransform = newFlip ? "scaleY(-1)" : "";
            const combinedTransform = [flipTransform, rotateTransform].filter(Boolean).join(" ");

            imageElement.style.transform = combinedTransform;
            imageElement.style.transition = "transform 0.3s ease";

          } else {
            console.warn("⚠️ 翻转按钮: 图片元素不可用");
          }
        } catch (error) {
          console.error("❌ 翻转按钮操作失败:", error);
        }
      },
    });
  };

  /**
   * 注册图片信息显示
   * 使用PhotoSwipe官方API，保持原生风格
   */
  const registerImageInfo = (pswp) => {
    pswp.ui.registerElement({
      name: "image-info",
      className: "pswp__image-info",
      appendTo: "wrapper", // 添加到wrapper而不是toolbar
      onInit: (el, pswp) => {
        try {
          // 创建信息容器
          el.innerHTML = `
            <div class="pswp__image-info-content">
              <div class="pswp__image-name"></div>
              <div class="pswp__image-details"></div>
            </div>
          `;

          const nameEl = el.querySelector(".pswp__image-name");
          const detailsEl = el.querySelector(".pswp__image-details");

          if (!nameEl || !detailsEl) {
            console.error("❌ 图片信息显示: 无法找到信息元素");
            return;
          }

          // 更新图片信息
          const updateImageInfo = () => {
            try {
              const currentSlide = pswp.currSlide;
              if (currentSlide && currentSlide.data) {
                const image = currentSlide.data.originalImage;
                const name = image?.name || "Unknown";
                const width = currentSlide.data.width || "Unknown";
                const height = currentSlide.data.height || "Unknown";
                const size = image?.size ? formatFileSize(image.size) : "";

                nameEl.textContent = name;
                detailsEl.textContent = `${width} × ${height}${size ? ` • ${size}` : ""}`;
              } else {
                nameEl.textContent = "Unknown";
                detailsEl.textContent = "";
              }
            } catch (error) {
              console.error("❌ 更新图片信息失败:", error);
            }
          };

          // 监听图片切换
          pswp.on("change", updateImageInfo);

          // 初始更新
          updateImageInfo();

        } catch (error) {
          console.error("❌ 图片信息显示初始化失败:", error);
        }
      },
    });
  };

  /**
   * 格式化文件大小
   * 工具函数，用于显示文件大小
   */
  const formatFileSize = (bytes) => {
    if (!bytes) return "";

    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
  };

  return {
    // 状态
    isInitialized,

    // 方法
    initPhotoSwipe,
    openPhotoSwipe,
    destroyPhotoSwipe,
  };
}
