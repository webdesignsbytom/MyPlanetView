# A cartoon Gateway of India for the country maps, built in the set's shared look (../toon.py): the
# great arch of yellow basalt on Mumbai's waterfront, its tall central arch with the side halls, the
# four turrets on its top with their little domes, the carved latticework, the Arabian Sea's harbour
# in front with a ferry, and the promenade with its lamps. Turned a little towards the camera.
# Run: blender -b --factory-startup -P gateway-of-india.py -- gateway-of-india-1024.png 1024 gateway-of-india.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#d0c4ae', shadow_mul=(0.82, 0.8, 0.86), lift=0.2),
    'sea': toon('sea', '#3a7aa0', shadow_mul=(0.76, 0.84, 0.92), lift=0.3),
    'basalt': toon('basalt', '#e2c890', shadow_mul=(0.86, 0.8, 0.76), lift=0.15),
    'basaltDark': toon('basaltDark', '#c4a670', shadow_mul=(0.86, 0.8, 0.76)),
    'dark': flat('dark', '#3a2e28'),
    'white': toon('white', '#f4f2ec', lift=0.15),
    'blue': toon('blue', '#3a5a9a'),
    'iron': toon('iron', '#3a3a40'),
})

G = tile(M['paving'])
before = set(bpy.data.objects)


def strip(y0, y1, r, z, n=6):
    """The band of the tile's disc between y0 and y1 (counter-clockwise from above)."""
    xa0, xa1 = math.sqrt(r * r - y0 * y0), math.sqrt(r * r - y1 * y1)
    a0, a1 = math.asin(y0 / r), math.asin(y1 / r)
    pts = [(-xa0, y0), (xa0, y0)]
    pts += [(r * math.cos(a0 + (a1 - a0) * k / n), r * math.sin(a0 + (a1 - a0) * k / n)) for k in range(1, n)]
    pts += [(xa1, y1), (-xa1, y1)]
    pts += [(r * math.cos(math.pi - a1 + (a1 - a0) * k / n), r * math.sin(math.pi - a1 + (a1 - a0) * k / n)) for k in range(1, n)]
    return [(x, y, G + z) for x, y in pts]


loft('harbour', M['sea'], [strip(-1.41, -0.45, 1.42, -0.004), strip(-1.41, -0.45, 1.42, 0.004)], outline=0)
box('seawall', M['basaltDark'], 0, -0.45, G - 0.005, 2.5, 0.04, 0.03, outline=0.003, bevel=0)

# ---------- the gateway ----------
W, D, H = 0.6, 0.26, 0.5
SPAN = 0.2
for s in (-1, 1):
    box(f'pier{s}', M['basalt'], s * (SPAN / 2 + (W - SPAN) / 4), 0, G - 0.005, (W - SPAN) / 2, D, H, outline=0.009, bevel=0)
    # the side halls' arched openings on the front and the ends
    x = s * (SPAN / 2 + (W - SPAN) / 4)
    for fy in (-1, 1):
        box(f'sidearch{s}{fy}', M['dark'], x, fy * (D / 2 + 0.003), G + 0.03, 0.06, 0.006, 0.12, outline=0, bevel=0)
        cyl(f'sidearchtop{s}{fy}', M['dark'], 0.03, 0.006, segs=12, outline=0, matrix=Matrix.Translation((x, fy * (D / 2 + 0.003), G + 0.15)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
        for j in (-1, 1):
            box(f'lattice{s}{fy}{j}', M['basaltDark'], x + j * 0.05, fy * (D / 2 + 0.004), G + 0.24, 0.03, 0.006, 0.08, outline=0, bevel=0)
    box(f'endarch{s}', M['dark'], s * (W / 2 + 0.003), 0, G + 0.03, 0.006, 0.07, 0.14, outline=0, bevel=0)
box('archtop', M['basalt'], 0, 0, G + 0.32, SPAN + 0.002, D, H - 0.32, outline=0.008, bevel=0)
# the great arch's curve, filled in steps at its top corners
for s in (-1, 1):
    for t in range(6):
        a0, a1 = math.pi / 2 * t / 6, math.pi / 2 * (t + 1) / 6
        x0 = SPAN / 2 * math.cos(a1)
        z0 = SPAN / 2 * math.sin(a0)
        w = SPAN / 2 - x0
        box(f'archcurve{s}{t}', M['basalt'], s * (SPAN / 2 - w / 2), 0, G + 0.22 + z0, w + 0.001, D, SPAN / 2 - z0 + 0.001, outline=0, bevel=0)
box('archceiling', M['basaltDark'], 0, 0, G + 0.315, SPAN, D - 0.004, 0.004, outline=0, bevel=0)
# the cornice, the parapet and the four turrets
box('cornice', M['basaltDark'], 0, 0, G + H - 0.02, W + 0.03, D + 0.03, 0.025, outline=0.004, bevel=0)
box('parapet', M['basalt'], 0, 0, G + H, W, D, 0.04, outline=0.005, bevel=0)
for j in range(9):
    box(f'parapetlattice{j}', M['basaltDark'], -W / 2 + 0.05 + j * (W - 0.1) / 8, -D / 2 - 0.004, G + H + 0.01, 0.03, 0.006, 0.02, outline=0, bevel=0)
for sx in (-1, 1):
    for sy in (-1, 1):
        tx, ty = sx * (W / 2 - 0.04), sy * (D / 2 - 0.04)
        lathe(f'turret{sx}{sy}', M['basalt'], ((0.04, 0), (0.04, 0.14), (0.045, 0.15)), G + H + 0.035, tx, ty, segs=8, outline=0.004, smooth=False)
        lathe(f'turretdome{sx}{sy}', M['basalt'], ((0.045, 0), (0.04, 0.03), (0.02, 0.06), (0.004, 0.08)), G + H + 0.185, tx, ty, segs=12, outline=0.003)
        rod(f'turretfinial{sx}{sy}', M['basaltDark'], (tx, ty, G + H + 0.26), (tx, ty, G + H + 0.29), 0.004, segs=4, outline=0)
lathe('centredome', M['basalt'], ((0.08, 0), (0.07, 0.04), (0.04, 0.08), (0.004, 0.1)), G + H + 0.035, 0, 0, segs=16, outline=0.004)

# ---------- the promenade and the harbour ----------
for k, x in enumerate((-0.85, -0.5, 0.5, 0.85)):
    rod(f'lamp{k}', M['iron'], (x, -0.38, G), (x, -0.38, G + 0.18), 0.006, segs=6, outline=0.001)
    ball(f'lamptop{k}', M['white'], x, -0.38, G + 0.19, 0.016, outline=0.002)
FX, FY = -0.35, -0.85
hull = ball('ferry', M['white'], 0, 0, 0, 0.08, outline=0.005)
hull.scale = (2.4, 0.9, 0.45)
hull.location = (FX, FY, G + 0.01)
box('ferrycabin', M['white'], FX, FY, G + 0.03, 0.22, 0.1, 0.05, outline=0.003, bevel=0)
box('ferrystripe', M['blue'], FX, FY - 0.052, G + 0.045, 0.2, 0.004, 0.015, outline=0, bevel=0)
box('ferryroof', M['blue'], FX, FY, G + 0.08, 0.24, 0.12, 0.012, outline=0.002, bevel=0)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
