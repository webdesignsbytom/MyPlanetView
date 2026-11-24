# A cartoon Royal Palace of Caserta for the country maps, built in the set's shared look
# (../toon.py): the Bourbon kings' vast palace, its long front of rows of windows with the
# pedimented middle and corner pavilions, and the park's long straight canal of fountains and
# basins running out from it, with the white statue groups and the lawns either side. Turned a
# little towards the camera.
# Run: blender -b --factory-startup -P caserta.py -- caserta-1024.png 1024 caserta.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'lawn': toon('lawn', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'gravel': toon('gravel', '#e0d8c4', lift=0.15),
    'palace': toon('palace', '#e8c8a0', shadow_mul=(0.86, 0.82, 0.78), lift=0.1),
    'brick': toon('brick', '#c8885a', shadow_mul=(0.86, 0.8, 0.76)),
    'stone': toon('stone', '#f0ead8', lift=0.15),
    'window': flat('window', '#3a3a44'),
    'roof': toon('roof', '#6a6a70'),
    'water': toon('water', '#5aa8d0', lift=0.3),
    'spray': toon('spray', '#ffffff', shadow_mul=(0.86, 0.9, 0.97), lift=0.15),
    'tree': toon('tree', '#3f7a3a', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['lawn'])
before = set(bpy.data.objects)

# ---------- the palace ----------
PX, PY = 0.0, 0.55
W, D, H = 1.5, 0.36, 0.3
box('palace', M['palace'], PX, PY, G - 0.005, W, D, H, outline=0.012, bevel=0)
box('basement', M['brick'], PX, PY - D / 2 - 0.002, G - 0.005, W, 0.006, 0.08, outline=0, bevel=0)
for r in range(3):
    for j in range(17):
        x = PX - 0.68 + j * 0.085
        if abs(x) < 0.1:
            continue
        box(f'win{r}{j}', M['window'], x, PY - D / 2 - 0.004, G + 0.1 + r * 0.065, 0.03, 0.006, 0.04, outline=0, bevel=0)
box('centre', M['palace'], PX, PY - D / 2 - 0.02, G - 0.005, 0.26, 0.04, H + 0.04, outline=0.006, bevel=0)
for j in range(4):
    rod(f'centrecol{j}', M['stone'], (PX - 0.09 + j * 0.06, PY - D / 2 - 0.045, G + 0.08), (PX - 0.09 + j * 0.06, PY - D / 2 - 0.045, G + 0.3), 0.01, segs=8, outline=0.002)
box('entrance', M['window'], PX, PY - D / 2 - 0.042, G - 0.005, 0.07, 0.006, 0.1, outline=0, bevel=0)
loft('pediment', M['stone'], [[(PX - 0.13, PY - D / 2 - 0.04, G + H + 0.03), (PX + 0.13, PY - D / 2 - 0.04, G + H + 0.03), (PX + 0.13, PY - D / 2, G + H + 0.03), (PX - 0.13, PY - D / 2, G + H + 0.03)],
                              [(PX - 0.004, PY - D / 2 - 0.04, G + H + 0.1), (PX + 0.004, PY - D / 2 - 0.04, G + H + 0.1), (PX + 0.004, PY - D / 2, G + H + 0.1), (PX - 0.004, PY - D / 2, G + H + 0.1)]], outline=0.004)
for s in (-1, 1):
    box(f'pavilion{s}', M['palace'], PX + s * 0.7, PY - D / 2 - 0.015, G - 0.005, 0.14, 0.03, H + 0.03, outline=0.005, bevel=0)
box('roofline', M['roof'], PX, PY, G + H - 0.005, W, D, 0.03, outline=0.004, bevel=0)
lathe('cupola', M['roof'], ((0.08, 0), (0.06, 0.05), (0.004, 0.1)), G + H + 0.02, PX, PY, segs=12, outline=0.004)

# ---------- the canal of fountains ----------
box('avenue', M['gravel'], PX, -0.2, G - 0.004, 0.34, 1.0, 0.01, outline=0.003, bevel=0)
for k, (y, L) in enumerate(((0.12, 0.2), (-0.15, 0.22), (-0.45, 0.24), (-0.78, 0.2))):
    box(f'basinrim{k}', M['stone'], PX, y, G - 0.003, 0.22, L, 0.025, outline=0.003, bevel=0)
    box(f'basin{k}', M['water'], PX, y, G - 0.002, 0.18, L - 0.04, 0.03, outline=0.002, bevel=0)
    for s in (-1, 1):
        lathe(f'jet{k}{s}', M['spray'], ((0.012, 0), (0.004, 0.08)), G + 0.025, PX + s * 0.05, y, segs=6, outline=0.001)
    for s in (-1, 1):
        lathe(f'statue{k}{s}', M['stone'], ((0.025, 0), (0.018, 0.06), (0.01, 0.09)), G - 0.005, PX + s * 0.15, y, segs=8, outline=0.002)

# ---------- the park's trees ----------
for s in (-1, 1):
    for k in range(4):
        y = 0.1 - k * 0.28
        x = s * (0.45 + 0.08 * (k % 2))
        if math.hypot(x, y) > 1.15:
            continue
        ball(f'tree{s}{k}', M['tree'], x, y, G + 0.1, 0.1, outline=0.009)
        ball(f'treeout{s}{k}', M['tree'], s * 0.85, y - 0.1, G + 0.1, 0.09, outline=0.009)

turn(before, -20)
render(G)
