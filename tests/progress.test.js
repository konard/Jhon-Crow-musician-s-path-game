const assert = require("node:assert/strict");
const vm = require("node:vm");
const fs = require("node:fs");

const context = { module: { exports: {} } };
vm.createContext(context);
vm.runInContext(fs.readFileSync("data.js", "utf8"), context);
context.ACTIONS = context.module.exports.ACTIONS;
context.BASELINE_YEARS = context.module.exports.BASELINE_YEARS;
context.OPTIMIZED_YEARS = context.module.exports.OPTIMIZED_YEARS;
context.module.exports = {};
vm.runInContext(fs.readFileSync("app.js", "utf8"), context);

const { applyLoopResets, calculateProgress, calculateRetainedPoints, loadState, saveState, STORAGE_KEY } = context.module.exports;
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

const storage = new Map();
const fakeStorage = {
  getItem: (key) => storage.get(key),
  setItem: (key, value) => storage.set(key, value)
};

saveState({ completed: ["canvas"], goalRub: 25000, resetLoops: false, loopCompletions: {}, retainedLoopPoints: {} }, fakeStorage);
assert.equal(storage.has(STORAGE_KEY), true);
assert.deepEqual(JSON.parse(JSON.stringify(loadState(fakeStorage))), {
  completed: ["canvas"],
  goalRub: 25000,
  resetLoops: false,
  loopCompletions: {},
  retainedLoopPoints: {}
});

storage.set(STORAGE_KEY, "{broken");
assert.deepEqual(JSON.parse(JSON.stringify(loadState(fakeStorage))), {
  completed: [],
  goalRub: 20000,
  resetLoops: true,
  loopCompletions: {},
  retainedLoopPoints: {}
});

const loopState = {
  completed: ["canvas"],
  goalRub: 20000,
  resetLoops: true,
  loopCompletions: { canvas: "2026-01-01T00:00:00.000Z" },
  retainedLoopPoints: {}
};
const reset = applyLoopResets(actions, loopState, new Date("2026-02-01T00:00:00.000Z"));
assert.deepEqual(JSON.parse(JSON.stringify(reset.completed)), []);
assert.equal(reset.retainedLoopPoints.canvas, 6);
assert.equal(calculateRetainedPoints(actions, reset), 6);

const disabled = applyLoopResets(actions, { ...loopState, resetLoops: false }, new Date("2026-02-01T00:00:00.000Z"));
assert.deepEqual(JSON.parse(JSON.stringify(disabled.completed)), ["canvas"]);

console.log("progress.test.js passed");
