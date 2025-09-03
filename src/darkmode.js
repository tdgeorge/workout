export let darkMode = localStorage.getItem("workout-darkmode") === "true";

export function setDarkMode() {
  document.body.classList.toggle("dark", darkMode);
}

export function renderDarkToggle(renderCallback) {
  const btn = document.createElement("button");
  btn.className = "toggle-dark";
  btn.textContent = darkMode ? "🌙 Dark" : "☀️ Light";
  btn.onclick = () => {
    darkMode = !darkMode;
    localStorage.setItem("workout-darkmode", darkMode);
    setDarkMode();
    if (renderCallback) renderCallback();
  };
  return btn;
}