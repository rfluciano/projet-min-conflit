# Min‑Conflit – Interactive CSP Solver

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Démonstration interactive de l'heuristique **Min‑Conflit** pour la résolution de problèmes de satisfaction de contraintes (CSP).

## 🚀 Fonctionnalités

- **N‑Reines** : visualisation pas à pas avec mise en évidence des conflits.
- **Sudoku** : deux solveurs (Min‑Conflit & Backtracking MRV), difficultés réglables.
- **Benchmark** : mesure des performances en temps réel.
- **Revue interactive** : slider, play/pause, retour arrière.

## 🛠️ Technologies

- **Backend** : Python (Flask)
- **Frontend** : Vanilla JS, CSS Grid, mode sombre
- **Algorithmes** : Min‑Conflit, Backtracking MRV

## 📦 Installation

```bash
pip install flask 
python app.py


---

## Comment lancer maintenant

1. Placez tous les fichiers dans la structure indiquée.
2. Assurez-vous que `solvers/__init__.py` existe (même vide).
3. Installez Flask : `pip install flask`.
4. Lancez `python app.py`.
5. Ouvrez `http://127.0.0.1:5000` → la **landing page** s’affiche.
6. Cliquez sur **Lancer l’application** → vous arrivez sur `/app` avec l’interface interactive complète.
