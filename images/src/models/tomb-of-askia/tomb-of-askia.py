# A cartoon Tomb of Askia for the country maps, built in the set's shared look (../toon.py): the tomb
# of the Songhai emperor Askia Mohammad in Gao, on the Niger in Mali, its great stepped pyramid of
# mud brick bristling with the wooden beams, the toron, that hold the scaffolding for its yearly
# replastering, the flat-roofed prayer halls of the mosque beside it with their rows of little
# pinnacles, the courtyard's wall, and the sand all round. Turned a little towards the camera.
# Run: blender -b --factory-startup -P tomb-of-askia.py -- tomb-of-askia-1024.png 1024 tomb-of-askia.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sand': toon('sand', '#e4cc98', shadow_mul=(0.82, 0.8, 0.84), lift=0.18),
    'mud': toon('mud', '#b88a5a', shadow_mul=(0.8, 0.74, 0.78), lift=0.12),
    'mudLight': toon('mudLight', '#c89a68', lift=0.12),
    'wood': toon('wood', '#6a4a30'),
    'dark': flat('dark', '#2e2420'),
    'tree': toon('tree', '#6a9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#7a5a3e'),
})

G = tile(M['sand'])
before = set(bpy.data.objects)

# ---------- the stepped pyramid ----------
PX, PY = -0.15, 0.15
TIERS = ((0.4, 0.16), (0.3, 0.15), (0.2, 0.14), (0.12, 0.08))
z = G - 0.005
for k, (w, h) in enumerate(TIERS):
    t = w * 0.12
    loft(f'tier{k}', M['mud'], [[(PX - w / 2, PY - w / 2, z), (PX + w / 2, PY - w / 2, z), (PX + w / 2, PY + w / 2, z), (PX - w / 2, PY + w / 2, z)],
                                [(PX - w / 2 + t, PY - w / 2 + t, z + h), (PX + w / 2 - t, PY - w / 2 + t, z + h), (PX + w / 2 - t, PY + w / 2 - t, z + h), (PX - w / 2 + t, PY + w / 2 - t, z + h)]], outline=0.006)
    # the toron: wooden beams sticking out of every face in rows
    for row in range(2):
        zz = z + h * (0.3 + 0.4 * row)
        inset = t * (0.3 + 0.4 * row)
        half = w / 2 - inset
        n = max(2, int(w / 0.06))
        for j in range(n):
            u = -half + 0.02 + j * (2 * half - 0.04) / (n - 1)
            for (dx, dy) in ((0, -1), (1, 0), (0, 1), (-1, 0)):
                bx = PX + (u if dy else dx * half)
                by = PY + (u if dx else dy * half)
                bar(f'toron{k}{row}{j}{dx}{dy}', M['wood'], (bx, by, zz), (bx + dx * 0.035, by + dy * 0.035, zz), 0.008, outline=0)
    z += h
lathe('pinnacle', M['mud'], ((0.035, 0), (0.025, 0.05), (0.003, 0.09)), z - 0.005, PX, PY, segs=8, outline=0.003, smooth=False)

# ---------- the mosque's prayer halls and the courtyard wall ----------
for k, (x, y, w, d) in enumerate(((0.35, 0.2, 0.36, 0.3), (0.35, -0.2, 0.36, 0.22))):
    box(f'hall{k}', M['mudLight'], x, y, G - 0.005, w, d, 0.13, outline=0.005, bevel=0)
    for j in range(5):
        lathe(f'pinnaclefront{k}{j}', M['mudLight'], ((0.014, 0), (0.008, 0.035), (0.003, 0.045)), G + 0.125, x - w / 2 + 0.03 + j * (w - 0.06) / 4, y - d / 2 + 0.012, segs=6, outline=0.001, smooth=False)
    for j in range(4):
        box(f'halldoor{k}{j}', M['dark'], x - w / 2 + 0.06 + j * (w - 0.12) / 3, y - d / 2 - 0.004, G - 0.005, 0.03, 0.006, 0.07, outline=0, bevel=0)
    for j in range(3):
        bar(f'hallbeam{k}{j}', M['wood'], (x - w / 2 + 0.08 + j * 0.1, y - d / 2, G + 0.1), (x - w / 2 + 0.08 + j * 0.1, y - d / 2 - 0.03, G + 0.1), 0.008, outline=0)
for k, (x, y, sx, sy) in enumerate(((0.0, -0.62, 1.2, 0.04), (-0.62, -0.1, 0.04, 1.04), (0.62, -0.1, 0.04, 1.04))):
    box(f'yardwall{k}', M['mud'], x, y, G - 0.005, sx, sy, 0.07, outline=0.003, bevel=0)
box('yardgate', M['dark'], 0.0, -0.643, G - 0.005, 0.08, 0.006, 0.06, outline=0, bevel=0)

for k, (x, y) in enumerate(((-0.85, -0.6), (0.85, -0.55), (0.85, 0.55))):
    rod(f'trunk{k}', M['trunk'], (x, y, G), (x, y, G + 0.12), 0.012, segs=6, outline=0.002)
    b = ball(f'tree{k}', M['tree'], 0, 0, 0, 0.09, outline=0.008)
    b.scale = (1.3, 1.3, 0.55)
    b.location = (x, y, G + 0.15)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
