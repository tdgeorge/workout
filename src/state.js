export const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
export let workouts = [];
export let schedule = {};

export function encodeState(obj) {
  return encodeURIComponent(btoa(JSON.stringify(obj)));
}
export function decodeState(str) {
  try {
    return JSON.parse(atob(decodeURIComponent(str)));
  } catch {
    return null;
  }
}
export function saveState() {
  const state = { workouts, schedule };
  const url = location.origin + location.pathname + "?state=" + encodeState(state);
  window.history.replaceState(null, "", url);
}
export function loadState() {
  const params = new URLSearchParams(location.search);
  if (params.get('state')) {
    const state = decodeState(params.get('state'));
    if (state && typeof state === "object") {
      workouts = Array.isArray(state.workouts) ? state.workouts : [];
      schedule = typeof state.schedule === "object" && state.schedule !== null ? state.schedule : {};
    }
  }
}