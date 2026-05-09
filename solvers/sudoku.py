import random
import copy
import time

class Sudoku:
    def __init__(self, grid):
        self.grid = [row[:] for row in grid]
        self.fixed = [[val != 0 for val in row] for row in grid]
        self.row_counts = [[0]*10 for _ in range(9)]
        self.col_counts = [[0]*10 for _ in range(9)]
        self.box_counts = [[[0]*10 for _ in range(3)] for _ in range(3)]
        self._init_counts()

    def _init_counts(self):
        for r in range(9):
            for c in range(9):
                val = self.grid[r][c]
                if val:
                    self.row_counts[r][val] += 1
                    self.col_counts[c][val] += 1
                    self.box_counts[r//3][c//3][val] += 1

    def conflicts(self, r, c, val):
        if val == 0:
            return 0
        if self.grid[r][c] == val:
            return (self.row_counts[r][val] - 1) + \
                   (self.col_counts[c][val] - 1) + \
                   (self.box_counts[r//3][c//3][val] - 1)
        else:
            return self.row_counts[r][val] + \
                   self.col_counts[c][val] + \
                   self.box_counts[r//3][c//3][val]

    def total_conflicts(self):
        total = 0
        for r in range(9):
            for c in range(9):
                val = self.grid[r][c]
                if val:
                    total += self.conflicts(r, c, val)
        return total // 2

    def assign(self, r, c, val):
        old = self.grid[r][c]
        if old == val:
            return
        if old:
            self.row_counts[r][old] -= 1
            self.col_counts[c][old] -= 1
            self.box_counts[r//3][c//3][old] -= 1
        self.grid[r][c] = val
        if val:
            self.row_counts[r][val] += 1
            self.col_counts[c][val] += 1
            self.box_counts[r//3][c//3][val] += 1

    def is_solution(self):
        return self.total_conflicts() == 0 and all(0 not in row for row in self.grid)

    def worst_variable(self):
        max_conf = -1
        worst = None
        for r in range(9):
            for c in range(9):
                if not self.fixed[r][c]:
                    conf = self.conflicts(r, c, self.grid[r][c])
                    if conf > max_conf:
                        max_conf = conf
                        worst = (r, c)
        return worst


def min_conflict_sudoku(initial_grid, max_steps_per_try=500, max_restarts=10, timeout=30):
    puzzle = copy.deepcopy(initial_grid)
    deadline = time.time() + timeout
    states_all = []

    for restart in range(max_restarts):
        if time.time() > deadline:
            break

        s = Sudoku(puzzle)
        empty = [(r, c) for r in range(9) for c in range(9) if not s.fixed[r][c]]
        for (r, c) in empty:
            val = random.randint(1, 9)
            s.assign(r, c, val)

        states = [{
            'step': 0,
            'grid': [row[:] for row in s.grid],
            'total_conflicts': s.total_conflicts(),
            'moved': None,
            'angry': [(r, c) for (r, c) in empty if s.conflicts(r, c, s.grid[r][c]) > 0]
        }]

        for step in range(1, max_steps_per_try + 1):
            if time.time() > deadline:
                states[-1]['solved'] = False
                return states_all + states

            if s.is_solution():
                states[-1]['solved'] = True
                return states_all + states

            var = s.worst_variable()
            if not var:
                if s.is_solution():
                    states[-1]['solved'] = True
                    return states_all + states
                continue

            r, c = var
            old_val = s.grid[r][c]
            s.assign(r, c, 0)
            min_confl = float('inf')
            candidates = []
            for v in range(1, 10):
                con = s.conflicts(r, c, v)
                if con < min_confl:
                    min_confl = con
                    candidates = [v]
                elif con == min_confl:
                    candidates.append(v)
            new_val = random.choice(candidates)
            s.assign(r, c, new_val)

            conflicts_before = s.conflicts(r, c, old_val) if old_val else 0
            conflicts_after = s.conflicts(r, c, new_val)
            total = s.total_conflicts()
            angry = [(r, c) for (r, c) in empty if s.conflicts(r, c, s.grid[r][c]) > 0]

            states.append({
                'step': step,
                'grid': [row[:] for row in s.grid],
                'total_conflicts': total,
                'moved': {
                    'var': (r, c),
                    'from': old_val,
                    'to': new_val,
                    'conflicts_before': conflicts_before,
                    'conflicts_after': conflicts_after
                },
                'angry': angry,
                'solved': False
            })

        states_all.extend(states)

    return states_all


def backtrack_sudoku(initial_grid):
    def is_valid(grid, r, c, val):
        for j in range(9):
            if grid[r][j] == val:
                return False
        for i in range(9):
            if grid[i][c] == val:
                return False
        br, bc = (r // 3) * 3, (c // 3) * 3
        for i in range(br, br + 3):
            for j in range(bc, bc + 3):
                if grid[i][j] == val:
                    return False
        return True

    def find_empty_mrv(grid, fixed):
        best = None
        best_count = 10
        for r in range(9):
            for c in range(9):
                if not fixed[r][c] and grid[r][c] == 0:
                    cnt = 0
                    for v in range(1, 10):
                        if is_valid(grid, r, c, v):
                            cnt += 1
                    if cnt < best_count:
                        best_count = cnt
                        best = (r, c)
        return best

    grid = [row[:] for row in initial_grid]
    fixed = [[val != 0 for val in row] for row in initial_grid]
    states = []
    steps = [0]

    def backtrack():
        if steps[0] % 1 == 0:
            states.append({
                'step': steps[0],
                'grid': [row[:] for row in grid],
                'total_conflicts': 0,
                'moved': None,
                'angry': [],
                'solved': False
            })
        cell = find_empty_mrv(grid, fixed)
        if not cell:
            if states:
                states[-1]['solved'] = True
            return True
        r, c = cell
        for val in range(1, 10):
            if is_valid(grid, r, c, val):
                grid[r][c] = val
                steps[0] += 1
                if states:
                    states[-1]['moved'] = {
                        'var': (r, c),
                        'from': 0,
                        'to': val,
                        'conflicts_before': 0,
                        'conflicts_after': 0
                    }
                if backtrack():
                    return True
                grid[r][c] = 0
                steps[0] += 1
                states.append({
                    'step': steps[0],
                    'grid': [row[:] for row in grid],
                    'total_conflicts': 0,
                    'moved': {'var': (r, c), 'from': val, 'to': 0},
                    'angry': [],
                    'solved': False
                })
        return False

    states.append({
        'step': 0,
        'grid': [row[:] for row in grid],
        'total_conflicts': 0,
        'moved': None,
        'angry': [],
        'solved': False
    })
    backtrack()
    if states and not states[-1].get('solved'):
        states[-1]['solved'] = True
    return states