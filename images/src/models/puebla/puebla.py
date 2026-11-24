# A cartoon Puebla Cathedral for the country maps, built in the set's shared look (../toon.py): the great
# grey stone cathedral on Puebla's zócalo, its front between the two very tall bell towers with their
# stages of arched openings and little domed tops, the long body behind with its side chapels, and
# the domes covered in yellow and blue Talavera tiles, the town's own pottery; the zócalo's trees
# in front. Turned a little towards the camera.
# Run: blender -b --factory-startup -P puebla.py -- puebla-1024.png 1024 puebla.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#d8cfbc', shadow_mul=(0.84, 0.84, 0.9), lift=0.2),
    'stone': toon('stone', '#a8a299', shadow_mul=(0.8, 0.82, 0.88), lift=0.15),
    'stoneLight': toon('stoneLight', '#cec8bc', lift=0.15),
    'roof': toon('roof', '#c8c0b0', lift=0.15),
    'talavera': toon('talavera', '#f2c640', lift=0.2),
    'tileBlue': toon('tileBlue', '#2e5aa0', lift=0.15),
    'white': toon('white', '#f6f2ea', lift=0.2),
    'dark': flat('dark', '#2e2a2a'),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#6a4a36'),
})

G = tile(M['paving'])
before = set(bpy.data.objects)


def tiled_dome(name, x, y, z0, r, h):
    """A dome of yellow Talavera tiles with blue ribs and a white lantern."""
    prof = ((r, 0), (r * 0.93, h * 0.35), (r * 0.7, h * 0.7), (r * 0.35, h * 0.93), (0.0, h))
    lathe(name, M['talavera'], prof, z0, x, y, segs=24, outline=0.004)
    for k in range(8):
        a = 2 * math.pi * k / 8
        for (r0, h0), (r1, h1) in zip(prof, prof[1:-1]):
            bar(f'{name}rib{k}{h0:.3f}', M['tileBlue'], (x + (r0 + 0.004) * math.cos(a), y + (r0 + 0.004) * math.sin(a), z0 + h0),
                (x + (r1 + 0.004) * math.cos(a), y + (r1 + 0.004) * math.sin(a), z0 + h1), r * 0.12, outline=0)
    lathe(f'{name}lantern', M['white'], ((r * 0.25, 0), (r * 0.25, h * 0.4)), z0 + h * 0.9, x, y, segs=10, outline=0.002)
    lathe(f'{name}lanterncap', M['talavera'], ((r * 0.28, 0), (r * 0.2, h * 0.15), (0.003, h * 0.4)), z0 + h * 1.3, x, y, segs=10, outline=0.002)


# ---------- the body of the cathedral ----------
CX, Y0, Y1 = 0.0, -0.08, 0.62
W, H = 0.52, 0.3
box('body', M['stone'], CX, (Y0 + Y1) / 2, G - 0.005, W, Y1 - Y0, H, outline=0.008, bevel=0)
box('bodyroof', M['roof'], CX, (Y0 + Y1) / 2, G + H - 0.005, W - 0.02, Y1 - Y0 - 0.02, 0.025, outline=0.002, bevel=0)
for s in (-1, 1):
    for k in range(4):
        box(f'sidewin{s}{k}', M['dark'], CX + s * (W / 2 + 0.003), Y0 + 0.15 + k * 0.13, G + 0.15, 0.006, 0.03, 0.08, outline=0, bevel=0)
    for k, y in enumerate((0.15, 0.36)):
        tiled_dome(f'chapeldome{s}{k}', CX + s * 0.16, y, G + H + 0.015, 0.06, 0.07)
# the crossing's drum and main dome
DY = 0.42
lathe('drum', M['stone'], ((0.12, 0), (0.12, 0.12)), G + H + 0.01, CX, DY, segs=8, outline=0.004, smooth=False)
for k in range(8):
    a = math.pi / 8 + k * math.pi / 4
    box(f'drumwin{k}', M['dark'], CX + 0.112 * math.cos(a), DY + 0.112 * math.sin(a), G + H + 0.04, 0.035, 0.006, 0.06, rot_z=a + math.pi / 2, outline=0, bevel=0)
tiled_dome('maindome', CX, DY, G + H + 0.125, 0.13, 0.15)

# ---------- the front between the two towers ----------
FY = Y0 - 0.005
box('front', M['stoneLight'], CX, FY, G - 0.005, 0.26, 0.03, 0.42, outline=0.005, bevel=0)
box('portal', M['dark'], CX, FY - 0.016, G - 0.005, 0.07, 0.006, 0.13, outline=0, bevel=0)
cyl('portaltop', M['dark'], 0.035, 0.006, segs=12, outline=0, matrix=Matrix.Translation((CX, FY - 0.016, G + 0.125)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
for s in (-1, 1):
    for j in (0.06, 0.1):
        rod(f'frontcol{s}{j}', M['stone'], (CX + s * j, FY - 0.025, G), (CX + s * j, FY - 0.025, G + 0.3), 0.009, segs=8, outline=0.001)
box('relief', M['stone'], CX, FY - 0.017, G + 0.19, 0.08, 0.006, 0.1, outline=0, bevel=0)
box('window', M['dark'], CX, FY - 0.018, G + 0.32, 0.04, 0.006, 0.05, outline=0, bevel=0)
loft('frontcrest', M['stoneLight'], [[(CX - 0.1, FY - 0.015, G + 0.415), (CX + 0.1, FY - 0.015, G + 0.415), (CX + 0.1, FY + 0.015, G + 0.415), (CX - 0.1, FY + 0.015, G + 0.415)],
                                     [(CX - 0.03, FY - 0.015, G + 0.48), (CX + 0.03, FY - 0.015, G + 0.48), (CX + 0.03, FY + 0.015, G + 0.48), (CX - 0.03, FY + 0.015, G + 0.48)]], outline=0.003)
for s in (-1, 1):
    x = CX + s * 0.2
    box(f'tower{s}', M['stone'], x, Y0 + 0.02, G - 0.005, 0.15, 0.15, 0.44, outline=0.007, bevel=0)
    box(f'towerwin{s}', M['dark'], x, Y0 - 0.056, G + 0.25, 0.03, 0.006, 0.07, outline=0, bevel=0)
    for st, (w, z0, h) in enumerate(((0.13, 0.435, 0.14), (0.105, 0.57, 0.12))):
        box(f'belfry{s}{st}', M['stoneLight'], x, Y0 + 0.02, G + z0, w, w, h, outline=0.005, bevel=0)
        for f in range(2):
            ox = (-0.025 + f * 0.05) * w / 0.13
            box(f'belfryopen{s}{st}{f}', M['dark'], x + ox, Y0 + 0.02 - w / 2 - 0.004, G + z0 + 0.02, 0.025 * w / 0.13, 0.006, h - 0.05, outline=0, bevel=0)
            cyl(f'belfryarch{s}{st}{f}', M['dark'], 0.0125 * w / 0.13, 0.006, segs=10, outline=0, matrix=Matrix.Translation((x + ox, Y0 + 0.02 - w / 2 - 0.004, G + z0 + h - 0.03)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
        box(f'belfrycornice{s}{st}', M['stone'], x, Y0 + 0.02, G + z0 + h - 0.01, w + 0.02, w + 0.02, 0.018, outline=0.002, bevel=0)
    lathe(f'towerdome{s}', M['talavera'], ((0.055, 0), (0.05, 0.03), (0.03, 0.06), (0.003, 0.075)), G + 0.695, x, Y0 + 0.02, segs=12, outline=0.003)
    lathe(f'towerlantern{s}', M['stoneLight'], ((0.015, 0), (0.015, 0.04), (0.003, 0.07)), G + 0.765, x, Y0 + 0.02, segs=8, outline=0.002, smooth=False)

# ---------- the zócalo's trees ----------
for k, (x, y) in enumerate(((-0.6, -0.55), (-0.25, -0.75), (0.25, -0.75), (0.6, -0.55), (-0.85, -0.1), (0.85, -0.1))):
    rod(f'trunk{k}', M['trunk'], (x, y, G), (x, y, G + 0.08), 0.014, segs=6, outline=0.002)
    ball(f'tree{k}', M['tree'], x, y, G + 0.16, 0.11, outline=0.01)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
