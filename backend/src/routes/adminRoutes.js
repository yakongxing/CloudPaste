import { Hono } from "hono";
import { login, logout, changePassword, testAdminToken } from "../services/adminService.js";
import { ApiStatus, UserType } from "../constants/index.js";
import { jsonOk } from "../utils/common.js";
import { directoryCacheManager, urlCacheManager, searchCacheManager } from "../cache/index.js";
import { invalidateFsCache, invalidateAllCaches } from "../cache/invalidation.js";
import { usePolicy } from "../security/policies/policies.js";
import { resolvePrincipal } from "../security/helpers/principal.js";
import { ValidationError } from "../http/errors.js";
import { getEncryptionSecret } from "../utils/environmentUtils.js";
import { MountManager } from "../storage/managers/MountManager.js";
import { FileSystem } from "../storage/fs/FileSystem.js";
import { ensureRepositoryFactory } from "../utils/repositories.js";
import { FsSearchIndexStore } from "../storage/fs/search/FsSearchIndexStore.js";

const adminRoutes = new Hono();
const requireAdmin = usePolicy("admin.all");
const requireMountView = usePolicy("fs.base");

const readCacheStats = async (label, reader) => {
  if (typeof reader !== "function") {
    return { error: `${label}模块未启用` };
  }

  return Promise.resolve()
    .then(() => reader())
    .catch((error) => {
      console.warn(`获取${label}统计失败:`, error);
      return { error: `${label}模块未启用` };
    });
};

// 管理员登录
adminRoutes.post("/api/admin/login", async (c) => {
  const db = c.env.DB;
  const repositoryFactory = c.get("repos");
  const { username, password } = await c.req.json();
  const loginResult = await login(db, username, password, repositoryFactory, c.env);

  return jsonOk(c, loginResult, "登录成功");
});

// 管理员登出 - 不需要认证检查，因为可能令牌已过期
adminRoutes.post("/api/admin/logout", async (c) => {
  const db = c.env.DB;
  const repositoryFactory = c.get("repos");
  const authHeader = c.req.header("Authorization");

  // 如果没有认证头，直接返回成功（前端清理状态）
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return jsonOk(c, undefined, "登出成功");
  }

  const token = authHeader.substring(7);

  await logout(db, token, repositoryFactory).catch((error) => {
    console.log("登出时清理令牌失败（可能已过期）:", error.message);
  });

  return jsonOk(c, undefined, "登出成功");
});

// 更改管理员密码（需要认证）
adminRoutes.post("/api/admin/change-password", requireAdmin, async (c) => {
  const db = c.env.DB;
  const repositoryFactory = c.get("repos");
  const { userId: adminId } = resolvePrincipal(c, { allowedTypes: [UserType.ADMIN] });
  const { currentPassword, newPassword, newUsername } = await c.req.json();

  await changePassword(db, adminId, currentPassword, newPassword, newUsername, repositoryFactory);

  return jsonOk(c, undefined, "信息更新成功，请重新登录");
});

// 测试管理员令牌路由
adminRoutes.get("/api/test/admin-token", requireAdmin, async (c) => {
  // 使用新的统一认证系统，管理员权限已在中间件中验证
  return jsonOk(c, undefined, "令牌有效");
});

// 获取系统监控信息（包括缓存统计和系统内存）
adminRoutes.get("/api/admin/cache/stats", requireAdmin, async (c) => {
  const dirStats = directoryCacheManager.getStats();
  const urlStats = await readCacheStats("URL缓存模块", () => urlCacheManager.getStats());
  const searchStats = await readCacheStats("搜索缓存模块", () => searchCacheManager.getStats());

  const memUsage = process.memoryUsage();
  const systemMemory = {
    rss: Math.round(memUsage.rss / 1024 / 1024),
    heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
    heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
    external: Math.round(memUsage.external / 1024 / 1024),
    arrayBuffers: memUsage.arrayBuffers ? Math.round(memUsage.arrayBuffers / 1024 / 1024) : 0,
    heapUsagePercent: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100),
  };

  return jsonOk(c, {
      cache: {
        directory: dirStats,
        url: urlStats,
        search: searchStats,
      },
      system: {
        memory: systemMemory,
        uptime: Math.round(process.uptime()),
      },
      timestamp: new Date().toISOString(),
    }, "获取系统监控信息成功");
});

// 清理目录缓存（管理员）
adminRoutes.post("/api/admin/cache/clear", requireAdmin, async (c) => {
  const db = c.env.DB;
  const { mountId, storageConfigId } = await c.req.json().catch(() => ({}));
  let clearedScope = null;

  if (mountId) {
    invalidateFsCache({ mountId, reason: "admin-manual", db });
    clearedScope = `mount:${mountId}`;
    console.log(`管理员手动清理挂载点缓存 - 挂载点ID: ${mountId}`);
  } else if (storageConfigId) {
    invalidateFsCache({ storageConfigId, reason: "admin-manual", db });
    clearedScope = `storageConfig:${storageConfigId}`;
    console.log(`管理员手动清理存储配置缓存 - 存储配置ID: ${storageConfigId}`);
  } else {
    invalidateAllCaches({ reason: "admin-manual-all" });
    clearedScope = "all";
    console.log(`管理员手动清理所有缓存`);
  }

  return jsonOk(c, { scope: clearedScope, timestamp: new Date().toISOString() }, "缓存清理操作已触发");
});

// 清理目录缓存（API密钥用户）
adminRoutes.post("/api/user/cache/clear", requireMountView, async (c) => {
  const db = c.env.DB;
  const identity = resolvePrincipal(c, { allowedTypes: [UserType.ADMIN, UserType.API_KEY] });
  const apiKeyInfo = identity.apiKeyInfo;

  const { mountId, storageConfigId } = await c.req.json().catch(() => ({}));
  let clearedScope = null;

  if (mountId) {
    invalidateFsCache({ mountId, reason: "user-manual", db });
    clearedScope = `mount:${mountId}`;
    console.log(`API密钥用户手动清理挂载点缓存 - 用户: ${apiKeyInfo?.name || identity.type}, 挂载点ID: ${mountId}`);
  } else if (storageConfigId) {
    invalidateFsCache({ storageConfigId, reason: "user-manual", db });
    clearedScope = `storageConfig:${storageConfigId}`;
    console.log(`API密钥用户手动清理存储配置缓存 - 用户: ${apiKeyInfo?.name || identity.type}, 存储配置ID: ${storageConfigId}`);
  } else {
    invalidateAllCaches({ reason: "user-manual-all" });
    clearedScope = "all";
    console.log(`API密钥用户手动清理所有缓存 - 用户: ${apiKeyInfo?.name || identity.type}`);
  }

  return jsonOk(c, { scope: clearedScope, timestamp: new Date().toISOString() }, "缓存清理操作已触发");
});

// ==================== FS 搜索索引管理（管理员） ====================

// 获取索引状态（按挂载点）
adminRoutes.get("/api/admin/fs/index/status", requireAdmin, async (c) => {
  const db = c.env.DB;
  const repositoryFactory = c.get("repos");
  const { userId: adminId } = resolvePrincipal(c, { allowedTypes: [UserType.ADMIN] });

  const factory = ensureRepositoryFactory(db, repositoryFactory);
  const mountRepository = factory.getMountRepository();
  const mounts = await mountRepository.findAll(false);
  const mountIds = mounts.map((m) => String(m?.id)).filter(Boolean);

  const store = new FsSearchIndexStore(db);
  const states = await store.getIndexStates(mountIds);

  // dirty 统计（用于判断是否需要 apply-dirty）
  const dirtyCountMap = await store.getDirtyCounts(mountIds);
  const DIRTY_REBUILD_THRESHOLD = 5000;

  const encryptionSecret = getEncryptionSecret(c);
  const mountManager = new MountManager(db, encryptionSecret, repositoryFactory);
  const fileSystem = new FileSystem(mountManager, c.env);

  // 回传“活跃中的索引作业”
  // - pending：已创建但可能尚未被 Workflows 拉起
  // - running：正在执行
  // 同时查询 rebuild 和 apply-dirty 两种类型
  const [
    rebuildPendingResult,
    rebuildRunningResult,
    applyDirtyPendingResult,
    applyDirtyRunningResult,
  ] = await Promise.all([
    fileSystem.listJobs(
      { taskType: "fs_index_rebuild", status: "pending", limit: 50, offset: 0 },
      adminId,
      UserType.ADMIN,
    ),
    fileSystem.listJobs(
      { taskType: "fs_index_rebuild", status: "running", limit: 50, offset: 0 },
      adminId,
      UserType.ADMIN,
    ),
    fileSystem.listJobs(
      { taskType: "fs_index_apply_dirty", status: "pending", limit: 50, offset: 0 },
      adminId,
      UserType.ADMIN,
    ),
    fileSystem.listJobs(
      { taskType: "fs_index_apply_dirty", status: "running", limit: 50, offset: 0 },
      adminId,
      UserType.ADMIN,
    ),
  ]);
  const runningJobs = [
    ...(rebuildPendingResult?.jobs || []),
    ...(rebuildRunningResult?.jobs || []),
    ...(applyDirtyPendingResult?.jobs || []),
    ...(applyDirtyRunningResult?.jobs || []),
  ];

  const items = mounts.map((mount) => {
    const id = String(mount?.id || "");
    const row = id ? states.get(id) : null;
    const dirtyCount = id ? (dirtyCountMap.get(id) ?? 0) : 0;
    const status = row?.status ?? "not_ready";

    // 给管理端一个“建议动作”，不在后端自动触发
    let recommendedAction = "none";
    let recommendedReason = null;
    if (status === "indexing") {
      recommendedAction = "wait";
      recommendedReason = "indexing";
    } else if (status !== "ready") {
      recommendedAction = "rebuild";
      recommendedReason = "index_not_ready";
    } else if (dirtyCount >= DIRTY_REBUILD_THRESHOLD) {
      recommendedAction = "rebuild";
      recommendedReason = "dirty_too_large";
    } else if (dirtyCount > 0) {
      recommendedAction = "apply-dirty";
      recommendedReason = "dirty_pending";
    }
    return {
      mountId: id,
      name: mount?.name ?? null,
      mountPath: mount?.mount_path ?? null,
      storageType: mount?.storage_type ?? null,
      status,
      lastIndexedMs: row?.last_indexed_ms ?? null,
      updatedAtMs: row?.updated_at_ms ?? null,
      lastError: row?.last_error ?? null,
      dirtyCount,
      recommendedAction,
      recommendedReason,
    };
  });

  return jsonOk(
    c,
    {
      items,
      runningJobs,
      hints: {
        minQueryLength: 3,
        dirtyRebuildThreshold: DIRTY_REBUILD_THRESHOLD,
      },
    },
    "获取索引状态成功",
  );
});

// 触发索引重建（创建 fs_index_rebuild 作业）
adminRoutes.post("/api/admin/fs/index/rebuild", requireAdmin, async (c) => {
  const db = c.env.DB;
  const repositoryFactory = c.get("repos");
  const { userId: adminId } = resolvePrincipal(c, { allowedTypes: [UserType.ADMIN] });

  const body = await c.req.json().catch(() => ({}));
  const mountIdsRaw = body.mountIds ?? body.mount_ids ?? null;
  const optionsRaw = body.options ?? {};

  const factory = ensureRepositoryFactory(db, repositoryFactory);
  const mountRepository = factory.getMountRepository();
  const allMounts = await mountRepository.findAll(false);

  let targetMountIds = [];
  if (mountIdsRaw !== null && mountIdsRaw !== undefined) {
    if (!Array.isArray(mountIdsRaw)) {
      throw new ValidationError("mountIds 必须是数组");
    }
    targetMountIds = mountIdsRaw.map((x) => String(x).trim()).filter(Boolean);
  } else {
    targetMountIds = allMounts.map((m) => String(m?.id)).filter(Boolean);
  }

  if (targetMountIds.length === 0) {
    throw new ValidationError("没有可重建的挂载点");
  }

  const batchSize = optionsRaw?.batchSize ?? body.batchSize ?? undefined;
  const maxDepth = optionsRaw?.maxDepth ?? body.maxDepth ?? undefined;
  const maxMountsPerRun = optionsRaw?.maxMountsPerRun ?? body.maxMountsPerRun ?? undefined;

  // 预先标记 indexing，便于 status 接口即时反馈
  const store = new FsSearchIndexStore(db);
  for (const id of targetMountIds) {
    await store.markIndexing(id);
  }

  const encryptionSecret = getEncryptionSecret(c);
  const mountManager = new MountManager(db, encryptionSecret, repositoryFactory);
  const fileSystem = new FileSystem(mountManager, c.env);

  const jobPayload = {
    mountIds: targetMountIds,
    options: {
      batchSize,
      maxDepth,
      maxMountsPerRun,
      // 重建默认跳过缓存，保证一致性优先
      refresh: true,
    },
  };

  const job = await fileSystem.createJob(
    "fs_index_rebuild",
    jobPayload,
    adminId,
    UserType.ADMIN,
    { triggerType: "manual", triggerRef: "admin/fs-index/rebuild" },
  );

  return jsonOk(c, { jobId: job.jobId, taskType: job.taskType }, "索引重建作业已创建");
});

// 应用 dirty（创建 fs_index_apply_dirty 作业）
adminRoutes.post("/api/admin/fs/index/apply-dirty", requireAdmin, async (c) => {
  const db = c.env.DB;
  const repositoryFactory = c.get("repos");
  const { userId: adminId } = resolvePrincipal(c, { allowedTypes: [UserType.ADMIN] });

  const body = await c.req.json().catch(() => ({}));
  const mountIdsRaw = body.mountIds ?? body.mount_ids ?? null;
  const optionsRaw = body.options ?? {};

  let mountIds = null;
  if (mountIdsRaw !== null && mountIdsRaw !== undefined) {
    if (!Array.isArray(mountIdsRaw)) {
      throw new ValidationError("mountIds 必须是数组");
    }
    mountIds = mountIdsRaw.map((x) => String(x).trim()).filter(Boolean);
  }

  const jobPayload = {
    ...(mountIds ? { mountIds } : {}),
    options: {
      batchSize: optionsRaw?.batchSize ?? body.batchSize ?? undefined,
      maxItems: optionsRaw?.maxItems ?? body.maxItems ?? undefined,
      rebuildDirectorySubtree: optionsRaw?.rebuildDirectorySubtree ?? body.rebuildDirectorySubtree ?? undefined,
      maxDepth: optionsRaw?.maxDepth ?? body.maxDepth ?? undefined,
      refresh: optionsRaw?.refresh ?? body.refresh ?? true,
    },
  };

  const encryptionSecret = getEncryptionSecret(c);
  const mountManager = new MountManager(db, encryptionSecret, repositoryFactory);
  const fileSystem = new FileSystem(mountManager, c.env);

  const job = await fileSystem.createJob(
    "fs_index_apply_dirty",
    jobPayload,
    adminId,
    UserType.ADMIN,
    { triggerType: "manual", triggerRef: "admin/fs-index/apply-dirty" },
  );
  return jsonOk(c, { jobId: job.jobId, taskType: job.taskType }, "索引增量应用作业已创建");
});

// 取消索引重建作业
adminRoutes.post("/api/admin/fs/index/stop", requireAdmin, async (c) => {
  const db = c.env.DB;
  const repositoryFactory = c.get("repos");
  const { userId: adminId } = resolvePrincipal(c, { allowedTypes: [UserType.ADMIN] });

  const body = await c.req.json().catch(() => ({}));
  const jobId = body.jobId ?? body.job_id;
  if (!jobId || typeof jobId !== "string") {
    throw new ValidationError("jobId 不能为空");
  }

  const encryptionSecret = getEncryptionSecret(c);
  const mountManager = new MountManager(db, encryptionSecret, repositoryFactory);
  const fileSystem = new FileSystem(mountManager, c.env);

  // 诊断信息
  const diagnostic = {
    jobId,
    nowIso: new Date().toISOString(),
    db: null,
    workflow: null,
    jobStatus: null,
  };

  // 读取 DB 记录（用于排查：任务表中的 status/时间戳是否符合预期）
  try {
    const row = await db
      .prepare(
        `
        SELECT task_id, task_type, status, created_at, started_at, finished_at, updated_at, error_message
        FROM ${DbTables.TASKS}
        WHERE task_id = ?
      `,
      )
      .bind(jobId)
      .first();
    diagnostic.db = row ?? null;
  } catch (e) {
    diagnostic.db = { error: e?.message || String(e) };
  }

  // 读取 Workflow status
  try {
    const instance = await c.env.JOB_WORKFLOW.get(jobId);
    const status = await instance.status();
    diagnostic.workflow = {
      id: status?.id ?? null,
      status: status?.status ?? null,
      created: status?.created ?? null,
      modified: status?.modified ?? null,
      output: status?.output ?? null,
    };
  } catch (e) {
    diagnostic.workflow = { error: e?.message || String(e) };
  }

  // 读取 jobStatus（含 allowedActions）
  const jobStatus = await fileSystem.getJobStatus(jobId, adminId, UserType.ADMIN);
  diagnostic.jobStatus = jobStatus;

  // 先读取 payload（用于后续标记 state）
  const payload = jobStatus?.payload || {};
  const mountIds = Array.isArray(payload?.mountIds) ? payload.mountIds.map((x) => String(x).trim()).filter(Boolean) : [];

  // 与 FileSystem.cancelJob 保持一致的语义：终态任务不可取消
  if (jobStatus.status !== "pending" && jobStatus.status !== "running") {
    return c.json(
      {
        success: false,
        code: "JOB_NOT_CANCELLABLE",
        message: "只能取消待执行或执行中的任务",
        data: { jobId, mountIds, diagnostic },
      },
      ApiStatus.BAD_REQUEST,
    );
  }

  // 权限不足
  if (!jobStatus.allowedActions?.canCancel) {
    return c.json(
      {
        success: false,
        code: "FORBIDDEN",
        message: "无权取消此任务",
        data: { jobId, mountIds, diagnostic },
      },
      ApiStatus.FORBIDDEN,
    );
  }

  // 执行取消
  try {
    await fileSystem.cancelJob(jobId, adminId, UserType.ADMIN);
  } catch (e) {
    return c.json(
      {
        success: false,
        code: e?.code || "CANCEL_FAILED",
        message: e?.message || "取消失败",
        data: { jobId, mountIds, diagnostic },
      },
      e?.status || ApiStatus.INTERNAL_ERROR,
    );
  }

  // 将索引状态标记为 error（明确告知：本次重建未完成）
  const store = new FsSearchIndexStore(db);
  for (const id of mountIds) {
    await store.markError(id, "索引重建被管理员取消");
  }

  // 返回取消后的最新状态（便于 UI/排查）
  const after = await fileSystem.getJobStatus(jobId, adminId, UserType.ADMIN);

  return jsonOk(c, { jobId, mountIds, before: jobStatus, after, diagnostic }, "索引重建作业已取消");
});

// 清空索引派生数据（不删除真实业务数据）
adminRoutes.post("/api/admin/fs/index/clear", requireAdmin, async (c) => {
  const db = c.env.DB;
  const body = await c.req.json().catch(() => ({}));
  const mountIdsRaw = body.mountIds ?? body.mount_ids ?? null;

  const store = new FsSearchIndexStore(db);

  // 不提供 mountIds：全量清空（派生数据），state 也清空（缺失即视为 not_ready）
  if (mountIdsRaw === null || mountIdsRaw === undefined) {
    await db.batch([
      db.prepare("DELETE FROM fs_search_index_entries"),
      db.prepare("DELETE FROM fs_search_index_dirty"),
      db.prepare("DELETE FROM fs_search_index_state"),
    ]);
    return jsonOk(c, { scope: "all" }, "索引已清空（需重新重建）");
  }

  if (!Array.isArray(mountIdsRaw)) {
    throw new ValidationError("mountIds 必须是数组");
  }

  const mountIds = mountIdsRaw.map((x) => String(x).trim()).filter(Boolean);
  for (const id of mountIds) {
    await store.clearMount(id);
    await store.clearDirtyByMount(id);
    await store.markNotReady(id);
  }

  return jsonOk(c, { scope: "mount", mountIds }, "索引已清空（需重新重建）");
});

export default adminRoutes;
