# A cartoon Drakensberg for the country maps, built in the set's shared look (../toon.py): the
# Amphitheatre, the great crescent of sheer basalt cliffs topped with green, the Tugela Falls
# dropping from its rim in long white leaps, the grassy foothills below, and the river running out
# from the falls. Turned a little towards the camera.
# Run: blender -b --factory-startup -P drakensberg.py -- drakensberg-1024.png 1024 drakensberg.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass2', '#8ab860', shadow_mul=(0.72, 0.8, 0.74), lift=0.2),
    'foothill': toon('foothill', '#7aa850', shadow_mul=(0.72, 0.8, 0.74)),
    'basalt': toon('basalt', '#7a6a60', shadow_mul=(0.84, 0.82, 0.86)),
    'basaltDark': toon('basaltDark', '#5a4e48', shadow_mul=(0.84, 0.82, 0.86)),
    'top': toon('top', '#6a9a4a', shadow_mul=(0.72, 0.8, 0.74)),
    'falls': toon('falls', '#ffffff', shadow_mul=(0.84, 0.9, 0.97), lift=0.15),
    'river': toon('river', '#4a9ac0', lift=0.3),
})

G = tile(M['grass'])
before = set(bpy.data.objects)
rng = random.Random(2111)

# ---------- the Amphitheatre: a crescent of cliff chunks ----------
CX, CY, RO, RI = 0.0, -0.35, 1.25, 0.95
N = 9
H = 0.62
for k in range(N):
    a0 = math.radians(28 + k * 124 / N)
    a1 = math.radians(28 + (k + 1) * 124 / N)
    foot = [(CX + RI * math.cos(a0), CY + RI * math.sin(a0)), (CX + RI * math.cos(a1), CY + RI * math.sin(a1)),
            (CX + RO * math.cos(a1), CY + RO * math.sin(a1)), (CX + RO * math.cos(a0), CY + RO * math.sin(a0))]
    h = H - 0.08 * abs(k - (N - 1) / 2) / ((N - 1) / 2) + rng.uniform(-0.02, 0.02)
    inset = 0.03
    top = [(x + inset * (CX - x) / math.hypot(CX - x, CY - y), y + inset * (CY - y) / math.hypot(CX - x, CY - y)) for x, y in foot]
    c = loft(f'cliff{k}', M['basalt' if k % 2 else 'basaltDark'], [[(x, y, G - 0.01) for x, y in foot], [(x, y, G + h) for x, y in foot]], outline=0.012)
    c.visible_shadow = False
    loft(f'cliftop{k}', M['top'], [[(x, y, G + h - 0.005) for x, y in foot], [(x, y, G + h + 0.03) for x, y in top]], outline=0.008)
    mx, my = CX + RI * math.cos((a0 + a1) / 2), CY + RI * math.sin((a0 + a1) / 2)
    for j in range(2):
        bar(f'cliffstreak{k}{j}', M['basaltDark' if k % 2 else 'basalt'], (mx - 0.05 + j * 0.1, my - 0.01, G + 0.05), (mx - 0.05 + j * 0.1, my - 0.01, G + h - 0.06), 0.03, outline=0)

# ---------- the foothills ----------
for k, (x, y, r, h) in enumerate(((-0.75, 0.15, 0.32, 0.18), (0.75, 0.1, 0.3, 0.16), (-0.35, 0.35, 0.25, 0.14), (0.4, 0.38, 0.22, 0.12))):
    lathe(f'foothill{k}', M['foothill'], ((r, 0), (r * 0.6, h * 0.7), (r * 0.25, h)), G - 0.01, x, y, segs=18, outline=0.01)

# ---------- the Tugela Falls ----------
TX = 0.12
TY = CY + RI * math.sin(math.radians(84))
pts = [(TX, TY - 0.01, G + H - 0.02), (TX - 0.01, TY - 0.03, G + 0.42), (TX + 0.02, TY - 0.05, G + 0.25), (TX, TY - 0.08, G + 0.04)]
for j in range(3):
    bar(f'fall{j}', M['falls'], pts[j], (pts[j + 1][0], pts[j + 1][1], pts[j + 1][2] + 0.02), 0.04, outline=0.004)
    ball(f'splash{j}', M['falls'], pts[j + 1][0], pts[j + 1][1] - 0.01, pts[j + 1][2] + 0.02, 0.04, outline=0.004)

# ---------- the river ----------
RIV = [(TX, TY - 0.08), (0.05, 0.25), (-0.1, -0.15), (0.05, -0.55), (-0.1, -1.0), (-0.05, -1.25)]
for k in range(len(RIV) - 1):
    (x0, y0), (x1, y1) = RIV[k], RIV[k + 1]
    a = math.atan2(y1 - y0, x1 - x0) + math.pi / 2
    w = 0.05 + 0.01 * k
    quad = [(x0 - w * math.cos(a), y0 - w * math.sin(a)), (x1 - w * math.cos(a), y1 - w * math.sin(a)), (x1 + w * math.cos(a), y1 + w * math.sin(a)), (x0 + w * math.cos(a), y0 + w * math.sin(a))]
    loft(f'river{k}', M['river'], [[(x, y, G - 0.004) for x, y in quad], [(x, y, G + 0.004) for x, y in quad]], outline=0.003)
    if k:
        lathe(f'riverjoin{k}', M['river'], ((w, 0), (w, 0.008)), G - 0.004, x0, y0, segs=12, outline=0)

turn(before, -20)
render(G)
