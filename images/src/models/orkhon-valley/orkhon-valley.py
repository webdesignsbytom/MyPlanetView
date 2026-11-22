# A cartoon Orkhon Valley for the country maps, built in the set's shared look (../toon.py): the
# green steppe with the Orkhon River winding through it, white gers with their orange doors and
# smoke-holes, horses grazing, the white wall of Erdene Zuu monastery behind, lined with its stupas,
# and a temple with a green tiled roof inside it, and the rolling hills beyond.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P orkhon-valley.py -- orkhon-valley-1024.png 1024 orkhon-valley.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'steppe': toon('steppe', '#9cc463', shadow_mul=(0.72, 0.8, 0.76), lift=0.25),
    'hills': toon('hills', '#7fae55', shadow_mul=(0.72, 0.8, 0.76)),
    'river': toon('river', '#4aa6dc', shadow_mul=(0.75, 0.82, 0.9), lift=0.35),
    'white': toon('white', '#f6f3ec', shadow_mul=(0.8, 0.8, 0.9), lift=0.2),
    'felt': toon('felt', '#ece6d6', shadow_mul=(0.8, 0.8, 0.9), lift=0.2),
    'orange': toon('orange', '#e8772e', shadow_mul=(0.8, 0.68, 0.55)),
    'band': flat('band', '#3c6fc4'),
    'roofGreen': toon('roofGreen', '#2f8a6a', shadow_mul=(0.7, 0.78, 0.8)),
    'red': toon('red', '#c8402f'),
    'horseBrown': toon('horseBrown', '#8a5a3c'),
    'horseDark': toon('horseDark', '#4a3a32'),
    'horseLight': toon('horseLight', '#d9c7a8', shadow_mul=(0.82, 0.78, 0.78)),
})

G = tile(M['steppe'])
before = set(bpy.data.objects)
rng = random.Random(271)


def place(made_before, degrees, x, y):
    m = Matrix.Translation((x, y, 0)) @ Matrix.Rotation(math.radians(degrees), 4, 'Z')
    bpy.context.view_layer.update()
    for ob in set(bpy.data.objects) - made_before:
        ob.matrix_world = m @ ob.matrix_world


def ring(cx, cy, rx, ry, z, jitter, sides=16):
    return [(cx + rx * (1 + rng.uniform(-jitter, jitter)) * math.cos(2 * math.pi * k / sides),
             cy + ry * (1 + rng.uniform(-jitter, jitter)) * math.sin(2 * math.pi * k / sides), G + z) for k in range(sides)]


# ---------- rolling hills beyond ----------
for k, (cx, cy, r, h) in enumerate(((-0.5, 0.98, 0.42, 0.35), (0.3, 1.0, 0.4, 0.3), (0.85, 0.7, 0.28, 0.22))):
    hl = loft(f'hill{k}', M['hills'], [ring(cx, cy, r, r * 0.5, -0.01, 0.03), ring(cx, cy, r * 0.65, r * 0.32, h * 0.65, 0.06), ring(cx, cy, r * 0.25, r * 0.12, h, 0.06)],
              outline=0.03)
    hl.visible_shadow = False

# ---------- the Orkhon River winding through ----------
KNOTS = [(-1.35, 0.05), (-0.85, -0.25), (-0.3, -0.05), (0.2, -0.45), (0.65, -0.55), (1.15, -0.75)]
path = []
for (x0, y0), (x1, y1), (x2, y2) in zip(KNOTS, KNOTS[1:], KNOTS[2:]):
    ax, ay, bx, by = (x0 + x1) / 2, (y0 + y1) / 2, (x1 + x2) / 2, (y1 + y2) / 2
    for j in range(8):
        t = j / 8
        path.append(((1 - t) ** 2 * ax + 2 * (1 - t) * t * x1 + t * t * bx, (1 - t) ** 2 * ay + 2 * (1 - t) * t * y1 + t * t * by))
path = [KNOTS[0]] + path + [KNOTS[-1]]
bm = bmesh.new()
left, right = [], []
for k, (x, y) in enumerate(path):
    (xa, ya), (xb, yb) = path[max(0, k - 1)], path[min(len(path) - 1, k + 1)]
    d = math.hypot(xb - xa, yb - ya) or 1
    px, py = -(yb - ya) / d, (xb - xa) / d
    left.append(bm.verts.new((x + px * 0.08, y + py * 0.08, G + 0.006)))
    right.append(bm.verts.new((x - px * 0.08, y - py * 0.08, G + 0.006)))
for k in range(len(path) - 1):
    bm.faces.new((left[k], right[k], right[k + 1], left[k + 1]))
finish('river', bm, M['river'], outline=0.012)

# ---------- Erdene Zuu: its white wall lined with stupas, a temple inside ----------
WX0, WX1, WY = -0.85, 0.6, 0.55
box('monasterywall', M['white'], (WX0 + WX1) / 2, WY, G - 0.005, WX1 - WX0, 0.04, 0.09, outline=0.012, bevel=0)
for k in range(13):
    x = WX0 + 0.05 + k * (WX1 - WX0 - 0.1) / 12
    lathe(f'stupa{k}', M['white'], ((0.032, 0), (0.032, 0.03), (0.026, 0.04), (0.024, 0.07), (0.012, 0.09), (0.004, 0.13)), G + 0.085, x, WY, segs=12,
          outline=0.006)
    ball(f'stupatop{k}', M['gold'], x, WY, G + 0.22, 0.01, outline=0)
TX, TY = -0.1, 0.78
box('temple', M['red'], TX, TY, G - 0.005, 0.3, 0.18, 0.14, outline=0.016, bevel=0)
box('templebase', M['white'], TX, TY, G - 0.005, 0.34, 0.22, 0.04, outline=0.012, bevel=0)
for k, (w, d, z, h) in enumerate(((0.42, 0.28, 0.135, 0.06), (0.3, 0.2, 0.2, 0.06))):
    loft(f'templeroof{k}', M['roofGreen'], [[(TX - w / 2, TY - d / 2, G + z), (TX + w / 2, TY - d / 2, G + z), (TX + w / 2, TY + d / 2, G + z), (TX - w / 2, TY + d / 2, G + z)],
                                            [(TX - w / 2 + 0.06, TY - 0.004, G + z + h), (TX + w / 2 - 0.06, TY - 0.004, G + z + h),
                                             (TX + w / 2 - 0.06, TY + 0.004, G + z + h), (TX - w / 2 + 0.06, TY + 0.004, G + z + h)]], outline=0.012)
    if k == 0:
        box('templeupper', M['red'], TX, TY, G + 0.16, 0.2, 0.12, 0.06, outline=0.01, bevel=0)


# ---------- gers ----------
def ger(name, x, y, r=0.13):
    lathe(name, M['felt'], ((r, 0), (r, r * 0.55)), G - 0.005, x, y, segs=24, outline=0.014)
    lathe(f'{name}band', M['band'], ((r + 0.003, 0), (r + 0.003, 0.012)), G + r * 0.38, x, y, segs=24, outline=0)
    lathe(f'{name}roof', M['white'], ((r + 0.01, 0), (r * 0.5, r * 0.25), (r * 0.12, r * 0.4)), G + r * 0.55 - 0.005, x, y, segs=24, outline=0.012)
    lathe(f'{name}crown', M['orange'], ((r * 0.13, 0), (r * 0.13, 0.015)), G + r * 0.55 + r * 0.4 - 0.008, x, y, segs=12, outline=0.004)
    box(f'{name}door', M['orange'], x, y - r - 0.002, G, r * 0.4, 0.012, r * 0.42, outline=0, bevel=0)


for k, (x, y) in enumerate(((-0.65, 0.15), (-0.3, 0.25), (0.45, 0.1), (0.15, 0.2))):
    ger(f'ger{k}', x, y)


# ---------- horses grazing ----------
def horse(name, x, y, deg, coat):
    made = set(bpy.data.objects)
    for dx in (-0.055, 0.055):
        for sy in (-1, 1):
            rod(f'{name}leg{dx}{sy}', M[coat], (dx, sy * 0.022, G), (dx, sy * 0.022, G + 0.11), 0.01, segs=6, outline=0.004)
    box(f'{name}body', M[coat], 0, 0, G + 0.1, 0.16, 0.065, 0.07, outline=0.009, bevel=0.014)
    bar(f'{name}neck', M[coat], (0.06, 0, G + 0.15), (0.11, 0, G + 0.06), 0.035, outline=0.007)
    box(f'{name}head', M[coat], 0.125, 0, G + 0.02, 0.06, 0.03, 0.035, outline=0.006, bevel=0.007)
    bar(f'{name}mane', M['horseDark'], (0.05, 0, G + 0.18), (0.1, 0, G + 0.09), 0.012, outline=0)
    bar(f'{name}tail', M['horseDark'], (-0.08, 0, G + 0.16), (-0.1, 0, G + 0.07), 0.014, outline=0)
    place(made, deg, x, y)


for k, (x, y, deg, coat) in enumerate(((-0.55, -0.55, -30, 'horseBrown'), (-0.3, -0.7, 20, 'horseLight'), (0.1, -0.85, -60, 'horseDark'),
                                       (0.55, -0.15, 160, 'horseBrown'), (-1.0, -0.35, -20, 'horseLight'))):
    horse(f'horse{k}', x, y, deg, coat)

turn(before, -20)
render(G)
