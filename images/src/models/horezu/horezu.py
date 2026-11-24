# A cartoon Horezu Monastery for the country maps, built in the set's shared look (../toon.py): the
# great Brâncovenesc monastery in Wallachia, its white church in the middle of the walled court with
# the open porch of carved stone columns and arches at its front, the brick-red band round its walls,
# the apses and the octagonal tower with its bell-shaped grey roof; round the court the white ranges
# of the monks' cells with their arcades and red tiled roofs, and the gate tower in the front wall.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P horezu.py -- horezu-1024.png 1024 horezu.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'court': toon('court', '#ddd2bc', shadow_mul=(0.84, 0.84, 0.9), lift=0.2),
    'white': toon('white', '#f6f2ea', shadow_mul=(0.82, 0.84, 0.9), lift=0.22),
    'brick': toon('brick', '#b8503e'),
    'tiles': toon('tiles', '#c4643e'),
    'grey': toon('grey', '#50555e'),
    'stone': toon('stone', '#e4dcc8', lift=0.15),
    'dark': flat('dark', '#2e2a2a'),
    'gold': toon('gold', '#e0b040', lift=0.2),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['grass'])
before = set(bpy.data.objects)


def ridge_roof(name, mat, cx, cy, z0, hx, hy, z1, along_x):
    top = (hx - 0.03, 0.004) if along_x else (0.004, hy - 0.03)
    return loft(name, mat, [[(cx - hx, cy - hy, z0), (cx + hx, cy - hy, z0), (cx + hx, cy + hy, z0), (cx - hx, cy + hy, z0)],
                            [(cx - top[0], cy - top[1], z1), (cx + top[0], cy - top[1], z1), (cx + top[0], cy + top[1], z1), (cx - top[0], cy + top[1], z1)]], outline=0.004)


def arch(name, x, y, z, w, h, face):
    """A dark arched opening on a wall facing -y ('y') or +x ('x')."""
    if face == 'y':
        box(name, M['dark'], x, y, z, w, 0.006, h, outline=0, bevel=0)
        cyl(f'{name}top', M['dark'], w / 2, 0.006, segs=10, outline=0, matrix=Matrix.Translation((x, y, z + h)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
    else:
        box(name, M['dark'], x, y, z, 0.006, w, h, outline=0, bevel=0)
        cyl(f'{name}top', M['dark'], w / 2, 0.006, segs=10, outline=0, matrix=Matrix.Translation((x, y, z + h)) @ Matrix.Rotation(math.pi / 2, 4, 'Y') @ Matrix.Rotation(math.pi / 2, 4, 'X'))


# ---------- the court ----------
S = 0.74
loft('court', M['court'], [[(-S, -S, G - 0.004), (S, -S, G - 0.004), (S, S, G - 0.004), (-S, S, G - 0.004)],
                           [(-S, -S, G + 0.004), (S, -S, G + 0.004), (S, S, G + 0.004), (-S, S, G + 0.004)]], outline=0.002)
# the ranges of cells at the back and on the left, with their arcades
box('backrange', M['white'], 0.0, 0.63, G - 0.005, 1.5, 0.2, 0.22, outline=0.007, bevel=0)
for j in range(11):
    arch(f'backarch{j}', -0.6 + j * 0.12, 0.527, G + 0.02, 0.07, 0.1, 'y')
ridge_roof('backroof', M['tiles'], 0.0, 0.63, G + 0.215, 0.78, 0.12, G + 0.32, True)
box('leftrange', M['white'], -0.63, -0.02, G - 0.005, 0.2, 1.06, 0.22, outline=0.007, bevel=0)
for j in range(8):
    arch(f'leftarch{j}', -0.527, -0.45 + j * 0.12, G + 0.02, 0.07, 0.1, 'x')
ridge_roof('leftroof', M['tiles'], -0.63, -0.02, G + 0.215, 0.12, 0.53, G + 0.32, False)
# the walls on the right and in front, and the gate tower
box('rightwall', M['white'], 0.75, 0.0, G - 0.005, 0.04, 1.5, 0.13, outline=0.004, bevel=0)
box('rightwallcap', M['tiles'], 0.75, 0.0, G + 0.12, 0.07, 1.52, 0.02, outline=0.002, bevel=0)
for s in (-1, 1):
    box(f'frontwall{s}', M['white'], s * 0.44, -0.75, G - 0.005, 0.62, 0.04, 0.13, outline=0.004, bevel=0)
    box(f'frontwallcap{s}', M['tiles'], s * 0.44, -0.75, G + 0.12, 0.64, 0.07, 0.02, outline=0.002, bevel=0)
box('gatetower', M['white'], 0.0, -0.75, G - 0.005, 0.22, 0.18, 0.34, outline=0.006, bevel=0)
arch('gatearch', 0.0, -0.843, G - 0.005, 0.09, 0.13, 'y')
box('gatewin', M['dark'], 0.0, -0.843, G + 0.22, 0.04, 0.006, 0.05, outline=0, bevel=0)
loft('gateroof', M['grey'], [[(-0.13, -0.85, G + 0.33), (0.13, -0.85, G + 0.33), (0.13, -0.65, G + 0.33), (-0.13, -0.65, G + 0.33)],
                             [(-0.004, -0.75, G + 0.5), (0.004, -0.75, G + 0.5), (0.004, -0.749, G + 0.5), (-0.004, -0.749, G + 0.5)]], outline=0.004)

# ---------- the church ----------
CX, CY, L = 0.08, 0.04, 0.44
box('nave', M['white'], CX, CY, G - 0.005, 0.26, L, 0.24, outline=0.007, bevel=0)
box('naveband', M['brick'], CX, CY, G + 0.12, 0.268, L + 0.008, 0.02, outline=0.001, bevel=0)
for k in range(3):
    box(f'navewin{k}', M['dark'], CX - 0.133, CY - 0.12 + k * 0.12, G + 0.16, 0.006, 0.025, 0.05, outline=0, bevel=0)
lathe('apse', M['white'], ((0.12, 0), (0.12, 0.22)), G - 0.005, CX, CY + L / 2, segs=14, outline=0.005)
lathe('apseband', M['brick'], ((0.124, 0), (0.124, 0.02)), G + 0.12, CX, CY + L / 2, segs=14, outline=0.001)
lathe('apseroof', M['grey'], ((0.14, 0), (0.003, 0.1)), G + 0.215, CX, CY + L / 2, segs=14, outline=0.003, smooth=False)
for s in (-1, 1):
    lathe(f'sideapse{s}', M['white'], ((0.08, 0), (0.08, 0.2)), G - 0.005, CX + s * 0.13, CY + 0.08, segs=12, outline=0.004)
    lathe(f'sideapseband{s}', M['brick'], ((0.084, 0), (0.084, 0.02)), G + 0.12, CX + s * 0.13, CY + 0.08, segs=12, outline=0.001)
    lathe(f'sideapseroof{s}', M['grey'], ((0.1, 0), (0.003, 0.08)), G + 0.195, CX + s * 0.13, CY + 0.08, segs=12, outline=0.003, smooth=False)
# the porch: an open arcade of slender stone columns
PY0, PY1 = CY - L / 2 - 0.15, CY - L / 2
box('porchfloor', M['stone'], CX, (PY0 + PY1) / 2, G - 0.005, 0.3, PY1 - PY0, 0.025, outline=0.003, bevel=0)
box('porchback', M['dark'], CX, PY1 - 0.004, G + 0.02, 0.24, 0.006, 0.13, outline=0, bevel=0)
box('porcharcade', M['white'], CX, PY0 + 0.01, G + 0.155, 0.3, 0.025, 0.085, outline=0.004, bevel=0)
for s in (-1, 1):
    box(f'porchside{s}', M['white'], CX + s * 0.14, (PY0 + PY1) / 2, G + 0.155, 0.02, PY1 - PY0, 0.085, outline=0.003, bevel=0)
for j in range(4):
    x = CX - 0.12 + j * 0.08
    rod(f'porchcol{j}', M['stone'], (x, PY0 + 0.012, G + 0.02), (x, PY0 + 0.012, G + 0.158), 0.011, segs=8, outline=0.002)
for j in range(3):
    cyl(f'porcharch{j}', M['dark'], 0.03, 0.006, segs=10, outline=0, matrix=Matrix.Translation((CX - 0.08 + j * 0.08, PY0 - 0.004, G + 0.158)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
box('porchband', M['brick'], CX, PY0 + 0.01, G + 0.2, 0.304, 0.03, 0.018, outline=0.001, bevel=0)
ridge_roof('naveroof', M['grey'], CX, (PY0 + CY + L / 2) / 2, G + 0.235, 0.16, (CY + L / 2 - PY0) / 2 + 0.02, G + 0.37, False)
# the octagonal tower and its bell-shaped roof
TX, TY = CX, CY - 0.02
lathe('drum', M['white'], ((0.075, 0), (0.075, 0.2)), G + 0.28, TX, TY, segs=8, outline=0.004, smooth=False)
lathe('drumband', M['brick'], ((0.079, 0), (0.079, 0.02)), G + 0.43, TX, TY, segs=8, outline=0.001, smooth=False)
for k in range(4):
    a = -math.pi / 2 + (k - 1.5) * math.pi / 4
    box(f'drumwin{k}', M['dark'], TX + 0.074 * math.cos(a), TY + 0.074 * math.sin(a), G + 0.34, 0.02, 0.006, 0.06, rot_z=a + math.pi / 2, outline=0, bevel=0)
lathe('towerroof', M['grey'], ((0.095, 0), (0.09, 0.03), (0.055, 0.07), (0.035, 0.1), (0.004, 0.17)), G + 0.475, TX, TY, segs=8, outline=0.004, smooth=False)
rod('cross', M['gold'], (TX, TY, G + 0.64), (TX, TY, G + 0.72), 0.005, segs=4, outline=0.001)
bar('crossbar', M['gold'], (TX - 0.022, TY, G + 0.695), (TX + 0.022, TY, G + 0.695), 0.007, outline=0.001)

for k, (x, y) in enumerate(((0.95, -0.35), (0.95, 0.4), (-0.4, -0.98), (0.45, -0.98))):
    ball(f'tree{k}', M['tree'], x, y, G + 0.14, 0.12, outline=0.012)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
