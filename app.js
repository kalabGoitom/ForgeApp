// ══════════════════════════════════════════════
//  DATA LAYER
// ══════════════════════════════════════════════
const EXERCISE_DB = {
  Chest: [
    "Bench Press",
    "Incline Bench Press",
    "Decline Bench Press",
    "Push-Up",
    "Cable Fly",
    "Dumbbell Fly",
    "Chest Dip",
  ],
  Back: [
    "Deadlift",
    "Pull-Up",
    "Barbell Row",
    "Seated Cable Row",
    "Lat Pulldown",
    "Single-Arm Row",
    "T-Bar Row",
  ],
  Shoulders: [
    "Overhead Press",
    "Lateral Raise",
    "Front Raise",
    "Face Pull",
    "Arnold Press",
    "Rear Delt Fly",
  ],
  Arms: [
    "Barbell Curl",
    "Hammer Curl",
    "Tricep Dip",
    "Skull Crusher",
    "Cable Curl",
    "Tricep Pushdown",
    "Preacher Curl",
  ],
  Legs: [
    "Squat",
    "Romanian Deadlift",
    "Leg Press",
    "Walking Lunge",
    "Leg Curl",
    "Leg Extension",
    "Calf Raise",
    "Hip Thrust",
  ],
  Core: [
    "Plank",
    "Crunch",
    "Russian Twist",
    "Hanging Leg Raise",
    "Ab Rollout",
    "Cable Crunch",
  ],
};

function load(key, def) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : def;
  } catch {
    return def;
  }
}

function save(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {}
}

let workouts = load("forge_workouts", []);
let settings = load("forge_settings", {
  unit: "kg",
  goalWorkouts: 4,
  restTimer: 90,
});
let customExercises = load("forge_custom_exercises", []);
let currentWorkout = { exercises: [], note: "", startTime: Date.now() };
let timerInterval = null;
let timerSeconds = 0;

// ══════════════════════════════════════════════
//  NAVIGATION
// ══════════════════════════════════════════════
let currentScreen = "home";

function navigate(screen) {
  document
    .querySelectorAll(".screen")
    .forEach((s) => s.classList.remove("active"));
  document
    .querySelectorAll(".nav-btn")
    .forEach((b) => b.classList.remove("active"));
  document.getElementById("screen-" + screen).classList.add("active");
  document.getElementById("nav-" + screen).classList.add("active");
  currentScreen = screen;
  if (screen === "home") renderHome();
  if (screen === "history") renderHistory();
  if (screen === "stats") renderStats();
  if (screen === "settings") loadSettings();
}

function goToLog() {
  currentWorkout = { exercises: [], note: "", startTime: Date.now() };
  document.getElementById("workoutNote").value = "";
  document.getElementById("exerciseCards").innerHTML = "";
  document.getElementById("suggestionArea").innerHTML = "";
  navigate("log");
}

// ══════════════════════════════════════════════
//  HOME
// ══════════════════════════════════════════════
function renderHome() {
  const now = new Date();
  document.getElementById("heroDate").textContent = now
    .toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    })
    .toUpperCase();

  // Streak
  const streak = calcStreak();
  document.getElementById("streakBadge").textContent =
    `🔥 ${streak} day streak`;

  // Stats
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const weekWorkouts = workouts.filter(
    (w) => new Date(w.date) >= weekStart,
  ).length;
  document.getElementById("statWeekWorkouts").textContent = weekWorkouts;
  document.getElementById("statTotal").textContent = workouts.length;
  document.getElementById("statPRs").textContent = countPRs();

  // Week bar
  const days = ["S", "M", "T", "W", "T", "F", "S"];
  const today = now.getDay();
  let barHTML = "";
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - ((today - i + 7) % 7));
    d.setHours(0, 0, 0, 0);
    const de = new Date(d);
    de.setDate(de.getDate() + 1);
    const hasW = workouts.some((w) => {
      const wd = new Date(w.date);
      return wd >= d && wd < de;
    });
    const h = hasW ? 52 : 8;
    barHTML += `<div class="week-bar-day">
      <div class="week-bar-fill ${hasW ? "active" : ""}" style="height:${h}px"></div>
      <span class="week-bar-lbl">${days[i]}</span>
    </div>`;
  }
  document.getElementById("weekBar").innerHTML = barHTML;

  // Recent
  const sorted = [...workouts]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);
  const container = document.getElementById("recentWorkouts");
  if (!sorted.length) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">🏋️</div><div class="empty-text">No workouts yet.<br>Hit Start Workout to begin your journey.</div></div>`;
    return;
  }
  container.innerHTML = sorted
    .map((w) => {
      const d = new Date(w.date);
      const label = relativeDate(d);
      const exNames = w.exercises.map((e) => e.name).join(", ");
      return `<div class="recent-item" onclick="navigate('history')">
      <div class="recent-dot"></div>
      <div class="recent-info">
        <div class="recent-name">${exNames || "Workout"}</div>
        <div class="recent-meta">${w.exercises.length} exercise${w.exercises.length !== 1 ? "s" : ""} · ${totalSets(w)} sets</div>
      </div>
      <div class="recent-date">${label}</div>
    </div>`;
    })
    .join("");
}

function relativeDate(d) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  const diff = Math.round((today - target) / 86400000);
  if (diff === 0) return "TODAY";
  if (diff === 1) return "YESTERDAY";
  if (diff < 7) return `${diff}D AGO`;
  return d
    .toLocaleDateString("en-US", { month: "short", day: "numeric" })
    .toUpperCase();
}

function calcStreak() {
  if (!workouts.length) return 0;
  const dates = [
    ...new Set(
      workouts.map((w) => {
        const d = new Date(w.date);
        d.setHours(0, 0, 0, 0);
        return d.getTime();
      }),
    ),
  ].sort((a, b) => b - a);
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let check = today.getTime();
  for (const d of dates) {
    if (d === check) {
      streak++;
      check -= 86400000;
    } else if (d < check) break;
  }
  return streak;
}

function countPRs() {
  const prs = {};
  for (const w of workouts) {
    for (const ex of w.exercises) {
      for (const set of ex.sets) {
        const w2 = parseFloat(set.weight) || 0;
        if (!prs[ex.name] || w2 > prs[ex.name]) prs[ex.name] = w2;
      }
    }
  }
  return Object.keys(prs).length;
}

function totalSets(w) {
  return w.exercises.reduce((a, e) => a + (e.sets ? e.sets.length : 0), 0);
}

// ══════════════════════════════════════════════
//  LOG SCREEN
// ══════════════════════════════════════════════
function openModal() {
  document.getElementById("exerciseModal").classList.add("open");
  document.getElementById("exerciseSearch").value = "";
  document.getElementById("customExerciseName").value = "";
  renderExerciseList();
  setTimeout(() => document.getElementById("exerciseSearch").focus(), 300);
}

function closeModal() {
  document.getElementById("exerciseModal").classList.remove("open");
}

function getAllExercises() {
  const all = [];
  for (const [muscle, exs] of Object.entries(EXERCISE_DB)) {
    for (const ex of exs) all.push({ name: ex, muscle });
  }
  for (const ex of customExercises) all.push({ name: ex, muscle: "Custom" });
  return all;
}

function renderExerciseList(filter = "") {
  const all = getAllExercises();
  const filtered = filter
    ? all.filter((e) => e.name.toLowerCase().includes(filter.toLowerCase()))
    : all;

  const grouped = {};
  for (const ex of filtered) {
    if (!grouped[ex.muscle]) grouped[ex.muscle] = [];
    grouped[ex.muscle].push(ex.name);
  }

  let html = "";
  for (const [muscle, names] of Object.entries(grouped)) {
    html += `<div class="muscle-group">${muscle}</div>`;
    for (const name of names) {
      const already = currentWorkout.exercises.find((e) => e.name === name);
      html += `<div class="exercise-option" onclick="selectExercise('${name.replace(/'/g, "\\'")}','${muscle}')">
        <span class="ex-name">${name}</span>
        ${already ? '<span style="color:var(--accent);font-size:12px">Added ✓</span>' : '<span style="color:var(--muted);font-size:12px">+</span>'}
      </div>`;
    }
  }
  if (!html)
    html = `<div style="padding:30px;text-align:center;color:var(--muted)">No exercises found</div>`;
  document.getElementById("exerciseList").innerHTML = html;
}

function filterExercises() {
  renderExerciseList(document.getElementById("exerciseSearch").value);
}

function addCustomExercise() {
  const name = document.getElementById("customExerciseName").value.trim();
  if (!name) return;
  if (!customExercises.includes(name)) {
    customExercises.push(name);
    save("forge_custom_exercises", customExercises);
  }
  selectExercise(name, "Custom");
}

function selectExercise(name, muscle) {
  if (!currentWorkout.exercises.find((e) => e.name === name)) {
    const lastPerf = getLastPerformance(name);
    currentWorkout.exercises.push({ name, muscle, sets: [] });
    renderExerciseCards();
    if (lastPerf) showSuggestion(name, lastPerf);
  }
  closeModal();
}

function getLastPerformance(name) {
  for (const w of [...workouts].sort(
    (a, b) => new Date(b.date) - new Date(a.date),
  )) {
    const ex = w.exercises.find((e) => e.name === name);
    if (ex && ex.sets.length) return ex;
  }
  return null;
}

function showSuggestion(name, lastEx) {
  const maxWeight = Math.max(
    ...lastEx.sets.map((s) => parseFloat(s.weight) || 0),
  );
  const maxReps = Math.max(...lastEx.sets.map((s) => parseInt(s.reps) || 0));
  if (maxWeight <= 0) return;
  const unit = settings.unit;
  const bump = unit === "kg" ? 2.5 : 5;
  const suggested = maxWeight + bump;
  const area = document.getElementById("suggestionArea");
  area.innerHTML += `<div class="suggestion-chip">
    🤖 ${name}: Last ${maxWeight}${unit} × ${maxReps} → Try ${suggested}${unit}?
  </div>`;
}

function renderExerciseCards() {
  const container = document.getElementById("exerciseCards");
  container.innerHTML = currentWorkout.exercises
    .map(
      (ex, ei) => `
    <div class="exercise-card" id="exCard-${ei}">
      <div class="exercise-header">
        <div>
          <div class="exercise-name">${ex.name}</div>
          <div class="exercise-muscle">${ex.muscle}</div>
        </div>
        <button class="btn-del" onclick="removeExercise(${ei})">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3,6 5,6 21,6"/><path d="M19,6l-1,14a2,2,0,01-2,2H8a2,2,0,01-2-2L5,6"/><path d="M10,11v6M14,11v6"/></svg>
        </button>
      </div>
      <div class="sets-header">
        <span>SET</span><span>WEIGHT</span><span>REPS</span><span>VOL</span><span></span>
      </div>
      <div id="setsContainer-${ei}">
        ${ex.sets.map((set, si) => renderSetRow(ei, si, set)).join("")}
      </div>
      <button class="btn-add-set" onclick="addSet(${ei})">+ ADD SET</button>
    </div>
  `,
    )
    .join("");
}

function renderSetRow(ei, si, set) {
  const unit = settings.unit;
  const vol = (
    (parseFloat(set.weight) || 0) * (parseInt(set.reps) || 0)
  ).toFixed(0);
  return `<div class="set-row" id="setRow-${ei}-${si}">
    <div class="set-num">${si + 1}</div>
    <input class="set-input" type="number" placeholder="0" value="${set.weight || ""}" min="0" step="0.5"
      onchange="updateSet(${ei},${si},'weight',this.value)" style="background:var(--subtle)">
    <input class="set-input" type="number" placeholder="0" value="${set.reps || ""}" min="0"
      onchange="updateSet(${ei},${si},'reps',this.value);startTimer()" style="background:var(--subtle)">
    <div class="set-input" style="pointer-events:none;background:transparent;border-color:transparent;color:var(--muted)">
      ${vol > 0 ? vol : "-"}
    </div>
    <button class="btn-del-set" onclick="removeSet(${ei},${si})">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
  </div>`;
}

function updateSet(ei, si, field, val) {
  currentWorkout.exercises[ei].sets[si][field] = val;
  // Update volume display
  const set = currentWorkout.exercises[ei].sets[si];
  const vol = (
    (parseFloat(set.weight) || 0) * (parseInt(set.reps) || 0)
  ).toFixed(0);
  const row = document.getElementById(`setRow-${ei}-${si}`);
  if (row) {
    const volEl = row.querySelectorAll(".set-input")[2];
    if (volEl) volEl.textContent = vol > 0 ? vol : "-";
  }
}

function addSet(ei) {
  const ex = currentWorkout.exercises[ei];
  const last = ex.sets[ex.sets.length - 1] || {};
  ex.sets.push({ weight: last.weight || "", reps: last.reps || "" });
  const container = document.getElementById(`setsContainer-${ei}`);
  const si = ex.sets.length - 1;
  container.insertAdjacentHTML("beforeend", renderSetRow(ei, si, ex.sets[si]));
}

function removeSet(ei, si) {
  currentWorkout.exercises[ei].sets.splice(si, 1);
  renderExerciseCards();
}

function removeExercise(ei) {
  currentWorkout.exercises.splice(ei, 1);
  renderExerciseCards();
}

function saveWorkout() {
  const validExercises = currentWorkout.exercises.filter((ex) =>
    ex.sets.some((s) => parseFloat(s.weight) > 0 || parseInt(s.reps) > 0),
  );
  if (!validExercises.length) {
    showToast("Add at least one set to save!");
    return;
  }
  const duration = Math.round((Date.now() - currentWorkout.startTime) / 60000);
  const workout = {
    id: Date.now(),
    date: new Date().toISOString(),
    exercises: validExercises,
    note: document.getElementById("workoutNote").value,
    duration,
  };
  workouts.push(workout);
  save("forge_workouts", workouts);
  dismissTimer();
  showToast("Workout saved! 💪");
  setTimeout(() => navigate("home"), 800);
}

// ══════════════════════════════════════════════
//  HISTORY
// ══════════════════════════════════════════════
function renderHistory() {
  const sorted = [...workouts].sort(
    (a, b) => new Date(b.date) - new Date(a.date),
  );
  const container = document.getElementById("historyList");
  if (!sorted.length) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">📅</div><div class="empty-text">No workout history yet.<br>Start logging to see your progress here.</div></div>`;
    return;
  }
  container.innerHTML = sorted
    .map((w) => {
      const d = new Date(w.date);
      const exNames = w.exercises.map((e) => e.name).slice(0, 4);
      const moreCount = w.exercises.length - 4;
      const detail = w.exercises
        .map((ex) => {
          const sets = ex.sets
            .map(
              (s, i) =>
                `<div class="detail-set">Set ${i + 1}: <span>${s.weight || 0}${settings.unit}</span> × <span>${s.reps || 0}</span></div>`,
            )
            .join("");
          return `<div class="detail-exercise">
        <div class="detail-ex-name">${ex.name}</div>
        <div class="detail-sets">${sets}</div>
      </div>`;
        })
        .join("");
      return `<div class="history-item" onclick="this.classList.toggle('expanded')">
      <div class="history-header">
        <div class="history-date">${d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }).toUpperCase()}</div>
        <div class="history-duration">${w.duration || "?"} MIN</div>
      </div>
      <div class="history-exercises">
        ${exNames.map((n) => `<span class="ex-chip">${n}</span>`).join("")}
        ${moreCount > 0 ? `<span class="ex-chip">+${moreCount} more</span>` : ""}
      </div>
      ${w.note ? `<div class="history-note">💬 ${w.note}</div>` : ""}
      <div class="history-detail">${detail}</div>
    </div>`;
    })
    .join("");
}

// ══════════════════════════════════════════════
//  STATS
// ══════════════════════════════════════════════
function renderStats() {
  renderPRs();
  renderChartSelect();
  renderInsights();
}

function renderPRs() {
  const prs = {};
  const prDates = {};
  for (const w of workouts) {
    for (const ex of w.exercises) {
      for (const set of ex.sets) {
        const wt = parseFloat(set.weight) || 0;
        if (wt > (prs[ex.name] || 0)) {
          prs[ex.name] = wt;
          prDates[ex.name] = w.date;
        }
      }
    }
  }
  const container = document.getElementById("prList");
  const entries = Object.entries(prs).sort((a, b) => b[1] - a[1]);
  if (!entries.length) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">🏆</div><div class="empty-text">No PRs yet. Start lifting!</div></div>`;
    return;
  }
  container.innerHTML = entries
    .map(([name, weight]) => {
      const change = calcChange(name);
      const changeHTML =
        change !== null
          ? `<div class="pr-change ${change >= 0 ? "positive" : "negative"}">${change >= 0 ? "+" : ""}${change}${settings.unit} from first</div>`
          : "";
      return `<div class="pr-card">
      <div class="pr-name">${name}</div>
      <div class="pr-value">${weight}<span class="pr-unit">${settings.unit}</span></div>
      ${changeHTML}
    </div>`;
    })
    .join("");
}

function calcChange(name) {
  const weights = [];
  for (const w of [...workouts].sort(
    (a, b) => new Date(a.date) - new Date(b.date),
  )) {
    for (const ex of w.exercises) {
      if (ex.name === name) {
        const max = Math.max(...ex.sets.map((s) => parseFloat(s.weight) || 0));
        if (max > 0) weights.push(max);
      }
    }
  }
  if (weights.length < 2) return null;
  return +(weights[weights.length - 1] - weights[0]).toFixed(1);
}

let chartInstance = null;

function renderChartSelect() {
  const exSet = new Set();
  for (const w of workouts) for (const ex of w.exercises) exSet.add(ex.name);
  const sel = document.getElementById("chartExerciseSelect");
  sel.innerHTML = [...exSet]
    .map((n) => `<option value="${n}">${n}</option>`)
    .join("");
  renderChart();
}

function renderChart() {
  const name = document.getElementById("chartExerciseSelect").value;
  if (!name) return;
  const points = [];
  for (const w of [...workouts].sort(
    (a, b) => new Date(a.date) - new Date(b.date),
  )) {
    const ex = w.exercises.find((e) => e.name === name);
    if (ex) {
      const max = Math.max(...ex.sets.map((s) => parseFloat(s.weight) || 0));
      if (max > 0) points.push({ date: new Date(w.date), weight: max });
    }
  }
  const canvas = document.getElementById("progressChart");
  const ctx = canvas.getContext("2d");
  const W = canvas.offsetWidth || 300;
  const H = 160;
  canvas.width = W * window.devicePixelRatio;
  canvas.height = H * window.devicePixelRatio;
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  ctx.clearRect(0, 0, W, H);

  if (points.length < 2) {
    ctx.fillStyle = "#666674";
    ctx.font = "14px DM Sans";
    ctx.textAlign = "center";
    ctx.fillText("Not enough data — keep logging!", W / 2, H / 2);
    return;
  }

  const pad = { t: 20, r: 20, b: 30, l: 45 };
  const cW = W - pad.l - pad.r;
  const cH = H - pad.t - pad.b;
  const weights = points.map((p) => p.weight);
  const minW = Math.min(...weights) * 0.95;
  const maxW = Math.max(...weights) * 1.05;

  const px = (i) => pad.l + (i / (points.length - 1)) * cW;
  const py = (w) => pad.t + cH - ((w - minW) / (maxW - minW)) * cH;

  // Grid
  ctx.strokeStyle = "rgba(255,255,255,0.05)";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = pad.t + (i / 4) * cH;
    ctx.beginPath();
    ctx.moveTo(pad.l, y);
    ctx.lineTo(pad.l + cW, y);
    ctx.stroke();
    const val = maxW - (i / 4) * (maxW - minW);
    ctx.fillStyle = "#666674";
    ctx.font = "10px JetBrains Mono";
    ctx.textAlign = "right";
    ctx.fillText(val.toFixed(0), pad.l - 6, y + 4);
  }

  // Gradient fill
  const grad = ctx.createLinearGradient(0, pad.t, 0, pad.t + cH);
  grad.addColorStop(0, "rgba(0,245,160,0.3)");
  grad.addColorStop(1, "rgba(0,245,160,0)");
  ctx.beginPath();
  ctx.moveTo(px(0), py(points[0].weight));
  for (let i = 1; i < points.length; i++) {
    const xc = (px(i - 1) + px(i)) / 2;
    ctx.quadraticCurveTo(
      px(i - 1),
      py(points[i - 1].weight),
      xc,
      (py(points[i - 1].weight) + py(points[i].weight)) / 2,
    );
  }
  ctx.lineTo(px(points.length - 1), py(points[points.length - 1].weight));
  ctx.lineTo(px(points.length - 1), pad.t + cH);
  ctx.lineTo(px(0), pad.t + cH);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // Line
  ctx.beginPath();
  ctx.moveTo(px(0), py(points[0].weight));
  for (let i = 1; i < points.length; i++) {
    const xc = (px(i - 1) + px(i)) / 2;
    ctx.quadraticCurveTo(
      px(i - 1),
      py(points[i - 1].weight),
      xc,
      (py(points[i - 1].weight) + py(points[i].weight)) / 2,
    );
  }
  ctx.lineTo(px(points.length - 1), py(points[points.length - 1].weight));
  ctx.strokeStyle = "#00f5a0";
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Dots
  for (let i = 0; i < points.length; i++) {
    ctx.beginPath();
    ctx.arc(px(i), py(points[i].weight), 4, 0, Math.PI * 2);
    ctx.fillStyle = "#00f5a0";
    ctx.fill();
    ctx.strokeStyle = "#0a0a0b";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // X labels
  ctx.fillStyle = "#666674";
  ctx.font = "10px JetBrains Mono";
  ctx.textAlign = "center";
  const step = Math.max(1, Math.floor(points.length / 5));
  for (let i = 0; i < points.length; i += step) {
    const d = points[i].date;
    const lbl = `${d.getMonth() + 1}/${d.getDate()}`;
    ctx.fillText(lbl, px(i), H - 8);
  }
}

function renderInsights() {
  const insights = [];
  const allEx = {};
  for (const w of workouts) {
    for (const ex of w.exercises) {
      if (!allEx[ex.name]) allEx[ex.name] = [];
      const max = Math.max(...ex.sets.map((s) => parseFloat(s.weight) || 0));
      if (max > 0) allEx[ex.name].push({ date: new Date(w.date), weight: max });
    }
  }

  // Monthly improvement
  const monthAgo = new Date();
  monthAgo.setDate(monthAgo.getDate() - 30);
  for (const [name, pts] of Object.entries(allEx)) {
    if (pts.length < 2) continue;
    const old = pts.filter((p) => p.date < monthAgo);
    const recent = pts.filter((p) => p.date >= monthAgo);
    if (old.length && recent.length) {
      const oldMax = Math.max(...old.map((p) => p.weight));
      const newMax = Math.max(...recent.map((p) => p.weight));
      const diff = newMax - oldMax;
      if (Math.abs(diff) >= 2.5) {
        insights.push({
          icon: diff > 0 ? "📈" : "📉",
          text: `Your <strong>${name}</strong> ${diff > 0 ? "improved" : "dropped"} by <strong>${Math.abs(diff)}${settings.unit}</strong> this month`,
        });
      }
    }
  }

  // Streak
  const streak = calcStreak();
  if (streak >= 3)
    insights.push({
      icon: "🔥",
      text: `You're on a <strong>${streak}-day streak</strong>. Keep it up!`,
    });

  // Total volume
  const totalVol = workouts.reduce(
    (acc, w) =>
      acc +
      w.exercises.reduce(
        (a, ex) =>
          a +
          ex.sets.reduce(
            (s, set) =>
              s + (parseFloat(set.weight) || 0) * (parseInt(set.reps) || 0),
            0,
          ),
        0,
      ),
    0,
  );
  if (totalVol > 0)
    insights.push({
      icon: "⚡",
      text: `Total volume lifted: <strong>${(totalVol / 1000).toFixed(1)}T</strong>`,
    });

  const container = document.getElementById("insightsList");
  if (!insights.length) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">🧠</div><div class="empty-text">Log more workouts to unlock insights.</div></div>`;
    return;
  }
  container.innerHTML = insights
    .map(
      (ins) => `
    <div class="insight-card">
      <div class="insight-icon">${ins.icon}</div>
      <div class="insight-text">${ins.text}</div>
    </div>
  `,
    )
    .join("");
}

// ══════════════════════════════════════════════
//  TIMER
// ══════════════════════════════════════════════
function startTimer() {
  dismissTimer();
  timerSeconds = settings.restTimer || 90;
  document.getElementById("timerOverlay").classList.add("visible");
  updateTimerDisplay();
  timerInterval = setInterval(() => {
    timerSeconds--;
    updateTimerDisplay();
    if (timerSeconds <= 0) {
      dismissTimer();
      showToast("Rest over! Time to lift 💪");
    }
  }, 1000);
}

function updateTimerDisplay() {
  const m = Math.floor(Math.max(0, timerSeconds) / 60)
    .toString()
    .padStart(2, "0");
  const s = (Math.max(0, timerSeconds) % 60).toString().padStart(2, "0");
  document.getElementById("timerDisplay").textContent = `${m}:${s}`;
}

function resetTimer() {
  startTimer();
}

function dismissTimer() {
  clearInterval(timerInterval);
  document.getElementById("timerOverlay").classList.remove("visible");
}

// ══════════════════════════════════════════════
//  SETTINGS
// ══════════════════════════════════════════════
function loadSettings() {
  document
    .getElementById("unitKg")
    .classList.toggle("active", settings.unit === "kg");
  document
    .getElementById("unitLb")
    .classList.toggle("active", settings.unit === "lb");
  document.getElementById("goalWorkouts").value = settings.goalWorkouts || 4;
  document.getElementById("goalRestTimer").value = settings.restTimer || 90;
}

function setUnit(u) {
  settings.unit = u;
  saveSettings();
  loadSettings();
}

function saveSettings() {
  settings.goalWorkouts =
    parseInt(document.getElementById("goalWorkouts").value) || 4;
  settings.restTimer =
    parseInt(document.getElementById("goalRestTimer").value) || 90;
  save("forge_settings", settings);
}

function clearAllData() {
  if (!confirm("Delete ALL workout data? This cannot be undone.")) return;
  workouts = [];
  customExercises = [];
  localStorage.removeItem("forge_workouts");
  localStorage.removeItem("forge_custom_exercises");
  showToast("All data cleared");
  renderHome();
}

// ══════════════════════════════════════════════
//  TOAST
// ══════════════════════════════════════════════
let toastTimer;
function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2500);
}

// ══════════════════════════════════════════════
//  INIT
// ══════════════════════════════════════════════
renderHome();
