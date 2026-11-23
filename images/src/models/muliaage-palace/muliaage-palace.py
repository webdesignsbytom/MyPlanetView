# A cartoon Muliaage Palace for the country maps, built in the set's shared look (../toon.py): the
# Maldives' white colonial-style palace in Malé, two storeys with its veranda under a pitched roof,
# the golden dome of the Islamic Centre beside it, palms, and the lagoon round the island with
# overwater bungalows on stilts. Turned a little towards the camera.
# Run: blender -b --factory-startup -P muliaage-palace.py -- muliaage-palace-1024.png 1024 muliaage-palace.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'lagoon': toon('lagoon', '#5fd0d8', shadow_mul=(0.74, 0.84, 0.9), lift=0.35),
    'deep': toon('deep', '#2f8fc8', shadow_mul=(0.74, 0.82, 0.9), lift=0.35),
    'sand': toon('sand', '#f6ecd0', shadow_mul=(0.82, 0.8, 0.86), lift=0.2),
    'white': toon('white', '#f8f6f0', shadow_mul=(0.8, 0.82, 0.92), lift=0.2),
    'roof': toon('roof', '#5a8a8a', shadow_mul=(0.76, 0.82, 0.86)),
    'gold': toon('goldDome', '#f3b53a', shadow_mul=(0.78, 0.62, 0.55), lift=0.45),
    'window': flat('window', '#3a3640'),
    'shutter': toon('shutter', '#3f7f9a'),
    'wood': toon('wood', '#8a6448'),
    'thatch': toon('thatch', '#c9a85a', shadow_mul=(0.84, 0.76, 0.62)),
    'palm': toon('palm', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#8a6448'),
})

G = tile(M['deep'])
before = set(bpy.data.objects)
rng = random.Random(857)

# ---------- the lagoon and the island ----------
cyl('lagoon', M['lagoon'], 1.0, 0.004, segs=40, outline=0.006, matrix=Matrix.Translation((0, 0.05, G + 0.001)) @ Matrix.Scale(1.25, 4, (1, 0, 0)) @ Matrix.Scale(1.0, 4, (0, 1, 0)))
IX, IY = -0.1, 0.3
isl = loft('island', M['sand'], [[(IX + 0.78 * math.cos(t), IY + 0.55 * math.sin(t), G - 0.01) for t in (2 * math.pi * j / 24 for j in range(24))],
                                 [(IX + 0.74 * math.cos(t), IY + 0.52 * math.sin(t), G + 0.03) for t in (2 * math.pi * j / 24 for j in range(24))]], outline=0.012)
isl.visible_shadow = False
IZ = G + 0.03

# ---------- Muliaage ----------
PX, PY = IX + 0.05, IY - 0.05
box('palace', M['white'], PX, PY, IZ - 0.005, 0.5, 0.26, 0.24, outline=0.018, bevel=0)
loft('palaceroof', M['roof'], [[(PX - 0.27, PY - 0.15, IZ + 0.235), (PX + 0.27, PY - 0.15, IZ + 0.235), (PX + 0.27, PY + 0.15, IZ + 0.235), (PX - 0.27, PY + 0.15, IZ + 0.235)],
                               [(PX - 0.2, PY - 0.004, IZ + 0.34), (PX + 0.2, PY - 0.004, IZ + 0.34), (PX + 0.2, PY + 0.004, IZ + 0.34), (PX - 0.2, PY + 0.004, IZ + 0.34)]],
     outline=0.012)
box('gable', M['white'], PX, PY - 0.13, IZ + 0.23, 0.18, 0.02, 0.05, outline=0.006, bevel=0)
pyramid('gabletop', M['white'], PX, PY - 0.13, IZ + 0.28, 0.12, 0.05, outline=0.004)
for row, z in enumerate((0.0, 0.12)):
    box(f'verandafloor{row}', M['white'], PX, PY - 0.17, IZ + z + 0.11, 0.5, 0.08, 0.012, outline=0.003, bevel=0)
    for k in range(7):
        x = PX - 0.24 + k * 0.08
        rod(f'column{row}{k}', M['white'], (x, PY - 0.2, IZ + z), (x, PY - 0.2, IZ + z + 0.11), 0.008, segs=8, outline=0.002)
        if k < 6:
            box(f'shutter{row}{k}', M['shutter'], x + 0.04, PY - 0.134, IZ + z + 0.025, 0.035, 0.01, 0.06, outline=0, bevel=0)
box('gate', M['white'], PX, PY - 0.42, IZ - 0.005, 0.18, 0.04, 0.1, outline=0.008, bevel=0)
box('gateway', M['window'], PX, PY - 0.443, IZ, 0.07, 0.01, 0.07, outline=0, bevel=0)

# ---------- the Islamic Centre's golden dome ----------
DX, DY = IX + 0.5, IY + 0.2
box('centre', M['white'], DX, DY, IZ - 0.005, 0.26, 0.26, 0.14, outline=0.014, bevel=0)
lathe('golddome', M['gold'], ((0.12, 0), (0.11, 0.06), (0.08, 0.12), (0.03, 0.16), (0.004, 0.17)), IZ + 0.135, DX, DY, segs=20, outline=0.012)
lathe('minaret', M['white'], ((0.025, 0), (0.02, 0.36)), IZ - 0.005, DX + 0.16, DY - 0.12, segs=10, outline=0.006)
lathe('minarettop', M['gold'], ((0.028, 0), (0.004, 0.06)), IZ + 0.35, DX + 0.16, DY - 0.12, segs=10, outline=0.004)

# ---------- palms ----------
for k, (x, y) in enumerate(((IX - 0.55, IY + 0.1), (IX - 0.45, IY - 0.3), (IX + 0.45, IY - 0.25), (IX - 0.25, IY + 0.4), (IX + 0.62, IY + 0.05))):
    h = rng.uniform(0.24, 0.3)
    rod(f'palmtrunk{k}', M['trunk'], (x, y, IZ), (x + 0.04, y, IZ + h), 0.013, r2=0.01, segs=8, outline=0.005)
    for f in range(7):
        b = 2 * math.pi * f / 7 + k
        bar(f'frond{k}{f}', M['palm'], (x + 0.04, y, IZ + h), (x + 0.04 + 0.1 * math.cos(b), y + 0.1 * math.sin(b), IZ + h - 0.05), 0.02, outline=0.005)

# ---------- overwater bungalows on stilts, along a jetty ----------
box('jetty', M['wood'], 0.35, -0.55, G + 0.06, 0.06, 0.7, 0.015, rot_z=0.9, outline=0.004, bevel=0)
for k, (x, y) in enumerate(((0.05, -0.72), (0.38, -0.82), (0.72, -0.65))):
    for sx in (-1, 1):
        for sy in (-1, 1):
            rod(f'stilt{k}{sx}{sy}', M['wood'], (x + sx * 0.05, y + sy * 0.04, G - 0.01), (x + sx * 0.05, y + sy * 0.04, G + 0.07), 0.006, segs=5, outline=0.002)
    box(f'bungalow{k}', M['wood'], x, y, G + 0.065, 0.13, 0.1, 0.07, outline=0.006, bevel=0)
    pyramid(f'bungalowroof{k}', M['thatch'], x, y, G + 0.13, 0.17, 0.08, outline=0.006)

turn(before, -20)
render(G)
