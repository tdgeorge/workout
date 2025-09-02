// --- Data ---
const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
let workouts = [];
let schedule = {};
let selectedWorkout = null;
let setStep = 0;
let exStep = 0;
let darkMode = localStorage.getItem("workout-darkmode") === "true";

// Timer state
let timerInterval = null;
let timerEndTime = null;

// --- Dark mode toggle ---
function renderDarkToggle() {
  const btn = document.createElement("button");
  btn.className = "toggle-dark";
  btn.textContent = darkMode ? "🌙 Dark" : "☀️ Light";
  btn.onclick = () => {
    darkMode = !darkMode;
    localStorage.setItem("workout-darkmode", darkMode);
    document.body.classList.toggle("dark", darkMode);
    render();
  };
  return btn;
}

// Set initial dark mode class
document.body.classList.toggle("dark", darkMode);

// --- Helper to get max sets for a workout ---
function getMaxSets(workout) {
  if (!workout || !workout.exercises.length) return 0;
  return Math.max(...workout.exercises.map(ex => Number(ex.sets) || 0));
}

// --- Serialization helpers ---
function encodeState(obj) {
  return encodeURIComponent(btoa(JSON.stringify(obj)));
}
function decodeState(str) {
  try {
    return JSON.parse(atob(decodeURIComponent(str)));
  } catch {
    return null;
  }
}
function updateUrl() {
  const state = { workouts, schedule };
  const url = location.origin + location.pathname + "?state=" + encodeState(state);
  window.history.replaceState(null, "", url);
}

// --- Timer helpers ---
function playBeep() {
  // Try to play a custom sound file if it exists
  const audio = document.getElementById("timer-audio");
  if (audio) {
    audio.currentTime = 0;
    audio.play();
  } else {
    // fallback beep
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = ctx.createOscillator();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(880, ctx.currentTime);
      oscillator.connect(ctx.destination);
      oscillator.start();
      setTimeout(() => {
        oscillator.stop();
        ctx.close();
      }, 400);
    } catch (e) {
      alert("Time's up!");
    }
  }
}

function clearTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
    timerEndTime = null;
  }
}

// --- Duration parsing ---
function parseDuration(durationStr) {
  if (!durationStr) return null;
  const match = durationStr.match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

function render() {
  // --- Save focus and selection ---
  const active = document.activeElement;
  let focusSelector = null, focusIdx = null, selectionStart = null, selectionEnd = null;
  if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA")) {
    focusSelector = active.getAttribute("data-focus");
    focusIdx = active.getAttribute("data-idx");
    selectionStart = active.selectionStart;
    selectionEnd = active.selectionEnd;
  }

  const app = document.getElementById('app');
  app.innerHTML = '';

  // --- Header with dark mode toggle ---
  const headerRow = document.createElement("div");
  headerRow.className = "header-row";
  const h1 = document.createElement("h1");
  h1.textContent = "Workout App";
  headerRow.appendChild(h1);
  headerRow.appendChild(renderDarkToggle());
  app.appendChild(headerRow);

  // --- Create Workouts ---
  const createDiv = document.createElement('div');
  createDiv.className = "card";
  createDiv.innerHTML = '<h2>Create Workouts</h2>';
  workouts.forEach((w, wIdx) => {
    const wDiv = document.createElement('div');
    wDiv.className = 'workout';
    // Workout name
    const wName = document.createElement('input');
    wName.type = 'text';
    wName.placeholder = 'Workout name';
    wName.value = w.name;
    wName.setAttribute("data-focus", "workout-name");
    wName.setAttribute("data-idx", wIdx);
    wName.oninput = e => { w.name = e.target.value; render(); };
    wDiv.appendChild(wName);

    // Exercises
    const exTitle = document.createElement('h4');
    exTitle.textContent = 'Exercises';
    wDiv.appendChild(exTitle);

    w.exercises.forEach((ex, eIdx) => {
      const exDiv = document.createElement('div');
      exDiv.className = 'exercise';

      const exName = document.createElement('input');
      exName.type = 'text';
      exName.placeholder = 'Exercise name';
      exName.value = ex.name;
      exName.setAttribute("data-focus", "exercise-name");
      exName.setAttribute("data-idx", `${wIdx}-${eIdx}`);
      exName.oninput = e => { ex.name = e.target.value; render(); };
      exDiv.appendChild(exName);

      const exSets = document.createElement('input');
      exSets.type = 'number';
      exSets.placeholder = 'Sets';
      exSets.value = ex.sets;
      exSets.style.width = '60px';
      exSets.setAttribute("data-focus", "exercise-sets");
      exSets.setAttribute("data-idx", `${wIdx}-${eIdx}`);
      exSets.oninput = e => { ex.sets = Number(e.target.value); render(); };
      exDiv.appendChild(exSets);

      const exReps = document.createElement('input');
      exReps.type = 'number';
      exReps.placeholder = 'Reps';
      exReps.value = ex.reps;
      exReps.style.width = '60px';
      exReps.setAttribute("data-focus", "exercise-reps");
      exReps.setAttribute("data-idx", `${wIdx}-${eIdx}`);
      exReps.oninput = e => { ex.reps = Number(e.target.value); render(); };
      exDiv.appendChild(exReps);

      const exDur = document.createElement('input');
      exDur.type = 'text';
      exDur.placeholder = 'Duration (optional)';
      exDur.value = ex.duration;
      exDur.style.width = '120px';
      exDur.setAttribute("data-focus", "exercise-duration");
      exDur.setAttribute("data-idx", `${wIdx}-${eIdx}`);
      exDur.oninput = e => { ex.duration = e.target.value; render(); };
      exDiv.appendChild(exDur);

      // Remove exercise button
      const rmExBtn = document.createElement('button');
      rmExBtn.textContent = 'Remove';
      rmExBtn.className = "remove-btn";
      rmExBtn.onclick = () => {
        w.exercises.splice(eIdx, 1);
        render();
      };
      exDiv.appendChild(rmExBtn);

      wDiv.appendChild(exDiv);
    });

    // Add exercise button
    const addExBtn = document.createElement('button');
    addExBtn.textContent = 'Add Exercise';
    addExBtn.onclick = () => {
      w.exercises.push({ name: '', sets: 3, reps: 10, duration: '' });
      render();
    };
    wDiv.appendChild(addExBtn);

    // Remove workout button
    const rmWBtn = document.createElement('button');
    rmWBtn.textContent = 'Remove Workout';
    rmWBtn.className = "remove-btn";
    rmWBtn.onclick = () => {
      workouts.splice(wIdx, 1);
      render();
    };
    wDiv.appendChild(rmWBtn);

    createDiv.appendChild(wDiv);
  });

  // Add workout button
  const addWBtn = document.createElement('button');
  addWBtn.textContent = 'Add Workout';
  addWBtn.onclick = () => {
    workouts.push({ name: '', exercises: [] });
    render();
  };
  createDiv.appendChild(addWBtn);

  app.appendChild(createDiv);

  // --- Assign Workouts to Days ---
  const schedDiv = document.createElement('div');
  schedDiv.className = "card";
  schedDiv.innerHTML = '<h2>Assign Workouts to Days</h2>';
  const daysRow = document.createElement("div");
  daysRow.className = "days-row";
  daysOfWeek.forEach(day => {
    const row = document.createElement('div');
    const label = document.createElement('label');
    label.textContent = day + ': ';
    row.appendChild(label);

    const sel = document.createElement('select');
    sel.onchange = e => {
      schedule[day] = e.target.value === '' ? undefined : Number(e.target.value);
      render();
    };
    const opt0 = document.createElement('option');
    opt0.value = '';
    opt0.textContent = '-- Select Workout --';
    sel.appendChild(opt0);
    workouts.forEach((w, idx) => {
      const opt = document.createElement('option');
      opt.value = idx;
      opt.textContent = w.name || `Workout ${idx + 1}`;
      if (schedule[day] === idx) opt.selected = true;
      sel.appendChild(opt);
    });
    row.appendChild(sel);
    daysRow.appendChild(row);
  });
  schedDiv.appendChild(daysRow);
  app.appendChild(schedDiv);

  // --- Share Schedule ---
  const shareDiv = document.createElement('div');
  shareDiv.className = "card";
  shareDiv.innerHTML = '<h2>Share Your Schedule</h2>';
  const urlInput = document.createElement('input');
  urlInput.type = 'text';
  urlInput.readOnly = true;
  urlInput.className = "share-url";
  urlInput.value = location.origin + location.pathname + '?state=' + encodeState({workouts, schedule});
  shareDiv.appendChild(urlInput);
  app.appendChild(shareDiv);

  // --- Update URL with current state ---
  updateUrl();

  // --- Start a Workout ---
  const startDiv = document.createElement('div');
  startDiv.className = "card";
  startDiv.innerHTML = '<h2>Start a Workout</h2>';
  daysOfWeek.forEach(day => {
    const wIdx = schedule[day];
    if (wIdx !== undefined && workouts[wIdx]) {
      const btn = document.createElement('button');
      btn.textContent = `${day}: ${workouts[wIdx].name || `Workout ${wIdx + 1}`}`;
      btn.onclick = () => {
        selectedWorkout = wIdx;
        setStep = 0;
        exStep = 0;
        clearTimer();
        render();
      };
      startDiv.appendChild(btn);
    }
  });
  app.appendChild(startDiv);

  // --- Workout Stepper (round-robin sets) ---
  if (selectedWorkout !== null && workouts[selectedWorkout]) {
    const stepper = document.createElement('div');
    stepper.className = 'stepper';
    const w = workouts[selectedWorkout];
    const maxSets = getMaxSets(w);

    // Find the next exercise with sets remaining for this setStep
    let found = false;
    let currentExIdx = exStep;
    let currentSetIdx = setStep;
    let looped = false;
    while (!found && !looped) {
      const ex = w.exercises[currentExIdx];
      if (ex && Number(ex.sets) > currentSetIdx) {
        found = true;
        break;
      }
      currentExIdx++;
      if (currentExIdx >= w.exercises.length) {
        currentExIdx = 0;
        currentSetIdx++;
        if (currentSetIdx >= maxSets) {
          looped = true;
        }
      }
    }

    if (found) {
      const ex = w.exercises[currentExIdx];
      const exTitle = document.createElement('h4');
      exTitle.textContent = `Set ${currentSetIdx + 1} - ${ex.name}`;
      stepper.appendChild(exTitle);

      const p = document.createElement('p');
      p.innerHTML = `Sets: ${ex.sets} <br> Reps: ${ex.reps} <br>` +
        (ex.duration ? `Duration: ${ex.duration} <br>` : '');
      stepper.appendChild(p);

      // Duration logic
      const durationSeconds = parseDuration(ex.duration);
      if (durationSeconds) {
        // Timer display
        const timerDiv = document.createElement('div');
        timerDiv.style.margin = "1em 0";
        timerDiv.style.fontSize = "1.5em";
        timerDiv.style.fontWeight = "bold";
        timerDiv.id = "timer-display";
        timerDiv.textContent = timerInterval && timerEndTime
          ? Math.max(0, Math.ceil((timerEndTime - Date.now()) / 1000)) + "s"
          : durationSeconds + "s";
        stepper.appendChild(timerDiv);

        // Start button
        if (!timerInterval) {
          const startBtn = document.createElement('button');
          startBtn.textContent = 'Start';
          startBtn.onclick = () => {
            timerEndTime = Date.now() + durationSeconds * 1000;
            timerDiv.textContent = durationSeconds + "s";
            timerInterval = setInterval(() => {
              const remaining = Math.max(0, Math.ceil((timerEndTime - Date.now()) / 1000));
              timerDiv.textContent = remaining + "s";
              if (remaining <= 0) {
                clearTimer();
                playBeep();
                // Advance to next exercise/set
                let nextEx = currentExIdx + 1;
                let nextSet = currentSetIdx;
                let advanced = false;
                while (!advanced) {
                  if (nextEx >= w.exercises.length) {
                    nextEx = 0;
                    nextSet++;
                  }
                  if (nextSet >= maxSets) {
                    selectedWorkout = null;
                    render();
                    return;
                  }
                  if (w.exercises[nextEx] && Number(w.exercises[nextEx].sets) > nextSet) {
                    advanced = true;
                    break;
                  }
                  nextEx++;
                }
                setStep = nextSet;
                exStep = nextEx;
                render();
              }
            }, 1000); // update every second
            render();
          };
          stepper.appendChild(startBtn);
        } else {
          // Show a cancel button if timer is running
          const cancelBtn = document.createElement('button');
          cancelBtn.textContent = 'Cancel Timer';
          cancelBtn.onclick = () => {
            clearTimer();
            render();
          };
          stepper.appendChild(cancelBtn);
        }
      } else {
        // No duration, regular next button
        const nextBtn = document.createElement('button');
        nextBtn.textContent = 'Next';
        nextBtn.onclick = () => {
          let nextEx = currentExIdx + 1;
          let nextSet = currentSetIdx;
          let advanced = false;
          while (!advanced) {
            if (nextEx >= w.exercises.length) {
              nextEx = 0;
              nextSet++;
            }
            if (nextSet >= maxSets) {
              selectedWorkout = null;
              render();
              return;
            }
            if (w.exercises[nextEx] && Number(w.exercises[nextEx].sets) > nextSet) {
              advanced = true;
              break;
            }
            nextEx++;
          }
          setStep = nextSet;
          exStep = nextEx;
          render();
        };
        stepper.appendChild(nextBtn);
      }

      const quitBtn = document.createElement('button');
      quitBtn.textContent = 'Quit';
      quitBtn.onclick = () => {
        clearTimer();
        selectedWorkout = null;
        render();
      };
      stepper.appendChild(quitBtn);
    } else {
      clearTimer();
      const done = document.createElement('h4');
      done.textContent = 'Workout Complete!';
      stepper.appendChild(done);
      const backBtn = document.createElement('button');
      backBtn.textContent = 'Back';
      backBtn.onclick = () => {
        selectedWorkout = null;
        render();
      };
      stepper.appendChild(backBtn);
    }
    app.appendChild(stepper);

    // Add audio element for custom sound if not present
    if (!document.getElementById("timer-audio")) {
      const audio = document.createElement("audio");
      audio.id = "timer-audio";
      audio.src = "src/timer.mp3"; // Change this path to your uploaded sound file
      audio.preload = "auto";
      audio.style.display = "none";
      document.body.appendChild(audio);
    }
  } else {
    clearTimer();
  }

  // --- Restore focus and selection ---
  if (focusSelector !== null && focusIdx !== null) {
    const selector = `[data-focus="${focusSelector}"][data-idx="${focusIdx}"]`;
    const el = document.querySelector(selector);
    if (el) {
      el.focus();
      if (selectionStart !== null && selectionEnd !== null && el.setSelectionRange) {
        el.setSelectionRange(selectionStart, selectionEnd);
      }
    }
  }
}

// --- Load from URL if present ---
(function loadFromUrl() {
  const params = new URLSearchParams(location.search);
  if (params.get('state')) {
    const state = decodeState(params.get('state'));
    if (state && typeof state === "object") {
      workouts = Array.isArray(state.workouts) ? state.workouts : [];
      schedule = typeof state.schedule === "object" && state.schedule !== null ? state.schedule : {};
    }
  }
})();

render();