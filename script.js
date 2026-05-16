const colors = ["#245b9a","#0f766e","#7c3aed","#b45309","#be123c","#047857","#4338ca","#a21caf","#0369a1","#4d7c0f"];

const scenarios = {
  basic: {
    quantum: 3,
    rows: [
      ["P1",0,7,2],
      ["P2",1,4,1],
      ["P3",2,9,3],
      ["P4",3,5,2],
      ["P5",5,2,4]
    ]
  },
  urgency: {
    quantum: 3,
    rows: [
      ["P1",0,8,4],
      ["P2",1,3,1],
      ["P3",2,6,3],
      ["P4",3,4,2],
      ["P5",4,5,5]
    ]
  },
  fairness: {
    quantum: 2,
    rows: [
      ["P1",0,10,3],
      ["P2",0,10,2],
      ["P3",0,10,4],
      ["P4",0,10,1]
    ]
  },
  starvation: {
    quantum: 2,
    rows: [
      ["P1",0,9,5],
      ["P2",1,3,1],
      ["P3",2,4,1],
      ["P4",3,3,2],
      ["P5",4,4,2],
      ["P6",5,2,1]
    ]
  },
  invalid: {
    quantum: 0,
    rows: [
      ["P1",0,5,2],
      ["P1",-1,4,1],
      ["P3",2,0,3]
    ]
  }
};

const processBody = document.getElementById("processBody");
const errorBox = document.getElementById("errorBox");
const okBox = document.getElementById("okBox");

document.getElementById("generateBtn").addEventListener("click", () => generateRows());
document.getElementById("runBtn").addEventListener("click", runAll);
document.getElementById("sampleBtn").addEventListener("click", () => loadScenario("basic"));

document.querySelectorAll(".scenario").forEach(el => {
  el.addEventListener("click", () => loadScenario(el.dataset.scenario));
});

document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".panel").forEach(p => p.style.display = "none");
    tab.classList.add("active");
    document.getElementById(tab.dataset.target).style.display = "block";
  });
});

function showError(msg){
  errorBox.textContent = msg;
  errorBox.classList.add("show");
  okBox.classList.remove("show");
}

function showOk(msg){
  okBox.textContent = msg;
  okBox.classList.add("show");
  errorBox.classList.remove("show");
}

function clearMessages(){
  errorBox.classList.remove("show");
  okBox.classList.remove("show");
}

function generateRows(count){
  clearMessages();
  const n = count ?? parseInt(document.getElementById("processCount").value, 10);
  if(!Number.isInteger(n) || n <= 0){
    showError("Number of processes must be a positive integer.");
    return;
  }
  processBody.innerHTML = "";
  for(let i=1;i<=n;i++){
    addRow([`P${i}`, i-1, Math.max(2, i+2), i]);
  }
}

function addRow(values){
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td><input type="text" value="${escapeAttr(values[0])}" class="pid"></td>
    <td><input type="number" value="${values[1]}" class="arrival"></td>
    <td><input type="number" value="${values[2]}" class="burst"></td>
    <td><input type="number" value="${values[3]}" class="priority"></td>
  `;
  processBody.appendChild(tr);
}

function escapeAttr(v){
  return String(v).replace(/"/g, "&quot;");
}

function loadScenario(name){
  const data = scenarios[name];
  document.getElementById("processCount").value = data.rows.length;
  document.getElementById("quantum").value = data.quantum;
  processBody.innerHTML = "";
  data.rows.forEach(addRow);
  if(name === "invalid"){
    showError("Validation scenario loaded intentionally with invalid values. Click Run Simulation to see rejection.");
  } else {
    showOk(`Scenario ${name.toUpperCase()} loaded successfully.`);
  }
}

function collectAndValidate(){
  const quantum = Number(document.getElementById("quantum").value);
  if(!Number.isInteger(quantum) || quantum <= 0){
    throw new Error("Invalid quantum value. Time Quantum must be a positive integer.");
  }

  const rows = Array.from(processBody.querySelectorAll("tr"));
  if(rows.length === 0){
    throw new Error("Process table is empty. Generate or load processes first.");
  }

  const seen = new Set();
  const processes = rows.map((tr, idx) => {
    const pid = tr.querySelector(".pid").value.trim();
    const arrival = Number(tr.querySelector(".arrival").value);
    const burst = Number(tr.querySelector(".burst").value);
    const priority = Number(tr.querySelector(".priority").value);

    if(!pid) throw new Error(`Missing Process ID at row ${idx+1}.`);
    if(seen.has(pid)) throw new Error(`Duplicate Process ID found: ${pid}.`);
    seen.add(pid);

    if(!Number.isInteger(arrival) || arrival < 0) throw new Error(`Invalid arrival time for ${pid}. Arrival must be an integer >= 0.`);
    if(!Number.isInteger(burst) || burst <= 0) throw new Error(`Invalid burst time for ${pid}. Burst must be an integer > 0.`);
    if(!Number.isInteger(priority) || priority <= 0) throw new Error(`Invalid priority for ${pid}. Priority must be a positive integer.`);

    return { pid, arrival, burst, priority, index: idx };
  });

  return { quantum, processes };
}

function simulateRoundRobin(input, quantum){
  const processes = input.map(p => ({...p, remaining:p.burst, firstStart:null, completion:null}));
  const byArrival = [...processes].sort((a,b) => a.arrival - b.arrival || a.index - b.index);
  let time = 0, i = 0;
  const ready = [];
  const gantt = [];

  function pushArrivals(){
    while(i < byArrival.length && byArrival[i].arrival <= time){
      ready.push(byArrival[i]);
      i++;
    }
  }

  if(byArrival.length && time < byArrival[0].arrival){
    gantt.push({pid:"Idle", start:time, end:byArrival[0].arrival, idle:true});
    time = byArrival[0].arrival;
  }
  pushArrivals();

  while(ready.length || i < byArrival.length){
    if(ready.length === 0){
      const nextArrival = byArrival[i].arrival;
      if(time < nextArrival){
        gantt.push({pid:"Idle", start:time, end:nextArrival, idle:true});
        time = nextArrival;
      }
      pushArrivals();
      continue;
    }

    const p = ready.shift();
    if(p.firstStart === null) p.firstStart = time;

    const slice = Math.min(quantum, p.remaining);
    const start = time;
    time += slice;
    p.remaining -= slice;
    gantt.push({pid:p.pid, start, end:time, idle:false});

    pushArrivals();

    if(p.remaining > 0){
      ready.push(p);
    } else {
      p.completion = time;
    }
  }

  return buildResult(processes, gantt);
}

// PREEMPTIVE PRIORITY SCHEDULING
function simulatePriority(input){
  const processes = input.map(p => ({
    ...p,
    remaining: p.burst,
    firstStart: null,
    completion: null
  }));

  let time = 0;
  let completed = 0;
  const n = processes.length;
  const isCompleted = new Array(n).fill(false);
  const gantt = [];
  let lastPid = null;

  while (completed < n) {
    let bestIdx = -1;
    let bestPriority = Infinity;
    let bestArrival = Infinity;
    let bestIndex = Infinity;

    for (let i = 0; i < n; i++) {
      if (!isCompleted[i] && processes[i].arrival <= time) {
        const p = processes[i];
        if (p.priority < bestPriority ||
            (p.priority === bestPriority && p.arrival < bestArrival) ||
            (p.priority === bestPriority && p.arrival === bestArrival && p.index < bestIndex)) {
          bestPriority = p.priority;
          bestArrival = p.arrival;
          bestIndex = p.index;
          bestIdx = i;
        }
      }
    }

    if (bestIdx === -1) {
      let nextArrival = Infinity;
      for (let i = 0; i < n; i++) {
        if (!isCompleted[i] && processes[i].arrival < nextArrival) {
          nextArrival = processes[i].arrival;
        }
      }
      if (time < nextArrival) {
        gantt.push({ pid: "Idle", start: time, end: nextArrival, idle: true });
        time = nextArrival;
      }
      continue;
    }

    const current = processes[bestIdx];

    if (current.firstStart === null) {
      current.firstStart = time;
    }

    let preemptTime = Infinity;
    for (let i = 0; i < n; i++) {
      if (!isCompleted[i] && processes[i].arrival > time && processes[i].priority < current.priority) {
        if (processes[i].arrival < preemptTime) {
          preemptTime = processes[i].arrival;
        }
      }
    }

    const runUntil = Math.min(time + current.remaining, preemptTime);
    const execTime = runUntil - time;

    if (execTime > 0) {
      if (lastPid === current.pid && gantt.length > 0 && !gantt[gantt.length - 1].idle) {
        gantt[gantt.length - 1].end = runUntil;
      } else {
        gantt.push({ pid: current.pid, start: time, end: runUntil, idle: false });
      }

      time = runUntil;
      current.remaining -= execTime;

      if (current.remaining === 0) {
        current.completion = time;
        isCompleted[bestIdx] = true;
        completed++;
        lastPid = null;
      } else {
        lastPid = current.pid;
      }
    } else {
      time = preemptTime;
      lastPid = null;
    }
  }

  return buildResult(processes, gantt);
}

function buildResult(processes, gantt){
  const rows = processes
    .map(p => {
      const tat = p.completion - p.arrival;
      const wt = tat - p.burst;
      const rt = p.firstStart - p.arrival;
      return {
        pid:p.pid, arrival:p.arrival, burst:p.burst, priority:p.priority,
        completion:p.completion, wt, tat, rt, index:p.index
      };
    })
    .sort((a,b) => a.index - b.index);

  const avg = {
    wt: average(rows.map(r => r.wt)),
    tat: average(rows.map(r => r.tat)),
    rt: average(rows.map(r => r.rt))
  };
  return {rows, avg, gantt};
}

function average(arr){
  return arr.reduce((a,b)=>a+b,0) / arr.length;
}

function runAll(){
  try{
    clearMessages();
    const {quantum, processes} = collectAndValidate();
    const rr = simulateRoundRobin(processes, quantum);
    const pr = simulatePriority(processes);

    renderGantt("rrGantt", rr.gantt);
    renderGantt("priorityGantt", pr.gantt);
    renderMetrics("rrMetrics", rr.avg);
    renderMetrics("priorityMetrics", pr.avg);
    renderResultsTable("rrTable", rr.rows);
    renderResultsTable("priorityTable", pr.rows);
    renderComparison(rr, pr);
    showOk("Simulation completed successfully. Both algorithms used the same workload.");
  } catch(err){
    showError(err.message);
  }
}

function renderGantt(id, gantt){
  const el = document.getElementById(id);
  if(!gantt || gantt.length === 0){
    el.innerHTML = "<p class='hint'>No Gantt chart yet.</p>";
    return;
  }
  const total = Math.max(...gantt.map(g => g.end));
  const blocks = gantt.map((g, idx) => {
    const duration = g.end - g.start;
    const width = Math.max(54, duration * 40);
    const color = g.idle ? "#9aa6b2" : colors[Math.abs(hashCode(g.pid)) % colors.length];
    return `
      <div class="block ${g.idle ? "idle" : ""}" style="width:${width}px;background:${color}">
        <span>${g.pid}</span>
        <span class="time-start">${g.start}</span>
        <span class="time-end">${g.end}</span>
      </div>
    `;
  }).join("");

  el.innerHTML = `
    <div class="gantt-row">${blocks}</div>
    <div class="legend">
      <span class="pill">Each block shows execution interval</span>
      <span class="pill">Numbers under blocks are start/end time</span>
    </div>
  `;
}

function renderMetrics(id, avg){
  document.getElementById(id).innerHTML = `
    <div class="metric"><small>Average WT</small><strong>${format(avg.wt)}</strong></div>
    <div class="metric"><small>Average TAT</small><strong>${format(avg.tat)}</strong></div>
    <div class="metric"><small>Average RT</small><strong>${format(avg.rt)}</strong></div>
  `;
}

function renderResultsTable(id, rows){
  document.getElementById(id).innerHTML = `
    <table class="process-table">
      <thead>
        <tr>
          <th>PID</th>
          <th>AT</th>
          <th>BT</th>
          <th>Priority</th>
          <th>CT</th>
          <th>WT</th>
          <th>TAT</th>
          <th>RT</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map(r => `
          <tr>
            <td>${r.pid}</td>
            <td>${r.arrival}</td>
            <td>${r.burst}</td>
            <td>${r.priority}</td>
            <td>${r.completion}</td>
            <td>${r.wt}</td>
            <td>${r.tat}</td>
            <td>${r.rt}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function renderComparison(rr, pr){
  const betterWT = rr.avg.wt < pr.avg.wt ? "Round Robin" : pr.avg.wt < rr.avg.wt ? "Priority" : "Both are equal";
  const betterRT = rr.avg.rt < pr.avg.rt ? "Round Robin" : pr.avg.rt < rr.avg.rt ? "Priority" : "Both are equal";
  const betterTAT = rr.avg.tat < pr.avg.tat ? "Round Robin" : pr.avg.tat < rr.avg.tat ? "Priority" : "Both are equal";

  document.getElementById("comparisonTable").innerHTML = `
    <table class="process-table">
      <thead>
        <tr>
          <th>Metric</th>
          <th>Round Robin</th>
          <th>Priority (Preemptive)</th>
          <th>Better</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>Average WT</td><td>${format(rr.avg.wt)}</td><td>${format(pr.avg.wt)}</td><td>${betterWT}</td></tr>
        <tr><td>Average TAT</td><td>${format(rr.avg.tat)}</td><td>${format(pr.avg.tat)}</td><td>${betterTAT}</td></tr>
        <tr><td>Average RT</td><td>${format(rr.avg.rt)}</td><td>${format(pr.avg.rt)}</td><td>${betterRT}</td></tr>
      </tbody>
    </table>
  `;

  const rrFairness = fairnessIndex(rr.rows.map(r => r.wt));
  const prFairness = fairnessIndex(pr.rows.map(r => r.wt));
  const fairnessWinner = rrFairness >= prFairness ? "Round Robin" : "Priority";
  const urgentImproved = checkUrgencyImprovement(rr, pr);
  const starvationRisk = detectStarvation(pr.rows);

  document.getElementById("analysisText").innerHTML = `
    <p><b>Which algorithm gave better average waiting time?</b><br>${betterWT} gave the better average WT in this workload.</p>
    <p><b>Which algorithm gave better response time?</b><br>${betterRT} gave the better average RT in this workload.</p>
    <p><b>Did higher-priority processes gain significant advantage?</b><br>${urgentImproved ? "Yes. Priority Scheduling executed higher-priority processes earlier than Round Robin." : "Not strongly in this workload."}</p>
    <p><b>Did Round Robin appear more balanced?</b><br>${fairnessWinner === "Round Robin" ? "Yes. Round Robin had a more balanced waiting-time distribution." : "Priority was at least as balanced."}</p>
    <p><b>Was starvation observed or likely in Priority Scheduling?</b><br>${starvationRisk ? "Possible starvation risk appeared." : "No strong starvation sign appeared."}</p>
  `;

  document.getElementById("conclusionBox").innerHTML = `
    <p><b>Selected workload conclusion:</b> ${betterWT} performed better for average waiting time, while ${betterRT} performed better for average response time.</p>
    <p><b>Urgency:</b> Preemptive Priority Scheduling improves urgent-task treatment because a higher-priority process can preempt a running lower-priority process.</p>
    <p><b>Fairness:</b> Round Robin generally improves fairness because every ready process receives CPU time using the same quantum.</p>
    <p><b>Starvation risk:</b> Preemptive Priority Scheduling may cause starvation for low-priority processes when high-priority processes continue to arrive.</p>
  `;
}

function fairnessIndex(values){
  const sum = values.reduce((a,b)=>a+b,0);
  const sumSq = values.reduce((a,b)=>a+b*b,0);
  return (sum*sum) / (values.length * sumSq || 1);
}

function checkUrgencyImprovement(rr, pr){
  const minPriority = Math.min(...pr.rows.map(r => r.priority));
  const urgent = pr.rows.filter(r => r.priority === minPriority).map(r => r.pid);
  const rrAvgUrgentCT = average(rr.rows.filter(r => urgent.includes(r.pid)).map(r => r.completion));
  const prAvgUrgentCT = average(pr.rows.filter(r => urgent.includes(r.pid)).map(r => r.completion));
  return prAvgUrgentCT < rrAvgUrgentCT;
}

function detectStarvation(rows){
  const avgWt = average(rows.map(r => r.wt));
  return rows.some(r => r.priority > 2 && r.wt > avgWt * 1.5 && r.wt >= 8);
}

function format(num){
  return Number(num).toFixed(2).replace(/\.00$/, "");
}

function hashCode(str){
  let h = 0;
  for(let i=0;i<str.length;i++){
    h = ((h<<5)-h) + str.charCodeAt(i);
    h |= 0;
  }
  return h;
}

generateRows(5);
loadScenario("basic");
runAll();
