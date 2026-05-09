const API = '';
let mode = 'queens';
let states = [], currentStep = 0, playInterval = null, backendOnline = false;
let sudokuInitialGrid = [];
let sudokuFixedMask = [];

// -------------------- Backend check --------------------
async function checkBackend() {
    try {
        const r = await fetch(`${API}/`, { signal: AbortSignal.timeout(1500) });
        backendOnline = r.ok;
        document.getElementById('connectionStatus').innerHTML = backendOnline ? '🟢 Backend' : '🔴 Backend';
        document.getElementById('connectionStatus').className = 'status ' + (backendOnline ? 'online' : 'offline');
    } catch (e) {
        backendOnline = false;
        document.getElementById('connectionStatus').innerHTML = '🔴 Backend';
        document.getElementById('connectionStatus').className = 'status offline';
    }
}
checkBackend();
setInterval(checkBackend, 4000);

// -------------------- Notation N‑Reines --------------------
function notation(r, c, n) { return String.fromCharCode(97 + c) + (n - r); }

// ==================== N‑REINES ====================
function drawQueensBoard() {
    if (!states.length) return;
    const container = document.getElementById('boardContainer');
    container.innerHTML = '';
    const board = document.createElement('div');
    board.className = 'queens-board';
    const n = Object.keys(states[currentStep].assign).length;
    const boardArea = document.querySelector('.board-area');
    const maxW = boardArea.clientWidth - 20;
    const maxH = boardArea.clientHeight - 100;
    const cellSize = Math.min(maxW / n, maxH / n, 48);
    board.style.width = board.style.height = (cellSize * n) + 'px';
    board.style.gridTemplateColumns = `repeat(${n}, ${cellSize}px)`;
    board.style.gridTemplateRows = `repeat(${n}, ${cellSize}px)`;

    const assign = states[currentStep].assign;
    for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
            const cell = document.createElement('div');
            cell.className = 'cell ' + ((r + c) % 2 === 0 ? 'light' : 'dark');
            if (assign[r] === c) {
                const span = document.createElement('span');
                span.className = 'queen';
                span.textContent = '♛';
                span.style.fontSize = (cellSize * 0.8) + 'px';
                cell.appendChild(span);
                if (states[currentStep].angry.includes(r)) cell.classList.add('angry');
                else cell.classList.add('happy');
                if (states[currentStep].moved && states[currentStep].moved.var === r) cell.classList.add('moved');
            }
            board.appendChild(cell);
        }
    }
    container.appendChild(board);
    updateQueensInfo();
    updateQueenTable();
}

function updateQueensInfo() {
    const info = document.getElementById('infoPanel');
    if (!states.length) { info.innerHTML = ''; return; }
    const st = states[currentStep];
    let txt = `<strong>Étape ${st.step}</strong> — Conflits totaux : ${st.total_conflicts}`;
    if (st.moved) {
        const m = st.moved;
        const n = Object.keys(st.assign).length;
        txt += `<br>Reine ${m.var} déplacée de ${notation(m.var, m.from, n)} → ${notation(m.var, m.to, n)}`;
        txt += `<br>Conflits : ${m.conflicts_before} → ${m.conflicts_after}`;
        txt += st.blunder ? ' <span style="color:red;">❌ BLUNDER</span>' : ' ✅ Amélioration';
    } else if (st.total_conflicts === 0) txt += ' ✅ Solution trouvée !';
    info.innerHTML = txt;
}

function updateQueenTable() {
    const tbody = document.querySelector('#queenTable tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    if (!states.length) return;
    const n = Object.keys(states[currentStep].assign).length;
    const assign = states[currentStep].assign;
    const st = states[currentStep];
    for (let r = 0; r < n; r++) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${r}</td>`;
        tr.innerHTML += `<td>${notation(r, assign[r], n)}</td>`;
        if (st.moved && st.moved.var === r) {
            tr.innerHTML += `<td>${notation(r, st.moved.from, n)} → ${notation(r, st.moved.to, n)}</td>`;
        } else {
            tr.innerHTML += '<td>—</td>';
        }
        let statusText = 'En attente', statusClass = 'status-attente';
        if (states.length && currentStep === states.length - 1 && st.total_conflicts === 0) {
            statusText = 'Placé'; statusClass = 'status-place';
        } else if (st.moved && st.moved.var === r) {
            statusText = 'En cours'; statusClass = 'status-cours';
        } else if (currentStep > 0 && !st.angry.includes(r)) {
            statusText = 'Placé'; statusClass = 'status-place';
        }
        tr.innerHTML += `<td><span class="status-badge ${statusClass}">${statusText}</span></td>`;
        tr.innerHTML += `<td>${st.angry.includes(r) ? '😠 Furieux' : '😊 Satisfait'}</td>`;
        tbody.appendChild(tr);
    }
}

// ==================== SUDOKU ====================
const SUDOKU_PUZZLES = {
    easy: [
        [5,3,0,0,7,0,0,0,0],
        [6,0,0,1,9,5,0,0,0],
        [0,9,8,0,0,0,0,6,0],
        [8,0,0,0,6,0,0,0,3],
        [4,0,0,8,0,3,0,0,1],
        [7,0,0,0,2,0,0,0,6],
        [0,6,0,0,0,0,2,8,0],
        [0,0,0,4,1,9,0,0,5],
        [0,0,0,0,8,0,0,7,9]
    ],
    medium: [
        [0,0,0,2,6,0,7,0,1],
        [6,8,0,0,7,0,0,9,0],
        [1,9,0,0,0,4,5,0,0],
        [8,2,0,1,0,0,0,4,0],
        [0,0,4,6,0,2,9,0,0],
        [0,5,0,0,0,3,0,2,8],
        [0,0,9,3,0,0,0,7,4],
        [0,5,0,0,4,0,0,5,0],
        [7,0,3,0,1,8,0,0,0]
    ],
    hard: [
        [0,0,0,6,0,0,4,0,0],
        [7,0,0,0,0,3,6,0,0],
        [0,0,0,0,9,1,0,8,0],
        [0,0,0,0,0,0,0,0,0],
        [0,5,0,1,8,0,0,0,3],
        [0,0,0,3,0,6,0,4,5],
        [0,4,0,2,0,0,0,6,0],
        [9,0,3,0,0,0,0,0,0],
        [0,2,0,0,0,0,1,0,0]
    ],
    expert: [
        [0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,3,0,8,5],
        [0,0,1,0,2,0,0,0,0],
        [0,0,0,5,0,7,0,0,0],
        [0,0,4,0,0,0,1,0,0],
        [0,9,0,0,0,0,0,0,0],
        [5,0,0,0,0,0,0,7,3],
        [0,0,2,0,1,0,0,0,0],
        [0,0,0,0,4,0,0,0,9]
    ]
};

function drawInitialSudokuBoard() {
    const container = document.getElementById('boardContainer');
    container.innerHTML = '';
    const board = document.createElement('div');
    board.className = 'sudoku-board';
    board.style.width = board.style.height = '432px';
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            const cell = document.createElement('div');
            cell.className = 'sudoku-cell';
            cell.style.width = '48px'; cell.style.height = '48px';
            if (c % 3 === 2 && c !== 8) cell.classList.add('right-thick');
            if (r % 3 === 2 && r !== 8) cell.classList.add('bottom-thick');
            const val = sudokuInitialGrid[r][c];
            if (val) {
                cell.textContent = val;
                if (sudokuFixedMask[r][c]) cell.classList.add('fixed');
                else cell.classList.add('new');
            }
            board.appendChild(cell);
        }
    }
    container.appendChild(board);
}

function drawSudokuBoard() {
    if (!states.length) return;
    const container = document.getElementById('boardContainer');
    container.innerHTML = '';
    const board = document.createElement('div');
    board.className = 'sudoku-board';
    board.style.width = board.style.height = '432px';
    const grid = states[currentStep].grid;
    const angrySet = new Set(states[currentStep].angry.map(([r,c]) => `${r},${c}`));
    const moved = states[currentStep].moved;

    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            const cell = document.createElement('div');
            cell.className = 'sudoku-cell';
            cell.style.width = '48px'; cell.style.height = '48px';
            if (c % 3 === 2 && c !== 8) cell.classList.add('right-thick');
            if (r % 3 === 2 && r !== 8) cell.classList.add('bottom-thick');

            const val = grid[r][c];
            if (val) {
                cell.textContent = val;
                if (sudokuFixedMask[r][c]) cell.classList.add('fixed');
                else cell.classList.add('new');
            }
            if (angrySet.has(`${r},${c}`)) cell.classList.add('conflict');
            if (moved && moved.var[0] === r && moved.var[1] === c) {
                cell.style.boxShadow = 'inset 0 0 0 2px gold';
            }
            board.appendChild(cell);
        }
    }
    container.appendChild(board);
    updateSudokuInfo();
    updateSudokuTracking();
}

function updateSudokuInfo() {
    const info = document.getElementById('infoPanel');
    if (!states.length) { info.innerHTML = ''; return; }
    const st = states[currentStep];
    let txt = `<strong>Étape ${st.step}</strong> — Conflits totaux : ${st.total_conflicts}`;
    if (st.moved) {
        const [r,c] = st.moved.var;
        txt += `<br>Case (${r},${c}) : ${st.moved.from} → ${st.moved.to}`;
        txt += `<br>Conflits : ${st.moved.conflicts_before} → ${st.moved.conflicts_after}`;
    }
    if (st.solved) txt += ' ✅ Résolu !';
    info.innerHTML = txt;
}

function updateSudokuTracking() {
    const tbody = document.querySelector('#trackingTable tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    if (!states.length) return;
    const grid = states[currentStep].grid;
    const angrySet = new Set(states[currentStep].angry.map(([r,c]) => `${r},${c}`));
    const moved = states[currentStep].moved;

    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            if (sudokuFixedMask[r][c]) continue;
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>(${r},${c})</td>`;
            tr.innerHTML += `<td>${sudokuInitialGrid[r][c] || '-'}</td>`;
            tr.innerHTML += `<td>${grid[r][c] || '-'}</td>`;
            const angry = angrySet.has(`${r},${c}`);
            tr.innerHTML += `<td>${angry ? 'Oui' : '0'}</td>`;
            let statusText = 'En attente', statusClass = 'status-attente';
            if (states.length && currentStep === states.length - 1 && states[currentStep].solved) {
                statusText = 'Placé'; statusClass = 'status-place';
            } else if (moved && moved.var[0] === r && moved.var[1] === c) {
                statusText = 'En cours'; statusClass = 'status-cours';
            } else if (currentStep > 0 && !angry) {
                statusText = 'Placé'; statusClass = 'status-place';
            }
            tr.innerHTML += `<td><span class="status-badge ${statusClass}">${statusText}</span></td>`;
            tr.innerHTML += `<td>${angry ? '😠 Furieux' : '😊 Satisfait'}</td>`;
            tbody.appendChild(tr);
        }
    }
}

function showSudokuError(msg) {
    const isTimeout = msg.includes('Timeout');
    const cls = isTimeout ? 'error-message timeout-message' : 'error-message';
    document.getElementById('infoPanel').innerHTML = `<div class="${cls}">${msg}</div>`;
    try {
        document.querySelector('#trackingTable tbody').innerHTML = '';
    } catch(e) {}
}

function updateSudokuGridFromDifficulty() {
    const diff = document.getElementById('difficulty').value;
    if (diff === 'custom') return;
    const puzzle = SUDOKU_PUZZLES[diff];
    if (puzzle) {
        sudokuInitialGrid = puzzle.map(row => [...row]);
        document.getElementById('sudokuGridInput').value = puzzle.map(r => r.join(' ')).join('\n');
        sudokuFixedMask = puzzle.map(row => row.map(v => v !== 0));
    }
    drawInitialSudokuBoard();
}

function resetCustomGrid() {
    sudokuInitialGrid = Array(9).fill().map(() => Array(9).fill(0));
    sudokuFixedMask = Array(9).fill().map(() => Array(9).fill(false));
    document.getElementById('sudokuGridInput').value = sudokuInitialGrid.map(r => r.join(' ')).join('\n');
    drawInitialSudokuBoard();
}

// ==================== MODE TOGGLE ====================
document.getElementById('toggleModeBtn').addEventListener('click', () => {
    if (mode === 'queens') {
        mode = 'sudoku';
        document.getElementById('queensControls').style.display = 'none';
        document.getElementById('sudokuControls').style.display = 'flex';
        document.getElementById('toggleModeBtn').textContent = '♛ Mode N‑Reines';
        document.getElementById('boardContainer').innerHTML = '';
        document.getElementById('timeline').style.display = 'none';
        document.getElementById('infoPanel').innerHTML = '';
        document.getElementById('rightPanel').innerHTML = `<h3>📋 Suivi du jeu</h3>
            <div class="queen-table-container">
                <table id="trackingTable">
                    <thead><tr><th>Case</th><th>Init.</th><th>Actuel</th><th>Conflits</th><th>Statut</th><th>État</th></tr></thead>
                    <tbody></tbody>
                </table>
            </div>`;
        if (document.getElementById('difficulty').value === 'custom') {
            document.getElementById('customGridArea').style.display = 'block';
        }
        updateSudokuGridFromDifficulty();
        drawInitialSudokuBoard();
    } else {
        mode = 'queens';
        document.getElementById('queensControls').style.display = 'flex';
        document.getElementById('sudokuControls').style.display = 'none';
        document.getElementById('toggleModeBtn').textContent = '🧩 Mode Sudoku';
        document.getElementById('boardContainer').innerHTML = '';
        document.getElementById('timeline').style.display = 'none';
        document.getElementById('infoPanel').innerHTML = '';
        document.getElementById('rightPanel').innerHTML = `<h3>👑 Suivi des reines</h3>
            <div class="queen-table-container">
                <table id="queenTable">
                    <thead><tr><th>Q°</th><th>Position</th><th>Déplacement</th><th>Status</th><th>État</th></tr></thead>
                    <tbody></tbody>
                </table>
            </div>`;
    }
});

document.getElementById('difficulty').addEventListener('change', () => {
    if (document.getElementById('difficulty').value === 'custom') {
        document.getElementById('customGridArea').style.display = 'block';
        resetCustomGrid();
    } else {
        document.getElementById('customGridArea').style.display = 'none';
        updateSudokuGridFromDifficulty();
        drawInitialSudokuBoard();
    }
});

document.getElementById('loadSudokuBtn').addEventListener('click', () => {
    if (document.getElementById('difficulty').value === 'custom') {
        const raw = document.getElementById('sudokuGridInput').value;
        const rows = raw.trim().split('\n');
        if (rows.length !== 9) { alert("Il faut exactement 9 lignes."); return; }
        const grid = rows.map(line => line.trim().split(/\s+/).map(Number));
        if (grid.some(r => r.length !== 9)) { alert("Chaque ligne doit avoir 9 nombres."); return; }
        sudokuInitialGrid = grid;
        sudokuFixedMask = grid.map(row => row.map(v => v !== 0));
        drawInitialSudokuBoard();
    }
});

// ==================== RÉSOLUTION ====================
document.getElementById('solveBtn').addEventListener('click', async () => {
    if (!backendOnline) { alert('Backend hors ligne.'); return; }

    if (mode === 'queens') {
        const n = parseInt(document.getElementById('size').value);
        document.getElementById('loadingIndicator').style.display = 'flex';
        try {
            const res = await fetch(`${API}/solve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ n, max_steps: 500 })
            });
            if (!res.ok) throw new Error(`Erreur ${res.status}`);
            const data = await res.json();
            states = data.states;
            currentStep = 0;
            document.getElementById('timeline').style.display = 'flex';
            document.getElementById('stepSlider').max = states.length - 1;
            document.getElementById('stepSlider').value = 0;
            document.getElementById('stepLabel').textContent = `Étape 0/${states.length - 1}`;
            document.getElementById('statsContent').innerHTML =
                `Résolu : ${data.solved ? 'Oui' : 'Non'}<br>Étapes : ${data.steps}<br>Temps : ${(data.time * 1000).toFixed(1)} ms`;
            drawQueensBoard();
        } catch (err) {
            document.getElementById('infoPanel').innerHTML = `<span style="color:red;">❌ ${err.message}</span>`;
        } finally {
            document.getElementById('loadingIndicator').style.display = 'none';
        }

    } else if (mode === 'sudoku') {
        if (!sudokuInitialGrid.length) { alert('Chargez une grille.'); return; }
        const method = document.getElementById('sudokuMethod').value;
        document.getElementById('loadingIndicator').style.display = 'flex';
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 35000);
        try {
            const res = await fetch(`${API}/solve-sudoku`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ grid: sudokuInitialGrid, method, max_steps: 5000 }),
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (!res.ok) throw new Error(`Erreur ${res.status}`);
            const data = await res.json();
            if (data.solved) {
                states = data.states;
                currentStep = 0;
                document.getElementById('timeline').style.display = 'flex';
                document.getElementById('stepSlider').max = states.length - 1;
                document.getElementById('stepSlider').value = 0;
                document.getElementById('stepLabel').textContent = `Étape 0/${states.length - 1}`;
                document.getElementById('statsContent').innerHTML =
                    `Résolu : Oui<br>Méthode : ${method === 'minconf' ? 'Min‑Conflit' : 'Backtracking'}<br>Étapes : ${data.steps}<br>Temps : ${(data.time * 1000).toFixed(1)} ms`;
                drawSudokuBoard();
            } else {
                showSudokuError(`❌ L'heuristique Min‑Conflit n'a pas réussi à résoudre cette grille. Essayez avec le Solveur Pro.`);
                document.getElementById('timeline').style.display = 'none';
            }
        } catch (err) {
            clearTimeout(timeoutId);
            if (err.name === 'AbortError') {
                showSudokuError(`⏰ Timeout : l'algorithme Min‑Conflit n'a pas trouvé de solution en 35 secondes.`);
            } else {
                showSudokuError(`❌ Erreur : ${err.message}`);
            }
        } finally {
            document.getElementById('loadingIndicator').style.display = 'none';
        }
    }
});

// ==================== SLIDER / PLAY / END ====================
document.getElementById('stepSlider').addEventListener('input', e => {
    currentStep = parseInt(e.target.value);
    if (mode === 'queens') drawQueensBoard();
    else drawSudokuBoard();
});

document.getElementById('playBtn').addEventListener('click', () => {
    if (playInterval) {
        clearInterval(playInterval); playInterval = null;
        document.getElementById('playBtn').textContent = '▶';
    } else {
        playInterval = setInterval(() => {
            if (currentStep < states.length - 1) {
                currentStep++;
                if (mode === 'queens') drawQueensBoard();
                else drawSudokuBoard();
                document.getElementById('stepSlider').value = currentStep;
                document.getElementById('stepLabel').textContent = `Étape ${currentStep}/${states.length - 1}`;
            } else {
                clearInterval(playInterval); playInterval = null;
                document.getElementById('playBtn').textContent = '▶';
            }
        }, 400);
        document.getElementById('playBtn').textContent = '⏸';
    }
});

document.getElementById('endBtn').addEventListener('click', () => {
    if (playInterval) { clearInterval(playInterval); playInterval = null; document.getElementById('playBtn').textContent = '▶'; }
    currentStep = states.length - 1;
    if (mode === 'queens') drawQueensBoard();
    else drawSudokuBoard();
    document.getElementById('stepSlider').value = currentStep;
    document.getElementById('stepLabel').textContent = `Étape ${currentStep}/${states.length - 1}`;
});

// ==================== BENCHMARK ====================
document.getElementById('benchBtn').addEventListener('click', async () => {
    if (!backendOnline) { alert('Backend hors ligne.'); return; }
    document.getElementById('benchOverlay').style.display = 'flex';
    try {
        const res = await fetch(`${API}/benchmark`);
        if (!res.ok) throw new Error(`Erreur ${res.status}`);
        const data = await res.json();
        let html = '<tr><th>N</th><th>Succès %</th><th>Temps ms</th><th>Étapes</th></tr>';
        data.forEach(d => html += `<tr><td>${d.n}</td><td>${d.success_rate.toFixed(1)}</td><td>${d.avg_time_ms.toFixed(2)}</td><td>${d.avg_steps.toFixed(1)}</td></tr>`);
        document.getElementById('benchTable').innerHTML = html;
        const canvas = document.getElementById('benchGraph');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            if (data.length) {
                const maxT = Math.max(...data.map(d => d.avg_time_ms));
                ctx.beginPath();
                ctx.strokeStyle = '#f38ba8';
                ctx.lineWidth = 2;
                data.forEach((d, i) => {
                    const x = (i / (data.length - 1)) * canvas.width;
                    const y = canvas.height - (d.avg_time_ms / maxT) * canvas.height;
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                });
                ctx.stroke();
                ctx.fillStyle = '#cdd6f4';
                ctx.font = '10px sans-serif';
                data.forEach((d, i) => ctx.fillText(d.n, (i / (data.length - 1)) * canvas.width - 10, canvas.height - 5));
            }
        }
    } catch (err) {
        document.getElementById('benchTable').innerHTML = `<p style="color:red;">Erreur : ${err.message}</p>`;
    }
});

document.getElementById('closeBenchBtn').addEventListener('click', () => {
    document.getElementById('benchOverlay').style.display = 'none';
});