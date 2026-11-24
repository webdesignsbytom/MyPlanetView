# A cartoon Ponte Vecchio for the country maps, built in the set's shared look (../toon.py): the old
# bridge's three low stone arches over the Arno on their two piers, the goldsmiths' shops in ochre,
# orange and cream hanging out over the water on their wooden brackets with green shutters, the
# Vasari Corridor running along the top, the open terrace in the middle, and the river's banks. Turned
# a little towards the camera.
# Run: blender -b --factory-startup -P ponte-vecchio.py -- ponte-vecchio-1024.png 1024 ponte-vecchio.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#d0c4ae', shadow_mul=(0.82, 0.8, 0.86), lift=0.2),
    'river': toon('river', '#6a9a7a', shadow_mul=(0.8, 0.88, 0.86), lift=0.3),
    'stone': toon('stone', '#d8c8a4', shadow_mul=(0.86, 0.82, 0.8), lift=0.12),
    'stoneDark': toon('stoneDark', '#b8a47e', shadow_mul=(0.86, 0.82, 0.8)),
    'ochre': toon('ochre', '#e8b860', lift=0.1),
    'orange': toon('orange', '#e08850', lift=0.1),
    'cream': toon('cream', '#f0dcb4', lift=0.1),
    'shutter': toon('shutter', '#4a8a5a'),
    'wood': toon('wood', '#7a5236'),
    'roof': toon('roof', '#c4603e'),
    'window': flat('window', '#3a3a42'),
})

G = tile(M['paving'])
before = set(bpy.data.objects)
rng = random.Random(1345)


def vstrip(x0, x1, r, z, n=8):
    """The band of the tile's disc between x0 and x1 (counter-clockwise from above)."""
    ya0, ya1 = math.sqrt(r * r - x0 * x0), math.sqrt(r * r - x1 * x1)
    b0, b1 = math.acos(x0 / r), math.acos(x1 / r)
    pts = [(x0, -ya0)]
    pts += [(r * math.cos(-b0 + (b0 - b1) * k / n), r * math.sin(-b0 + (b0 - b1) * k / n)) for k in range(1, n)]
    pts += [(x1, -ya1), (x1, ya1)]
    pts += [(r * math.cos(b1 + (b0 - b1) * k / n), r * math.sin(b1 + (b0 - b1) * k / n)) for k in range(1, n)]
    pts += [(x0, ya0)]
    return [(x, y, z) for x, y in pts]


RW = 0.62   # half the river's width: it runs front to back, the bridge across it
loft('river', M['river'], [vstrip(-RW, RW, 1.42, G - 0.004), vstrip(-RW, RW, 1.42, G + 0.004)], outline=0)

# ---------- the arches and piers ----------
DZ = G + 0.16   # the roadway
BD = 0.22       # the bridge's breadth (the shops hang out beyond it)
for s in (-1, 1):
    box(f'pier{s}', M['stoneDark'], s * 0.2, 0, G - 0.005, 0.07, BD + 0.08, DZ - G, outline=0.005, bevel=0)
    loft(f'cutwater{s}', M['stoneDark'], [[(s * 0.2 - 0.035, -(BD / 2 + 0.04), G - 0.005), (s * 0.2 + 0.035, -(BD / 2 + 0.04), G - 0.005), (s * 0.2, -(BD / 2 + 0.1), G - 0.005)],
                                          [(s * 0.2 - 0.035, -(BD / 2 + 0.04), DZ - 0.04), (s * 0.2 + 0.035, -(BD / 2 + 0.04), DZ - 0.04), (s * 0.2, -(BD / 2 + 0.1), DZ - 0.04)]], outline=0.003)
box('roadway', M['stone'], 0, 0, DZ - 0.04, 2 * RW + 0.1, BD, 0.04, outline=0.006, bevel=0)
# the three segmental arches, as stone spandrels over each opening
for k, (x0, x1) in enumerate(((-RW, -0.235), (-0.165, 0.165), (0.235, RW))):
    n = 10
    for j in range(n):
        a, b = x0 + (x1 - x0) * j / n, x0 + (x1 - x0) * (j + 1) / n
        t = (j + 0.5) / n
        rise = 0.09 * math.sin(math.pi * t)
        box(f'spandrel{k}{j}', M['stone'], (a + b) / 2, 0, G + 0.02 + rise, b - a + 0.001, BD, DZ - 0.04 - G - 0.02 - rise + 0.001, outline=0, bevel=0)
    for fy in (-1, 1):
        for j in range(n):
            a, b = x0 + (x1 - x0) * j / n, x0 + (x1 - x0) * (j + 1) / n
            za = G + 0.02 + 0.09 * math.sin(math.pi * j / n)
            zb = G + 0.02 + 0.09 * math.sin(math.pi * (j + 1) / n)
            bar(f'archring{k}{fy}{j}', M['stoneDark'], (a, fy * (BD / 2 + 0.003), za + 0.008), (b, fy * (BD / 2 + 0.003), zb + 0.008), 0.016, outline=0)

# ---------- the shops on both sides, out over the water ----------
colours = ('ochre', 'orange', 'cream')
k = 0
for fy in (-1, 1):
    x = -RW + 0.02
    while x < RW - 0.05:
        w = rng.choice((0.08, 0.1, 0.12))
        if abs(x + w / 2) < 0.1:
            x = 0.1
            continue
        h = rng.choice((0.12, 0.15, 0.18))
        out = rng.choice((0.06, 0.08, 0.1))
        y = fy * (BD / 2 - 0.04 + out / 2 + 0.04)
        cx = x + w / 2
        box(f'shop{k}', M[colours[k % 3]], cx, y, DZ - 0.04, w - 0.004, out + 0.08, h, outline=0.004, bevel=0)
        box(f'shutter{k}', M['shutter'], cx, y + fy * ((out + 0.08) / 2 + 0.003), DZ + 0.02, w * 0.5, 0.006, 0.04, outline=0, bevel=0)
        box(f'shopwin{k}', M['window'], cx, y + fy * ((out + 0.08) / 2 + 0.003), DZ + h - 0.08, w * 0.4, 0.006, 0.03, outline=0, bevel=0)
        for bx in (cx - w / 3, cx + w / 3):
            bar(f'bracket{k}{bx:.3f}', M['wood'], (bx, fy * (BD / 2), DZ - 0.1), (bx, y + fy * ((out + 0.08) / 2 - 0.005), DZ - 0.04), 0.012, outline=0.001)
        loft(f'shoproof{k}', M['roof'], [[(cx - w / 2, y - (out + 0.08) / 2 - 0.01, DZ - 0.045 + h), (cx + w / 2, y - (out + 0.08) / 2 - 0.01, DZ - 0.045 + h), (cx + w / 2, y + (out + 0.08) / 2 + 0.01, DZ - 0.045 + h), (cx - w / 2, y + (out + 0.08) / 2 + 0.01, DZ - 0.045 + h)],
                                         [(cx - w / 2, y - 0.004, DZ - 0.01 + h), (cx + w / 2, y - 0.004, DZ - 0.01 + h), (cx + w / 2, y + 0.004, DZ - 0.01 + h), (cx - w / 2, y + 0.004, DZ - 0.01 + h)]], outline=0.002)
        x += w
        k += 1
# the Vasari Corridor along the top of the upstream (back) row, over the open terrace in the middle
CY, CB, CT = 0.17, DZ + 0.1, DZ + 0.28   # its line, bottom and top


def corridor_roof(name, x0, x1):
    loft(name, M['roof'], [[(x0, CY - 0.05, CT - 0.005), (x1, CY - 0.05, CT - 0.005), (x1, CY + 0.05, CT - 0.005), (x0, CY + 0.05, CT - 0.005)],
                           [(x0, CY - 0.002, CT + 0.03), (x1, CY - 0.002, CT + 0.03), (x1, CY + 0.002, CT + 0.03), (x0, CY + 0.002, CT + 0.03)]], outline=0.003)


for s in (-1, 1):
    x0, x1 = sorted((s * 0.12, s * (RW - 0.02)))
    box(f'corridor{s}', M['ochre'], (x0 + x1) / 2, CY, CB, x1 - x0, 0.09, CT - CB, outline=0.004, bevel=0)
    for j in range(5):
        box(f'corridorwin{s}{j}', M['window'], x0 + (x1 - x0) * (j + 0.5) / 5, CY - 0.048, CT - 0.06, 0.025, 0.006, 0.03, outline=0, bevel=0)
    corridor_roof(f'corridorroof{s}', x0, x1)
box('corridormiddle', M['ochre'], 0, CY, DZ - 0.04, 0.24, 0.09, CT - DZ + 0.04, outline=0.004, bevel=0)
for j in range(3):
    box(f'terracearch{j}', M['window'], -0.07 + j * 0.07, CY - 0.048, DZ - 0.04, 0.045, 0.006, 0.1, outline=0, bevel=0)
    box(f'middlewin{j}', M['window'], -0.07 + j * 0.07, CY - 0.048, CT - 0.06, 0.025, 0.006, 0.03, outline=0, bevel=0)
corridor_roof('corridormiddleroof', -0.12, 0.12)

# ---------- the buildings along the banks ----------
for s in (-1, 1):
    for j, y in enumerate((-0.75, -0.42, 0.42, 0.75)):
        x = s * (RW + 0.2)
        h = rng.uniform(0.2, 0.32)
        box(f'bank{s}{j}', M[colours[(j + (s > 0)) % 3]], x, y, G - 0.005, 0.34, 0.3, h, outline=0.006, bevel=0)
        for row in range(2):
            for c in range(3):
                box(f'bankwin{s}{j}{row}{c}', M['window'], x - s * 0.173, y - 0.09 + c * 0.09, G + 0.06 + row * 0.08, 0.006, 0.03, 0.04, outline=0, bevel=0)
        loft(f'bankroof{s}{j}', M['roof'], [[(x - 0.17, y - 0.15, G + h - 0.005), (x + 0.17, y - 0.15, G + h - 0.005), (x + 0.17, y + 0.15, G + h - 0.005), (x - 0.17, y + 0.15, G + h - 0.005)],
                                             [(x - 0.004, y - 0.15, G + h + 0.06), (x + 0.004, y - 0.15, G + h + 0.06), (x + 0.004, y + 0.15, G + h + 0.06), (x - 0.004, y + 0.15, G + h + 0.06)]], outline=0.003)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
