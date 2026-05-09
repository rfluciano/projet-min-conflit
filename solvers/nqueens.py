import random

class NReines:
    def __init__(self, n):
        self.n = n

    def conflits(self, var, val, assign):
        cnt = 0
        for ligne, col in assign.items():
            if ligne == var:
                continue
            if col == val or abs(ligne - var) == abs(col - val):
                cnt += 1
        return cnt

    def total_conflits(self, assign):
        return sum(self.conflits(v, assign[v], assign) for v in assign)

def min_conflit_steps(n, max_steps=500):
    csp = NReines(n)
    assign = {v: random.randrange(n) for v in range(n)}
    states = []
    tc = csp.total_conflits(assign)
    angry = [v for v in assign if csp.conflits(v, assign[v], assign) > 0]
    states.append({
        'step': 0,
        'assign': assign.copy(),
        'total_conflicts': tc,
        'moved': None,
        'blunder': False,
        'angry': angry
    })
    for step in range(1, max_steps + 1):
        if tc == 0:
            break
        var = random.choice(angry)
        old_col = assign[var]
        best = float('inf')
        best_vals = []
        for col in range(n):
            c = csp.conflits(var, col, assign)
            if c < best:
                best = c
                best_vals = [col]
            elif c == best:
                best_vals.append(col)
        new_col = random.choice(best_vals)
        conflicts_before = csp.conflits(var, old_col, assign)
        assign[var] = new_col
        conflicts_after = csp.conflits(var, new_col, assign)
        new_tc = csp.total_conflits(assign)
        blunder = new_tc > tc
        angry = [v for v in assign if csp.conflits(v, assign[v], assign) > 0]
        states.append({
            'step': step,
            'assign': assign.copy(),
            'total_conflicts': new_tc,
            'moved': {
                'var': var,
                'from': old_col,
                'to': new_col,
                'conflicts_before': conflicts_before,
                'conflicts_after': conflicts_after
            },
            'blunder': blunder,
            'angry': angry
        })
        tc = new_tc
    return states