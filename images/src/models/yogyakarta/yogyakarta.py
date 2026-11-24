# A cartoon Yogyakarta for the country maps, built in the set's shared look (../toon.py): the city's
# cosmological axis running from Mount Merapi to the sea, the white Tugu monument with its golden
# top on the axis road, and the Kraton, the sultan's palace, behind its white wall and gate: the
# great open pendopo pavilion on its platform with its slender columns and tall two-tiered joglo
# roof in green and gold, the banyan trees in the square, and smoking Merapi on the horizon.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P yogyakarta.py -- yogyakarta-1024.png 1024 yogyakarta.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'road': toon('road', '#d6cfc0', lift=0.18),
    'white': toon('white', '#f6f4ee', shadow_mul=(0.8, 0.82, 0.9), lift=0.22),
    'gold': toon('gold', '#e0b040', lift=0.3),
    'green': toon('green', '#3a7a5a', lift=0.12),
    'roof': toon('roof', '#4a4a4e'),
    'wood': toon('wood', '#8a5a3e'),
    'volcano': toon('volcano', '#7a7a6e', shadow_mul=(0.78, 0.78, 0.82)),
    'smoke': toon('smoke', '#e8e8e6', lift=0.35),
    'dark': flat('dark', '#2e2a2a'),
    'banyan': toon('banyan', '#3f7a3a', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['grass'])
before = set(bpy.data.objects)

# ---------- Merapi on the horizon ----------
mv = lathe('merapi', M['volcano'], ((0.36, 0), (0.22, 0.24), (0.08, 0.42), (0.05, 0.44), (0.0, 0.44)), G - 0.01, 0.55, 0.85, segs=28, outline=0.006)
mv.visible_shadow = False
for k, (dx, dz, r) in enumerate(((0.0, 0.5, 0.05), (0.04, 0.56, 0.04), (0.09, 0.6, 0.035))):
    ball(f'smoke{k}', M['smoke'], 0.55 + dx, 0.85, G + dz, r, outline=0.003)

# ---------- the axis road ----------
box('axis', M['road'], -0.2, -0.2, G - 0.004, 0.16, 1.5, 0.01, outline=0.001, bevel=0)

# ---------- the Tugu ----------
TX, TY = -0.2, -0.62
box('tugubase', M['white'], TX, TY, G - 0.005, 0.12, 0.12, 0.05, outline=0.003, bevel=0)
box('tugubase2', M['white'], TX, TY, G + 0.04, 0.09, 0.09, 0.05, outline=0.003, bevel=0)
lathe('tugu', M['white'], ((0.035, 0), (0.03, 0.18), (0.034, 0.2), (0.026, 0.22)), G + 0.085, TX, TY, segs=12, outline=0.003)
lathe('tuguband', M['gold'], ((0.037, 0), (0.037, 0.015)), G + 0.17, TX, TY, segs=12, outline=0.001)
lathe('tugutop', M['gold'], ((0.026, 0), (0.03, 0.03), (0.015, 0.07), (0.003, 0.12)), G + 0.3, TX, TY, segs=12, outline=0.002)

# ---------- the Kraton: wall, gate and the pendopo ----------
KY = 0.2
for s in (-1, 1):
    box(f'kratonwall{s}', M['white'], -0.2 + s * 0.42, KY - 0.22, G - 0.005, 0.68, 0.04, 0.1, outline=0.004, bevel=0)
box('gate', M['white'], -0.2, KY - 0.22, G - 0.005, 0.16, 0.06, 0.17, outline=0.004, bevel=0)
box('gatedoor', M['dark'], -0.2, KY - 0.253, G - 0.005, 0.06, 0.006, 0.1, outline=0, bevel=0)
box('gatetop', M['green'], -0.2, KY - 0.22, G + 0.16, 0.18, 0.08, 0.02, outline=0.002, bevel=0)
pyramid('gateroof', M['roof'], -0.2, KY - 0.22, G + 0.175, 0.16, 0.06)
PX = -0.2
box('platform', M['white'], PX, KY + 0.1, G - 0.005, 0.56, 0.38, 0.05, outline=0.005, bevel=0)
PZ = G + 0.045
for i in range(4):
    for j in range(4):
        x = PX - 0.21 + i * 0.14
        y = KY + 0.1 - 0.15 + j * 0.1
        rod(f'column{i}{j}', M['green'], (x, y, PZ), (x, y, PZ + 0.12), 0.008, segs=8, outline=0.001)
        box(f'columncap{i}{j}', M['gold'], x, y, PZ + 0.11, 0.022, 0.022, 0.012, outline=0, bevel=0)
RZ = PZ + 0.12
loft('joglolower', M['roof'], [[(PX - 0.3, KY - 0.11, RZ), (PX + 0.3, KY - 0.11, RZ), (PX + 0.3, KY + 0.31, RZ), (PX - 0.3, KY + 0.31, RZ)],
                               [(PX - 0.17, KY + 0.0, RZ + 0.07), (PX + 0.17, KY + 0.0, RZ + 0.07), (PX + 0.17, KY + 0.2, RZ + 0.07), (PX - 0.17, KY + 0.2, RZ + 0.07)]], outline=0.005)
box('jogloband', M['gold'], PX, KY + 0.1, RZ + 0.065, 0.34, 0.2, 0.015, outline=0.001, bevel=0)
loft('joglotop', M['roof'], [[(PX - 0.16, KY + 0.01, RZ + 0.075), (PX + 0.16, KY + 0.01, RZ + 0.075), (PX + 0.16, KY + 0.19, RZ + 0.075), (PX - 0.16, KY + 0.19, RZ + 0.075)],
                             [(PX - 0.06, KY + 0.096, RZ + 0.22), (PX + 0.06, KY + 0.096, RZ + 0.22), (PX + 0.06, KY + 0.104, RZ + 0.22), (PX - 0.06, KY + 0.104, RZ + 0.22)]], outline=0.005)
for s in (-1, 1):
    lathe(f'ridgefinial{s}', M['gold'], ((0.01, 0), (0.003, 0.04)), RZ + 0.215, PX + s * 0.06, KY + 0.1, segs=6, outline=0.001, smooth=False)

# ---------- the banyans in the square ----------
for k, (x, y) in enumerate(((-0.55, -0.35), (0.15, -0.35), (0.55, -0.1), (-0.85, 0.2), (0.6, 0.35))):
    rod(f'banyantrunk{k}', M['wood'], (x, y, G), (x, y, G + 0.1), 0.02, segs=8, outline=0.002)
    b = ball(f'banyan{k}', M['banyan'], 0, 0, 0, 0.12, outline=0.01)
    b.scale = (1.3, 1.3, 0.75)
    b.location = (x, y, G + 0.17)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
