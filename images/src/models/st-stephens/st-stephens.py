# A cartoon St. Stephen's Cathedral for the country maps, built in the set's shared look
# (../toon.py): Vienna's Stephansdom on its square, the great steep roof patterned in zigzags of
# green, gold and black tiles, the soaring Gothic south tower tapering in stages to its tip, the
# unfinished north tower with its little cupola, and the west front's two Heathen Towers. Turned a
# little towards the camera.
# Run: blender -b --factory-startup -P st-stephens.py -- st-stephens-1024.png 1024 st-stephens.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#d0c8b8', shadow_mul=(0.84, 0.82, 0.88), lift=0.2),
    'stone': toon('stone', '#d8ccb0', shadow_mul=(0.84, 0.84, 0.88), lift=0.1),
    'stoneDark': toon('stoneDark', '#b0a284'),
    'tileGold': toon('tileGold', '#e8c040', lift=0.2),
    'tileGreen': toon('tileGreen', '#3a8a6a', lift=0.1),
    'tileBlack': toon('tileBlack', '#3a3a40'),
    'tileWhite': toon('tileWhite', '#f0ece0', lift=0.15),
    'window': flat('window', '#3a3a48'),
    'copper': toon('copper', '#5aa88a', lift=0.12),
})

G = tile(M['paving'])
before = set(bpy.data.objects)

X0, X1, Y, W, H = -0.48, 0.42, 0.18, 0.3, 0.24
box('nave', M['stone'], (X0 + X1) / 2, Y, G - 0.005, X1 - X0, W, H, outline=0.009, bevel=0)
for j in range(7):
    x = X0 + 0.1 + j * 0.12
    box(f'navewin{j}', M['window'], x, Y - W / 2 - 0.003, G + 0.06, 0.04, 0.006, 0.14, outline=0, bevel=0)
    box(f'buttress{j}', M['stoneDark'], x + 0.06, Y - W / 2 - 0.015, G - 0.005, 0.025, 0.03, H - 0.02, outline=0.002, bevel=0)
    lathe(f'pinnacle{j}', M['stoneDark'], ((0.014, 0), (0.004, 0.06)), G + H - 0.03, x + 0.06, Y - W / 2 - 0.015, segs=4, outline=0.001, smooth=False)
# the great roof
RT = 0.36
loft('roof', M['tileWhite'], [[(X0, Y - W / 2 - 0.005, G + H - 0.005), (X1, Y - W / 2 - 0.005, G + H - 0.005), (X1, Y + W / 2 + 0.005, G + H - 0.005), (X0, Y + W / 2 + 0.005, G + H - 0.005)],
                              [(X0, Y - 0.004, G + H + RT), (X1, Y - 0.004, G + H + RT), (X1, Y + 0.004, G + H + RT), (X0, Y + 0.004, G + H + RT)]], outline=0.007)


def onroof(x, t, lift=0.006):
    """A point on the roof's front slope, t from the eaves (0) to the ridge (1)."""
    y = Y - W / 2 - 0.005 + t * (W / 2)
    z = G + H - 0.005 + t * RT
    n = (W / 2, RT)
    L = math.hypot(*n)
    return (x, y - lift * RT / L, z + lift * (W / 2) / L)


for row, (t0, mat) in enumerate(((0.12, 'tileGreen'), (0.36, 'tileGold'), (0.6, 'tileBlack'))):
    n = 12
    pts = [onroof(X0 + 0.02 + i * (X1 - X0 - 0.04) / n, t0 + (0.12 if i % 2 else 0.0)) for i in range(n + 1)]
    for i in range(n):
        bar(f'zigzag{row}{i}', M[mat], pts[i], pts[i + 1], 0.03, outline=0)
        bar(f'zigzagb{row}{i}', M[mat], onroof(pts[i][0], (t0 + (0.12 if i % 2 else 0.0)) + 0.06), onroof(pts[i + 1][0], (t0 + (0.0 if i % 2 else 0.12)) + 0.06), 0.03, outline=0)
for row, t0 in enumerate((0.03, 0.84)):
    bar(f'band{row}', M['tileGreen' if row else 'tileGold'], onroof(X0 + 0.02, t0), onroof(X1 - 0.02, t0), 0.025, outline=0)
# the apse
lathe('apse', M['stone'], ((0.15, 0), (0.15, H)), G - 0.005, X1, Y, segs=10, outline=0.007, smooth=False)
lathe('apseroof', M['tileWhite'], ((0.155, 0), (0.004, 0.3)), G + H - 0.005, X1, Y, segs=10, outline=0.005, smooth=False)

# ---------- the south tower ----------
SX, SY = 0.0, Y - W / 2 - 0.08
box('southtower', M['stone'], SX, SY, G - 0.005, 0.15, 0.15, 0.32, outline=0.008, bevel=0)
box('southdoor', M['window'], SX, SY - 0.078, G - 0.005, 0.05, 0.006, 0.1, outline=0, bevel=0)
for k in range(2):
    box(f'southwin{k}', M['window'], SX, SY - 0.078, G + 0.15 + k * 0.08, 0.04, 0.006, 0.06, outline=0, bevel=0)
z = G + 0.315
for k, (r0, r1, h) in enumerate(((0.075, 0.06, 0.16), (0.058, 0.044, 0.14), (0.042, 0.026, 0.12))):
    lathe(f'stage{k}', M['stone'], ((r0, 0), (r1, h)), z, SX, SY, segs=8, outline=0.005, smooth=False)
    for j in range(8):
        a = 2 * math.pi * (j + 0.5) / 8
        lathe(f'stagepin{k}{j}', M['stoneDark'], ((0.01, 0), (0.003, 0.05)), z + h - 0.01, SX + r1 * math.cos(a), SY + r1 * math.sin(a), segs=4, outline=0.001, smooth=False)
        if j % 2 == 0:
            box(f'stagewin{k}{j}', M['window'], SX + (r0 * 0.93) * math.cos(a), SY + (r0 * 0.93) * math.sin(a), z + h * 0.25, 0.02, 0.006, h * 0.45, rot_z=a + math.pi / 2, outline=0, bevel=0)
    z += h
lathe('spiretip', M['stone'], ((0.026, 0), (0.004, 0.2)), z, SX, SY, segs=8, outline=0.003, smooth=False)
ball('spireball', M['tileGold'], SX, SY, z + 0.2, 0.01, outline=0)

# ---------- the north tower and the west front ----------
box('northtower', M['stone'], 0.0, Y + W / 2 + 0.06, G - 0.005, 0.13, 0.13, 0.36, outline=0.007, bevel=0)
lathe('northcupola', M['copper'], ((0.05, 0), (0.045, 0.04), (0.02, 0.07), (0.004, 0.1)), G + 0.355, 0.0, Y + W / 2 + 0.06, segs=12, outline=0.003)
box('westfront', M['stone'], X0 - 0.02, Y, G - 0.005, 0.06, W, 0.3, outline=0.006, bevel=0)
box('giantsdoor', M['window'], X0 - 0.052, Y, G - 0.005, 0.006, 0.06, 0.1, outline=0, bevel=0)
for s in (-1, 1):
    lathe(f'heathentower{s}', M['stone'], ((0.035, 0), (0.035, 0.36)), G - 0.005, X0 - 0.03, Y + s * 0.11, segs=8, outline=0.004, smooth=False)
    lathe(f'heathenspire{s}', M['stoneDark'], ((0.038, 0), (0.004, 0.1)), G + 0.355, X0 - 0.03, Y + s * 0.11, segs=8, outline=0.003, smooth=False)

turn(before, -20)
render(G)
