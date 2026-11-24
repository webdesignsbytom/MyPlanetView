# A cartoon Palace of Fontainebleau for the country maps, built in the set's shared look
# (../toon.py): the White Horse Courtyard, the palace's long front of brick and stone under steep
# slate roofs with their dormers and tall chimneys, and the famous horseshoe staircase sweeping up
# in two curved flights to the central pavilion where Napoleon said farewell. Turned a little
# towards the camera.
# Run: blender -b --factory-startup -P fontainebleau.py -- fontainebleau-1024.png 1024 fontainebleau.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'court': toon('court', '#d8d0c0', shadow_mul=(0.84, 0.82, 0.88), lift=0.2),
    'lawn': toon('lawn', '#7cb85a'),
    'stone': toon('stone', '#ece4d0', shadow_mul=(0.84, 0.82, 0.86), lift=0.12),
    'brick': toon('brick', '#c87a5a', shadow_mul=(0.86, 0.78, 0.76)),
    'slate': toon('slate', '#4a5058', shadow_mul=(0.84, 0.84, 0.9)),
    'window': flat('window', '#3a4050'),
    'gold': toon('gold', '#f0c030', lift=0.3),
})

G = tile(M['court'])
before = set(bpy.data.objects)

for s in (-1, 1):
    box(f'lawn{s}', M['lawn'], s * 0.5, -0.45, G - 0.003, 0.5, 0.45, 0.008, outline=0.002, bevel=0)

# ---------- the palace front ----------
PX, PY = 0.0, 0.4
box('palace', M['brick'], PX, PY, G - 0.005, 1.5, 0.24, 0.24, outline=0.011, bevel=0)
for j in range(15):
    x = PX - 0.7 + j * 0.1
    box(f'pilaster{j}', M['stone'], x, PY - 0.122, G - 0.005, 0.025, 0.006, 0.24, outline=0, bevel=0)
    if abs(x) > 0.12:
        for r in range(2):
            box(f'win{r}{j}', M['window'], x + 0.05, PY - 0.123, G + 0.04 + r * 0.1, 0.035, 0.006, 0.07, outline=0, bevel=0)
loft('roof', M['slate'], [[(PX - 0.76, PY - 0.13, G + 0.235), (PX + 0.76, PY - 0.13, G + 0.235), (PX + 0.76, PY + 0.13, G + 0.235), (PX - 0.76, PY + 0.13, G + 0.235)],
                         [(PX - 0.7, PY - 0.02, G + 0.36), (PX + 0.7, PY - 0.02, G + 0.36), (PX + 0.7, PY + 0.02, G + 0.36), (PX - 0.7, PY + 0.02, G + 0.36)]], outline=0.008)
for j in range(7):
    x = PX - 0.6 + j * 0.2
    if abs(x) < 0.15:
        continue
    box(f'dormer{j}', M['stone'], x, PY - 0.09, G + 0.25, 0.06, 0.04, 0.07, outline=0.003, bevel=0)
    pyramid(f'dormerroof{j}', M['slate'], x, PY - 0.09, G + 0.32, 0.07, 0.04, outline=0.002)
for j, x in enumerate((-0.62, -0.32, 0.32, 0.62)):
    box(f'chimney{j}', M['brick'], x, PY + 0.04, G + 0.3, 0.05, 0.08, 0.14, outline=0.004, bevel=0)
# the central pavilion
box('pavilion', M['stone'], PX, PY - 0.02, G - 0.005, 0.24, 0.3, 0.3, outline=0.009, bevel=0)
box('pavdoor', M['window'], PX, PY - 0.172, G + 0.13, 0.07, 0.006, 0.1, outline=0, bevel=0)
loft('pavroof', M['slate'], [[(PX - 0.13, PY - 0.18, G + 0.29), (PX + 0.13, PY - 0.18, G + 0.29), (PX + 0.13, PY + 0.14, G + 0.29), (PX - 0.13, PY + 0.14, G + 0.29)],
                             [(PX - 0.03, PY - 0.07, G + 0.46), (PX + 0.03, PY - 0.07, G + 0.46), (PX + 0.03, PY + 0.03, G + 0.46), (PX - 0.03, PY + 0.03, G + 0.46)]], outline=0.006)
box('pavclock', M['gold'], PX, PY - 0.172, G + 0.24, 0.04, 0.006, 0.04, outline=0, bevel=0)

# ---------- the horseshoe staircase ----------
FY = PY - 0.17          # the pavilion's front
LZ = G + 0.13           # the landing, at the first floor's door
box('landing', M['stone'], PX, FY - 0.05, G - 0.005, 0.18, 0.1, LZ - G + 0.005, outline=0.005, bevel=0)
box('landingarch', M['window'], PX, FY - 0.102, G - 0.005, 0.07, 0.006, 0.09, outline=0, bevel=0)
CX, CY, RR = PX, FY - 0.24, 0.2
N = 12
for s in (-1, 1):
    for j in range(N):
        t = j / (N - 1)     # 0 at the landing, 1 at the foot
        ang = math.pi / 2 - s * math.radians(20 + 110 * t)
        z = LZ - (LZ - G) * t
        x, y = CX + RR * math.cos(ang), CY + RR * math.sin(ang)
        box(f'flight{s}{j}', M['stone'], x, y, G - 0.005, 0.06, 0.09, z - G + 0.005, rot_z=ang + math.pi / 2, outline=0.003, bevel=0)
        xo, yo = CX + (RR + 0.05) * math.cos(ang), CY + (RR + 0.05) * math.sin(ang)
        box(f'balustrade{s}{j}', M['stone'], xo, yo, G - 0.005, 0.045, 0.014, z - G + 0.05, rot_z=ang + math.pi / 2, outline=0.002, bevel=0)

turn(before, -20)
render(G)
