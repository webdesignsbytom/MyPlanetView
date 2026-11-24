# A cartoon New Lanark for the country maps, built in the set's shared look (../toon.py): Robert
# Owen's model mill village in its wooded gorge on the River Clyde, the great long cotton mills of
# pale sandstone with their rows of small windows and slate roofs, the mill lade running past them,
# the workers' tenement rows climbing the slope, the school and the bell tower, and the river with its
# weir. Turned a little towards the camera.
# Run: blender -b --factory-startup -P new-lanark.py -- new-lanark-1024.png 1024 new-lanark.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass2', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'river': toon('river', '#5a8a9a', lift=0.3),
    'foam': toon('foam', '#eef6fa', lift=0.4),
    'sandstone': toon('sandstone', '#e0d0b0', shadow_mul=(0.86, 0.82, 0.8), lift=0.12),
    'slate': toon('slate', '#5a5e68', shadow_mul=(0.84, 0.86, 0.92)),
    'window': flat('window', '#3a3a46'),
    'forest': toon('forest', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['grass'])
before = set(bpy.data.objects)
rng = random.Random(1786)


def strip(y0, y1, r, z, n=6):
    """The band of the tile's disc between y0 and y1 (counter-clockwise from above)."""
    xa0, xa1 = math.sqrt(r * r - y0 * y0), math.sqrt(r * r - y1 * y1)
    a0, a1 = math.asin(y0 / r), math.asin(y1 / r)
    pts = [(-xa0, y0), (xa0, y0)]
    pts += [(r * math.cos(a0 + (a1 - a0) * k / n), r * math.sin(a0 + (a1 - a0) * k / n)) for k in range(1, n)]
    pts += [(xa1, y1), (-xa1, y1)]
    pts += [(r * math.cos(math.pi - a1 + (a1 - a0) * k / n), r * math.sin(math.pi - a1 + (a1 - a0) * k / n)) for k in range(1, n)]
    return [(x, y, G + z) for x, y in pts]


# the Clyde across the front with its weir, the gorge's slope rising at the back
loft('clyde', M['river'], [strip(-1.41, -0.7, 1.42, -0.004), strip(-1.41, -0.7, 1.42, 0.004)], outline=0)
box('weir', M['foam'], -0.3, -0.95, G + 0.004, 0.06, 0.4, 0.012, rot_z=0.4, outline=0, bevel=0)
slope = loft('slope', M['grass'], [strip(0.35, 1.38, 1.4, -0.01), strip(0.45, 1.36, 1.38, 0.18)], outline=0.005, smooth=True)
slope.visible_shadow = False


def mill(name, x, y, w, d, h):
    box(name, M['sandstone'], x, y, G - 0.005, w, d, h, outline=0.008, bevel=0)
    for row in range(int(h / 0.055)):
        for j in range(int(w / 0.05)):
            box(f'{name}win{row}{j}', M['window'], x - w / 2 + 0.03 + j * 0.05, y - d / 2 - 0.003, G + 0.03 + row * 0.055, 0.022, 0.006, 0.032, outline=0, bevel=0)
    loft(f'{name}roof', M['slate'], [[(x - w / 2, y - d / 2, G + h - 0.005), (x + w / 2, y - d / 2, G + h - 0.005), (x + w / 2, y + d / 2, G + h - 0.005), (x - w / 2, y + d / 2, G + h - 0.005)],
                                     [(x - w / 2, y - 0.004, G + h + 0.07), (x + w / 2, y - 0.004, G + h + 0.07), (x + w / 2, y + 0.004, G + h + 0.07), (x - w / 2, y + 0.004, G + h + 0.07)]], outline=0.004)


# ---------- the mills along the river ----------
mill('mill1', -0.45, -0.38, 0.6, 0.18, 0.3)
mill('mill2', 0.3, -0.38, 0.55, 0.18, 0.3)
mill('mill3', 0.0, -0.05, 0.4, 0.16, 0.24)
box('lade', M['river'], 0, -0.56, G - 0.002, 1.5, 0.06, 0.01, outline=0.001, bevel=0)
# the bell tower over the school
box('school', M['sandstone'], 0.62, -0.05, G - 0.005, 0.3, 0.18, 0.2, outline=0.006, bevel=0)
for j in range(5):
    box(f'schoolwin{j}', M['window'], 0.5 + j * 0.06, -0.143, G + 0.06, 0.03, 0.006, 0.08, outline=0, bevel=0)
box('belltower', M['sandstone'], 0.0, -0.05, G + 0.235, 0.07, 0.07, 0.1, outline=0.003, bevel=0)
lathe('bellcap', M['slate'], ((0.045, 0), (0.003, 0.07)), G + 0.33, 0.0, -0.05, segs=4, outline=0.002, smooth=False)

# ---------- the tenement rows up the slope ----------
for k, (x, y) in enumerate(((-0.6, 0.35), (0.1, 0.4), (0.65, 0.3), (-0.25, 0.65), (0.4, 0.7))):
    z = G + 0.18 * min(1.0, max(0.0, (y - 0.35) / 0.2)) - 0.02
    box(f'row{k}', M['sandstone'], x, y, z, 0.42, 0.12, 0.14, outline=0.005, bevel=0)
    for j in range(7):
        box(f'rowwin{k}{j}', M['window'], x - 0.18 + j * 0.06, y - 0.063, z + 0.05, 0.022, 0.006, 0.03, outline=0, bevel=0)
    loft(f'rowroof{k}', M['slate'], [[(x - 0.21, y - 0.06, z + 0.135), (x + 0.21, y - 0.06, z + 0.135), (x + 0.21, y + 0.06, z + 0.135), (x - 0.21, y + 0.06, z + 0.135)],
                                     [(x - 0.21, y - 0.004, z + 0.18), (x + 0.21, y - 0.004, z + 0.18), (x + 0.21, y + 0.004, z + 0.18), (x - 0.21, y + 0.004, z + 0.18)]], outline=0.003)

# ---------- the wooded gorge ----------
for k in range(12):
    x, y = rng.uniform(-1.05, 1.05), rng.uniform(0.75, 1.15)
    if math.hypot(x, y) > 1.25:
        continue
    ball(f'tree{k}', M['forest'], x, y, G + 0.26, rng.uniform(0.09, 0.13), outline=0.012)
for k, (x, y) in enumerate(((-0.95, -0.2), (0.95, -0.35))):
    ball(f'banktree{k}', M['forest'], x, y, G + 0.12, 0.11, outline=0.012)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
