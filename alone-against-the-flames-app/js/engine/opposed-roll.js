/**
 * CoC 7e 对抗检定解算器
 */

export function getSuccessLevel(roll, target) {
  if (roll === 1) return 4;
  if (target < 50 && roll >= 96) return -1;
  if (target >= 50 && roll === 100) return -1;
  if (roll <= Math.floor(target / 5)) return 3;
  if (roll <= Math.floor(target / 2)) return 2;
  if (roll <= target) return 1;
  return 0;
}

export function resolveOpposedRoll(playerRoll, playerTarget, enemyRoll, enemyTarget, tieBreaker) {
  const playerLevel = getSuccessLevel(playerRoll, playerTarget);
  const enemyLevel = getSuccessLevel(enemyRoll, enemyTarget);

  if (playerLevel > enemyLevel) return "win";
  if (enemyLevel > playerLevel) return "lose";

  if (tieBreaker === "higher-skill") {
    return playerTarget >= enemyTarget ? "win" : "lose";
  }
  return "win";
}

export function getSuccessLevelLabel(level) {
  const labels = { "-1": "大失败", 0: "失败", 1: "成功", 2: "困难成功", 3: "极难成功", 4: "大成功" };
  return labels[level] ?? "失败";
}

export function rollD100() {
  return Math.floor(Math.random() * 100) + 1;
}

export function rollDice(expr) {
  const match = expr.match(/^(\d+)[Dd](\d+)([+-]\d+)?$/);
  if (!match) return 0;
  const [, count, sides, mod] = match;
  let total = 0;
  for (let i = 0; i < Number(count); i++) {
    total += Math.floor(Math.random() * Number(sides)) + 1;
  }
  return total + (Number(mod) || 0);
}

export function rollMultiDice(expr) {
  const parts = expr.split("+").map(s => s.trim());
  let total = 0;
  for (const part of parts) {
    if (/^\d+[Dd]\d+/.test(part)) {
      total += rollDice(part);
    } else {
      total += Number(part) || 0;
    }
  }
  return total;
}
