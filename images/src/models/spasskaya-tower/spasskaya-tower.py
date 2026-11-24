# A cartoon Spasskaya Tower for the country maps, built in the set's shared look (../toon.py): the
# Kremlin's red brick gate tower over Red Square, its gate arch, the white stone lace of its upper
# tiers, the great clock with its gold hands on every side, the green tented spire and the ruby star
# on top, with the Kremlin's swallowtail-crenellated red wall running off either side and the
# cobbles of the square in front. Turned a little towards the camera.
# Run: blender -b --factory-startup -P spasskaya-tower.py -- spasskaya-tower-1024.png 1024 spasskaya-tower.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'cobbles': toon('cobbles', '#9a948c', shadow_mul=(0.84, 0.84, 0.9), lift=0.2),
    'brick': toon('brick', '#b84a3a', shadow_mul=(0.86, 0.76, 0.76), lift=0.06),
    'brickDark': toon('brickDark', '#963a2e'),
    'white': toon('white', '#f4f0e6', lift=0.2),
    'green': toon('green', '#3a7a5a', shadow_mul=(0.78, 0.86, 0.84), lift=0.1),
    'clock': toon('clock', '#2a3a6a', lift=0.1),
    'gold': toon('gold', '#f0c040', lift=0.3),
    'ruby': toon('ruby', '#e0283a', lift=0.3),
    'dark': flat('dark', '#2a2222'),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['cobbles'])
before = set(bpy.data.objects)

TX, TY = 0.0, 0.25
# ---------- the Kremlin wall ----------
WY, WH = TY + 0.04, 0.22
for s in (-1, 1):
    x0, x1 = s * 0.14, s * 1.1
    box(f'wall{s}', M['brick'], (x0 + x1) / 2, WY, G - 0.005, abs(x1 - x0), 0.12, WH, outline=0.007, bevel=0)
    n = 16
    for j in range(n):
        x = x0 + (x1 - x0) * (j + 0.5) / n
        if math.hypot(x, WY) > 1.15:
            continue
        # the swallowtail merlons
        box(f'merlon{s}{j}', M['brick'], x, WY - 0.04, G + WH - 0.005, 0.035, 0.03, 0.05, outline=0.002, bevel=0)
        box(f'notch{s}{j}', M['cobbles'], x, WY - 0.04, G + WH + 0.03, 0.012, 0.032, 0.016, outline=0, bevel=0)
    # a smaller tower along the wall on each side
    tx = s * 0.85
    box(f'walltower{s}', M['brick'], tx, WY, G - 0.005, 0.14, 0.14, 0.34, outline=0.006, bevel=0)
    lathe(f'walltowerspire{s}', M['green'], ((0.08, 0), (0.003, 0.22)), G + 0.335, tx, WY, segs=4, outline=0.003, smooth=False)
    ball(f'walltowerstar{s}', M['ruby'], tx, WY, G + 0.57, 0.016, outline=0.002)
# trees behind the wall, inside the Kremlin
for k, x in enumerate((-0.7, -0.45, 0.45, 0.7)):
    ball(f'tree{k}', M['tree'], x, WY + 0.3, G + 0.22, 0.12, outline=0.012)

# ---------- the tower ----------
box('base', M['brick'], TX, TY, G - 0.005, 0.26, 0.26, 0.42, outline=0.009, bevel=0)
box('gate', M['dark'], TX, TY - 0.133, G - 0.005, 0.08, 0.006, 0.13, outline=0, bevel=0)
cyl('gatetop', M['dark'], 0.04, 0.006, segs=14, outline=0, matrix=Matrix.Translation((TX, TY - 0.133, G + 0.125)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
box('gateicon', M['white'], TX, TY - 0.133, G + 0.2, 0.05, 0.006, 0.06, outline=0, bevel=0)
# the white-trimmed upper tiers, each a little narrower
Z = G + 0.415
for k, (w, h) in enumerate(((0.28, 0.025), (0.22, 0.12), (0.23, 0.02))):
    box(f'tier{k}', M['white'] if k != 1 else M['brick'], TX, TY, Z, w, w, h, outline=0.005, bevel=0)
    Z += h
# the white pinnacles round the clock storey
for sx in (-1, 1):
    for sy in (-1, 1):
        lathe(f'pinnacle{sx}{sy}', M['white'], ((0.02, 0), (0.018, 0.06), (0.003, 0.12)), G + 0.415, TX + sx * 0.12, TY + sy * 0.12, segs=8, outline=0.002, smooth=False)
        ball(f'pinnacleknob{sx}{sy}', M['gold'], TX + sx * 0.12, TY + sy * 0.12, G + 0.54, 0.008, outline=0)
# the clock faces on all four sides of the clock storey
CZ = G + 0.415 + 0.025 + 0.06
for k in range(4):
    a = k * math.pi / 2 - math.pi / 2
    c, s = math.cos(a), math.sin(a)
    m = Matrix.Translation((TX + c * 0.112, TY + s * 0.112, CZ)) @ Matrix.Rotation(a + math.pi / 2, 4, 'Z') @ Matrix.Rotation(math.pi / 2, 4, 'X')
    cyl(f'clockface{k}', M['clock'], 0.05, 0.006, segs=20, outline=0.002, matrix=m)
    cyl(f'clockrim{k}', M['gold'], 0.055, 0.004, segs=20, outline=0, matrix=m @ Matrix.Translation((0, 0, -0.003)))
    bar(f'hourhand{k}', M['gold'], (TX + c * 0.117, TY + s * 0.117, CZ), (TX + c * 0.117, TY + s * 0.117, CZ + 0.03), 0.006, outline=0)
    bar(f'minutehand{k}', M['gold'], (TX + c * 0.117, TY + s * 0.117, CZ), (TX + c * 0.117 - s * 0.035, TY + s * 0.117 + c * 0.035, CZ), 0.005, outline=0)
# the open octagonal belfry, the tent and the star
BZ = Z
lathe('belfry', M['brick'], ((0.09, 0), (0.09, 0.12)), BZ, TX, TY, segs=8, outline=0.005, smooth=False)
for k in range(8):
    a = 2 * math.pi * (k + 0.5) / 8
    box(f'belfryarch{k}', M['dark'], TX + 0.086 * math.cos(a), TY + 0.086 * math.sin(a), BZ + 0.03, 0.004, 0.04, 0.06, rot_z=a, outline=0, bevel=0)
lathe('belfrycornice', M['white'], ((0.1, 0), (0.1, 0.015)), BZ + 0.12, TX, TY, segs=8, outline=0.002, smooth=False)
lathe('tent', M['green'], ((0.095, 0), (0.06, 0.12), (0.03, 0.26), (0.004, 0.34)), BZ + 0.135, TX, TY, segs=8, outline=0.005, smooth=False)
SZ = BZ + 0.5
for k in range(5):
    a = 2 * math.pi * k / 5 + math.pi / 2
    bar(f'starray{k}', M['ruby'], (TX, TY, SZ), (TX + 0.05 * math.cos(a), TY, SZ + 0.05 * math.sin(a)), 0.022, outline=0.002)
ball('starcentre', M['ruby'], TX, TY, SZ, 0.022, outline=0.002)
rod('starstem', M['gold'], (TX, TY, BZ + 0.47), (TX, TY, SZ - 0.02), 0.005, segs=4, outline=0)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
