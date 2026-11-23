# A cartoon Batalha Monastery for the country maps, built in the set's shared look (../toon.py):
# the Gothic abbey church of golden limestone bristling with pinnacles and openwork parapets, the
# Founder's Chapel with its octagonal lantern projecting in front, the roofless octagon of the
# Unfinished Chapels with its great buttresses at the east end, and the statue of Nuno Álvares
# Pereira on horseback on the square. Turned a little towards the camera.
# Run: blender -b --factory-startup -P batalha.py -- batalha-1024.png 1024 batalha.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#d8d0c0', shadow_mul=(0.84, 0.82, 0.88), lift=0.2),
    'stone': toon('stone', '#e4c890', shadow_mul=(0.88, 0.84, 0.76), lift=0.1),
    'stoneDark': toon('stoneDark', '#c4a46a'),
    'window': flat('window', '#3a3a48'),
    'bronze': toon('bronze', '#4a5a50'),
    'roof': toon('roof', '#c06a46'),
})

G = tile(M['paving'])
before = set(bpy.data.objects)


def pinnacles(name, x0, x1, y, z, n, h=0.06):
    for j in range(n):
        x = x0 + j * (x1 - x0) / max(1, n - 1)
        lathe(f'{name}{j}', M['stoneDark'], ((0.012, 0), (0.004, h)), z, x, y, segs=4, outline=0.001, smooth=False)


# ---------- the church ----------
Y, X0, X1, W, H = 0.22, -0.42, 0.28, 0.24, 0.32
box('nave', M['stone'], (X0 + X1) / 2, Y, G - 0.005, X1 - X0, W, H, outline=0.009, bevel=0)
loft('naveroof', M['roof'], [[(X0, Y - W / 2, G + H - 0.005), (X1, Y - W / 2, G + H - 0.005), (X1, Y + W / 2, G + H - 0.005), (X0, Y + W / 2, G + H - 0.005)],
                             [(X0, Y - 0.004, G + H + 0.05), (X1, Y - 0.004, G + H + 0.05), (X1, Y + 0.004, G + H + 0.05), (X0, Y + 0.004, G + H + 0.05)]], outline=0.004)
pinnacles('navepin', X0 + 0.02, X1 - 0.02, Y - W / 2, G + H - 0.01, 12)
box('aisle', M['stone'], (X0 + X1) / 2, Y - W / 2 - 0.05, G - 0.005, X1 - X0, 0.1, 0.17, outline=0.006, bevel=0)
pinnacles('aislepin', X0 + 0.02, X1 - 0.02, Y - W / 2 - 0.1, G + 0.165, 12, 0.05)
for j in range(6):
    x = X0 + 0.06 + j * (X1 - X0 - 0.12) / 5
    box(f'clerestory{j}', M['window'], x, Y - W / 2 - 0.003, G + 0.2, 0.03, 0.006, 0.09, outline=0, bevel=0)
    box(f'buttress{j}', M['stoneDark'], x + 0.05, Y - W / 2 - 0.105, G - 0.005, 0.025, 0.025, 0.2, outline=0.001, bevel=0)
    bar(f'flyer{j}', M['stoneDark'], (x + 0.05, Y - W / 2 - 0.1, G + 0.18), (x + 0.05, Y - W / 2, G + 0.27), 0.016, outline=0.001)
# the west front
box('westfront', M['stone'], X0 - 0.03, Y - 0.03, G - 0.005, 0.06, W + 0.12, H + 0.04, outline=0.007, bevel=0)
box('westportal', M['window'], X0 - 0.062, Y - 0.03, G - 0.005, 0.006, 0.07, 0.14, outline=0, bevel=0)
cyl('westportaltop', M['window'], 0.035, 0.006, segs=12, outline=0, matrix=Matrix.Translation((X0 - 0.062, Y - 0.03, G + 0.135)) @ Matrix.Rotation(math.pi / 2, 4, 'Y'))
box('westwindow', M['window'], X0 - 0.062, Y - 0.03, G + 0.2, 0.006, 0.06, 0.1, outline=0, bevel=0)
for j in range(5):
    lathe(f'westpin{j}', M['stoneDark'], ((0.014, 0), (0.004, 0.08)), G + H + 0.03, X0 - 0.03, Y - 0.15 + j * 0.06, segs=4, outline=0.001, smooth=False)

# ---------- the Founder's Chapel ----------
FX, FY = X0 + 0.14, Y - W / 2 - 0.22
box('founders', M['stone'], FX, FY, G - 0.005, 0.24, 0.24, 0.26, outline=0.008, bevel=0)
for side in range(2):
    a = -math.pi / 2 if side == 0 else math.pi
    box(f'founderswin{side}', M['window'], FX + 0.123 * math.cos(a), FY + 0.123 * math.sin(a), G + 0.08, 0.06, 0.006, 0.14, rot_z=a + math.pi / 2, outline=0, bevel=0)
lathe('lantern', M['stone'], ((0.09, 0), (0.09, 0.1)), G + 0.255, FX, FY, segs=8, outline=0.005, smooth=False)
lathe('lanternroof', M['stoneDark'], ((0.095, 0), (0.06, 0.04), (0.004, 0.07)), G + 0.35, FX, FY, segs=8, outline=0.003, smooth=False)
for k in range(8):
    a = 2 * math.pi * k / 8
    lathe(f'lanternpin{k}', M['stoneDark'], ((0.012, 0), (0.004, 0.07)), G + 0.35, FX + 0.09 * math.cos(a), FY + 0.09 * math.sin(a), segs=4, outline=0.001, smooth=False)
for sx in (-1, 1):
    for sy in (-1, 1):
        lathe(f'founderspin{sx}{sy}', M['stoneDark'], ((0.016, 0), (0.004, 0.09)), G + 0.255, FX + sx * 0.12, FY + sy * 0.12, segs=4, outline=0.001, smooth=False)

# ---------- the Unfinished Chapels ----------
UX, UY, R = X1 + 0.2, Y, 0.18
for k in range(8):
    a0 = 2 * math.pi * k / 8 + math.pi / 8
    a1 = 2 * math.pi * (k + 1) / 8 + math.pi / 8
    mx, my = UX + R * math.cos((a0 + a1) / 2), UY + R * math.sin((a0 + a1) / 2)
    box(f'chapelwall{k}', M['stone'], mx, my, G - 0.005, 2 * R * math.sin(math.pi / 8) * 0.9, 0.035, 0.22, rot_z=(a0 + a1) / 2 + math.pi / 2, outline=0.004, bevel=0)
    bx, by = UX + (R + 0.04) * math.cos(a0), UY + (R + 0.04) * math.sin(a0)
    box(f'chapelbuttress{k}', M['stoneDark'], bx, by, G - 0.005, 0.05, 0.05, 0.3, rot_z=a0, outline=0.003, bevel=0)
    lathe(f'chapelpin{k}', M['stoneDark'], ((0.02, 0), (0.004, 0.08)), G + 0.295, bx, by, segs=4, outline=0.001, smooth=False)
    if math.sin((a0 + a1) / 2) < 0.3:
        box(f'chapelportal{k}', M['window'], UX + (R + 0.019) * math.cos((a0 + a1) / 2), UY + (R + 0.019) * math.sin((a0 + a1) / 2), G + 0.03, 0.05, 0.006, 0.12, rot_z=(a0 + a1) / 2 + math.pi / 2, outline=0, bevel=0)

# ---------- the statue ----------
SX, SY = 0.3, -0.5
box('statuebase', M['stone'], SX, SY, G - 0.005, 0.1, 0.06, 0.1, outline=0.003, bevel=0)
b = ball('horse', M['bronze'], 0, 0, 0, 0.5, outline=0.003)
b.scale = (0.09, 0.035, 0.04)
b.location = (SX, SY, G + 0.15)
for dx in (-0.03, 0.03):
    rod(f'horseleg{dx}', M['bronze'], (SX + dx, SY, G + 0.095), (SX + dx, SY, G + 0.14), 0.007, segs=6, outline=0)
rod('horseneck', M['bronze'], (SX + 0.035, SY, G + 0.16), (SX + 0.055, SY, G + 0.2), 0.012, segs=6, outline=0.001)
lathe('rider', M['bronze'], ((0.016, 0), (0.012, 0.06)), G + 0.165, SX - 0.005, SY, segs=8, outline=0.001)
ball('riderhead', M['bronze'], SX - 0.005, SY, G + 0.24, 0.011, outline=0)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
