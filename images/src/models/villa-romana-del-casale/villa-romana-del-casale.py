# A cartoon Villa Romana del Casale for the country maps, built in the set's shared look
# (../toon.py): the late Roman country palace near Piazza Armerina in Sicily, famous for its
# mosaic floors (the bikini girls, the great hunt), its rooms rebuilt as light roofed
# pavilions over the mosaics with walkways round them, the peristyle garden with its fountain
# and columns, the round baths, and the wooded hills round it. Turned a little towards the camera.
# Run: blender -b --factory-startup -P villa-romana-del-casale.py -- villa-romana-del-casale-1024.png 1024 villa-romana-del-casale.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#94bc5c', shadow_mul=(0.7, 0.78, 0.8), lift=0.22),
    'wall': toon('wall', '#e6d6b4', shadow_mul=(0.8, 0.8, 0.86), lift=0.18),
    'roof': toon('roof', '#c86c48'),
    'mosaic': toon('mosaic', '#d8a870', lift=0.18),
    'mosaicBlue': toon('mosaicBlue', '#5a8ab0', lift=0.2),
    'stone': toon('stone', '#ece2cc', lift=0.2),
    'water': toon('water', '#4a9ac8', lift=0.3),
    'dark': flat('dark', '#3a2e26'),
    'tree': toon('tree', '#4e8a3e', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#7a5a3e'),
})

G = tile()
before = set(bpy.data.objects)
def tree(name, x, y, r=0.09, h=0.12, mat="tree"):
    rod(name + "trunk", M["trunk"], (x, y, G), (x, y, G + h), 0.012, segs=6, outline=0.002)
    b = ball(name, M[mat], 0, 0, 0, r, outline=0.008)
    b.scale = (1.1, 1.1, 0.95)
    b.location = (x, y, G + h + r * 0.75)


# ---------- the peristyle garden ----------
PX, PY, PW, PD = -0.1, -0.05, 0.6, 0.42
box('peristyle', M['grass'], PX, PY, G - 0.004, PW, PD, 0.01, outline=0.001, bevel=0)
lathe('fountain', M['stone'], ((0.08, 0), (0.08, 0.03), (0.07, 0.03), (0.07, 0.01)), G - 0.005, PX, PY, segs=16, outline=0.002, smooth=False)
lathe('fountainwater', M['water'], ((0.07, 0), (0.07, 0.02)), G - 0.005, PX, PY, segs=16, outline=0)
for k in range(8):
    for s in (-1, 1):
        x = PX - PW / 2 + 0.04 + k * (PW - 0.08) / 7
        lathe(f'colfb{k}{s}', M['stone'], ((0.012, 0), (0.012, 0.12)), G - 0.005, x, PY + s * PD / 2, segs=8, outline=0.001, smooth=False)
for k in range(5):
    for s in (-1, 1):
        y = PY - PD / 2 + 0.04 + k * (PD - 0.08) / 4
        lathe(f'colsd{k}{s}', M['stone'], ((0.012, 0), (0.012, 0.12)), G - 0.005, PX + s * PW / 2, y, segs=8, outline=0.001, smooth=False)
for s in (-1, 1):
    box(f'porticoroof{s}', M['roof'], PX, PY + s * (PD / 2 + 0.03), G + 0.115, PW + 0.1, 0.08, 0.02, outline=0.002, bevel=0)
    box(f'porticoroofs{s}', M['roof'], PX + s * (PW / 2 + 0.03), PY, G + 0.115, 0.08, PD, 0.02, outline=0.002, bevel=0)


def pavilion(name, x, y, w, d, h, floor):
    """A room rebuilt as a light pavilion over its mosaic: low walls, windows, a pitched roof."""
    box(name, M['wall'], x, y, G - 0.005, w, d, h, outline=0.004, bevel=0)
    gable(name + 'roof', M['roof'], x, y, G + h - 0.005, w, d, 0.07, ridge_x=w > d, over=0.015)
    for j in range(max(2, int(w / 0.09))):
        box(f'{name}win{j}', M['dark'], x - w / 2 + (j + 0.5) * w / max(2, int(w / 0.09)), y - d / 2 - 0.003, G + h - 0.06, 0.035, 0.006, 0.035, outline=0, bevel=0)
    box(name + 'floor', M[floor], x, y - d / 2 - 0.06, G - 0.004, w * 0.7, 0.08, 0.008, outline=0.001, bevel=0)


# ---------- the rooms round it ----------
pavilion('hunt', PX, PY + PD / 2 + 0.25, PW + 0.2, 0.16, 0.14, 'mosaic')
pavilion('rooms1', PX + PW / 2 + 0.2, PY, 0.22, 0.4, 0.13, 'mosaicBlue')
pavilion('rooms2', PX - PW / 2 - 0.2, PY + 0.05, 0.2, 0.34, 0.12, 'mosaic')
pavilion('basilica', PX + PW / 2 + 0.25, PY + 0.45, 0.26, 0.26, 0.17, 'mosaic')
# the round baths
for k, (x, y, r) in enumerate(((-0.55, -0.55, 0.12), (-0.3, -0.62, 0.09))):
    lathe(f'bath{k}', M['wall'], ((r, 0), (r, 0.1)), G - 0.005, x, y, segs=20, outline=0.004, smooth=False)
    lathe(f'bathdome{k}', M['roof'], [(r * 1.02 * math.cos(a), 0.06 * math.sin(a)) for a in [j * math.pi / 12 for j in range(7)]], G + 0.095, x, y, segs=20, outline=0.003)
# the walkway out to the visitors
box('walk', M['stone'], 0.25, -0.62, G - 0.004, 0.5, 0.07, 0.012, outline=0.001, bevel=0)

for k, (x, y) in enumerate(((-0.95, 0.35), (0.95, -0.4), (0.7, -0.85), (-0.85, 0.75), (0.25, 0.95), (-1.0, -0.2))):
    tree(f'tree{k}', x, y)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
