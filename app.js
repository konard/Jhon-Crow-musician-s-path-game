const STORAGE_KEY = "musicians-path-game-state-v1";
const DAY_MS = 24 * 60 * 60 * 1000;

function defaultState() {
  return {
    completed: [],
    goalRub: 20000,
    resetLoops: true,
    loopCompletions: {},
    retainedLoopPoints: {}
  };
}

function normalizeRecord(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function loadState(storage = window.localStorage) {
  const fallback = defaultState();
  try {
    const parsed = JSON.parse(storage.getItem(STORAGE_KEY) || "{}");
    return {
      completed: Array.isArray(parsed.completed) ? parsed.completed : [],
      goalRub: Number.isFinite(parsed.goalRub) ? parsed.goalRub : fallback.goalRub,
      resetLoops: typeof parsed.resetLoops === "boolean" ? parsed.resetLoops : fallback.resetLoops,
      loopCompletions: normalizeRecord(parsed.loopCompletions),
      retainedLoopPoints: normalizeRecord(parsed.retainedLoopPoints)
    };
  } catch {
    return fallback;
  }
}

function saveState(state, storage = window.localStorage) {
  storage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function calculateProgress(actions, completedIds) {
  const totalPoints = actions.reduce((sum, action) => sum + action.points, 0);
  const completed = actions.filter((action) => completedIds.includes(action.id));
  const points = completed.reduce((sum, action) => sum + action.points, 0);
  const percent = totalPoints === 0 ? 0 : points / totalPoints;
  const acceleration = 1 + percent;
  const yearsMin = BASELINE_YEARS.min - (BASELINE_YEARS.min - OPTIMIZED_YEARS.min) * percent;
  const yearsMax = BASELINE_YEARS.max - (BASELINE_YEARS.max - OPTIMIZED_YEARS.max) * percent;
  const medianUplift = completed.reduce((sum, action) => sum + (action.upliftMin + action.upliftMax) / 2, 0);

  return {
    points,
    totalPoints,
    percent,
    acceleration,
    yearsMin,
    yearsMax,
    medianUplift
  };
}

function applyLoopResets(actions, state, now = new Date()) {
  if (!state.resetLoops) {
    return state;
  }

  const nowMs = now.getTime();
  const completed = new Set(state.completed);
  const loopCompletions = { ...state.loopCompletions };
  const retainedLoopPoints = { ...state.retainedLoopPoints };

  actions.forEach((action) => {
    if (!action.recurrenceDays || !completed.has(action.id)) {
      return;
    }

    const completedAt = Date.parse(loopCompletions[action.id]);
    if (!Number.isFinite(completedAt)) {
      loopCompletions[action.id] = now.toISOString();
      return;
    }

    if (nowMs - completedAt >= action.recurrenceDays * DAY_MS) {
      completed.delete(action.id);
      retainedLoopPoints[action.id] = Math.max(Number(retainedLoopPoints[action.id]) || 0, Math.round(action.points * 0.6));
    }
  });

  return {
    ...state,
    completed: [...completed],
    loopCompletions,
    retainedLoopPoints
  };
}

function calculateRetainedPoints(actions, state) {
  const completed = new Set(state.completed);
  return actions.reduce((sum, action) => {
    if (completed.has(action.id)) {
      return sum;
    }
    return sum + Math.min(action.points, Number(state.retainedLoopPoints[action.id]) || 0);
  }, 0);
}

function calculateGrowthCurve(model, progressPercent = 0) {
  const clampedProgress = Math.min(Math.max(progressPercent, 0), 1);
  const monthlyRate = model.baseMonthlyRate + (model.optimizedMonthlyRate - model.baseMonthlyRate) * clampedProgress;
  const jumpMultiplier = 1 + (model.recommendationJumpMultiplier - 1) * clampedProgress;

  return Array.from({ length: model.months + 1 }, (_, month) => {
    const standard = Math.round(model.startListeners * ((1 + model.baseMonthlyRate) ** month));
    const preJumpOptimized = model.startListeners * ((1 + monthlyRate) ** month);
    const jump = month >= model.recommendationJumpMonth ? jumpMultiplier : 1;
    return {
      month,
      standard,
      optimized: Math.round(preJumpOptimized * jump)
    };
  });
}

function formatYears(value) {
  return value.toLocaleString("ru-RU", { maximumFractionDigits: 1 });
}

function formatListeners(value) {
  return value.toLocaleString("ru-RU");
}

function renderGrowthChart(curve) {
  const width = 720;
  const height = 280;
  const padding = { top: 20, right: 28, bottom: 42, left: 58 };
  const maxValue = Math.max(...curve.flatMap((point) => [point.standard, point.optimized]));
  const xScale = (month) => padding.left + (month / GROWTH_MODEL.months) * (width - padding.left - padding.right);
  const yScale = (value) => height - padding.bottom - (value / maxValue) * (height - padding.top - padding.bottom);
  const pathFor = (key) => curve.map((point, index) => {
    const command = index === 0 ? "M" : "L";
    return `${command}${xScale(point.month).toFixed(1)},${yScale(point[key]).toFixed(1)}`;
  }).join(" ");
  const ticks = [0, 12, 24, 36];
  const last = curve[curve.length - 1];
  const jumpX = xScale(GROWTH_MODEL.recommendationJumpMonth);

  return `
    <svg class="growth-chart" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="growthChartTitle growthChartDesc">
      <title id="growthChartTitle">График роста аудитории</title>
      <desc id="growthChartDesc">Сравнение стандартного роста и сценария со скачком после попадания в рекомендации.</desc>
      <g class="grid">
        ${ticks.map((tick) => `<line x1="${xScale(tick).toFixed(1)}" y1="${padding.top}" x2="${xScale(tick).toFixed(1)}" y2="${height - padding.bottom}"></line>`).join("")}
      </g>
      <line class="axis" x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${height - padding.bottom}"></line>
      <line class="jump-line" x1="${jumpX.toFixed(1)}" y1="${padding.top}" x2="${jumpX.toFixed(1)}" y2="${height - padding.bottom}"></line>
      <path class="standard-line" d="${pathFor("standard")}"></path>
      <path class="optimized-line" d="${pathFor("optimized")}"></path>
      ${ticks.map((tick) => `<text x="${xScale(tick).toFixed(1)}" y="${height - 14}" text-anchor="middle">${tick}м</text>`).join("")}
      <text x="${padding.left}" y="16">${formatListeners(maxValue)} слушателей</text>
      <text x="${jumpX + 8}" y="${padding.top + 18}">скачок рекомендаций</text>
      <circle class="standard-dot" cx="${xScale(last.month).toFixed(1)}" cy="${yScale(last.standard).toFixed(1)}" r="5"></circle>
      <circle class="optimized-dot" cx="${xScale(last.month).toFixed(1)}" cy="${yScale(last.optimized).toFixed(1)}" r="5"></circle>
    </svg>
  `;
}

function renderApp() {
  const root = document.querySelector("#app");
  let state = applyLoopResets(ACTIONS, loadState());
  saveState(state);
  const phases = [...new Set(ACTIONS.map((action) => action.phase))];

  root.innerHTML = `
    <header class="topbar">
      <div>
        <p class="eyebrow">Musician's Path</p>
        <h1>Геймифицированный план релизов</h1>
      </div>
      <label class="goal">
        <span>Цель, ₽/мес</span>
        <input id="goalRub" type="number" min="1000" step="1000" value="${state.goalRub}">
      </label>
      <label class="loop-toggle">
        <input id="resetLoops" type="checkbox" ${state.resetLoops ? "checked" : ""}>
        <span>Обнулять повторяющиеся задачи</span>
      </label>
    </header>

    <main>
      <section class="dashboard" aria-label="Прогресс">
        <div class="score">
          <span id="pointsValue">0</span>
          <small>очков собрано</small>
        </div>
        <div class="metric">
          <span id="timelineValue">5-7 лет</span>
          <small>прогноз до цели</small>
        </div>
        <div class="metric">
          <span id="speedValue">1.0x</span>
          <small>коэффициент ускорения</small>
        </div>
        <button id="resetButton" class="icon-button" type="button" title="Сбросить прогресс" aria-label="Сбросить прогресс">↺</button>
      </section>

      <section class="growth-section" aria-label="График роста аудитории">
        <div class="section-heading">
          <h2>График роста</h2>
          <p>Стандартная кривая сравнивается со сценарием, где алгоритмы получают достаточно сигналов и начинают чаще рекомендовать релизы подходящим слушателям.</p>
        </div>
        <div class="growth-panel">
          <div id="growthChart"></div>
          <dl class="growth-stats">
            <div>
              <dt>Стандартный сценарий</dt>
              <dd id="standardListeners">0</dd>
            </div>
            <div>
              <dt>Со скачком рекомендаций</dt>
              <dd id="optimizedListeners">0</dd>
            </div>
            <div>
              <dt>Разница за 36 месяцев</dt>
              <dd id="growthDelta">0</dd>
            </div>
          </dl>
        </div>
      </section>

      <section class="roadmap" aria-label="Чек-лист действий">
        ${phases.map((phase) => `
          <section class="phase">
            <h2>${phase}</h2>
            <div class="actions">
              ${ACTIONS.filter((action) => action.phase === phase).map((action) => `
                <article class="action" data-action-id="${action.id}">
                  <label>
                    <input type="checkbox" value="${action.id}" ${state.completed.includes(action.id) ? "checked" : ""}>
                    <span>
                      <strong>${action.title}</strong>
                      <small>${action.points} очков · ${action.horizon}${action.recurrenceDays ? ` · цикл ${action.recurrenceDays} дн.` : ""}</small>
                    </span>
                  </label>
                  <p>${action.description}</p>
                  <footer>
                    <span>${action.upliftMax > 0 ? `+${action.upliftMin}-${action.upliftMax}%` : "стратегический бонус"}</span>
                  </footer>
                </article>
              `).join("")}
            </div>
          </section>
        `).join("")}
      </section>

      <aside class="sources">
        <h2>Методика</h2>
        <p>Очки пересчитываются в ускорение от 1.0x до 2.0x и сокращают прогноз с базовых 5-7 лет до оптимизированных 3.5-4.5 лет. Повторяющиеся задачи проверяются при загрузке и изменениях формы, без фонового polling. Просроченный цикл возвращается в список задач, но часть очков сохраняется как накопленный эффект.</p>
      </aside>
    </main>
  `;

  const update = () => {
    const completed = [...root.querySelectorAll(".action input[type='checkbox']:checked")].map((input) => input.value);
    const goalRub = Number(root.querySelector("#goalRub").value) || 20000;
    const resetLoops = root.querySelector("#resetLoops").checked;
    const loopCompletions = { ...state.loopCompletions };
    completed.forEach((id) => {
      if (!loopCompletions[id]) {
        loopCompletions[id] = new Date().toISOString();
      }
    });
    state = applyLoopResets(ACTIONS, {
      ...state,
      completed,
      goalRub,
      resetLoops,
      loopCompletions
    });
    const progress = calculateProgress(ACTIONS, state.completed);
    const retainedPoints = calculateRetainedPoints(ACTIONS, state);
    const effectivePoints = Math.min(progress.totalPoints, progress.points + retainedPoints);
    const effectivePercent = progress.totalPoints === 0 ? 0 : effectivePoints / progress.totalPoints;
    const yearsMin = BASELINE_YEARS.min - (BASELINE_YEARS.min - OPTIMIZED_YEARS.min) * effectivePercent;
    const yearsMax = BASELINE_YEARS.max - (BASELINE_YEARS.max - OPTIMIZED_YEARS.max) * effectivePercent;
    root.querySelector("#pointsValue").textContent = `${effectivePoints}/${progress.totalPoints}`;
    root.querySelector("#timelineValue").textContent = `${formatYears(yearsMin)}-${formatYears(yearsMax)} лет`;
    root.querySelector("#speedValue").textContent = `${(1 + effectivePercent).toFixed(1)}x`;
    const curve = calculateGrowthCurve(GROWTH_MODEL, effectivePercent);
    const last = curve[curve.length - 1];
    root.querySelector("#growthChart").innerHTML = renderGrowthChart(curve);
    root.querySelector("#standardListeners").textContent = formatListeners(last.standard);
    root.querySelector("#optimizedListeners").textContent = formatListeners(last.optimized);
    root.querySelector("#growthDelta").textContent = `+${formatListeners(last.optimized - last.standard)}`;
    root.style.setProperty("--progress", `${Math.round(effectivePercent * 100)}%`);
    saveState(state);
  };

  root.addEventListener("change", update);
  root.querySelector("#resetButton").addEventListener("click", () => {
    saveState(defaultState());
    renderApp();
  });
  update();
}

if (typeof window !== "undefined") {
  window.MusiciansPath = { applyLoopResets, calculateProgress, calculateGrowthCurve, calculateRetainedPoints, loadState, saveState, STORAGE_KEY };
  window.addEventListener("DOMContentLoaded", renderApp);
}

if (typeof module !== "undefined") {
  module.exports = { applyLoopResets, calculateProgress, calculateGrowthCurve, calculateRetainedPoints, defaultState, loadState, saveState, STORAGE_KEY };
}
