# A cartoon Valparaíso for the country maps, built in the set's shared look (../toon.py): the port
# city's steep hills crowded with houses painted every colour, their corrugated roofs stepping up the
# slope, an old funicular ascensor climbing its inclined track from the lower town to the station
# on the hill, and the Pacific harbour at the bottom. Turned a little towards the camera.
# Run: blender -b --factory-startup -P valparaiso.py -- valparaiso-1024.png 1024 valparaiso.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'street': toon('street', '#b8b0a0', shadow_mul=(0.84, 0.82, 0.86), lift=0.2),
    'sea': toon('sea', '#2f7ab8', shadow_mul=(0.76, 0.84, 0.92), lift=0.3),
    'hill': toon('hill', '#8aa85a', shadow_mul=(0.76, 0.8, 0.78)),
    'yellow': toon('yellow', '#f0c840', lift=0.15),
    'blue': toon('blue', '#3a8ad0', lift=0.12),
    'pink': toon('pink', '#e87aa0', lift=0.12),
    'green': toon('green', '#5ab87a', lift=0.12),
    'orange': toon('orange', '#f08a40', lift=0.12),
    'violet': toon('violet', '#9a7ad0', lift=0.12),
    'roof': toon('roof', '#8a8e96'),
    'red': toon('red', '#c83a2a', lift=0.1),
    'steel': toon('steel', '#5a5e66'),
    'window': flat('window', '#3a3a42'),
})

G = tile(M['street'])
before = set(bpy.data.objects)
rng = random.Random(2633)


def strip(y0, y1, r, z, n=6):
    xa0, xa1 = math.sqrt(r * r - y0 * y0), math.sqrt(r * r - y1 * y1)
    a0, a1 = math.asin(y0 / r), math.asin(y1 / r)
    pts = [(-xa0, y0), (xa0, y0)]
    pts += [(r * math.cos(a0 + (a1 - a0) * k / n), r * math.sin(a0 + (a1 - a0) * k / n)) for k in range(1, n)]
    pts += [(xa1, y1), (-xa1, y1)]
    pts += [(r * math.cos(math.pi - a1 + (a1 - a0) * k / n), r * math.sin(math.pi - a1 + (a1 - a0) * k / n)) for k in range(1, n)]
    return [(x, y, G + z) for x, y in pts]


loft('sea', M['sea'], [strip(-1.25, -0.62, 1.33, -0.004), strip(-1.25, -0.62, 1.33, 0.006)], outline=0.004)
# the hill rising from the lower town to the back
Y0, Y1, ZT = -0.32, 0.75, 0.42
hl = loft('hill', M['hill'], [strip(Y0, 1.18, 1.24, -0.01), strip(Y0 + 0.05, 1.15, 1.2, 0.02), strip(Y1 - 0.15, 1.1, 1.15, ZT)], outline=0.01, smooth=True)
hl.visible_shadow = False


def ground(y):
    if y <= Y0:
        return G
    t = min(1.0, (y - Y0) / (Y1 - 0.15 - Y0))
    return G + ZT * t


colours = ('yellow', 'blue', 'pink', 'green', 'orange', 'violet')
k = 0
for row in range(6):
    y = Y0 + 0.06 + row * 0.15
    for j in range(8):
        x = -0.8 + j * 0.22 + (0.08 if row % 2 else 0) + rng.uniform(-0.03, 0.03)
        if math.hypot(x, y) > 1.02 or abs(x - 0.38) < 0.1:
            continue
        zb = ground(y - 0.05)
        h = 0.08 + (ground(y + 0.05) - zb) + rng.uniform(0.0, 0.04)
        mat = M[colours[k % len(colours)]]
        box(f'house{k}', mat, x, y, zb - 0.005, 0.16, 0.12, h, outline=0.004, bevel=0)
        for r in range(2):
            box(f'housewin{k}{r}', M['window'], x, y - 0.063, zb + h - 0.05 - r * 0.04 if h > 0.1 else zb + 0.03, 0.1, 0.006, 0.02, outline=0, bevel=0)
        loft(f'houseroof{k}', M['roof'], [[(x - 0.085, y - 0.065, zb + h - 0.005), (x + 0.085, y - 0.065, zb + h - 0.005), (x + 0.085, y + 0.065, zb + h - 0.005), (x - 0.085, y + 0.065, zb + h - 0.005)],
                                          [(x - 0.085, y - 0.004, zb + h + 0.035), (x + 0.085, y - 0.004, zb + h + 0.035), (x + 0.085, y + 0.004, zb + h + 0.035), (x - 0.085, y + 0.004, zb + h + 0.035)]], outline=0.003)
        k += 1

# ---------- the ascensor ----------
AX = 0.38
y0, y1 = Y0 - 0.05, Y1 - 0.12
for s in (-1, 1):
    bar(f'rail{s}', M['steel'], (AX + s * 0.025, y0, ground(y0) + 0.01), (AX + s * 0.025, y1, ground(y1) + 0.01), 0.01, outline=0.001)
for i in range(10):
    t = (i + 0.5) / 10
    y = y0 + (y1 - y0) * t
    box(f'trestle{i}', M['steel'], AX, y, G - 0.005, 0.07, 0.012, ground(y) - G + 0.01, outline=0, bevel=0)
t = 0.45
cy = y0 + (y1 - y0) * t
mark = set(bpy.data.objects)
box('car', M['red'], 0, 0, 0, 0.08, 0.1, 0.07, outline=0.003, bevel=0)
box('carwin', M['window'], 0, -0.051, 0.02, 0.05, 0.004, 0.03, outline=0, bevel=0)
bpy.context.view_layer.update()
slope = math.atan2(ground(y1) - ground(y0), y1 - y0)
m = Matrix.Translation((AX, cy, ground(cy) + 0.015)) @ Matrix.Rotation(slope, 4, 'X')
for o in [o for o in bpy.data.objects if o not in mark]:
    o.matrix_world = m @ o.matrix_world
box('lowerstation', M['yellow'], AX, y0 - 0.06, G - 0.005, 0.14, 0.1, 0.1, outline=0.004, bevel=0)
box('upperstation', M['blue'], AX, y1 + 0.05, ground(y1) - 0.01, 0.14, 0.1, 0.1, outline=0.004, bevel=0)

turn(before, -20)
render(G)
