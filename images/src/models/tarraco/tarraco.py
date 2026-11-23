# A cartoon Tarraco for the country maps, built in the set's shared look (../toon.py): Tarragona's
# Roman amphitheatre on the shore, its oval of seats cut into the slope above the sandy arena, the
# ruined Romanesque church of Santa Maria del Miracle standing in the arena, palms, and the blue
# Mediterranean right behind it. Turned a little towards the camera.
# Run: blender -b --factory-startup -P tarraco.py -- tarraco-1024.png 1024 tarraco.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'ground': toon('ground', '#d8c8a0', shadow_mul=(0.86, 0.82, 0.76), lift=0.2),
    'sea': toon('sea', '#2f7ab8', shadow_mul=(0.76, 0.84, 0.92), lift=0.3),
    'beach': toon('beach', '#ecdcb0'),
    'stone': toon('stone', '#d4b888', shadow_mul=(0.86, 0.82, 0.76), lift=0.08),
    'stoneDark': toon('stoneDark', '#b09868'),
    'sand': toon('sand', '#e8d4a0'),
    'dark': flat('dark', '#3a3028'),
    'palm': toon('palm', '#5a9a40'),
    'trunk': toon('trunk', '#7a5a3a'),
})

G = tile(M['ground'])
before = set(bpy.data.objects)


def strip(y0, y1, r, z, n=6):
    xa0, xa1 = math.sqrt(r * r - y0 * y0), math.sqrt(r * r - y1 * y1)
    a0, a1 = math.asin(y0 / r), math.asin(y1 / r)
    pts = [(-xa0, y0), (xa0, y0)]
    pts += [(r * math.cos(a0 + (a1 - a0) * k / n), r * math.sin(a0 + (a1 - a0) * k / n)) for k in range(1, n)]
    pts += [(xa1, y1), (-xa1, y1)]
    pts += [(r * math.cos(math.pi - a1 + (a1 - a0) * k / n), r * math.sin(math.pi - a1 + (a1 - a0) * k / n)) for k in range(1, n)]
    return [(x, y, G + z) for x, y in pts]


loft('beach', M['beach'], [strip(0.45, 1.3, 1.33, -0.004), strip(0.45, 1.3, 1.33, 0.004)], outline=0.002)
loft('sea', M['sea'], [strip(0.58, 1.3, 1.33, 0.0), strip(0.58, 1.3, 1.33, 0.009)], outline=0.003)

# ---------- the amphitheatre ----------
CX, CY, SY = 0.0, 0.0, 0.72
mark = set(bpy.data.objects)
lathe('cavea', M['stone'], ((0.62, 0), (0.62, 0.14), (0.56, 0.14), (0.46, 0.1), (0.36, 0.06), (0.27, 0.035), (0.25, 0.012)), G - 0.005, CX, CY, segs=48, outline=0.008)
lathe('arena', M['sand'], ((0.25, 0), (0.25, 0.016)), G - 0.005, CX, CY, segs=48, outline=0)
for k, rr in enumerate((0.31, 0.41, 0.51)):
    lathe(f'seatline{k}', M['stoneDark'], ((rr, 0), (rr + 0.008, 0.005)), G + 0.035 + k * 0.03, CX, CY, segs=48, outline=0)
bpy.context.view_layer.update()
for o in [o for o in bpy.data.objects if o not in mark]:
    o.scale = (1.0, SY, 1.0)
bpy.context.view_layer.update()
for k in range(20):
    a = math.pi + math.pi * (k + 0.5) / 20
    x, y = CX + 0.622 * math.cos(a), CY + 0.622 * SY * math.sin(a)
    tang = math.atan2(SY * math.cos(a), -math.sin(a))
    box(f'vomitorium{k}', M['dark'], x, y, G + 0.02, 0.04, 0.006, 0.06, rot_z=tang, outline=0, bevel=0)

# ---------- the church ruins in the arena ----------
box('churchwallL', M['stoneDark'], -0.05, 0.0, G + 0.01, 0.2, 0.025, 0.09, outline=0.003, bevel=0)
box('churchwallR', M['stoneDark'], -0.05, 0.08, G + 0.01, 0.2, 0.025, 0.06, outline=0.003, bevel=0)
lathe('churchapse', M['stoneDark'], ((0.05, 0), (0.05, 0.08)), G + 0.01, 0.07, 0.04, segs=12, outline=0.003)
box('churcharch', M['dark'], -0.05, -0.014, G + 0.03, 0.04, 0.004, 0.04, outline=0, bevel=0)

for k, (x, y) in enumerate(((-0.8, 0.25), (0.8, 0.2), (-0.65, -0.55), (0.62, -0.58))):
    rod(f'palmtrunk{k}', M['trunk'], (x, y, G), (x + 0.03, y, G + 0.32), 0.016, segs=6, outline=0.002)
    for j in range(7):
        a = 2 * math.pi * j / 7
        bar(f'palmleaf{k}{j}', M['palm'], (x + 0.03, y, G + 0.32), (x + 0.03 + 0.11 * math.cos(a), y + 0.11 * math.sin(a), G + 0.26), 0.025, outline=0.002)

turn(before, -20)
render(G)
