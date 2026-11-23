# A cartoon Minaret of Jam for the country maps, built in the set's shared look (../toon.py): the
# tall brick minaret on its octagonal base, rising in tapering stages wrapped in bands of brick
# patterns, its band of turquoise tiled script near the top, its balconies, standing alone where
# two rivers meet in a deep valley between bare, rugged mountains. Turned a little towards the
# camera.
# Run: blender -b --factory-startup -P minaret-of-jam.py -- minaret-of-jam-1024.png 1024 minaret-of-jam.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'valley': toon('valley', '#d6bf8a', shadow_mul=(0.82, 0.74, 0.62), lift=0.25),
    'mountain': toon('mountain', '#a4825e', shadow_mul=(0.8, 0.72, 0.74)),
    'mountainDark': toon('mountainDark', '#8a6a4e', shadow_mul=(0.8, 0.72, 0.74)),
    'brick': toon('brick', '#c9a070', shadow_mul=(0.84, 0.74, 0.66)),
    'brickDark': toon('brickDark', '#a8805a', shadow_mul=(0.84, 0.74, 0.66)),
    'tile': toon('tile', '#3fa6b8', shadow_mul=(0.72, 0.84, 0.88), lift=0.3),
    'river': toon('river', '#5fa8c8', shadow_mul=(0.75, 0.84, 0.88), lift=0.3),
    'gravel': toon('gravel', '#c9b996', shadow_mul=(0.82, 0.8, 0.84)),
    'window': flat('window', '#3a3030'),
})

G = tile(M['valley'])
before = set(bpy.data.objects)
rng = random.Random(281)


def ring(cx, cy, rx, ry, z, jitter, sides=14):
    return [(cx + rx * (1 + rng.uniform(-jitter, jitter)) * math.cos(2 * math.pi * k / sides),
             cy + ry * (1 + rng.uniform(-jitter, jitter)) * math.sin(2 * math.pi * k / sides), G + z) for k in range(sides)]


# ---------- the bare mountains either side of the valley ----------
for k, (cx, cy, rx, ry, h, mat) in enumerate(((-0.75, 0.42, 0.45, 0.5, 1.05, 'mountain'), (0.78, 0.45, 0.42, 0.48, 0.95, 'mountainDark'),
                                              (0.05, 1.05, 0.45, 0.25, 0.7, 'mountainDark'), (-0.95, -0.45, 0.3, 0.28, 0.5, 'mountainDark'))):
    m = loft(f'mountain{k}', M[mat], [ring(cx, cy, rx, ry, -0.01, 0.04), ring(cx, cy, rx * 0.68, ry * 0.68, h * 0.45, 0.14), ring(cx, cy, rx * 0.35, ry * 0.35, h * 0.8, 0.16),
                                      ring(cx, cy, 0.03, 0.03, h, 0.0)], outline=0.035)
    m.visible_shadow = False

# ---------- the two rivers meeting by the minaret ----------
for k, ((x0, y0), (x1, y1), w) in enumerate((((-0.2, 0.95), (-0.05, 0.12), 0.1), ((0.45, 0.95), (0.3, 0.6), 0.08), ((0.3, 0.6), (-0.05, 0.12), 0.08), ((-0.05, 0.12), (-0.25, -0.5), 0.13),
                                             ((-0.25, -0.5), (-0.32, -1.25), 0.14))):
    box(f'gravelbank{k}', M['gravel'], (x0 + x1) / 2, (y0 + y1) / 2, G - 0.004, math.hypot(x1 - x0, y1 - y0) + w, w * 2.2, 0.008, rot_z=math.atan2(y1 - y0, x1 - x0),
        outline=0, bevel=0)
    box(f'river{k}', M['river'], (x0 + x1) / 2, (y0 + y1) / 2, G - 0.002, math.hypot(x1 - x0, y1 - y0) + w, w, 0.01, rot_z=math.atan2(y1 - y0, x1 - x0),
        outline=0.008, bevel=0)

# ---------- the minaret ----------
MX, MY = 0.2, -0.14
lathe('base', M['brickDark'], ((0.2, 0), (0.2, 0.12)), G - 0.005, MX, MY, segs=8, outline=0.02, smooth=False)
STAGES = ((0.16, 0.13, 0.62), (0.115, 0.1, 0.28), (0.085, 0.075, 0.16))
z = G + 0.115
for k, (r0, r1, h) in enumerate(STAGES):
    lathe(f'shaft{k}', M['brick'], ((r0, 0), (r1, h)), z, MX, MY, segs=24, outline=0.018)
    for j in range(int(h / 0.1)):
        t = (j + 0.6) / (h / 0.1)
        rr = r0 + (r1 - r0) * t
        lathe(f'pattern{k}{j}', M['brickDark'], ((rr + 0.004, 0), (rr + 0.004, 0.018)), z + h * t, MX, MY, segs=24, outline=0)
    if k == 0:
        lathe('script', M['tile'], ((r1 + 0.006, 0), (r1 + 0.008, 0.05)), z + h - 0.09, MX, MY, segs=24, outline=0.006)
    # a balcony at the top of each stage
    lathe(f'balcony{k}', M['brickDark'], ((r1 + 0.02, 0), (r1 + 0.03, 0.02), (r1 + 0.03, 0.035)), z + h - 0.005, MX, MY, segs=24, outline=0.01)
    z += h + 0.03
lathe('lantern', M['brick'], ((0.06, 0), (0.06, 0.06), (0.03, 0.09), (0.004, 0.11)), z - 0.01, MX, MY, segs=16, outline=0.012)
for k in range(4):
    a = math.pi / 2 * k - math.pi / 2
    box(f'window{k}', M['window'], MX + 0.14 * math.cos(a), MY + 0.14 * math.sin(a), G + 0.35 + 0.15 * k, 0.03, 0.03, 0.06, rot_z=a, outline=0, bevel=0)

turn(before, -20)
render(G)
