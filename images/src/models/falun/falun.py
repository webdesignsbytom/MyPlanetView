# A cartoon Falun for the country maps, built in the set's shared look (../toon.py): the great copper
# mountain in Dalarna, the Great Pit (Stora Stöten) opening in the rusty, ore-stained ground, and
# beside it the mine's buildings in their own Falu red with white trim: the tall wooden headframe
# over its shaft with its winding wheel, the shaft house and the long red buildings with their
# black roofs. Turned a little towards the camera.
# Run: blender -b --factory-startup -P falun.py -- falun-1024.png 1024 falun.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'ore': toon('ore', '#a8684a', shadow_mul=(0.76, 0.72, 0.76)),
    'pitfloor': toon('pitfloor', '#6a4a3e'),
    'red': toon('red', '#a8322a', shadow_mul=(0.78, 0.72, 0.76), lift=0.12),
    'white': toon('white', '#f4f2ea', lift=0.2),
    'black': toon('black', '#3a3a40'),
    'timber': toon('timber', '#7a5236'),
    'dark': flat('dark', '#2e2a2a'),
    'fir': toon('fir', '#3a6e3a', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['grass'])
before = set(bpy.data.objects)


def gable(name, mat, cx, cy, z0, hx, hy, z1, along_x=True):
    top = (hx, 0.004) if along_x else (0.004, hy)
    loft(name, mat, [[(cx - hx, cy - hy, z0), (cx + hx, cy - hy, z0), (cx + hx, cy + hy, z0), (cx - hx, cy + hy, z0)],
                     [(cx - top[0], cy - top[1], z1), (cx + top[0], cy - top[1], z1), (cx + top[0], cy + top[1], z1), (cx - top[0], cy + top[1], z1)]], outline=0.004)


def red_house(name, x, y, w, d, h, roof_h, along_x=True):
    box(name, M['red'], x, y, G - 0.005, w, d, h, outline=0.005, bevel=0)
    n = max(1, int(w / 0.09))
    for j in range(n):
        wx = x - w / 2 + (j + 0.5) * w / n
        box(f'{name}win{j}', M['white'], wx, y - d / 2 - 0.004, G + h * 0.45, 0.034, 0.006, 0.045, outline=0, bevel=0)
        box(f'{name}pane{j}', M['dark'], wx, y - d / 2 - 0.007, G + h * 0.45 + 0.005, 0.024, 0.006, 0.035, outline=0, bevel=0)
    for s in (-1, 1):
        box(f'{name}corner{s}', M['white'], x + s * (w / 2 - 0.004), y - d / 2 - 0.003, G - 0.005, 0.012, 0.008, h, outline=0, bevel=0)
    gable(f'{name}roof', M['black'], x, y, G + h - 0.005, w / 2 + 0.02, d / 2 + 0.02, G + h + roof_h, along_x)


# ---------- the Great Pit in its rusty spoil ground ----------
PX, PY = -0.38, -0.22
pit = lathe('pit', M['ore'], ((0.0, 0.004), (0.2, 0.004), (0.36, 0.13), (0.42, 0.15), (0.52, 0.13), (0.82, 0.0)), G - 0.01, PX, PY, segs=40, outline=0.006)
pit.visible_shadow = False
lathe('pitfloor', M['pitfloor'], ((0.2, 0), (0.2, 0.004)), G - 0.008, PX, PY, segs=40, outline=0)
# the fence round the rim
for k in range(18):
    a0, a1 = 2 * math.pi * k / 18, 2 * math.pi * (k + 1) / 18
    p0 = (PX + 0.45 * math.cos(a0), PY + 0.45 * math.sin(a0), G + 0.145)
    p1 = (PX + 0.45 * math.cos(a1), PY + 0.45 * math.sin(a1), G + 0.145)
    bar(f'fencerail{k}', M['timber'], (p0[0], p0[1], p0[2] + 0.04), (p1[0], p1[1], p1[2] + 0.04), 0.008, outline=0.001)
    bar(f'fencepost{k}', M['timber'], p0, (p0[0], p0[1], p0[2] + 0.05), 0.01, outline=0.001)

# ---------- the headframe over its shaft ----------
HX, HY = 0.42, -0.05
box('shafthouse', M['red'], HX, HY, G - 0.005, 0.24, 0.2, 0.16, outline=0.005, bevel=0)
box('shaftdoor', M['dark'], HX, HY - 0.103, G - 0.005, 0.05, 0.006, 0.08, outline=0, bevel=0)
gable('shaftroof', M['black'], HX, HY, G + 0.155, 0.14, 0.12, G + 0.24, along_x=True)
box('headframe', M['red'], HX, HY, G + 0.15, 0.12, 0.12, 0.42, outline=0.005, bevel=0)
for k in range(3):
    box(f'headwin{k}', M['white'], HX, HY - 0.063, G + 0.27 + k * 0.1, 0.035, 0.006, 0.05, outline=0, bevel=0)
    box(f'headpane{k}', M['dark'], HX, HY - 0.066, G + 0.275 + k * 0.1, 0.025, 0.006, 0.04, outline=0, bevel=0)
for s in (-1, 1):
    box(f'headcorner{s}', M['white'], HX + s * 0.056, HY - 0.061, G + 0.15, 0.01, 0.006, 0.42, outline=0, bevel=0)
loft('headroof', M['black'], [[(HX - 0.08, HY - 0.08, G + 0.565), (HX + 0.08, HY - 0.08, G + 0.565), (HX + 0.08, HY + 0.08, G + 0.565), (HX - 0.08, HY + 0.08, G + 0.565)],
                              [(HX - 0.004, HY - 0.004, G + 0.68), (HX + 0.004, HY - 0.004, G + 0.68), (HX + 0.004, HY + 0.004, G + 0.68), (HX - 0.004, HY + 0.004, G + 0.68)]], outline=0.004)
# the winding wheel on the side
cyl('wheel', M['timber'], 0.07, 0.012, segs=20, outline=0.003, matrix=Matrix.Translation((HX + 0.07, HY, G + 0.48)) @ Matrix.Rotation(math.pi / 2, 4, 'Y'))
for k in range(4):
    a = k * math.pi / 4
    bar(f'spoke{k}', M['dark'], (HX + 0.078, HY - 0.06 * math.cos(a), G + 0.48 - 0.06 * math.sin(a)), (HX + 0.078, HY + 0.06 * math.cos(a), G + 0.48 + 0.06 * math.sin(a)), 0.006, outline=0)

# ---------- the long red mine buildings ----------
red_house('office', 0.05, 0.6, 0.5, 0.18, 0.16, 0.1)
red_house('smithy', 0.68, 0.45, 0.24, 0.16, 0.12, 0.08)
red_house('store', -0.6, 0.5, 0.3, 0.16, 0.13, 0.08)

for k, (x, y, h) in enumerate(((0.9, -0.45, 0.42), (-0.2, 0.95, 0.46), (0.5, 0.95, 0.4), (-0.95, 0.25, 0.44), (0.25, -0.85, 0.38))):
    lathe(f'fir{k}', M['fir'], ((0.1, 0), (0.065, h * 0.45), (0.003, h)), G + 0.02, x, y, segs=10, outline=0.006, smooth=False)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
