# A cartoon Timbuktu for the country maps, built in the set's shared look (../toon.py) on a tile of
# Saharan sand: the Djinguereber Mosque in sun-dried mud, its tapering minaret bristling with the
# wooden beams (toron) left in the walls for replastering, the long prayer hall with its buttresses
# rising into little pinnacles along the parapet, a second minaret, mud houses round it, an acacia
# and two people in indigo. Turned a little towards the camera.
# Run: blender -b --factory-startup -P timbuktu.py -- timbuktu-1024.png 1024 timbuktu.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sand': toon('sand', '#ead2a0', shadow_mul=(0.84, 0.74, 0.62), lift=0.25),
    'mud': toon('mud', '#c9a26b', shadow_mul=(0.84, 0.72, 0.66)),
    'mudLight': toon('mudLight', '#d8b47e', shadow_mul=(0.84, 0.72, 0.66)),
    'beam': toon('beam', '#6b4a33'),
    'door': flat('door', '#4a3428'),
    'acacia': toon('acacia', '#7a9e4e', shadow_mul=(0.72, 0.8, 0.78)),
    'trunk': toon('trunk', '#6b4a33'),
    'indigo': toon('indigo', '#2f4f9a', shadow_mul=(0.72, 0.72, 0.82)),
    'skin': toon('skin', '#7a4a30'),
})

G = tile(M['sand'])
before = set(bpy.data.objects)
rng = random.Random(163)


def toron(name, x0, x1, y, z, count, out=-1, axis='y'):
    """A row of beam ends sticking out of a wall face (the face at y, or at x with axis='x')."""
    for k in range(count):
        t = (k + 0.5) / count
        if axis == 'y':
            x = x0 + (x1 - x0) * t
            rod(f'{name}{k}', M['beam'], (x, y, z), (x, y + out * 0.05, z), 0.008, segs=6, outline=0.003)
        else:
            yy = x0 + (x1 - x0) * t
            rod(f'{name}{k}', M['beam'], (y, yy, z), (y + out * 0.05, yy, z), 0.008, segs=6, outline=0.003)


def tapered(name, mat, x, y, w0, d0, w1, d1, z0, h, outline=0.024):
    return loft(name, mat, [[(x - w0 / 2, y - d0 / 2, z0), (x + w0 / 2, y - d0 / 2, z0), (x + w0 / 2, y + d0 / 2, z0), (x - w0 / 2, y + d0 / 2, z0)],
                            [(x - w1 / 2, y - d1 / 2, z0 + h), (x + w1 / 2, y - d1 / 2, z0 + h), (x + w1 / 2, y + d1 / 2, z0 + h),
                             (x - w1 / 2, y + d1 / 2, z0 + h)]], outline=outline, bevel=0.012)


# ---------- the prayer hall: long mud walls, buttresses rising into pinnacles ----------
HX, HY, HW, HD, HH = 0.15, 0.25, 1.05, 0.7, 0.2
tapered('hall', M['mud'], HX, HY, HW, HD, HW - 0.03, HD - 0.03, G - 0.005, HH)
FY = HY - HD / 2
for k in range(9):
    x = HX - HW / 2 + 0.06 + k * (HW - 0.12) / 8
    tapered(f'buttress{k}', M['mudLight'], x, FY - 0.02, 0.06, 0.05, 0.035, 0.03, G - 0.005, HH + 0.06, outline=0.012)
    lathe(f'pinnacle{k}', M['mudLight'], ((0.02, 0), (0.002, 0.07)), G + HH + 0.05, x, FY - 0.02, segs=8, outline=0.008)
    if k < 8:
        box(f'door{k}', M['door'], x + (HW - 0.12) / 16, FY - 0.004, G, 0.045, 0.01, 0.09, outline=0, bevel=0)
toron('halltoron', HX - HW / 2 + 0.05, HX + HW / 2 - 0.05, FY - 0.01, G + 0.15, 16)
for k in range(6):
    y = HY - HD / 2 + 0.06 + k * (HD - 0.12) / 5
    lathe(f'sidepinnacle{k}', M['mudLight'], ((0.02, 0), (0.002, 0.07)), G + HH - 0.01, HX - HW / 2 + 0.01, y, segs=8, outline=0.008)

# ---------- the great minaret: a tapering tower bristling with toron ----------
MX, MY = HX - HW / 2 + 0.12, FY - 0.05
tapered('minaret', M['mud'], MX, MY, 0.34, 0.34, 0.15, 0.15, G - 0.005, 0.82)
for k, z in enumerate((0.16, 0.32, 0.48, 0.64)):
    half = 0.17 - (0.17 - 0.075) * z / 0.82
    toron(f'mtoronfront{k}', MX - half + 0.02, MX + half - 0.02, MY - half - 0.005, G + z, 4)
    toron(f'mtoronside{k}', MY - half + 0.02, MY + half - 0.02, MX - half - 0.005, G + z, 4, axis='x')
for sx in (-1, 1):
    for sy in (-1, 1):
        lathe(f'mcrown{sx}{sy}', M['mudLight'], ((0.022, 0), (0.002, 0.08)), G + 0.81, MX + sx * 0.06, MY + sy * 0.06, segs=8, outline=0.008)
box('mdoor', M['door'], MX, MY - 0.17, G, 0.06, 0.01, 0.12, outline=0, bevel=0)

# ---------- the second, smaller minaret at the back ----------
tapered('minaret2', M['mud'], HX + 0.3, HY + 0.25, 0.2, 0.2, 0.1, 0.1, G + HH - 0.01, 0.32)
for sx in (-1, 1):
    lathe(f'm2crown{sx}', M['mudLight'], ((0.018, 0), (0.002, 0.06)), G + HH + 0.3, HX + 0.3 + sx * 0.035, HY + 0.25, segs=8, outline=0.006)

# ---------- mud houses round it ----------
for k, (x, y, w, h) in enumerate(((-0.95, -0.35, 0.26, 0.17), (0.95, -0.25, 0.24, 0.15), (-0.8, 0.85, 0.3, 0.18), (0.95, 0.65, 0.22, 0.16))):
    tapered(f'house{k}', M['mudLight'], x, y, w, w * 0.85, w - 0.02, w * 0.85 - 0.02, G - 0.005, h, outline=0.016)
    box(f'housedoor{k}', M['door'], x, y - w * 0.425 - 0.002, G, 0.04, 0.01, 0.08, outline=0, bevel=0)
    toron(f'housetoron{k}', x - w / 2 + 0.03, x + w / 2 - 0.03, y - w * 0.425, G + h - 0.04, 3)

# ---------- an acacia and two people in indigo ----------
AX, AY = 0.55, -0.85
rod('acaciatrunk', M['trunk'], (AX, AY, G), (AX + 0.02, AY, G + 0.22), 0.025, r2=0.018, segs=8, outline=0.01)
canopy = ball('acaciacanopy', M['acacia'], 0, 0, 0, 0.22, outline=0.02)
canopy.scale = (1, 1, 0.25)
canopy.location = (AX + 0.02, AY, G + 0.25)
for k, (x, y) in enumerate(((-0.25, -0.75), (-0.15, -0.8))):
    rod(f'person{k}', M['indigo'], (x, y, G), (x, y, G + 0.1), 0.026, r2=0.016, segs=8, outline=0.006)
    ball(f'head{k}', M['indigo'], x, y, G + 0.12, 0.02, outline=0.005)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
