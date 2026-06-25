const assert = require("node:assert/strict");
const vm = require("node:vm");
const fs = require("node:fs");

const context = { module: { exports: {} } };
vm.createContext(context);
vm.runInContext(fs.readFileSync("data.js", "utf8"), context);
context.ACTIONS = context.module.exports.ACTIONS;
context.BASELINE_YEARS = context.module.exports.BASELINE_YEARS;
context.OPTIMIZED_YEARS = context.module.exports.OPTIMIZED_YEARS;
context.GROWTH_MODEL = context.module.exports.GROWTH_MODEL;
context.module.exports = {};
vm.runInContext(fs.readFileSync("app.js", "utf8"), context);

const { calculateProgress, calculateGrowthCurve, loadState, saveState, STORAGE_KEY } = context.module.exports;
const actions = context.ACTIONS;

const empty = calculateProgress(actions, []);
assert.equal(empty.points, 0);
assert.equal(empty.acceleration, 1);
assert.equal(empty.yearsMin, 5);
assert.equal(empty.yearsMax, 7);

const full = calculateProgress(actions, actions.map((action) => action.id));
assert.equal(full.points, full.totalPoints);
assert.equal(full.acceleration, 2);
assert.equal(full.yearsMin, 3.5);
assert.equal(full.yearsMax, 4.5);

const standardCurve = calculateGrowthCurve(context.GROWTH_MODEL, 0);
assert.equal(standardCurve.length, context.GROWTH_MODEL.months + 1);
assert.equal(standardCurve[0].standard, context.GROWTH_MODEL.startListeners);
assert.equal(standardCurve[0].optimized, context.GROWTH_MODEL.startListeners);
assert.equal(standardCurve.at(-1).optimized, standardCurve.at(-1).standard);

const recommendationCurve = calculateGrowthCurve(context.GROWTH_MODEL, 1);
const jumpMonth = context.GROWTH_MODEL.recommendationJumpMonth;
assert.equal(recommendationCurve[jumpMonth - 1].optimized > standardCurve[jumpMonth - 1].optimized, true);
assert.equal(recommendationCurve[jumpMonth].optimized > recommendationCurve[jumpMonth].standard, true);
assert.equal(recommendationCurve.at(-1).optimized > recommendationCurve.at(-1).standard, true);

const storage = new Map();
const fakeStorage = {
  getItem: (key) => storage.get(key),
  setItem: (key, value) => storage.set(key, value)
};

saveState({ completed: ["canvas"], goalRub: 25000 }, fakeStorage);
assert.equal(storage.has(STORAGE_KEY), true);
assert.deepEqual(JSON.parse(JSON.stringify(loadState(fakeStorage))), { completed: ["canvas"], goalRub: 25000 });

storage.set(STORAGE_KEY, "{broken");
assert.deepEqual(JSON.parse(JSON.stringify(loadState(fakeStorage))), { completed: [], goalRub: 20000 });

console.log("progress.test.js passed");
