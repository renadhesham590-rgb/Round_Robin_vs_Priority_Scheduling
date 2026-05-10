# Round_Robin_vs_Priority_Scheduling
C3: OS algorithm comparison/ scheduling project

📖 Overview
This project is a web-based application (HTML/CSS/JavaScript) and it compares 2 CPU scheduling algorithms: Round Robin and Priority Scheduling(Pre-emptive). Both algorithms use the same process table to analyze fairness, urgency, WT(waiting time), TAT(turnaround time), RT(response time), and starvation risk.

✨ Key Features
📊 Comprehensive Metrics: Accurately calculates Waiting Time (WT), Turnaround Time (TAT), Completion Time (CT), and Response Time (RT) for every process and then calculates average.
📈 Visual Gantt Charts: Clear Gantt charts to track process execution flow block-by-block.

🔄 Round Robin (RR)
Aspect	                                                     Explanation
Type                                                        Preemptive (time-based)
How it works	                                               CPU cycles through ready queue, giving each process a fixed time quantum
If process finishes early	                                  CPU moves to next process immediately
If quantum expires	                                         Process goes to back of queue, next process runs
New arrivals	                                               Added to ready queue as they arrive
Fairness	                                                   ✅ Excellent — every process gets equal CPU time
Starvation	                                                 ❌ No — every process eventually gets CPU
Best for	                                                   Time-sharing, interactive systems


⭐ Priority Scheduling (Preemptive)
Aspect	                                                     Explanation
Type	                                                       Preemptive (priority-based)
Rule	                                                       Lower number = Higher priority
How it works	                                               CPU always runs the highest priority ready process
Preemption                                                  If a higher-priority process arrives, it interrupts the running process
Tie-breaker	                                                Same priority → Earlier arrival → Input order
Urgency	                                                    ✅ Excellent — critical tasks get immediate CPU
Starvation	                                                 ⚠️ Yes — low-priority processes may wait indefinitely
Best for	                                                   Real-time systems, emergency handlers


🆚 Quick Comparison
Feature	                                         Round Robin	                                           Priority (Preemptive)
CPU allocation	                                  Time quantum	                                          Priority value
Preemption trigger	                              Time quantum expires	                                  Higher priority arrives
Uses quantum?	                                   ✅ Yes	                                                ❌ No
Fairness	                                         High	                                                  Low
Urgency handling	                                Poor	                                                   Excellent
Starvation risk	                                 None	                                                   High

How to Run?
Option 1: Direct Browser Open
Option 2: Using VS Code

Team Members:included in cover sheet

Source Code-rr&p.html(attached)

Test Scenarios-included in web
 A - Basic workload with 5 processes
 B - Urgency Case
 C - Fairness Case
 D - Starvation Case
 E - Validation Case

 Screenshots-scenarios and gantt charts- also included in web

1️⃣ TURNAROUND TIME (TAT)
    TAT = Completion Time (CT) - Arrival Time (AT)
2️⃣ WAITING TIME (WT)
    WT = Turnaround Time (TAT) - Burst Time (BT)
 OR
    WT = Completion Time (CT) - Arrival Time (AT) - Burst Time (BT)
3️⃣ RESPONSE TIME (RT)
    RT = First CPU Time (Start Time) - Arrival Time (AT)
