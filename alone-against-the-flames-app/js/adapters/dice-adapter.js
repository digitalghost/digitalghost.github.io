import DiceBox from "../../dice-box/dice-box.es.min.js";

const DICE_TYPES = [
  { id: "d4", label: "D4" },
  { id: "d6", label: "D6" },
  { id: "d8", label: "D8" },
  { id: "d10", label: "D10" },
  { id: "d12", label: "D12" },
  { id: "d20", label: "D20" },
  { id: "d100", label: "D100" }
];

const selectedDice = Object.fromEntries(DICE_TYPES.map((die) => [die.id, 0]));
const shortcutRolls = [
  { id: "shortcut-d100", label: "1d100", note: "属性 / 技能检定", notation: "1d100" },
  { id: "shortcut-san", label: "1d3", note: "轻量理智损失", notation: "1d3" },
  { id: "shortcut-damage", label: "1d6", note: "常见伤害骰", notation: "1d6" },
  { id: "shortcut-bonus", label: "2d6+1", note: "带修正示例", notation: "2d6+1" }
];

let diceBox = null;
let diceBoxReady = false;
let isRolling = false;
let rollCompleteListener = null;
let pendingExternalNotations = null;
let currentRollMeta = null;
let inlineMode = false;

let container;
let selectorEl;
let notationInput;
let rollBtn;
let clearBtn;
let closeBtn;
let resultsPanel;
let resultsContent;
let resultsClose;

function cacheDom() {
  container = document.getElementById("dice-box-container");
  selectorEl = document.getElementById("diceSelector");
  notationInput = document.getElementById("diceNotationInput");
  rollBtn = document.getElementById("diceRollBtn");
  clearBtn = document.getElementById("diceClearBtn");
  closeBtn = document.getElementById("diceCloseBtn");
  resultsPanel = document.getElementById("diceResultsPanel");
  resultsContent = document.getElementById("diceResultsContent");
  resultsClose = document.getElementById("diceResultsClose");
}

function buildSelectorButtons() {
  if (!selectorEl || selectorEl.childElementCount) return;

  DICE_TYPES.forEach((dice) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "dice-type-btn";
    button.id = `dbtn-${dice.id}`;
    button.innerHTML = `${dice.label}<span class="dice-count" id="dcnt-${dice.id}">0</span>`;
    button.addEventListener("click", () => {
      if (selectedDice[dice.id] < 20) {
        selectedDice[dice.id] += 1;
        updateSelectorUI();
      }
    });
    selectorEl.appendChild(button);
  });

  updateSelectorUI();
}

function updateSelectorUI() {
  DICE_TYPES.forEach((dice) => {
    const button = document.getElementById(`dbtn-${dice.id}`);
    const count = document.getElementById(`dcnt-${dice.id}`);
    if (!button || !count) return;
    const value = selectedDice[dice.id];
    count.textContent = value;
    button.classList.toggle("active", value > 0);
  });
}

async function initDiceBox() {
  if (diceBoxReady || !container) return;

  const assetBaseUrl = new URL("../../dice-box/assets/", import.meta.url);
  const isFilePreview = window.location.protocol === "file:";
  const runtimeOrigin = isFilePreview ? "" : window.location.origin;
  const runtimeAssetPath = isFilePreview ? assetBaseUrl.href : assetBaseUrl.pathname;

  try {
    diceBox = new DiceBox({
      id: "dice-canvas",
      assetPath: runtimeAssetPath,
      origin: runtimeOrigin,
      container: "#dice-box-canvas",
      theme: "coc",
      offscreen: false,
      scale: 4,
      gravity: 1.5,
      friction: 0.6,
      linearDamping: 0.5,
      angularDamping: 0.5,
      throwForce: 4,
      spinForce: 3,
      restitution: 0,
      enableShadows: true,
      lightIntensity: 0.9,
      startingHeight: 6
    });

    await diceBox.init();
    diceBox.onRollComplete = (results) => {
      setTimeout(() => {
        diceBox.clear();
        const summary = displayResults(results);
        if (inlineMode) {
          setTimeout(() => {
            hideResults();
            closeDicePanel();
            inlineMode = false;
            if (rollCompleteListener) rollCompleteListener(summary);
          }, 2000);
        } else {
          if (rollCompleteListener) rollCompleteListener(summary);
        }
        isRolling = false;
        if (rollBtn) rollBtn.disabled = false;
      }, 600);
    };

    diceBoxReady = true;
  } catch (error) {
    console.error("DiceBox 初始化失败", error);
    document.getElementById("dice-box-canvas").innerHTML =
      `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#d7b15a;padding:24px;text-align:center;">DiceBox 初始化失败<br><small style="display:block;margin-top:8px;color:#b9ab92;">assetPath: ${runtimeAssetPath}</small></div>`;
  }
}

function openDicePanel() {
  container.classList.add("open");
  if (!diceBoxReady) {
    initDiceBox();
  } else {
    if (diceBox.resize) setTimeout(() => diceBox.resize(), 120);
  }
}

function closeDicePanel() {
  container.classList.remove("open", "inline-roll");
  hideResults();
}

function hideResults() {
  resultsPanel.classList.remove("show");
}

function clearAll() {
  DICE_TYPES.forEach((dice) => {
    selectedDice[dice.id] = 0;
  });
  updateSelectorUI();
  notationInput.value = "";
  hideResults();
  pendingExternalNotations = null;
  currentRollMeta = null;
  if (diceBox) diceBox.clear();
}

function collectNotation() {
  if (pendingExternalNotations?.length) {
    const next = pendingExternalNotations;
    pendingExternalNotations = null;
    return next;
  }

  const notations = [];
  for (const [id, count] of Object.entries(selectedDice)) {
    if (count > 0) notations.push(`${count}${id}`);
  }

  if (!notations.length && notationInput.value.trim()) {
    notations.push(notationInput.value.trim());
  }

  return notations;
}

function rollDice() {
  if (isRolling || !diceBox) return;
  const notations = collectNotation();
  if (!notations.length) return;

  isRolling = true;
  if (rollBtn) rollBtn.disabled = true;
  hideResults();
  diceBox.roll(notations);
}

function rollNotation(notationOrConfig) {
  const config =
    typeof notationOrConfig === "object" && !Array.isArray(notationOrConfig)
      ? notationOrConfig
      : { notation: notationOrConfig };
  const notation = config.notation;
  inlineMode = true;
  container.classList.add("open", "inline-roll");
  if (!diceBoxReady) {
    initDiceBox();
  } else {
    if (diceBox.resize) setTimeout(() => diceBox.resize(), 120);
  }
  pendingExternalNotations = Array.isArray(notation) ? notation : [notation];
  currentRollMeta = config.meta || null;
  if (!diceBoxReady) {
    const wait = setInterval(() => {
      if (!diceBoxReady) return;
      clearInterval(wait);
      rollDice();
    }, 120);
    return;
  }
  rollDice();
}

function displayResults(rawResults) {
  if (!Array.isArray(rawResults) || !rawResults.length) {
    hideResults();
    return null;
  }

  if (currentRollMeta?.percentile) {
    const percentileSummary = buildPercentileSummary(rawResults, currentRollMeta.mode || "regular");
    resultsContent.innerHTML = renderPercentileResults(percentileSummary, currentRollMeta.mode || "regular");
    resultsPanel.classList.add("show");
    return {
      rawResults,
      flatRolls: [percentileSummary.chosen],
      total: percentileSummary.chosen,
      percentile: true,
      percentileOnes: percentileSummary.ones,
      percentileTens: percentileSummary.tens,
      percentileCandidates: percentileSummary.candidates,
      percentileChosen: percentileSummary.chosen
    };
  }

  const grouped = {};
  rawResults.forEach((die) => {
    const sides = die.sides || die.side || 6;
    const rolls = Array.isArray(die.rolls)
      ? die.rolls.map((roll) => (typeof roll === "object" ? roll.value || 0 : roll || 0))
      : [die.value || 0];
    const value = rolls.reduce((sum, roll) => sum + roll, 0);

    if (!grouped[sides]) {
      grouped[sides] = { qty: 0, sides, rolls: [], value: 0 };
    }
    grouped[sides].qty += rolls.length;
    grouped[sides].rolls.push(...rolls);
    grouped[sides].value += value;
  });

  const groups = Object.values(grouped);
  const flatRolls = [];
  let html = "";
  groups.forEach((group) => {
    flatRolls.push(...group.rolls);
    html += `
      <div class="dice-result-group">
        <span class="dice-result-label">${group.qty}d${group.sides}</span>
        <div class="dice-result-rolls">
          ${group.rolls.map((roll) => `<span class="dice-result-die">${roll}</span>`).join("")}
        </div>
        <span class="dice-result-value">${group.value}</span>
      </div>
    `;
  });

  if (groups.length > 1) {
    const total = groups.reduce((sum, group) => sum + group.value, 0);
    html += `
      <div class="dice-result-total">
        <span class="dice-result-total-label">总结果</span>
        <span class="dice-result-total-value">${total}</span>
      </div>
    `;
  }

  resultsContent.innerHTML = html;
  resultsPanel.classList.add("show");
  return {
    groups,
    rawResults,
    flatRolls,
    total: groups.length > 1 ? groups.reduce((sum, group) => sum + group.value, 0) : groups[0]?.value ?? 0
  };
}

function buildPercentileSummary(rawResults, mode) {
  const d10Rolls = rawResults
    .filter((die) => Number(die.sides || die.side || 0) === 10)
    .flatMap((die) =>
      Array.isArray(die.rolls)
        ? die.rolls.map((roll) => normalizeD10Value(typeof roll === "object" ? roll.value || 0 : roll || 0))
        : [normalizeD10Value(die.value || 0)]
    );

  const ones = d10Rolls[0] ?? 0;
  const tens = d10Rolls.slice(1);
  const candidates = (tens.length ? tens : [0]).map((ten) => composePercentileValue(ten, ones));
  const chosen = mode === "penalty" ? Math.max(...candidates) : Math.min(...candidates);

  return { ones, tens, candidates, chosen };
}

function renderPercentileResults(summary, mode) {
  const tensLabel = mode === "regular" ? "十位骰" : "十位候选";
  const choiceLabel = mode === "penalty" ? "取高" : mode === "bonus" ? "取低" : "结果";

  return `
    <div class="dice-result-group percentile-layout">
      <span class="dice-result-label">个位骰</span>
      <div class="dice-result-rolls">
        <span class="dice-result-die">${summary.ones}</span>
      </div>
      <span class="dice-result-value">${summary.ones}</span>
    </div>
    <div class="dice-result-group percentile-layout">
      <span class="dice-result-label">${tensLabel}</span>
      <div class="dice-result-rolls">
        ${summary.tens.map((roll) => `<span class="dice-result-die">${roll}0</span>`).join("")}
      </div>
      <span class="dice-result-value">${summary.tens.map((roll) => `${roll}0`).join(" / ") || "00"}</span>
    </div>
    <div class="dice-result-total">
      <span class="dice-result-total-label">${choiceLabel}</span>
      <span class="dice-result-total-value">${summary.chosen}</span>
    </div>
  `;
}

function normalizeD10Value(value) {
  const numeric = Number(value) || 0;
  return numeric === 10 ? 0 : numeric;
}

function composePercentileValue(tens, ones) {
  if (tens === 0 && ones === 0) return 100;
  return tens * 10 + ones;
}

function bindEvents() {
  rollBtn.addEventListener("click", rollDice);
  clearBtn.addEventListener("click", clearAll);
  closeBtn.addEventListener("click", closeDicePanel);
  resultsClose.addEventListener("click", hideResults);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && container.classList.contains("open")) {
      closeDicePanel();
    }
    if (event.key === "Enter" && container.classList.contains("open") && document.activeElement !== notationInput) {
      event.preventDefault();
      rollDice();
    }
  });
}

export function initDiceAdapter() {
  cacheDom();
  buildSelectorButtons();
  bindEvents();
}

export function getDiceShortcutRolls() {
  return shortcutRolls;
}

export function mountDiceShortcuts(onQuickRoll) {
  const list = document.getElementById("diceShortcutList");
  if (!list) return;
  list.innerHTML = "";

  shortcutRolls.forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "dice-shortcut";
    button.innerHTML = `<strong>${item.label}</strong><span>${item.note}</span>`;
    button.onclick = () => onQuickRoll(item.notation);
    list.appendChild(button);
  });
}

export const diceAdapter = {
  status: "已接入 DiceBox 3D 掷骰层；当前先支持手动与快捷掷骰，后续再绑定具体条目检定。",

  describeIntegration() {
    return "下一步把 action.check 接到当前 DiceBox 面板，并将结果写回剧情状态。";
  },

  openPanel() {
    openDicePanel();
  },

  quickRoll(notation) {
    rollNotation(notation);
  },

  setRollCompleteListener(listener) {
    rollCompleteListener = listener;
  }
};
