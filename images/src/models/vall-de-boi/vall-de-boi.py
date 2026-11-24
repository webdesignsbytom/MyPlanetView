# A cartoon Vall de Boí for the country maps, built in the set's shared look (../toon.py): Sant
# Climent de Taüll, the little Romanesque church of grey stone in the Pyrenees, its slender
# six-storey bell tower with paired arched windows and Lombard bands, the nave with its slate roof
# and the three round apses at its east end, the meadow round it and the mountains behind. Turned a
# little towards the camera.
# Run: blender -b --factory-startup -P vall-de-boi.py -- vall-de-boi-1024.png 1024 vall-de-boi.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'meadow': toon('meadow', '#8ac05a', shadow_mul=(0.72, 0.8, 0.74), lift=0.2),
    'stone': toon('stone', '#bab0a0', shadow_mul=(0.84, 0.84, 0.9), lift=0.12),
    'stoneDark': toon('stoneDark', '#9a9080'),
    'slate': toon('slate', '#5a5e68', shadow_mul=(0.84, 0.86, 0.92)),
    'dark': flat('dark', '#2a2622'),
    'mountain': toon('mountain', '#7a8a9a', shadow_mul=(0.82, 0.86, 0.92)),
    'snow': toon('snow', '#f4f6fa', lift=0.3),
    'fir': toon('fir', '#3f6a40', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['meadow'])
before = set(bpy.data.objects)

# ---------- the Pyrenees behind ----------
for k, (x, y, r, h) in enumerate(((-0.55, 0.85, 0.42, 0.6), (0.3, 0.92, 0.42, 0.72))):
    r = min(r, 1.36 - math.hypot(x, y))
    mt = lathe(f'mountain{k}', M['mountain'], ((r, 0), (r * 0.6, h * 0.55), (r * 0.25, h * 0.88), (0.004, h)), G - 0.01, x, y, segs=12, outline=0.008, smooth=False)
    mt.visible_shadow = False
    lathe(f'snow{k}', M['snow'], ((r * 0.25 + 0.006, 0), (0.004, h * 0.12 + 0.004)), G - 0.01 + h * 0.88, x, y, segs=12, outline=0.003, smooth=False)

# ---------- the nave and the apses ----------
NX, NY = 0.05, 0.05
box('nave', M['stone'], NX, NY + 0.15, G - 0.005, 0.32, 0.5, 0.22, outline=0.008, bevel=0)
loft('naveroof', M['slate'], [[(NX - 0.17, NY - 0.1, G + 0.215), (NX + 0.17, NY - 0.1, G + 0.215), (NX + 0.17, NY + 0.4, G + 0.215), (NX - 0.17, NY + 0.4, G + 0.215)],
                              [(NX - 0.004, NY - 0.1, G + 0.3), (NX + 0.004, NY - 0.1, G + 0.3), (NX + 0.004, NY + 0.4, G + 0.3), (NX - 0.004, NY + 0.4, G + 0.3)]], outline=0.005)
box('navedoor', M['dark'], NX, NY - 0.103, G - 0.005, 0.05, 0.006, 0.1, outline=0, bevel=0)
cyl('navedoortop', M['dark'], 0.025, 0.006, segs=10, outline=0, matrix=Matrix.Translation((NX, NY - 0.103, G + 0.095)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
for k, (dx, r, h) in enumerate(((-0.1, 0.05, 0.15), (0.0, 0.08, 0.2), (0.1, 0.05, 0.15))):
    lathe(f'apse{k}', M['stone'], ((r, 0), (r, h)), G - 0.005, NX + dx, NY + 0.4, segs=14, outline=0.004)
    lathe(f'apseroof{k}', M['slate'], ((r + 0.008, 0), (0.003, 0.04)), G + h - 0.008, NX + dx, NY + 0.4, segs=14, outline=0.002)
    for j in range(4):
        a = math.pi * (0.15 + 0.7 * j / 3)
        box(f'apseband{k}{j}', M['stoneDark'], NX + dx + (r + 0.002) * math.cos(a), NY + 0.4 + (r + 0.002) * math.sin(a), G + h - 0.03, 0.015, 0.008, 0.02, rot_z=a + math.pi / 2, outline=0, bevel=0)

# ---------- the bell tower ----------
TX, TY = NX + 0.25, NY + 0.0
TS = 0.13
box('tower', M['stone'], TX, TY, G - 0.005, TS, TS, 0.72, outline=0.008, bevel=0)
for k in range(6):
    z = G + 0.08 + k * 0.105
    box(f'towerband{k}', M['stoneDark'], TX, TY, z + 0.075, TS + 0.008, TS + 0.008, 0.012, outline=0, bevel=0)
    if k >= 2:
        for fy, fx in ((-1, 0), (0, -1)):
            for j in (-1, 1):
                ox = j * 0.025 if fy else 0
                oy = j * 0.025 if fx else 0
                box(f'towerwin{k}{fy}{fx}{j}', M['dark'], TX + fx * (TS / 2 + 0.003) + ox, TY + fy * (TS / 2 + 0.003) + oy, z + 0.01, 0.022 if fy else 0.006, 0.006 if fy else 0.022, 0.05, outline=0, bevel=0)
loft('towerroof', M['slate'], [[(TX - TS / 2 - 0.01, TY - TS / 2 - 0.01, G + 0.715), (TX + TS / 2 + 0.01, TY - TS / 2 - 0.01, G + 0.715), (TX + TS / 2 + 0.01, TY + TS / 2 + 0.01, G + 0.715), (TX - TS / 2 - 0.01, TY + TS / 2 + 0.01, G + 0.715)],
                               [(TX - 0.005, TY - 0.005, G + 0.8), (TX + 0.005, TY - 0.005, G + 0.8), (TX + 0.005, TY + 0.005, G + 0.8), (TX - 0.005, TY + 0.005, G + 0.8)]], outline=0.004)

# ---------- firs and a stone wall round the churchyard ----------
for k, (x, y) in enumerate(((-0.75, -0.3), (-0.85, 0.15), (0.8, -0.2), (0.75, 0.35), (-0.4, -0.8))):
    lathe(f'fir{k}', M['fir'], ((0.08, 0), (0.05, 0.1), (0.06, 0.1), (0.003, 0.3)), G - 0.005, x, y, segs=10, outline=0.006, smooth=False)
for k, (x0, y0, x1, y1) in enumerate(((-0.45, -0.3, 0.6, -0.3), (-0.45, -0.3, -0.45, 0.55))):
    bar(f'churchyardwall{k}', M['stoneDark'], (x0, y0, G + 0.03), (x1, y1, G + 0.03), 0.05, outline=0.003)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
