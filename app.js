const STORAGE_KEY = "musicians-path-game-state-v1";

function loadState(storage = window.localStorage) {
  try {
    const parsed = JSON.parse(storage.getItem(STORAGE_KEY) || "{}");
    return {
      completed: Array.isArray(parsed.completed) ? parsed.completed : [],
      goalRub: Number.isFinite(parsed.goalRub) ? parsed.goalRub : 20000
    };
  } catch {
    return { completed: [], goalRub: 20000 };
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

function formatYears(value) {
  return value.toLocaleString("ru-RU", { maximumFractionDigits: 1 });
}

function renderApp() {
  const root = document.querySelector("#app");
  const state = loadState();
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
                      <small>${action.points} очков · ${action.horizon}</small>
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
        <p>Очки пересчитываются в ускорение от 1.0x до 2.0x и сокращают прогноз с базовых 5-7 лет до оптимизированных 3.5-4.5 лет. Состояние сохраняется в localStorage.</p>
      </aside>
    </main>
  `;

  const update = () => {
    const completed = [...root.querySelectorAll("input[type='checkbox']:checked")].map((input) => input.value);
    const goalRub = Number(root.querySelector("#goalRub").value) || 20000;
    const progress = calculateProgress(ACTIONS, completed);
    root.querySelector("#pointsValue").textContent = `${progress.points}/${progress.totalPoints}`;
    root.querySelector("#timelineValue").textContent = `${formatYears(progress.yearsMin)}-${formatYears(progress.yearsMax)} лет`;
    root.querySelector("#speedValue").textContent = `${progress.acceleration.toFixed(1)}x`;
    root.style.setProperty("--progress", `${Math.round(progress.percent * 100)}%`);
    saveState({ completed, goalRub });
  };

  root.addEventListener("change", update);
  root.querySelector("#resetButton").addEventListener("click", () => {
    saveState({ completed: [], goalRub: 20000 });
    renderApp();
  });
  update();
}

if (typeof window !== "undefined") {
  window.MusiciansPath = { calculateProgress, loadState, saveState, STORAGE_KEY };
  window.addEventListener("DOMContentLoaded", renderApp);
}

if (typeof module !== "undefined") {
  module.exports = { calculateProgress, loadState, saveState, STORAGE_KEY };
}
