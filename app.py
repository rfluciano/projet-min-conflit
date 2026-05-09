from flask import Flask, jsonify, request, send_from_directory
import time
from solvers.nqueens import min_conflit_steps
from solvers.sudoku import min_conflict_sudoku, backtrack_sudoku

app = Flask(__name__, static_folder='static', static_url_path='')

# ---------- Pages ----------
@app.route('/')
def landing():
    return send_from_directory(app.static_folder, 'landing.html')

@app.route('/app')
def app_page():
    return send_from_directory(app.static_folder, 'app.html')

# ---------- API ----------
@app.route('/solve', methods=['POST'])
def solve():
    data = request.get_json()
    n = data.get('n', 20)
    max_steps = data.get('max_steps', 500)
    start = time.perf_counter()
    states = min_conflit_steps(n, max_steps)
    elapsed = time.perf_counter() - start
    return jsonify({
        'states': states,
        'solved': states[-1]['total_conflicts'] == 0,
        'steps': len(states) - 1,
        'time': elapsed
    })

@app.route('/solve-sudoku', methods=['POST'])
def solve_sudoku():
    data = request.get_json()
    grid = data.get('grid')
    method = data.get('method', 'backtrack')
    start = time.perf_counter()
    if method == 'minconf':
        states = min_conflict_sudoku(grid, timeout=30)
    else:
        states = backtrack_sudoku(grid)
    elapsed = time.perf_counter() - start
    solved = states[-1].get('solved', False) if states else False
    return jsonify({
        'states': states,
        'solved': solved,
        'steps': len(states) - 1,
        'time': elapsed
    })

@app.route('/benchmark', methods=['GET'])
def benchmark():
    tailles = [8, 16, 32, 64, 128, 256, 512, 1000]
    results = []
    debut = time.perf_counter()
    for n in tailles:
        if time.perf_counter() - debut > 15:
            break
        succes = 0
        temps_total = 0
        etapes_moy = 0
        essais = 10
        for _ in range(essais):
            t0 = time.perf_counter()
            states = min_conflit_steps(n, 200)
            t1 = time.perf_counter() - t0
            if states[-1]['total_conflicts'] == 0:
                succes += 1
                etapes_moy += len(states) - 1
            temps_total += t1
        results.append({
            'n': n,
            'success_rate': succes / essais * 100,
            'avg_time_ms': (temps_total / essais) * 1000,
            'avg_steps': etapes_moy / succes if succes else 0
        })
    return jsonify(results)

if __name__ == '__main__':
    print("Serveur sur http://127.0.0.1:5000")
    app.run(debug=True, port=5000)