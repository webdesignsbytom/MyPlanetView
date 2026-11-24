# A cartoon My Son for the country maps, built in the set's shared look (../toon.py): the Cham
# sanctuary's red-brick temple towers in a jungle clearing, the main tower's false doors and
# pilasters rising in diminishing tiers with little corner towers, two smaller towers and a ruined
# one beside it, moss on the old brick, and Cat's Tooth Mountain over the trees behind. Turned a
# little towards the camera.
# Run: blender -b --factory-startup -P my-son.py -- my-son-1024.png 1024 my-son.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'jungle': toon('jungle', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'clearing': toon('clearing', '#a8a070'),
    'brick': toon('brick', '#b05a3a', shadow_mul=(0.86, 0.78, 0.76), lift=0.06),
    'brickDark': toon('brickDark', '#8a4a30'),
    'moss': toon('moss', '#6a8a4a'),
    'dark': flat('dark', '#3a2a24'),
    'tree': toon('tree', '#3f7a3a', shadow_mul=(0.7, 0.78, 0.8)),
    'treeDark': toon('treeDark', '#2f6a34', shadow_mul=(0.7, 0.78, 0.8)),
    'mountain': toon('mountain', '#5a8a4a', shadow_mul=(0.72, 0.8, 0.74)),
})

G = tile(M['jungle'])
before = set(bpy.data.objects)
rng = random.Random(2377)

lathe('clearing', M['clearing'], ((0.72, 0), (0.72, 0.008)), G - 0.004, 0.0, -0.02, segs=32, outline=0.003)
mt = lathe('mountain', M['mountain'], ((0.34, 0), (0.22, 0.22), (0.1, 0.4), (0.004, 0.46)), G - 0.01, 0.15, 0.86, segs=20, outline=0.008)
mt.visible_shadow = False


def kalan(name, x, y, base, body_h, tiers):
    box(f'{name}body', M['brick'], x, y, G - 0.005, base, base, body_h, outline=0.007, bevel=0)
    for dx, dy in ((0, -1), (1, 0), (-1, 0), (0, 1)):
        px, py = x + dx * (base / 2 + 0.014), y + dy * (base / 2 + 0.014)
        sx, sy = (base * 0.38, 0.03) if dy else (0.03, base * 0.38)
        box(f'{name}porch{dx}{dy}', M['brickDark'], px, py, G - 0.005, sx, sy, body_h * 0.78, outline=0.003, bevel=0)
        pyramid(f'{name}porchtop{dx}{dy}', M['brickDark'], px, py, G + body_h * 0.78 - 0.01, max(sx, sy), 0.06, outline=0.002)
    box(f'{name}door', M['dark'], x, y - base / 2 - 0.03, G - 0.005, base * 0.16, 0.006, body_h * 0.45, outline=0, bevel=0)
    for s in (-1, 1):
        box(f'{name}pilaster{s}', M['brickDark'], x + s * base * 0.36, y - base / 2 - 0.003, G - 0.005, 0.022, 0.006, body_h, outline=0, bevel=0)
    for k in range(3):
        box(f'{name}moss{k}', M['moss'], x + rng.uniform(-base * 0.4, base * 0.4), y - base / 2 - 0.004, G + rng.uniform(0.02, body_h * 0.8), 0.04, 0.006, 0.025, outline=0, bevel=0)
    z = G + body_h
    w = base
    for i in range(tiers):
        box(f'{name}cornice{i}', M['brickDark'], x, y, z - 0.005, w * 1.08, w * 1.08, 0.022, outline=0.003, bevel=0)
        w *= 0.72
        th = body_h * 0.32
        box(f'{name}tier{i}', M['brick'], x, y, z + 0.012, w, w, th, outline=0.005, bevel=0)
        box(f'{name}tierdoor{i}', M['dark'], x, y - w / 2 - 0.003, z + 0.03, w * 0.2, 0.006, th * 0.6, outline=0, bevel=0)
        for sx in (-1, 1):
            for sy in (-1, 1):
                box(f'{name}corner{i}{sx}{sy}', M['brick'], x + sx * w * 0.5, y + sy * w * 0.5, z + 0.012, 0.035, 0.035, th + 0.03, outline=0.002, bevel=0)
        z += th + 0.017
    pyramid(f'{name}cap', M['brickDark'], x, y, z - 0.005, w * 0.8, w * 0.7, outline=0.003)


kalan('main', 0.0, 0.12, 0.26, 0.3, 3)
kalan('east', 0.46, -0.12, 0.17, 0.2, 2)
kalan('west', -0.45, 0.02, 0.18, 0.22, 2)
# the ruined tower and low walls
box('ruin', M['brick'], -0.12, -0.38, G - 0.005, 0.2, 0.16, 0.1, outline=0.005, bevel=0)
for k, (dx, h) in enumerate(((-0.06, 0.06), (0.03, 0.04), (0.07, 0.07))):
    box(f'ruintop{k}', M['brick'], -0.12 + dx, -0.38, G + 0.095, 0.05, 0.12, h, outline=0.003, bevel=0)
box('ruinmoss', M['moss'], -0.12, -0.461, G + 0.04, 0.08, 0.006, 0.03, outline=0, bevel=0)
for k, (x, y, sx, sy) in enumerate(((0.25, -0.45, 0.3, 0.04), (-0.6, -0.3, 0.04, 0.3), (0.55, 0.3, 0.25, 0.04))):
    box(f'lowwall{k}', M['brick'], x, y, G - 0.005, sx, sy, 0.05, outline=0.003, bevel=0)

# ---------- the jungle ----------
n = 0
for k in range(200):
    a = rng.uniform(0, 2 * math.pi)
    rr = rng.uniform(0.76, 1.12)
    x, y = rr * math.cos(a), rr * math.sin(a)
    if math.hypot(x - 0.15, y - 0.86) < 0.36:
        continue
    r = rng.uniform(0.08, 0.13)
    ball(f'tree{k}', M['tree' if k % 2 else 'treeDark'], x, y, G + r * 1.1, r, outline=0.008)
    n += 1
    if n >= 24:
        break

turn(before, -20)
render(G)
