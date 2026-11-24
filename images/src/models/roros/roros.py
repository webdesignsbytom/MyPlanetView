# A cartoon Røros for the country maps, built in the set's shared look (../toon.py): the old copper-mining
# town high in the Norwegian mountains, its big white stone church, Bergstadens Ziir, with the tall
# tower and its black baroque cap and spire, the dark slag heaps behind, and in front the low wooden
# houses along the street in red, ochre and brown, some under turf roofs. Turned a little towards
# the camera.
# Run: blender -b --factory-startup -P roros.py -- roros-1024.png 1024 roros.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#8ab862', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'street': toon('street', '#cfc4ae', shadow_mul=(0.84, 0.84, 0.9), lift=0.15),
    'white': toon('white', '#f6f4ee', shadow_mul=(0.82, 0.84, 0.9), lift=0.22),
    'black': toon('black', '#34363c'),
    'slag': toon('slag', '#4a4a4e', shadow_mul=(0.8, 0.8, 0.86)),
    'red': toon('red', '#a8382c', lift=0.12),
    'ochre': toon('ochre', '#d8a848', lift=0.12),
    'brown': toon('brown', '#7a5236'),
    'turf': toon('turf', '#6a9a44', shadow_mul=(0.7, 0.78, 0.8)),
    'roofgrey': toon('roofgrey', '#5a5c62'),
    'dark': flat('dark', '#2e2a2a'),
    'gold': toon('gold', '#e0b040', lift=0.2),
})

G = tile(M['grass'])
before = set(bpy.data.objects)

# ---------- the slag heaps behind ----------
for k, (x, y, r, h) in enumerate(((-0.7, 0.62, 0.36, 0.2), (-0.25, 0.92, 0.3, 0.16), (0.75, 0.68, 0.32, 0.17))):
    heap = lathe(f'slag{k}', M['slag'], ((r, 0), (r * 0.7, h * 0.6), (r * 0.3, h * 0.95), (0.0, h)), G - 0.01, x, y, segs=24, outline=0.005)
    heap.visible_shadow = False

# ---------- the church ----------
CX, CY = 0.15, 0.35
box('nave', M['white'], CX, CY, G - 0.005, 0.5, 0.26, 0.22, outline=0.007, bevel=0)
for row in range(2):
    for j in range(5):
        box(f'navewin{row}{j}', M['dark'], CX - 0.18 + j * 0.09 + 0.04, CY - 0.133, G + 0.05 + row * 0.09, 0.03, 0.006, 0.05, outline=0, bevel=0)
loft('naveroof', M['black'], [[(CX - 0.26, CY - 0.14, G + 0.215), (CX + 0.26, CY - 0.14, G + 0.215), (CX + 0.26, CY + 0.14, G + 0.215), (CX - 0.26, CY + 0.14, G + 0.215)],
                              [(CX - 0.2, CY - 0.04, G + 0.31), (CX + 0.2, CY - 0.04, G + 0.31), (CX + 0.2, CY + 0.04, G + 0.31), (CX - 0.2, CY + 0.04, G + 0.31)]], outline=0.004)
# the tower at the west end, its black baroque cap and spire
TX, TY = CX - 0.3, CY
box('tower', M['white'], TX, TY, G - 0.005, 0.14, 0.14, 0.42, outline=0.006, bevel=0)
box('towerdoor', M['dark'], TX, TY - 0.073, G - 0.005, 0.045, 0.006, 0.08, outline=0, bevel=0)
cyl('clock', M['white'], 0.028, 0.006, segs=14, outline=0.002, matrix=Matrix.Translation((TX, TY - 0.074, G + 0.35)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
cyl('clockring', M['black'], 0.032, 0.004, segs=14, outline=0, matrix=Matrix.Translation((TX, TY - 0.072, G + 0.35)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
lathe('cap', M['black'], ((0.085, 0), (0.075, 0.04), (0.04, 0.08), (0.045, 0.1), (0.045, 0.14), (0.02, 0.2), (0.003, 0.34)), G + 0.415, TX, TY, segs=8, outline=0.004, smooth=False)
ball('spireball', M['gold'], TX, TY, G + 0.76, 0.012, outline=0.001)

# ---------- the street and its wooden houses ----------
box('street', M['street'], 0.0, -0.35, G - 0.004, 2.2, 0.16, 0.01, outline=0.001, bevel=0)
HOUSES = (('red', 'turf'), ('ochre', 'roofgrey'), ('brown', 'turf'), ('red', 'roofgrey'), ('ochre', 'turf'), ('brown', 'roofgrey'))
for row, y in enumerate((-0.6, -0.1)):
    for j in range(5):
        x = -0.8 + j * 0.4 + (0.1 if row else 0.0)
        w = 0.3
        if math.hypot(abs(x) + w / 2, abs(y) + 0.09) > 1.22:
            continue
        wall, roof = HOUSES[(j + row * 3) % 6]
        box(f'house{row}{j}', M[wall], x, y, G - 0.005, w, 0.16, 0.13, outline=0.005, bevel=0)
        for k in range(3):
            box(f'housewin{row}{j}{k}', M['white'], x - 0.1 + k * 0.1, y - 0.083, G + 0.05, 0.035, 0.006, 0.04, outline=0, bevel=0)
            box(f'housepane{row}{j}{k}', M['dark'], x - 0.1 + k * 0.1, y - 0.086, G + 0.055, 0.025, 0.006, 0.03, outline=0, bevel=0)
        loft(f'houseroof{row}{j}', M[roof], [[(x - w / 2 - 0.01, y - 0.09, G + 0.125), (x + w / 2 + 0.01, y - 0.09, G + 0.125), (x + w / 2 + 0.01, y + 0.09, G + 0.125), (x - w / 2 - 0.01, y + 0.09, G + 0.125)],
                                             [(x - w / 2 - 0.01, y - 0.004, G + 0.19), (x + w / 2 + 0.01, y - 0.004, G + 0.19), (x + w / 2 + 0.01, y + 0.004, G + 0.19), (x - w / 2 - 0.01, y + 0.004, G + 0.19)]], outline=0.004)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
