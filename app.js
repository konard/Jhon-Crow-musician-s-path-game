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

function formatYears(value) {
  return value.toLocaleString("ru-RU", { maximumFractionDigits: 1 });
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
    const progress = calculateProgress(ACTIONS, completed);
    const retainedPoints = calculateRetainedPoints(ACTIONS, state);
    const effectivePoints = Math.min(progress.totalPoints, progress.points + retainedPoints);
    const effectivePercent = progress.totalPoints === 0 ? 0 : effectivePoints / progress.totalPoints;
    const yearsMin = BASELINE_YEARS.min - (BASELINE_YEARS.min - OPTIMIZED_YEARS.min) * effectivePercent;
    const yearsMax = BASELINE_YEARS.max - (BASELINE_YEARS.max - OPTIMIZED_YEARS.max) * effectivePercent;
    root.querySelector("#pointsValue").textContent = `${effectivePoints}/${progress.totalPoints}`;
    root.querySelector("#timelineValue").textContent = `${formatYears(yearsMin)}-${formatYears(yearsMax)} лет`;
    root.querySelector("#speedValue").textContent = `${(1 + effectivePercent).toFixed(1)}x`;
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
  window.MusiciansPath = { calculateProgress, loadState, saveState, STORAGE_KEY };
  window.addEventListener("DOMContentLoaded", renderApp);
}

if (typeof module !== "undefined") {
  module.exports = { applyLoopResets, calculateProgress, calculateRetainedPoints, defaultState, loadState, saveState, STORAGE_KEY };
}
