# A cartoon Fourvière for the country maps, built in the set's shared look (../toon.py): Lyon's
# white Basilica of Notre-Dame de Fourvière on its hill, the four octagonal corner towers with their
# battlements, the columned porch under its pediment, the old chapel's bell tower with the golden
# Virgin beside it and the little iron tower, and below, Vieux Lyon's coloured Renaissance houses
# along the Saône. Turned a little towards the camera.
# Run: blender -b --factory-startup -P fourviere.py -- fourviere-1024.png 1024 fourviere.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'quay': toon('quay', '#c8c0b0', shadow_mul=(0.84, 0.82, 0.88), lift=0.2),
    'hill': toon('hill', '#6aa54a', shadow_mul=(0.72, 0.8, 0.74)),
    'river': toon('river', '#4a8ab0', lift=0.3),
    'white': toon('white', '#f2eee4', shadow_mul=(0.82, 0.84, 0.9), lift=0.15),
    'whiteDark': toon('whiteDark', '#d0ccc0'),
    'slate': toon('slate', '#5a5e66'),
    'gold': toon('gold', '#e8b830', lift=0.3),
    'iron': toon('iron', '#6a6e76'),
    'ochre': toon('ochre', '#ecc078', lift=0.1),
    'pink': toon('pink', '#e8a890', lift=0.1),
    'rose': toon('rose', '#d8806a', lift=0.08),
    'roof': toon('roof', '#c4603e'),
    'window': flat('window', '#3a3a48'),
    'tree': toon('tree', '#3f7a3a', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['quay'])
before = set(bpy.data.objects)
rng = random.Random(2477)


def strip(y0, y1, r, z, n=6):
    xa0, xa1 = math.sqrt(r * r - y0 * y0), math.sqrt(r * r - y1 * y1)
    a0, a1 = math.asin(y0 / r), math.asin(y1 / r)
    pts = [(-xa0, y0), (xa0, y0)]
    pts += [(r * math.cos(a0 + (a1 - a0) * k / n), r * math.sin(a0 + (a1 - a0) * k / n)) for k in range(1, n)]
    pts += [(xa1, y1), (-xa1, y1)]
    pts += [(r * math.cos(math.pi - a1 + (a1 - a0) * k / n), r * math.sin(math.pi - a1 + (a1 - a0) * k / n)) for k in range(1, n)]
    return [(x, y, G + z) for x, y in pts]


loft('saone', M['river'], [strip(-1.25, -0.7, 1.33, -0.004), strip(-1.25, -0.7, 1.33, 0.006)], outline=0.004)
hl = lathe('hill', M['hill'], ((0.8, 0), (0.62, 0.14), (0.42, 0.24), (0.3, 0.26)), G - 0.01, 0.0, 0.45, segs=32, outline=0.01)
hl.visible_shadow = False
T = G + 0.25

# ---------- the basilica ----------
BX, BY, W, D = 0.0, 0.48, 0.36, 0.26
box('basilica', M['white'], BX, BY, T - 0.005, W, D, 0.2, outline=0.008, bevel=0)
loft('basilicaroof', M['slate'], [[(BX - W / 2, BY - D / 2, T + 0.195), (BX + W / 2, BY - D / 2, T + 0.195), (BX + W / 2, BY + D / 2, T + 0.195), (BX - W / 2, BY + D / 2, T + 0.195)],
                                  [(BX - 0.004, BY - D / 2, T + 0.28), (BX + 0.004, BY - D / 2, T + 0.28), (BX + 0.004, BY + D / 2, T + 0.28), (BX - 0.004, BY + D / 2, T + 0.28)]], outline=0.005)
for sx in (-1, 1):
    for sy in (-1, 1):
        tx, ty = BX + sx * W / 2, BY + sy * D / 2
        lathe(f'tower{sx}{sy}', M['white'], ((0.05, 0), (0.05, 0.33)), T - 0.005, tx, ty, segs=8, outline=0.005, smooth=False)
        for j in range(8):
            a = 2 * math.pi * j / 8
            box(f'battlement{sx}{sy}{j}', M['whiteDark'], tx + 0.045 * math.cos(a), ty + 0.045 * math.sin(a), T + 0.32, 0.02, 0.02, 0.03, rot_z=a, outline=0.001, bevel=0)
        box(f'towerwin{sx}{sy}', M['window'], tx, ty - 0.048, T + 0.2, 0.02, 0.006, 0.06, outline=0, bevel=0)
PY = BY - D / 2 - 0.05
box('porchfloor', M['whiteDark'], BX, PY, T - 0.005, 0.22, 0.1, 0.03, outline=0.002, bevel=0)
for j in range(4):
    rod(f'porchcol{j}', M['white'], (BX - 0.08 + j * 0.0533, PY - 0.03, T + 0.025), (BX - 0.08 + j * 0.0533, PY - 0.03, T + 0.15), 0.011, segs=10, outline=0.002)
box('porchbeam', M['white'], BX, PY, T + 0.15, 0.22, 0.1, 0.025, outline=0.002, bevel=0)
loft('porchpediment', M['white'], [[(BX - 0.11, PY - 0.05, T + 0.17), (BX + 0.11, PY - 0.05, T + 0.17), (BX + 0.11, PY + 0.05, T + 0.17), (BX - 0.11, PY + 0.05, T + 0.17)],
                                   [(BX - 0.004, PY - 0.05, T + 0.23), (BX + 0.004, PY - 0.05, T + 0.23), (BX + 0.004, PY + 0.05, T + 0.23), (BX - 0.004, PY + 0.05, T + 0.23)]], outline=0.003)
box('porchdoor', M['window'], BX, BY - D / 2 - 0.003, T + 0.02, 0.05, 0.006, 0.09, outline=0, bevel=0)
# the chapel's bell tower with the golden Virgin
box('chapeltower', M['white'], BX + 0.32, BY + 0.05, T - 0.005, 0.07, 0.07, 0.24, outline=0.004, bevel=0)
lathe('chapeldome', M['whiteDark'], ((0.04, 0), (0.03, 0.03), (0.004, 0.05)), T + 0.235, BX + 0.32, BY + 0.05, segs=10, outline=0.002)
lathe('virgin', M['gold'], ((0.014, 0), (0.01, 0.05), (0.004, 0.06)), T + 0.28, BX + 0.32, BY + 0.05, segs=8, outline=0.001)
ball('virginhead', M['gold'], BX + 0.32, BY + 0.05, T + 0.345, 0.008, outline=0)
# the little iron tower
for sx in (-1, 1):
    for sy in (-1, 1):
        bar(f'irontower{sx}{sy}', M['iron'], (-0.42 + sx * 0.04, 0.55 + sy * 0.04, G + 0.2), (-0.42, 0.55, G + 0.6), 0.008, outline=0.001)
for z in (0.3, 0.42):
    box(f'ironring{z}', M['iron'], -0.42, 0.55, G + z, 0.06 - (z - 0.3) * 0.15, 0.06 - (z - 0.3) * 0.15, 0.008, outline=0, bevel=0)

# ---------- Vieux Lyon ----------
for k in range(9):
    x = -0.85 + k * 0.2
    y = -0.5 + rng.uniform(-0.03, 0.03)
    if math.hypot(x, y) > 1.05:
        continue
    h = rng.uniform(0.14, 0.2)
    box(f'house{k}', M[('ochre', 'pink', 'rose')[k % 3]], x, y, G - 0.005, 0.18, 0.16, h, outline=0.005, bevel=0)
    for r in range(3):
        box(f'housewin{k}{r}', M['window'], x, y - 0.083, G + 0.03 + r * 0.05, 0.12, 0.006, 0.022, outline=0, bevel=0)
    loft(f'houseroof{k}', M['roof'], [[(x - 0.09, y - 0.08, G + h - 0.005), (x + 0.09, y - 0.08, G + h - 0.005), (x + 0.09, y + 0.08, G + h - 0.005), (x - 0.09, y + 0.08, G + h - 0.005)],
                                      [(x - 0.09, y - 0.004, G + h + 0.05), (x + 0.09, y - 0.004, G + h + 0.05), (x + 0.09, y + 0.004, G + h + 0.05), (x - 0.09, y + 0.004, G + h + 0.05)]], outline=0.003)
for k, (x, y) in enumerate(((-0.6, 0.15), (0.6, 0.2), (-0.35, 0.05), (0.4, 0.05))):
    ball(f'tree{k}', M['tree'], x, y, G + 0.14, 0.07, outline=0.006)

turn(before, -20)
render(G)
