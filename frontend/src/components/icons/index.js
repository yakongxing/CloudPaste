/**
 * 统一图标组件库
 * 集中管理所有 SVG 图标
 *
 */

import { h } from 'vue'

import IconUploadSvg from '~icons/heroicons-outline/upload'
import IconDownloadSvg from '~icons/heroicons-outline/download'
import IconShoppingCartSvg from '~icons/heroicons-outline/shopping-cart'
import IconSettingsSvg from '~icons/heroicons-outline/cog'
import IconCheckboxSvg from '~icons/heroicons-outline/check-circle'
import IconTaskListSvg from '~icons/heroicons-outline/clipboard-list'
import IconChartBarSvg from '~icons/heroicons-outline/chart-bar'
import IconFolderPlusSvg from '~icons/heroicons-outline/folder-add'
import IconPlusSvg from '~icons/heroicons-outline/plus'
import IconMinusSvg from '~icons/heroicons-outline/minus'
import IconRefreshSvg from '~icons/heroicons-outline/refresh'
import IconCloseSvg from '~icons/heroicons-outline/x'
import IconMenuSvg from '~icons/heroicons-outline/dots-vertical'
import IconLinkSvg from '~icons/heroicons-outline/link'
import IconCopySvg from '~icons/heroicons-outline/duplicate'
import IconRenameSvg from '~icons/heroicons-outline/pencil-alt'
import IconDeleteSvg from '~icons/heroicons-outline/trash'
import IconSearchSvg from '~icons/heroicons-outline/search'
import IconFolderSvg from '~icons/heroicons-outline/folder'
import IconListSvg from '~icons/heroicons-outline/view-list'
import IconGridSvg from '~icons/heroicons-outline/view-grid'
import IconGallerySvg from '~icons/heroicons-outline/photograph'
import IconBackSvg from '~icons/heroicons-outline/arrow-left'
import IconArrowUpSvg from '~icons/heroicons-outline/arrow-up'
import IconChevronLeftSvg from '~icons/heroicons-outline/chevron-left'
import IconChevronDownSvg from '~icons/heroicons-outline/chevron-down'
import IconChevronRightSvg from '~icons/heroicons-outline/chevron-right'
import IconChevronUpSvg from '~icons/heroicons-outline/chevron-up'
import IconSortAscendingSvg from '~icons/heroicons-outline/sort-ascending'
import IconExternalLinkSvg from '~icons/heroicons-outline/external-link'
import IconErrorSvg from '~icons/heroicons-outline/exclamation-circle'
import IconExclamationSvg from '~icons/heroicons-outline/exclamation'
import IconInformationCircleSvg from '~icons/heroicons-outline/information-circle'
import IconArchiveSvg from '~icons/heroicons-outline/archive'
import IconHomeSvg from '~icons/heroicons-outline/home'
import IconCloudSvg from '~icons/heroicons-outline/cloud'
import IconServerStackSvg from '~icons/heroicons-outline/server-stack'
import IconBellAlertSvg from '~icons/heroicons-outline/bell-alert'
import IconGlobeAltSvg from '~icons/heroicons-outline/globe-alt'
import IconCircleStackSvg from '~icons/heroicons-outline/circle-stack'
import IconLogoutSvg from '~icons/heroicons-outline/arrow-right-on-rectangle'
import IconQrCodeSvg from '~icons/heroicons-outline/qr-code'
import IconDocumentTextSvg from '~icons/heroicons-outline/document-text'
import IconCodeSvg from '~icons/heroicons-outline/code'
import IconBookOpenSvg from '~icons/heroicons-outline/book-open'
import IconCheckSvg from '~icons/heroicons-solid/check'
import IconCheckCircleSvg from '~icons/heroicons-solid/check-circle'
import IconXCircleSvg from '~icons/heroicons-solid/x-circle'
import IconExclamationSolidSvg from '~icons/heroicons-solid/exclamation'
import IconMoonSvg from '~icons/heroicons-outline/moon'
import IconSunSvg from '~icons/heroicons-outline/sun'
import IconComputerDesktopSvg from '~icons/heroicons-outline/computer-desktop'
import IconHamburgerSvg from '~icons/heroicons-outline/menu'
import IconEyeSvg from '~icons/heroicons-outline/eye'
import IconEyeOffSvg from '~icons/heroicons-outline/eye-off'
import IconUserSvg from '~icons/heroicons-outline/user'
import IconUsersSvg from '~icons/heroicons-outline/users'
import IconCalendarSvg from '~icons/heroicons-outline/calendar'
import IconClockSvg from '~icons/heroicons-outline/clock'
import IconCameraSvg from '~icons/heroicons-outline/camera'
import IconLocationMarkerSvg from '~icons/heroicons-outline/location-marker'
import IconShieldCheckSvg from '~icons/heroicons-outline/shield-check'
import IconShareSvg from '~icons/heroicons-outline/share'
import IconFolderOpenSvg from '~icons/heroicons-outline/folder-open'
import IconAdjustmentsSvg from '~icons/heroicons-outline/adjustments'
import IconSaveSvg from '~icons/heroicons-outline/save'
import IconExpandSvg from '~icons/heroicons-outline/arrows-pointing-out'
import IconCollapseSvg from '~icons/heroicons-outline/arrows-pointing-in'
import IconKeySvg from '~icons/heroicons-outline/key'
import IconLockClosedSvg from '~icons/heroicons-outline/lock-closed'
import IconDocumentSvg from '~icons/heroicons-outline/document'
import IconCollectionSvg from '~icons/heroicons-outline/collection'
import IconGithubSvg from '~icons/mdi/github'
import IconWeiboSvg from '~icons/mdi/sina-weibo'
import IconQqSvg from '~icons/mdi/qqchat'
import IconTwitterSvg from '~icons/mdi/twitter'
import IconTelegramSvg from '~icons/mdi/telegram'
import IconFacebookSvg from '~icons/mdi/facebook'
import IconMdiChevronLeftSvg from '~icons/mdi/chevron-left'
import IconMdiClockOutlineSvg from '~icons/mdi/clock-outline'
import IconMdiFileOutlineSvg from '~icons/mdi/file-outline'
import IconMdiDatabaseOutlineSvg from '~icons/mdi/database-outline'
import IconMdiAspectRatioSvg from '~icons/mdi/aspect-ratio'
import IconMdiCalendarSvg from '~icons/mdi/calendar'
import IconMdiMapMarkerOutlineSvg from '~icons/mdi/map-marker-outline'
import IconMdiCameraSvg from '~icons/mdi/camera'
import IconMdiFocusAutoSvg from '~icons/mdi/focus-auto'
import IconMdiRulerSvg from '~icons/mdi/ruler'
import IconMdiCameraIrisSvg from '~icons/mdi/camera-iris'
import IconMdiTimerOutlineSvg from '~icons/mdi/timer-outline'
import IconMdiAlphaICircleOutlineSvg from '~icons/mdi/alpha-i-circle-outline'
import IconMdiInformationOutlineSvg from '~icons/mdi/information-outline'
import IconMdiGoogleMapsSvg from '~icons/mdi/google-maps'
import IconMdiMapMarkerSvg from '~icons/mdi/map-marker'
import IconTranslateSvg from '~icons/mdi/translate'

const normalizeClassName = (value) => {
  if (!value) return ''
  if (Array.isArray(value)) return value.filter(Boolean).join(' ')
  if (typeof value === 'object') {
    return Object.entries(value)
      .filter(([, enabled]) => enabled)
      .map(([key]) => key)
      .join(' ')
  }
  return String(value)
}

// 基础图标组件（基于 Iconify 图标组件进行二次封装）
const createIcon = (IconComponent, defaultStrokeWidth = 2) => {
  return {
    name: 'Icon',
    inheritAttrs: false,
    props: {
      size: {
        type: String,
        default: 'md'
      },
      strokeWidth: {
        type: [String, Number],
        default: defaultStrokeWidth
      }
    },
    setup(props, { attrs }) {
      const sizeMap = {
        xs: 'w-3 h-3',
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-6 h-6',
        xl: 'w-8 h-8',
        '2xl': 'w-10 h-10',
        '3xl': 'w-12 h-12',
        '4xl': 'w-16 h-16',
        '5xl': 'w-20 h-20'
      }

      return () => {
        const sizeClass = sizeMap[props.size] || sizeMap.md
        const extraClass = normalizeClassName(attrs.class)
        const mergedClass = extraClass ? `${sizeClass} ${extraClass}` : sizeClass

        const forwardedAttrs = { ...attrs }
        delete forwardedAttrs.class

        return h(IconComponent, {
          ...forwardedAttrs,
          class: mergedClass,
          'stroke-width': props.strokeWidth,
          'aria-hidden': forwardedAttrs['aria-hidden'] ?? 'true',
        })
      }
    }
  }
}

// 常用图标定义
export const IconUpload = createIcon(IconUploadSvg)

export const IconDownload = createIcon(IconDownloadSvg)

export const IconShoppingCart = createIcon(IconShoppingCartSvg)

export const IconSettings = createIcon(IconSettingsSvg)

export const IconCheckbox = createIcon(IconCheckboxSvg)

export const IconTaskList = createIcon(IconTaskListSvg)

export const IconChartBar = createIcon(IconChartBarSvg)

export const IconFolderPlus = createIcon(IconFolderPlusSvg)

export const IconPlus = createIcon(IconPlusSvg)

export const IconMinus = createIcon(IconMinusSvg)

export const IconRefresh = createIcon(IconRefreshSvg)

export const IconClose = createIcon(IconCloseSvg)

export const IconMenu = createIcon(IconMenuSvg)

export const IconLink = createIcon(IconLinkSvg)

export const IconCopy = createIcon(IconCopySvg)

export const IconRename = createIcon(IconRenameSvg)

export const IconDelete = createIcon(IconDeleteSvg)

export const IconSearch = createIcon(IconSearchSvg)

export const IconFolder = createIcon(IconFolderSvg)

export const IconList = createIcon(IconListSvg)

export const IconGrid = createIcon(IconGridSvg)

export const IconGallery = createIcon(IconGallerySvg)

export const IconBack = createIcon(IconBackSvg)

export const IconArrowUp = createIcon(IconArrowUpSvg)

export const IconChevronLeft = createIcon(IconChevronLeftSvg)

export const IconChevronDown = createIcon(IconChevronDownSvg)

export const IconChevronRight = createIcon(IconChevronRightSvg)

export const IconChevronUp = createIcon(IconChevronUpSvg)

export const IconSortAscending = createIcon(IconSortAscendingSvg)

export const IconExternalLink = createIcon(IconExternalLinkSvg)

export const IconError = createIcon(IconErrorSvg)

export const IconExclamation = createIcon(IconExclamationSvg)

export const IconInformationCircle = createIcon(IconInformationCircleSvg)

export const IconArchive = createIcon(IconArchiveSvg)

export const IconHome = createIcon(IconHomeSvg)

export const IconCloud = createIcon(IconCloudSvg)

export const IconServerStack = createIcon(IconServerStackSvg)

export const IconBellAlert = createIcon(IconBellAlertSvg)

export const IconGlobeAlt = createIcon(IconGlobeAltSvg)

export const IconCircleStack = createIcon(IconCircleStackSvg)

export const IconLogout = createIcon(IconLogoutSvg)

export const IconQrCode = createIcon(IconQrCodeSvg)

export const IconDocumentText = createIcon(IconDocumentTextSvg)

export const IconBookOpen = createIcon(IconBookOpenSvg)

export const IconCode = createIcon(IconCodeSvg)

export const IconCheck = createIcon(IconCheckSvg)

export const IconCheckCircle = createIcon(IconCheckCircleSvg)

export const IconXCircle = createIcon(IconXCircleSvg)

export const IconExclamationSolid = createIcon(IconExclamationSolidSvg)

export const IconMoon = createIcon(IconMoonSvg)

export const IconSun = createIcon(IconSunSvg)

export const IconComputerDesktop = createIcon(IconComputerDesktopSvg)

export const IconHamburger = createIcon(IconHamburgerSvg)

export const IconEye = createIcon(IconEyeSvg)

export const IconEyeOff = createIcon(IconEyeOffSvg)

export const IconUser = createIcon(IconUserSvg)

export const IconUsers = createIcon(IconUsersSvg)

export const IconCalendar = createIcon(IconCalendarSvg)

export const IconClock = createIcon(IconClockSvg)

export const IconCamera = createIcon(IconCameraSvg)

export const IconLocationMarker = createIcon(IconLocationMarkerSvg)

export const IconShieldCheck = createIcon(IconShieldCheckSvg)

export const IconShare = createIcon(IconShareSvg)

export const IconFolderOpen = createIcon(IconFolderOpenSvg)

export const IconAdjustments = createIcon(IconAdjustmentsSvg)

export const IconSave = createIcon(IconSaveSvg)

export const IconExpand = createIcon(IconExpandSvg)

export const IconCollapse = createIcon(IconCollapseSvg)

export const IconKey = createIcon(IconKeySvg)

export const IconLockClosed = createIcon(IconLockClosedSvg)

export const IconDocument = createIcon(IconDocumentSvg)

export const IconCollection = createIcon(IconCollectionSvg)

export const IconGithub = createIcon(IconGithubSvg)

export const IconWeibo = createIcon(IconWeiboSvg)

export const IconQQ = createIcon(IconQqSvg)

export const IconTwitter = createIcon(IconTwitterSvg)

export const IconTelegram = createIcon(IconTelegramSvg)

export const IconFacebook = createIcon(IconFacebookSvg)

// Lightbox（信息侧栏）专用：保持与旧版一致的 MDI 图标，但统一走 @/components/icons 出口
export const IconMdiChevronLeft = createIcon(IconMdiChevronLeftSvg)

export const IconMdiClockOutline = createIcon(IconMdiClockOutlineSvg)

export const IconMdiFileOutline = createIcon(IconMdiFileOutlineSvg)

export const IconMdiDatabaseOutline = createIcon(IconMdiDatabaseOutlineSvg)

export const IconMdiAspectRatio = createIcon(IconMdiAspectRatioSvg)

export const IconMdiCalendar = createIcon(IconMdiCalendarSvg)

export const IconMdiMapMarkerOutline = createIcon(IconMdiMapMarkerOutlineSvg)

export const IconMdiCamera = createIcon(IconMdiCameraSvg)

export const IconMdiFocusAuto = createIcon(IconMdiFocusAutoSvg)

export const IconMdiRuler = createIcon(IconMdiRulerSvg)

export const IconMdiCameraIris = createIcon(IconMdiCameraIrisSvg)

export const IconMdiTimerOutline = createIcon(IconMdiTimerOutlineSvg)

export const IconMdiAlphaICircleOutline = createIcon(IconMdiAlphaICircleOutlineSvg)

export const IconMdiInformationOutline = createIcon(IconMdiInformationOutlineSvg)

export const IconMdiGoogleMaps = createIcon(IconMdiGoogleMapsSvg)

export const IconMdiMapMarker = createIcon(IconMdiMapMarkerSvg)

// 语言/翻译图标（用于 LanguageSwitcher）
export const IconTranslate = createIcon(IconTranslateSvg)

// 导出所有图标
export default {
  IconUpload,
  IconDownload,
  IconShoppingCart,
  IconSettings,
  IconCheckbox,
  IconTaskList,
  IconChartBar,
  IconFolderPlus,
  IconPlus,
  IconMinus,
  IconRefresh,
  IconClose,
  IconMenu,
  IconLink,
  IconCopy,
  IconRename,
  IconDelete,
  IconSearch,
  IconFolder,
  IconList,
  IconGrid,
  IconGallery,
  IconBack,
  IconArrowUp,
  IconChevronLeft,
  IconChevronDown,
  IconChevronRight,
  IconChevronUp,
  IconSortAscending,
  IconExternalLink,
  IconError,
  IconExclamation,
  IconInformationCircle,
  IconArchive,
  IconHome,
  IconCloud,
  IconServerStack,
  IconBellAlert,
  IconGlobeAlt,
  IconCircleStack,
  IconLogout,
  IconQrCode,
  IconDocumentText,
  IconBookOpen,
  IconCode,
  IconCheck,
  IconCheckCircle,
  IconXCircle,
  IconExclamationSolid,
  IconMoon,
  IconSun,
  IconComputerDesktop,
  IconHamburger,
  IconEye,
  IconEyeOff,
  IconUser,
  IconUsers,
  IconCalendar,
  IconClock,
  IconCamera,
  IconLocationMarker,
  IconShieldCheck,
  IconShare,
  IconFolderOpen,
  IconAdjustments,
  IconSave,
  IconExpand,
  IconCollapse,
  IconKey,
  IconLockClosed,
  IconDocument,
  IconCollection,
  IconGithub,
  IconWeibo,
  IconQQ,
  IconTwitter,
  IconTelegram,
  IconFacebook,
  IconMdiChevronLeft,
  IconMdiClockOutline,
  IconMdiFileOutline,
  IconMdiDatabaseOutline,
  IconMdiAspectRatio,
  IconMdiCalendar,
  IconMdiMapMarkerOutline,
  IconMdiCamera,
  IconMdiFocusAuto,
  IconMdiRuler,
  IconMdiCameraIris,
  IconMdiTimerOutline,
  IconMdiAlphaICircleOutline,
  IconMdiInformationOutline,
  IconMdiGoogleMaps,
  IconMdiMapMarker,
  IconTranslate
}
