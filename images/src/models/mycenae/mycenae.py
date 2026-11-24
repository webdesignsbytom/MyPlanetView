# A cartoon Mycenae for the country maps, built in the set's shared look (../toon.py): the Lion Gate,
# its two great stone jambs and the huge lintel with the relief of two lions rearing either side of a
# column above it, set in the Cyclopean walls of enormous rough blocks, the ramp leading up to it, the
# round Grave Circle inside, and the rocky citadel hill with olive trees and the mountains behind.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P mycenae.py -- mycenae-1024.png 1024 mycenae.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'ground': toon('ground', '#c8b890', shadow_mul=(0.84, 0.82, 0.78), lift=0.2),
    'stone': toon('stone', '#b8aa90', shadow_mul=(0.84, 0.84, 0.88), lift=0.1),
    'stoneLight': toon('stoneLight', '#cfc2a6', lift=0.12),
    'stoneDark': toon('stoneDark', '#968a72'),
    'dark': flat('dark', '#2e2a26'),
    'hill': toon('hill', '#a8a070', shadow_mul=(0.8, 0.8, 0.8)),
    'olive': toon('olive', '#8aa060', shadow_mul=(0.72, 0.8, 0.76)),
    'trunk': toon('trunk', '#6a4a36'),
})

G = tile(M['ground'])
before = set(bpy.data.objects)
rng = random.Random(1250)

# ---------- the mountains and the citadel's rock behind ----------
for k, (x, y, r, h) in enumerate(((-0.6, 0.85, 0.35, 0.36), (0.25, 0.95, 0.32, 0.42), (0.8, 0.65, 0.3, 0.3))):
    hl = lathe(f'mountain{k}', M['hill'], ((r, 0), (r * 0.72, h * 0.55), (r * 0.32, h * 0.9), (0.004, h)), G - 0.01, x, y, segs=18, outline=0.008)
    hl.visible_shadow = False

# ---------- the Cyclopean walls, of huge uneven blocks ----------
WY, WH = 0.05, 0.3
GW = 0.14      # the gateway's width


def wall_run(name, x0, x1, y, h):
    x = x0
    k = 0
    while x < x1 - 0.01:
        w = min(rng.uniform(0.09, 0.15), x1 - x)
        for row, (z0, hh) in enumerate(((0.0, h * 0.45), (h * 0.45, h * 0.55))):
            off = rng.uniform(-0.01, 0.01)
            box(f'{name}{k}{row}', M[rng.choice(('stone', 'stoneLight', 'stoneDark'))], x + w / 2 + off * row, y + rng.uniform(-0.008, 0.008), G - 0.005 + z0, w - 0.006, 0.12, hh - 0.004, outline=0.004, bevel=0)
        x += w
        k += 1


wall_run('leftwall', -0.85, -GW / 2 - 0.03, WY, WH)
wall_run('rightwall', GW / 2 + 0.03, 0.85, WY + 0.12, WH)    # the bastion jutting out on the right
# the gate: two jambs, the lintel and the relieving triangle with the lions
for s in (-1, 1):
    box(f'jamb{s}', M['stoneLight'], s * (GW / 2 + 0.015), WY, G - 0.005, 0.05, 0.13, 0.2, outline=0.006, bevel=0)
box('gatedark', M['dark'], 0, WY + 0.03, G - 0.005, GW, 0.006, 0.2, outline=0, bevel=0)
box('lintel', M['stoneLight'], 0, WY, G + 0.195, GW + 0.12, 0.14, 0.05, outline=0.006, bevel=0)
loft('relief', M['stoneLight'], [[(-0.1, WY - 0.06, G + 0.245), (0.1, WY - 0.06, G + 0.245), (0.1, WY + 0.0, G + 0.245), (-0.1, WY + 0.0, G + 0.245)],
                                 [(-0.004, WY - 0.06, G + 0.4), (0.004, WY - 0.06, G + 0.4), (0.004, WY + 0.0, G + 0.4), (-0.004, WY + 0.0, G + 0.4)]], outline=0.005)
rod('reliefcolumn', M['stoneDark'], (0, WY - 0.064, G + 0.25), (0, WY - 0.064, G + 0.33), 0.01, r2=0.014, segs=6, outline=0.001)
for s in (-1, 1):
    # each lion rearing up with its forepaws on the altar under the column
    bar(f'lionbody{s}', M['stoneDark'], (s * 0.06, WY - 0.064, G + 0.26), (s * 0.025, WY - 0.064, G + 0.33), 0.022, outline=0.001)
    bar(f'lionleg{s}', M['stoneDark'], (s * 0.07, WY - 0.064, G + 0.25), (s * 0.075, WY - 0.064, G + 0.275), 0.012, outline=0)
    ball(f'lionhead{s}', M['stoneDark'], s * 0.02, WY - 0.066, G + 0.345, 0.012, outline=0)
# the walls over the gate
box('gatewalltop', M['stone'], 0, WY + 0.02, G + 0.245, 0.3, 0.1, 0.07, outline=0.004, bevel=0)

# ---------- the ramp and the Grave Circle ----------
box('ramp', M['stoneLight'], 0, WY - 0.35, G - 0.004, 0.16, 0.6, 0.012, outline=0.002, bevel=0)
GC = (-0.35, 0.42)
for k in range(24):
    a = 2 * math.pi * k / 24
    box(f'circleslab{k}', M['stoneLight'], GC[0] + 0.2 * math.cos(a), GC[1] + 0.2 * math.sin(a), G - 0.005, 0.05, 0.02, 0.05, rot_z=a + math.pi / 2, outline=0.002, bevel=0)
for k in range(4):
    box(f'shaftgrave{k}', M['dark'], GC[0] - 0.06 + (k % 2) * 0.12, GC[1] - 0.06 + (k // 2) * 0.12, G - 0.003, 0.07, 0.05, 0.004, outline=0, bevel=0)

# ---------- olives ----------
for k, (x, y) in enumerate(((-0.65, -0.45), (0.6, -0.4), (-0.35, -0.85), (0.4, -0.85), (0.5, 0.4))):
    rod(f'olivetrunk{k}', M['trunk'], (x, y, G), (x, y, G + 0.06), 0.014, segs=6, outline=0.002)
    ball(f'olive{k}', M['olive'], x, y, G + 0.12, 0.09, outline=0.01)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
