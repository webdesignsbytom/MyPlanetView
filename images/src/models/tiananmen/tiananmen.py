# A cartoon Tiananmen, the Gate of Heavenly Peace, for the country maps, built in the set's shared
# look (../toon.py): the great red gate on its tall red wall with five arched passages, the double
# yellow-tiled hip roof of the gate tower above on its red columns, the red lanterns, the moat in front
# with its five white marble bridges and the carved white columns (huabiao) and stone lions guarding
# them. Turned a little towards the camera.
# Run: blender -b --factory-startup -P tiananmen.py -- tiananmen-1024.png 1024 tiananmen.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#ccc4b4', shadow_mul=(0.82, 0.8, 0.88), lift=0.2),
    'red': toon('red', '#c8372e', shadow_mul=(0.86, 0.76, 0.76), lift=0.08),
    'redDark': toon('redDark', '#a02a24'),
    'yellow': toon('yellow', '#f0b830', shadow_mul=(0.86, 0.78, 0.66), lift=0.15),
    'green': toon('green', '#3a8a7a', lift=0.1),
    'marble': toon('marble', '#f4f2ec', lift=0.2),
    'water': toon('water', '#4a8ab0', lift=0.3),
    'dark': flat('dark', '#2a2222'),
    'lantern': toon('lantern', '#e8302a', lift=0.25),
    'stone': toon('stone', '#d8d0c0'),
})

G = tile(M['paving'])
before = set(bpy.data.objects)

GY = 0.3                 # the gate's front face
WW, WD, WH = 1.36, 0.36, 0.3
# ---------- the wall and its passages ----------
box('wall', M['red'], 0, GY + WD / 2, G - 0.005, WW, WD, WH, outline=0.009, bevel=0)
box('wallbase', M['stone'], 0, GY + WD / 2, G - 0.005, WW + 0.02, WD + 0.02, 0.03, outline=0.003, bevel=0)
box('wallcap', M['yellow'], 0, GY + WD / 2, G + WH - 0.005, WW + 0.02, WD + 0.02, 0.02, outline=0.003, bevel=0)
for j, x in enumerate((-0.42, -0.21, 0.0, 0.21, 0.42)):
    w = 0.09 if j == 2 else 0.06
    h = 0.14 if j == 2 else 0.1
    box(f'passage{j}', M['dark'], x, GY - 0.003, G - 0.005, w, 0.006, h, outline=0, bevel=0)
    cyl(f'passagetop{j}', M['dark'], w / 2, 0.006, segs=14, outline=0, matrix=Matrix.Translation((x, GY - 0.003, G + h - 0.005)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
box('portrait', M['stone'], 0, GY - 0.004, G + 0.18, 0.08, 0.006, 0.1, outline=0, bevel=0)
for s in (-1, 1):
    box(f'banner{s}', M['marble'], s * 0.24, GY - 0.004, G + 0.18, 0.2, 0.006, 0.05, outline=0, bevel=0)

# ---------- the gate tower ----------
TW, TD = 1.0, 0.26
TZ = G + WH + 0.015
box('terrace', M['marble'], 0, GY + WD / 2, TZ - 0.005, WW - 0.06, WD - 0.04, 0.02, outline=0.003, bevel=0)
box('hall', M['red'], 0, GY + WD / 2, TZ + 0.01, TW, TD, 0.14, outline=0.007, bevel=0)
for j in range(10):
    x = -TW / 2 + 0.03 + j * (TW - 0.06) / 9
    rod(f'column{j}', M['redDark'], (x, GY + WD / 2 - TD / 2 - 0.03, TZ + 0.01), (x, GY + WD / 2 - TD / 2 - 0.03, TZ + 0.15), 0.012, segs=8, outline=0.002)
box('eavesband', M['green'], 0, GY + WD / 2, TZ + 0.14, TW + 0.08, TD + 0.08, 0.025, outline=0.003, bevel=0)


def hiproof(name, w, d, z, h, overhang, ridge):
    """A hip roof of yellow tiles, its eaves flaring out past the walls."""
    x0, y0 = w / 2 + overhang, d / 2 + overhang
    rx = ridge / 2
    cy = GY + WD / 2
    loft(name, M['yellow'], [[(-x0, cy - y0, z), (x0, cy - y0, z), (x0, cy + y0, z), (-x0, cy + y0, z)],
                             [(-x0 + 0.04, cy - y0 + 0.04, z + h * 0.25), (x0 - 0.04, cy - y0 + 0.04, z + h * 0.25), (x0 - 0.04, cy + y0 - 0.04, z + h * 0.25), (-x0 + 0.04, cy + y0 - 0.04, z + h * 0.25)],
                             [(-rx, cy - 0.01, z + h), (rx, cy - 0.01, z + h), (rx, cy + 0.01, z + h), (-rx, cy + 0.01, z + h)]], outline=0.006)
    box(name + 'ridge', M['yellow'], 0, cy, z + h - 0.005, 2 * rx + 0.04, 0.025, 0.02, outline=0.002, bevel=0)
    for s in (-1, 1):
        ball(name + f'beast{s}', M['yellow'], s * (rx + 0.02), cy, z + h + 0.02, 0.016, outline=0.002)


hiproof('lowerroof', TW, TD, TZ + 0.16, 0.08, 0.1, TW - 0.1)
box('upperhall', M['red'], 0, GY + WD / 2, TZ + 0.22, TW - 0.12, TD - 0.06, 0.06, outline=0.004, bevel=0)
hiproof('upperroof', TW - 0.12, TD - 0.06, TZ + 0.275, 0.14, 0.1, TW - 0.4)
for k, x in enumerate((-0.32, -0.12, 0.12, 0.32)):
    rod(f'lanterncord{k}', M['dark'], (x, GY + WD / 2 - TD / 2 - 0.06, TZ + 0.17), (x, GY + WD / 2 - TD / 2 - 0.06, TZ + 0.13), 0.003, segs=4, outline=0)
    lt = ball(f'lantern{k}', M['lantern'], 0, 0, 0, 0.03, outline=0.003)
    lt.scale = (1.0, 1.0, 0.8)
    lt.location = (x, GY + WD / 2 - TD / 2 - 0.06, TZ + 0.11)

# ---------- the moat, bridges, columns and lions ----------
MY = -0.12
box('moatrim', M['stone'], 0, MY, G - 0.005, 1.5, 0.22, 0.02, outline=0.002, bevel=0)
box('moat', M['water'], 0, MY, G + 0.002, 1.46, 0.16, 0.02, outline=0, bevel=0)
for j, x in enumerate((-0.42, -0.21, 0.0, 0.21, 0.42)):
    w = 0.12 if j == 2 else 0.09
    box(f'bridge{j}', M['marble'], x, MY, G + 0.02, w, 0.3, 0.025, outline=0.003, bevel=0)
    for s in (-1, 1):
        bar(f'bridgerail{j}{s}', M['marble'], (x + s * (w / 2 - 0.005), MY - 0.15, G + 0.06), (x + s * (w / 2 - 0.005), MY + 0.15, G + 0.06), 0.008, outline=0.001)
for s in (-1, 1):
    hx = s * 0.6
    rod(f'huabiao{s}', M['marble'], (hx, MY - 0.28, G), (hx, MY - 0.28, G + 0.32), 0.022, segs=8, outline=0.003)
    lathe(f'huabiaotop{s}', M['marble'], ((0.04, 0), (0.04, 0.02), (0.02, 0.05)), G + 0.32, hx, MY - 0.28, segs=10, outline=0.002)
    bar(f'huabiaowing{s}', M['marble'], (hx - 0.05, MY - 0.28, G + 0.26), (hx + 0.05, MY - 0.28, G + 0.26), 0.02, outline=0.002)
    lx = s * 0.12
    box(f'lionplinth{s}', M['stone'], lx, MY - 0.3, G - 0.005, 0.07, 0.07, 0.06, outline=0.002, bevel=0)
    lion = ball(f'lion{s}', M['stone'], 0, 0, 0, 0.03, outline=0.003)
    lion.scale = (0.9, 1.0, 1.3)
    lion.location = (lx, MY - 0.3, G + 0.09)
    ball(f'lionhead{s}', M['stone'], lx, MY - 0.32, G + 0.135, 0.02, outline=0.002)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
