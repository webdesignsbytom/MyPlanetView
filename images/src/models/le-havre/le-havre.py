# A cartoon Le Havre for the country maps, built in the set's shared look (../toon.py): Auguste
# Perret's Church of St Joseph, its octagonal concrete lantern tower soaring over the city like a
# lighthouse, its walls studded with little squares of coloured glass, standing among Perret's
# rebuilt concrete blocks of flats with their regular grids of windows, and the harbour's water.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P le-havre.py -- le-havre-1024.png 1024 le-havre.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#c8c4bc', shadow_mul=(0.84, 0.84, 0.9), lift=0.2),
    'concrete': toon('concrete', '#d8d0c0', shadow_mul=(0.84, 0.84, 0.9), lift=0.15),
    'concreteDark': toon('concreteDark', '#b8b0a0'),
    'window': flat('window', '#3a3e48'),
    'glassBlue': toon('glassBlue', '#3a7ad0', lift=0.3),
    'glassRed': toon('glassRed', '#d0503a', lift=0.3),
    'glassYellow': toon('glassYellow', '#f0c840', lift=0.3),
    'sea': toon('sea', '#4a8ab0', lift=0.3),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['paving'])
before = set(bpy.data.objects)
rng = random.Random(1956)
GLASS = ('glassBlue', 'glassRed', 'glassYellow')


def strip(y0, y1, r, z, n=6):
    """The band of the tile's disc between y0 and y1 (counter-clockwise from above)."""
    xa0, xa1 = math.sqrt(r * r - y0 * y0), math.sqrt(r * r - y1 * y1)
    a0, a1 = math.asin(y0 / r), math.asin(y1 / r)
    pts = [(-xa0, y0), (xa0, y0)]
    pts += [(r * math.cos(a0 + (a1 - a0) * k / n), r * math.sin(a0 + (a1 - a0) * k / n)) for k in range(1, n)]
    pts += [(xa1, y1), (-xa1, y1)]
    pts += [(r * math.cos(math.pi - a1 + (a1 - a0) * k / n), r * math.sin(math.pi - a1 + (a1 - a0) * k / n)) for k in range(1, n)]
    return [(x, y, G + z) for x, y in pts]


loft('harbour', M['sea'], [strip(-1.41, -1.0, 1.42, -0.004), strip(-1.41, -1.0, 1.42, 0.004)], outline=0)

# ---------- Perret's blocks of flats round the church ----------
for k, (x, y, w, d) in enumerate(((-0.65, 0.4, 0.36, 0.28), (0.65, 0.4, 0.36, 0.28), (-0.7, -0.25, 0.3, 0.4), (0.7, -0.25, 0.3, 0.4), (-0.25, -0.72, 0.4, 0.2), (0.3, -0.72, 0.36, 0.2), (0.0, 0.8, 0.5, 0.2))):
    h = rng.choice((0.2, 0.24, 0.28))
    box(f'block{k}', M['concrete'], x, y, G - 0.005, w, d, h, outline=0.006, bevel=0)
    for row in range(int(h / 0.05)):
        for j in range(int(w / 0.05)):
            box(f'blockwin{k}{row}{j}', M['window'], x - w / 2 + 0.03 + j * 0.05, y - d / 2 - 0.003, G + 0.03 + row * 0.05, 0.025, 0.006, 0.03, outline=0, bevel=0)
    box(f'blockroof{k}', M['concreteDark'], x, y, G + h - 0.005, w + 0.01, d + 0.01, 0.012, outline=0.002, bevel=0)

# ---------- St Joseph's ----------
CX, CY = 0.0, 0.05
box('church', M['concrete'], CX, CY, G - 0.005, 0.42, 0.42, 0.22, outline=0.008, bevel=0)
for face, (nx, ny) in enumerate(((0, -1), (-1, 0))):
    for row in range(4):
        for j in range(8):
            o = -0.18 + j * 0.05
            x = CX + nx * 0.213 + (o if ny else 0)
            y = CY + ny * 0.213 + (o if nx else 0)
            box(f'churchglass{face}{row}{j}', M[GLASS[(row + j + face) % 3]], x, y, G + 0.03 + row * 0.045, 0.025 if ny else 0.006, 0.006 if ny else 0.025, 0.025, outline=0, bevel=0)
box('churchdoor', M['window'], CX, CY - 0.214, G - 0.005, 0.08, 0.006, 0.1, outline=0, bevel=0)
# the lantern tower: octagonal, tapering, its sides latticed with coloured glass
Z = G + 0.215
for k, (r0, r1, h) in enumerate(((0.15, 0.13, 0.24), (0.13, 0.1, 0.3), (0.1, 0.06, 0.32), (0.06, 0.02, 0.22))):
    lathe(f'lantern{k}', M['concrete'], ((r0, 0), (r1, h)), Z, CX, CY, segs=8, outline=0.006, smooth=False)
    for j in range(8):
        a = 2 * math.pi * (j + 0.5) / 8
        if math.sin(a) > 0.4:
            continue
        for row in range(int(h / 0.05)):
            t = (row + 0.5) / int(h / 0.05)
            rr = (r0 + (r1 - r0) * t) * math.cos(math.pi / 8) + 0.003
            box(f'lanternglass{k}{j}{row}', M[GLASS[(j + row + k) % 3]], CX + rr * math.cos(a), CY + rr * math.sin(a), Z + t * h - 0.012, 0.004, rr * 0.45, 0.024, rot_z=a, outline=0, bevel=0)
    Z += h
rod('spire', M['concreteDark'], (CX, CY, Z), (CX, CY, Z + 0.06), 0.006, segs=4, outline=0)
for k, (x, y) in enumerate(((-0.35, -0.35), (0.35, -0.35))):
    ball(f'tree{k}', M['tree'], x, y, G + 0.12, 0.09, outline=0.01)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
