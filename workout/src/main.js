// --- Data ---
const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
let workouts = [];
let schedule = {};
let selectedWorkout = null;
let stepIdx = 0;

function encodeSchedule(obj) {
  return encodeURIComponent(btoa(JSON.stringify(obj)));
}
function decodeSchedule(str) {
  try {
    return JSON.parse(atob(decodeURIComponent(str)));
  } catch {
    return {};
  }
}

function render() {
  const app = document.getElementById('app');
  app.innerHTML = '';

  // --- Create Workouts ---
  const createDiv = document.createElement('div');
  createDiv.innerHTML = '<h2>Create Workouts</h2>';
  workouts.forEach((w, wIdx) => {
    const wDiv = document.createElement('div');
    wDiv.className = 'workout';
    // Workout name
    const wName = document.createElement('input');
    wName.type = 'text';
    wName.placeholder = 'Workout name';
    wName.value = w.name;
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
      exName.oninput = e => { ex.name = e.target.value; render(); };
      exDiv.appendChild(exName);

      const exSets = document.createElement('input');
      exSets.type = 'number';
      exSets.placeholder = 'Sets';
      exSets.value = ex.sets;
      exSets.style.width = '60px';
      exSets.oninput = e => { ex.sets = Number(e.target.value); render(); };
      exDiv.appendChild(exSets);

      const exReps = document.createElement('input');
      exReps.type = 'number';
      exReps.placeholder = 'Reps';
      exReps.value = ex.reps;
      exReps.style.width = '60px';
      exReps.oninput = e => { ex.reps = Number(e.target.value); render(); };
      exDiv.appendChild(exReps);

      const exDur = document.createElement('input');
      exDur.type = 'text';
      exDur.placeholder = 'Duration (optional)';
      exDur.value = ex.duration;
      exDur.style.width = '120px';
      exDur.oninput = e => { ex.duration = e.target.value; render(); };
      exDiv.appendChild(exDur);

      // Remove exercise button
      const rmExBtn = document.createElement('button');
      rmExBtn.textContent = 'Remove';
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
  schedDiv.innerHTML = '<h2>Assign Workouts to Days</h2>';
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
    schedDiv.appendChild(row);
  });
  app.appendChild(schedDiv);

  // --- Share Schedule ---
  const shareDiv = document.createElement('div');
  shareDiv.innerHTML = '<h2>Share Your Schedule</h2>';
  const urlInput = document.createElement('input');
  urlInput.type = 'text';
  urlInput.readOnly = true;
  urlInput.style.width = '100%';
  urlInput.value = location.origin + location.pathname + '?schedule=' + encodeSchedule(schedule);
  shareDiv.appendChild(urlInput);
  app.appendChild(shareDiv);

  // --- Start a Workout ---
  const startDiv = document.createElement('div');
  startDiv.innerHTML = '<h2>Start a Workout</h2>';
  daysOfWeek.forEach(day => {
    const wIdx = schedule[day];
    if (wIdx !== undefined && workouts[wIdx]) {
      const btn = document.createElement('button');
      btn.textContent = `${day}: ${workouts[wIdx].name || `Workout ${wIdx + 1}`}`;
      btn.onclick = () => {
        selectedWorkout = wIdx;
        stepIdx = 0;
        render();
      };
      startDiv.appendChild(btn);
    }
  });
  app.appendChild(startDiv);

  // --- Workout Stepper ---
  if (selectedWorkout !== null && workouts[selectedWorkout]) {
    const stepper = document.createElement('div');
    stepper.className = 'stepper';
    const w = workouts[selectedWorkout];
    const ex = w.exercises[stepIdx];
    const title = document.createElement('h3');
    title.textContent = `Workout: ${w.name}`;
    stepper.appendChild(title);

    if (ex) {
      const exTitle = document.createElement('h4');
      exTitle.textContent = `Exercise ${stepIdx + 1}: ${ex.name}`;
      stepper.appendChild(exTitle);

      const p = document.createElement('p');
      p.innerHTML = `Sets: ${ex.sets} <br> Reps: ${ex.reps} <br>` +
        (ex.duration ? `Duration: ${ex.duration} <br>` : '');
      stepper.appendChild(p);

      const nextBtn = document.createElement('button');
      nextBtn.textContent = 'Next Exercise';
      nextBtn.disabled = stepIdx + 1 >= w.exercises.length;
      nextBtn.onclick = () => {
        stepIdx++;
        render();
      };
      stepper.appendChild(nextBtn);
    } else {
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
  }
}

// --- Load from URL if present ---
(function loadFromUrl() {
  const params = new URLSearchParams(location.search);
  if (params.get('schedule')) {
    schedule = decodeSchedule(params.get('schedule'));
  }
})();

render();