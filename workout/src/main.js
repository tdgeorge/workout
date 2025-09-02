import React, { useState } from "react";
import LZString from "lz-string";
import { createRoot } from "react-dom/client";

// --- Data ---
const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
let workouts = [];
let schedule = {};
let selectedWorkout = null;
let stepIdx = 0;

// Helper to encode/decode schedule in URL
const encodeSchedule = (schedule) => encodeURIComponent(btoa(JSON.stringify(schedule)));
const decodeSchedule = (str) => JSON.parse(atob(decodeURIComponent(str)));

function App() {
  const [workouts, setWorkouts] = useState([]);
  const [schedule, setSchedule] = useState({});
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [stepIdx, setStepIdx] = useState(0);

  // Load from URL if present
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("schedule")) {
      setSchedule(decodeSchedule(params.get("schedule")));
    }
  }, []);

  // Add a new workout
  const addWorkout = () => setWorkouts([...workouts, { name: "", exercises: [] }]);

  // Add exercise to a workout
  const addExercise = (wIdx) => {
    const newWorkouts = [...workouts];
    newWorkouts[wIdx].exercises.push({ name: "", sets: 3, reps: 10, duration: "" });
    setWorkouts(newWorkouts);
  };

  // Update workout or exercise details
  const updateWorkout = (wIdx, field, value) => {
    const newWorkouts = [...workouts];
    newWorkouts[wIdx][field] = value;
    setWorkouts(newWorkouts);
  };
  const updateExercise = (wIdx, eIdx, field, value) => {
    const newWorkouts = [...workouts];
    newWorkouts[wIdx].exercises[eIdx][field] = value;
    setWorkouts(newWorkouts);
  };

  // Assign workout to a day
  const assignWorkout = (day, wIdx) => {
    setSchedule({ ...schedule, [day]: wIdx });
  };

  // Share schedule via URL
  const shareUrl = `${window.location.origin}${window.location.pathname}?schedule=${encodeSchedule(schedule)}`;

  // Workout stepper
  const startWorkout = (wIdx) => {
    setSelectedWorkout(wIdx);
    setStepIdx(0);
  };
  const nextStep = () => setStepIdx((i) => i + 1);

  // --- Serialization/Deserialization ---

  function escapeText(str) {
      return str.replace(/([|~\\])/g, '\\$1');
  }
  function unescapeText(str) {
      return str.replace(/\\([|~\\])/g, '$1');
  }

  function serialize(cards) {
      return cards.map(card =>
          `${escapeText(card.word)}~${escapeText(card.definition)}`
      ).join('|');
  }

  function deserialize(str) {
      if (!str) return [];
      let result = [];
      let pair = '';
      let inEscape = false;
      let items = [];
      for (let i = 0; i < str.length; i++) {
          let c = str[i];
          if (inEscape) {
              pair += c;
              inEscape = false;
          } else if (c === '\\') {
              inEscape = true;
          } else if (c === '|') {
              items.push(pair);
              pair = '';
          } else {
              pair += c;
          }
      }
      if (pair) items.push(pair);
      for (let item of items) {
          let parts = [];
          let part = '';
          inEscape = false;
          for (let i = 0; i < item.length; i++) {
              let c = item[i];
              if (inEscape) {
                  part += c;
                  inEscape = false;
              } else if (c === '\\') {
                  inEscape = true;
              } else if (c === '~') {
                  parts.push(part);
                  part = '';
              } else {
                  part += c;
              }
          }
          parts.push(part);
          if (parts.length === 2) {
              result.push({ word: parts[0], definition: parts[1] });
          }
      }
      return result;
  }

  // --- Share functionality with compression/obfuscation ---

  // Auto-load if URL has data
  if (location.hash.startsWith('#data=')) {
      const compressed = decodeURIComponent(location.hash.slice(6));
      const data = LZString.decompressFromBase64(compressed);
      cards = deserialize(data);
      updateWordList();
  }

  return (
    <div>
      <h1>Workout App</h1>
      <h2>Create Workouts</h2>
      {workouts.map((w, wIdx) => (
        <div key={wIdx} style={{ border: "1px solid #ccc", margin: 8, padding: 8 }}>
          <input
            placeholder="Workout name"
            value={w.name}
            onChange={e => updateWorkout(wIdx, "name", e.target.value)}
          />
          <h4>Exercises</h4>
          {w.exercises.map((ex, eIdx) => (
            <div key={eIdx}>
              <input
                placeholder="Exercise name"
                value={ex.name}
                onChange={e => updateExercise(wIdx, eIdx, "name", e.target.value)}
              />
              <input
                type="number"
                placeholder="Sets"
                value={ex.sets}
                onChange={e => updateExercise(wIdx, eIdx, "sets", e.target.value)}
                style={{ width: 60 }}
              />
              <input
                type="number"
                placeholder="Reps"
                value={ex.reps}
                onChange={e => updateExercise(wIdx, eIdx, "reps", e.target.value)}
                style={{ width: 60 }}
              />
              <input
                placeholder="Duration (optional)"
                value={ex.duration}
                onChange={e => updateExercise(wIdx, eIdx, "duration", e.target.value)}
                style={{ width: 120 }}
              />
            </div>
          ))}
          <button onClick={() => addExercise(wIdx)}>Add Exercise</button>
        </div>
      ))}
      <button onClick={addWorkout}>Add Workout</button>

      <h2>Assign Workouts to Days</h2>
      {daysOfWeek.map(day => (
        <div key={day}>
          <label>{day}: </label>
          <select
            value={schedule[day] ?? ""}
            onChange={e => assignWorkout(day, e.target.value)}
          >
            <option value="">-- Select Workout --</option>
            {workouts.map((w, idx) => (
              <option key={idx} value={idx}>{w.name || `Workout ${idx + 1}`}</option>
            ))}
          </select>
        </div>
      ))}

      <h2>Share Your Schedule</h2>
      <input value={shareUrl} readOnly style={{ width: "100%" }} />

      <h2>Start a Workout</h2>
      {daysOfWeek.map(day => (
        schedule[day] !== undefined && workouts[schedule[day]] ? (
          <button key={day} onClick={() => startWorkout(schedule[day])}>
            {day}: {workouts[schedule[day]].name}
          </button>
        ) : null
      ))}

      {selectedWorkout !== null && (
        <div style={{ marginTop: 20, border: "2px solid #444", padding: 16 }}>
          <h3>Workout: {workouts[selectedWorkout].name}</h3>
          {workouts[selectedWorkout].exercises[stepIdx] ? (
            <div>
              <h4>Exercise {stepIdx + 1}: {workouts[selectedWorkout].exercises[stepIdx].name}</h4>
              <p>
                Sets: {workouts[selectedWorkout].exercises[stepIdx].sets} <br />
                Reps: {workouts[selectedWorkout].exercises[stepIdx].reps} <br />
                {workouts[selectedWorkout].exercises[stepIdx].duration && (
                  <>Duration: {workouts[selectedWorkout].exercises[stepIdx].duration} <br /></>
                )}
              </p>
              <button onClick={nextStep} disabled={stepIdx + 1 >= workouts[selectedWorkout].exercises.length}>
                Next Exercise
              </button>
            </div>
          ) : (
            <div>
              <h4>Workout Complete!</h4>
              <button onClick={() => setSelectedWorkout(null)}>Back</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const container = document.getElementById("root");
const root = createRoot(container);
root.render(<App />);

// --- Load from URL if present ---
(function loadFromUrl() {
  const params = new URLSearchParams(location.search);
  if (params.get('schedule')) {
    schedule = decodeSchedule(params.get('schedule'));
  }