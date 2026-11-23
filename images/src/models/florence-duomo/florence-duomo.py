# A cartoon Florence Cathedral for the country maps, built in the set's shared look (../toon.py):
# Brunelleschi's great octagonal dome in terracotta with its white ribs and lantern, the cathedral's
# green, white and pink marble, Giotto's slender bell tower beside it, and the city's red roofs
# round them. Turned a little towards the camera.
# Run: blender -b --factory-startup -P florence-duomo.py -- florence-duomo-1024.png 1024 florence-duomo.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#d8ccb4', shadow_mul=(0.84, 0.82, 0.86), lift=0.2),
    'marble': toon('marble', '#f6f3ea', shadow_mul=(0.8, 0.82, 0.92), lift=0.2),
    'green': toon('marbleGreen', '#3f7a5a'),
    'pink': toon('marblePink', '#e8a8a0'),
    'terracotta': toon('terracotta', '#c8603e', shadow_mul=(0.86, 0.76, 0.72), lift=0.1),
    'house': toon('house', '#ecd8b0'),
    'roof': toon('roof', '#c4573a'),
    'window': flat('window', '#3a3640'),
})

G = tile(M['paving'])
before = set(bpy.data.objects)
rng = random.Random(1621)

# ---------- the city round it ----------
for k in range(18):
    a = rng.uniform(0, 2 * math.pi)
    r = rng.uniform(0.75, 1.2)
    x, y = r * math.cos(a), r * math.sin(a)
    w = rng.uniform(0.14, 0.2)
    h = rng.uniform(0.08, 0.13)
    box(f'house{k}', M['house'], x, y, G - 0.005, w, 0.14, h, outline=0.008, bevel=0)
    pyramid(f'houseroof{k}', M['roof'], x, y, G + h - 0.006, w + 0.02, 0.06, outline=0.006)

# ---------- the cathedral: nave in coloured marble ----------
CX, CY = -0.2, 0.0
box('nave', M['marble'], CX, CY, G - 0.005, 0.6, 0.24, 0.2, outline=0.014, bevel=0)
for j in range(6):
    box(f'navepanel{j}', M['green'], CX - 0.25 + j * 0.1, CY - 0.123, G + 0.03, 0.06, 0.006, 0.12, outline=0, bevel=0)
    box(f'navepink{j}', M['pink'], CX - 0.25 + j * 0.1, CY - 0.125, G + 0.07, 0.03, 0.006, 0.04, outline=0, bevel=0)
loft('naveroof', M['roof'], [[(CX - 0.3, CY - 0.12, G + 0.195), (CX + 0.3, CY - 0.12, G + 0.195), (CX + 0.3, CY + 0.12, G + 0.195), (CX - 0.3, CY + 0.12, G + 0.195)],
                             [(CX - 0.3, CY - 0.005, G + 0.26), (CX + 0.3, CY - 0.005, G + 0.26), (CX + 0.3, CY + 0.005, G + 0.26), (CX - 0.3, CY + 0.005, G + 0.26)]],
     outline=0.01)
box('facade', M['marble'], CX - 0.32, CY, G - 0.005, 0.04, 0.28, 0.28, outline=0.01, bevel=0)
box('facaderose', M['pink'], CX - 0.342, CY, G + 0.18, 0.006, 0.06, 0.06, outline=0, bevel=0)

# ---------- Brunelleschi's dome: octagonal, terracotta, white ribs, the lantern ----------
DX, DY = CX + 0.38, CY
box('crossing', M['marble'], DX, DY, G - 0.005, 0.34, 0.34, 0.22, outline=0.014, bevel=0)
lathe('drum', M['marble'], ((0.2, 0), (0.2, 0.1)), G + 0.215, DX, DY, segs=8, outline=0.012, smooth=False)
for j in range(8):
    a = math.pi / 8 + j * math.pi / 4
    box(f'oculus{j}', M['window'], DX + 0.19 * math.cos(a), DY + 0.19 * math.sin(a), G + 0.25, 0.03, 0.006, 0.03, rot_z=a + math.pi / 2, outline=0, bevel=0)
PROFILE = ((0.21, 0), (0.2, 0.08), (0.17, 0.16), (0.12, 0.23), (0.06, 0.28), (0.04, 0.29))
lathe('dome', M['terracotta'], PROFILE, G + 0.31, DX, DY, segs=8, outline=0.014, smooth=False)
for j in range(8):
    a = j * math.pi / 4
    pts = [(DX + r * math.cos(a) * 1.01, DY + r * math.sin(a) * 1.01, G + 0.31 + h) for r, h in PROFILE]
    for k in range(len(pts) - 1):
        rod(f'rib{j}{k}', M['marble'], pts[k], pts[k + 1], 0.011, segs=6, outline=0.002)
lathe('lantern', M['marble'], ((0.045, 0), (0.04, 0.07), (0.02, 0.1), (0.004, 0.15)), G + 0.6, DX, DY, segs=8, outline=0.006)

# ---------- Giotto's bell tower ----------
BX, BY = CX - 0.15, CY - 0.32
box('campanile', M['marble'], BX, BY, G - 0.005, 0.12, 0.12, 0.62, outline=0.012, bevel=0)
for k in range(5):
    box(f'campaniletrim{k}', M['green'], BX, BY - 0.062, G + 0.05 + k * 0.12, 0.12, 0.006, 0.02, outline=0, bevel=0)
    box(f'campanilepink{k}', M['pink'], BX, BY - 0.062, G + 0.09 + k * 0.12, 0.05, 0.006, 0.04, outline=0, bevel=0)
box('campanilebelfry', M['window'], BX, BY - 0.063, G + 0.5, 0.05, 0.006, 0.08, outline=0, bevel=0)
box('campanilecap', M['marble'], BX, BY, G + 0.61, 0.14, 0.14, 0.03, outline=0.006, bevel=0)

turn(before, -20)
render(G)
