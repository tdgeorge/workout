let timerInterval = null;
let timerEndTime = null;

export function clearTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
    timerEndTime = null;
  }
}

export function parseDuration(durationStr) {
  if (!durationStr) return null;
  const match = durationStr.match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

export function playBeep() {
  const audio = document.getElementById("timer-audio");
  if (audio) {
    audio.currentTime = 0;
    audio.play();
  } else {
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

export function getTimerState() {
  return { timerInterval, timerEndTime };
}

export function setTimerState(interval, endTime) {
  timerInterval = interval;
  timerEndTime = endTime;
}