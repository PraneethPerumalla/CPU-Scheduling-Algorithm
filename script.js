document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const algorithmSelect = document.getElementById('algorithm-select');
    const timeQuantumContainer = document.getElementById('time-quantum-container');
    const timeQuantumInput = document.getElementById('time-quantum');
    const processIdInput = document.getElementById('process-id');
    const arrivalTimeInput = document.getElementById('arrival-time');
    const burstTimeInput = document.getElementById('burst-time');
    const priorityInput = document.getElementById('process-priority');
    const addProcessBtn = document.getElementById('add-process');
    const processList = document.getElementById('process-list');
    const startSimulationBtn = document.getElementById('start-simulation');
    const ganttChart = document.getElementById('gantt-chart');
    const timeMarks = document.getElementById('time-marks');
    const algorithmInfo = document.getElementById('algorithm-info');
    const avgWaitingTime = document.getElementById('avg-waiting-time');
    const avgTurnaroundTime = document.getElementById('avg-turnaround-time');
    const throughput = document.getElementById('throughput');
    const cpuUtilization = document.getElementById('cpu-utilization');

    // Process data
    let processes = [];
    let nextColorIndex = 0;

    // Algorithm information
    const algorithmDescriptions = {
        'fcfs': {
            name: 'First Come First Serve (FCFS)',
            description: 'First Come First Serve (FCFS) is the simplest CPU scheduling algorithm that schedules processes according to their arrival time.',
            characteristics: [
                'Non-preemptive algorithm',
                'Processes are executed in order of arrival',
                'Simple to implement but may result in long waiting times',
                'Convoy effect may occur (short process behind long process)'
            ]
        },
        'sjf': {
            name: 'Shortest Job First (SJF)',
            description: 'Shortest Job First (SJF) schedules processes according to their burst time, executing the shortest job first.',
            characteristics: [
                'Non-preemptive algorithm',
                'Processes with shortest burst time are executed first',
                'Optimal for minimizing average waiting time',
                'Requires knowledge of burst times in advance'
            ]
        },
        'srtf': {
            name: 'Shortest Remaining Time First (SRTF)',
            description: 'Shortest Remaining Time First (SRTF) is the preemptive version of SJF where the process with the shortest remaining burst time is executed.',
            characteristics: [
                'Preemptive algorithm',
                'Process with shortest remaining burst time is executed',
                'Better performance than SJF in terms of waiting time',
                'More complex implementation due to preemption'
            ]
        },
        'rr': {
            name: 'Round Robin (RR)',
            description: 'Round Robin (RR) scheduling algorithm assigns a fixed time unit per process and cycles through them.',
            characteristics: [
                'Preemptive algorithm',
                'Each process gets a small unit of CPU time (time quantum)',
                'Fair allocation of CPU time to all processes',
                'Performance depends heavily on time quantum size'
            ]
        },
        'priority': {
            name: 'Priority Scheduling (Non-Preemptive)',
            description: 'Priority Scheduling executes processes according to their priority (lower number usually means higher priority).',
            characteristics: [
                'Non-preemptive algorithm',
                'Processes are executed based on priority',
                'Can lead to starvation of low priority processes',
                'Aging can be used to prevent starvation'
            ]
        },
        'priority-premptive': {
            name: 'Priority Scheduling (Preemptive)',
            description: 'Preemptive Priority Scheduling will preempt the CPU if a higher priority process arrives.',
            characteristics: [
                'Preemptive algorithm',
                'Higher priority processes can interrupt lower priority ones',
                'Better response time for high priority processes',
                'Starvation can be a serious problem'
            ]
        }
    };

    // Event Listeners
    algorithmSelect.addEventListener('change', function() {
        updateAlgorithmInfo();
        if (this.value === 'rr') {
            timeQuantumContainer.style.display = 'block';
        } else {
            timeQuantumContainer.style.display = 'none';
        }

        if (this.value === 'priority' || this.value === 'priority-premptive') {
            priorityInput.style.display = 'block';
        } else {
            priorityInput.style.display = 'none';
        }
    });

    addProcessBtn.addEventListener('click', addProcess);
    startSimulationBtn.addEventListener('click', startSimulation);

    // Functions
    function updateAlgorithmInfo() {
        const algo = algorithmSelect.value;
        const info = algorithmDescriptions[algo];
        
        algorithmInfo.innerHTML = `
            <h2>${info.name}</h2>
            <p>${info.description}</p>
            <p><strong>Key Characteristics:</strong></p>
            <ul>
                ${info.characteristics.map(item => `<li>${item}</li>`).join('')}
            </ul>
        `;
    }

    function addProcess() {
        const id = processIdInput.value.trim() || `P${processes.length + 1}`;
        const arrivalTime = parseInt(arrivalTimeInput.value) || 0;
        const burstTime = parseInt(burstTimeInput.value) || 1;
        const priority = parseInt(priorityInput.value) || 1;
        const colorClass = `color-${nextColorIndex}`;

        // Validate inputs
        if (burstTime <= 0) {
            alert('Burst time must be greater than 0');
            return;
        }

        if (priority <= 0) {
            alert('Priority must be greater than 0');
            return;
        }

        const process = {
            id,
            arrivalTime,
            burstTime,
            remainingTime: burstTime,
            priority,
            colorClass,
            startTime: null,
            finishTime: null,
            waitingTime: 0,
            turnaroundTime: 0
        };

        processes.push(process);
        renderProcessList();

        // Reset inputs
        processIdInput.value = '';
        arrivalTimeInput.value = '0';
        burstTimeInput.value = '3';
        priorityInput.value = '1';

        // Update color index
        nextColorIndex = (nextColorIndex + 1) % 10;
    }

    function renderProcessList() {
        processList.innerHTML = '';
        processes.forEach((process, index) => {
            const processItem = document.createElement('div');
            processItem.className = 'process-item';
            processItem.innerHTML = `
                <span>${process.id}</span>
                <span>AT: ${process.arrivalTime}</span>
                <span>BT: ${process.burstTime}</span>
                ${algorithmSelect.value.includes('priority') ? `<span>Priority: ${process.priority}</span>` : ''}
                <span class="remove-process" data-index="${index}">×</span>
            `;
            processList.appendChild(processItem);
        });

        // Add event listeners to remove buttons
        document.querySelectorAll('.remove-process').forEach(btn => {
            btn.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                processes.splice(index, 1);
                renderProcessList();
            });
        });
    }

    function startSimulation() {
        if (processes.length === 0) {
            alert('Please add at least one process');
            return;
        }

        // Reset previous simulation
        ganttChart.innerHTML = '';
        timeMarks.innerHTML = '';
        avgWaitingTime.textContent = '0';
        avgTurnaroundTime.textContent = '0';
        throughput.textContent = '0';
        cpuUtilization.textContent = '0%';

        // Make a copy of processes for simulation
        const simulationProcesses = JSON.parse(JSON.stringify(processes));
        
        // Run selected algorithm
        const algorithm = algorithmSelect.value;
        let timeline = [];

        switch (algorithm) {
            case 'fcfs':
                timeline = fcfs(simulationProcesses);
                break;
            case 'sjf':
                timeline = sjf(simulationProcesses);
                break;
            case 'srtf':
                timeline = srtf(simulationProcesses);
                break;
            case 'rr':
                const quantum = parseInt(timeQuantumInput.value) || 2;
                timeline = roundRobin(simulationProcesses, quantum);
                break;
            case 'priority':
                timeline = priorityNonPreemptive(simulationProcesses);
                break;
            case 'priority-premptive':
                timeline = priorityPreemptive(simulationProcesses);
                break;
        }

        // Calculate statistics
        calculateStatistics(simulationProcesses, timeline);

        // Render Gantt chart
        renderGanttChart(timeline);
    }

    // Scheduling Algorithms
    function fcfs(processes) {
        // Sort by arrival time
        const sortedProcesses = [...processes].sort((a, b) => a.arrivalTime - b.arrivalTime);
        let timeline = [];
        let currentTime = 0;

        for (const process of sortedProcesses) {
            if (currentTime < process.arrivalTime) {
                currentTime = process.arrivalTime;
            }

            timeline.push({
                process: process.id,
                start: currentTime,
                end: currentTime + process.burstTime,
                color: process.colorClass
            });

            process.startTime = currentTime;
            process.finishTime = currentTime + process.burstTime;
            process.waitingTime = process.startTime - process.arrivalTime;
            process.turnaroundTime = process.finishTime - process.arrivalTime;

            currentTime += process.burstTime;
        }

        return timeline;
    }

    function sjf(processes) {
        const sortedByArrival = [...processes].sort((a, b) => a.arrivalTime - b.arrivalTime);
        let timeline = [];
        let currentTime = 0;
        let readyQueue = [];
        let completed = 0;
        let n = sortedByArrival.length;

        while (completed < n) {
            // Add arrived processes to ready queue
            for (const process of sortedByArrival) {
                if (process.arrivalTime <= currentTime && 
                    !readyQueue.includes(process) && 
                    process.remainingTime > 0) {
                    readyQueue.push(process);
                }
            }

            if (readyQueue.length === 0) {
                currentTime++;
                continue;
            }

            // Sort ready queue by burst time
            readyQueue.sort((a, b) => a.burstTime - b.burstTime);
            const process = readyQueue[0];

            // Execute the shortest job
            timeline.push({
                process: process.id,
                start: currentTime,
                end: currentTime + process.burstTime,
                color: process.colorClass
            });

            process.startTime = currentTime;
            process.finishTime = currentTime + process.burstTime;
            process.waitingTime = process.startTime - process.arrivalTime;
            process.turnaroundTime = process.finishTime - process.arrivalTime;
            process.remainingTime = 0;

            currentTime += process.burstTime;
            completed++;
            readyQueue = [];
        }

        return timeline;
    }

    function srtf(processes) {
        const sortedByArrival = [...processes].sort((a, b) => a.arrivalTime - b.arrivalTime);
        let timeline = [];
        let currentTime = 0;
        let completed = 0;
        let n = sortedByArrival.length;
        let currentProcess = null;
        let lastStartTime = 0;

        while (completed < n) {
            // Find process with shortest remaining time
            let shortest = null;
            let shortestIndex = -1;

            for (let i = 0; i < sortedByArrival.length; i++) {
                const process = sortedByArrival[i];
                if (process.arrivalTime <= currentTime && process.remainingTime > 0) {
                    if (shortest === null || process.remainingTime < shortest.remainingTime) {
                        shortest = process;
                        shortestIndex = i;
                    }
                }
            }

            if (shortest === null) {
                currentTime++;
                continue;
            }

            // If the process changed, add the previous execution to timeline
            if (currentProcess && currentProcess.id !== shortest.id) {
                timeline.push({
                    process: currentProcess.id,
                    start: lastStartTime,
                    end: currentTime,
                    color: currentProcess.colorClass
                });
                lastStartTime = currentTime;
            }

            // If this is the first time the process is running
            if (currentProcess === null || currentProcess.id !== shortest.id) {
                lastStartTime = currentTime;
            }

            currentProcess = shortest;
            currentProcess.remainingTime--;
            currentTime++;

            // If process completed
            if (currentProcess.remainingTime === 0) {
                timeline.push({
                    process: currentProcess.id,
                    start: lastStartTime,
                    end: currentTime,
                    color: currentProcess.colorClass
                });

                currentProcess.finishTime = currentTime;
                currentProcess.turnaroundTime = currentProcess.finishTime - currentProcess.arrivalTime;
                currentProcess.waitingTime = currentProcess.turnaroundTime - currentProcess.burstTime;
                completed++;
                currentProcess = null;
            }
        }

        return timeline;
    }

    function roundRobin(processes, quantum) {
        const sortedByArrival = [...processes].sort((a, b) => a.arrivalTime - b.arrivalTime);
        let timeline = [];
        let currentTime = 0;
        let readyQueue = [];
        let completed = 0;
        let n = sortedByArrival.length;
        let processIndex = 0;

        // Initialize remaining time
        for (const process of sortedByArrival) {
            process.remainingTime = process.burstTime;
        }

        while (completed < n) {
            // Add arrived processes to ready queue
            while (processIndex < n && sortedByArrival[processIndex].arrivalTime <= currentTime) {
                readyQueue.push(sortedByArrival[processIndex]);
                processIndex++;
            }

            if (readyQueue.length === 0) {
                currentTime++;
                continue;
            }

            const process = readyQueue.shift();
            const executionTime = Math.min(quantum, process.remainingTime);
            const startTime = currentTime;

            timeline.push({
                process: process.id,
                start: startTime,
                end: startTime + executionTime,
                color: process.colorClass
            });

            currentTime += executionTime;
            process.remainingTime -= executionTime;

            // Add newly arrived processes during this execution
            while (processIndex < n && sortedByArrival[processIndex].arrivalTime <= currentTime) {
                readyQueue.push(sortedByArrival[processIndex]);
                processIndex++;
            }

            // If process not finished, add back to queue
            if (process.remainingTime > 0) {
                readyQueue.push(process);
            } else {
                completed++;
                process.finishTime = currentTime;
                process.turnaroundTime = process.finishTime - process.arrivalTime;
                process.waitingTime = process.turnaroundTime - process.burstTime;
            }
        }

        return timeline;
    }

    function priorityNonPreemptive(processes) {
        const sortedByArrival = [...processes].sort((a, b) => a.arrivalTime - b.arrivalTime);
        let timeline = [];
        let currentTime = 0;
        let readyQueue = [];
        let completed = 0;
        let n = sortedByArrival.length;

        while (completed < n) {
            // Add arrived processes to ready queue
            for (const process of sortedByArrival) {
                if (process.arrivalTime <= currentTime && 
                    !readyQueue.includes(process) && 
                    process.remainingTime > 0) {
                    readyQueue.push(process);
                }
            }

            if (readyQueue.length === 0) {
                currentTime++;
                continue;
            }

            // Sort ready queue by priority (lower number = higher priority)
            readyQueue.sort((a, b) => a.priority - b.priority);
            const process = readyQueue[0];

            // Execute the highest priority process
            timeline.push({
                process: process.id,
                start: currentTime,
                end: currentTime + process.burstTime,
                color: process.colorClass
            });

            process.startTime = currentTime;
            process.finishTime = currentTime + process.burstTime;
            process.waitingTime = process.startTime - process.arrivalTime;
            process.turnaroundTime = process.finishTime - process.arrivalTime;
            process.remainingTime = 0;

            currentTime += process.burstTime;
            completed++;
            readyQueue = [];
        }

        return timeline;
    }

    function priorityPreemptive(processes) {
        const sortedByArrival = [...processes].sort((a, b) => a.arrivalTime - b.arrivalTime);
        let timeline = [];
        let currentTime = 0;
        let completed = 0;
        let n = sortedByArrival.length;
        let currentProcess = null;
        let lastStartTime = 0;

        // Initialize remaining time
        for (const process of sortedByArrival) {
            process.remainingTime = process.burstTime;
        }

        while (completed < n) {
            // Find process with highest priority (lowest number)
            let highestPriority = null;
            let highestPriorityIndex = -1;

            for (let i = 0; i < sortedByArrival.length; i++) {
                const process = sortedByArrival[i];
                if (process.arrivalTime <= currentTime && process.remainingTime > 0) {
                    if (highestPriority === null || process.priority < highestPriority.priority) {
                        highestPriority = process;
                        highestPriorityIndex = i;
                    }
                }
            }

            if (highestPriority === null) {
                currentTime++;
                continue;
            }

            // If the process changed, add the previous execution to timeline
            if (currentProcess && currentProcess.id !== highestPriority.id) {
                timeline.push({
                    process: currentProcess.id,
                    start: lastStartTime,
                    end: currentTime,
                    color: currentProcess.colorClass
                });
                lastStartTime = currentTime;
            }

            // If this is the first time the process is running
            if (currentProcess === null || currentProcess.id !== highestPriority.id) {
                lastStartTime = currentTime;
            }

            currentProcess = highestPriority;
            currentProcess.remainingTime--;
            currentTime++;

            // If process completed
            if (currentProcess.remainingTime === 0) {
                timeline.push({
                    process: currentProcess.id,
                    start: lastStartTime,
                    end: currentTime,
                    color: currentProcess.colorClass
                });

                currentProcess.finishTime = currentTime;
                currentProcess.turnaroundTime = currentProcess.finishTime - currentProcess.arrivalTime;
                currentProcess.waitingTime = currentProcess.turnaroundTime - currentProcess.burstTime;
                completed++;
                currentProcess = null;
            }
        }

        return timeline;
    }

    function calculateStatistics(processes, timeline) {
        // Calculate average waiting time
        const totalWaitingTime = processes.reduce((sum, process) => sum + process.waitingTime, 0);
        const avgWT = (totalWaitingTime / processes.length).toFixed(2);
        avgWaitingTime.textContent = avgWT;

        // Calculate average turnaround time
        const totalTurnaroundTime = processes.reduce((sum, process) => sum + process.turnaroundTime, 0);
        const avgTT = (totalTurnaroundTime / processes.length).toFixed(2);
        avgTurnaroundTime.textContent = avgTT;

        // Calculate throughput
        const totalTime = timeline.length > 0 ? timeline[timeline.length - 1].end : 0;
        const tp = (processes.length / (totalTime || 1)).toFixed(2);
        throughput.textContent = tp;

        // Calculate CPU utilization
        const busyTime = timeline.reduce((sum, item) => sum + (item.end - item.start), 0);
        const utilization = ((busyTime / totalTime) * 100).toFixed(1);
        cpuUtilization.textContent = `${utilization}%`;
    }

    function renderGanttChart(timeline) {
        if (timeline.length === 0) return;

        const totalTime = timeline[timeline.length - 1].end;
        const containerWidth = ganttChart.offsetWidth;

        // Create process blocks
        for (const item of timeline) {
            const duration = item.end - item.start;
            const width = (duration / totalTime) * 100;

            const block = document.createElement('div');
            block.className = `process-block ${item.color}`;
            block.style.width = `${width}%`;
            block.textContent = item.process;
            
            const timeLabel = document.createElement('span');
            timeLabel.textContent = item.start;
            block.appendChild(timeLabel);

            ganttChart.appendChild(block);
        }

        // Add final time mark
        const finalMark = document.createElement('div');
        finalMark.className = 'time-mark';
        finalMark.style.left = '100%';
        finalMark.textContent = totalTime;
        timeMarks.appendChild(finalMark);
    }

    // Initialize
    updateAlgorithmInfo();
});