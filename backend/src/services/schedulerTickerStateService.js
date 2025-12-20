import { DbTables } from "../constants/index.js";
import { SETTING_FLAGS, SETTING_GROUPS, SETTING_TYPES } from "../constants/settings.js";

// 用于存储“外部触发器（CF/Docker tick）真实触发状态”的固定 key
// - 只维护 1 行（system_settings.key 为主键）
// - value 存 JSON：{ lastMs:number, lastCron:string|null }
export const SCHEDULER_TICK_STATE_SETTING_KEY = "scheduler_tick_state";

/**
 * @typedef {{ lastMs: number|null, lastCron: string|null }} SchedulerTickState
 */

/**
 * 读取“平台触发器”上次真实触发状态（毫秒 + cron）
 * @param {D1Database} db
 * @returns {Promise<SchedulerTickState>}
 */
export async function getSchedulerTickState(db) {
  /** @type {SchedulerTickState} */
  const empty = { lastMs: null, lastCron: null };
  if (!db) return empty;
  try {
    const row = await db
      .prepare(`SELECT value FROM ${DbTables.SYSTEM_SETTINGS} WHERE key = ?`)
      .bind(SCHEDULER_TICK_STATE_SETTING_KEY)
      .first();
    const raw = row?.value;
    if (raw === null || raw === undefined) return empty;

    // 约定：value 为 JSON 字符串
    if (typeof raw === "string" && raw.trim()) {
      try {
        const parsed = JSON.parse(raw);
        const ms = Number(parsed?.lastMs);
        const lastMs = Number.isFinite(ms) && ms > 0 ? ms : null;
        const lastCron =
          typeof parsed?.lastCron === "string" && parsed.lastCron.trim()
            ? parsed.lastCron.trim()
            : null;
        return { lastMs, lastCron };
      } catch {
        // ignore
      }
    }

    return empty;
  } catch {
    return empty;
  }
}

/**
 * 写入“平台触发器”上次真实触发状态（毫秒 + cron）
 * - 使用 upsert：不存在则插入，存在则更新
 * - 设计目标：永远只有 1 行数据
 * @param {D1Database} db
 * @param {{ lastMs: number, lastCron: string|null }} state
 * @returns {Promise<void>}
 */
export async function upsertSchedulerTickState(db, state) {
  if (!db) return;
  const ms = Number(state?.lastMs);
  if (!Number.isFinite(ms) || ms <= 0) return;
  const lastCron =
    typeof state?.lastCron === "string" && state.lastCron.trim()
      ? state.lastCron.trim()
      : null;

  try {
    const stateJson = JSON.stringify({ lastMs: ms, lastCron });

    await db
      .prepare(
        `
        INSERT INTO ${DbTables.SYSTEM_SETTINGS} (
          key, value, description, type, group_id, options, sort_order, flags, updated_at
        )
        VALUES (?, ?, ?, ?, ?, NULL, 0, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(key) DO UPDATE SET
          value = excluded.value,
          updated_at = CURRENT_TIMESTAMP
      `,
      )
      .bind(
        SCHEDULER_TICK_STATE_SETTING_KEY,
        stateJson,
        "平台触发器上次真实触发状态（毫秒+cron），系统内部使用。",
        SETTING_TYPES.TEXTAREA,
        SETTING_GROUPS.SYSTEM,
        SETTING_FLAGS.READONLY,
      )
      .run();
  } catch (e) {
    // 注意：这里不抛错，避免“记录 tick 时间失败”影响真实调度执行
    console.warn("[schedulerTickerStateService] 写入 scheduler_tick_last_ms 失败:", {
      error: e?.message || String(e),
    });
  }
}
