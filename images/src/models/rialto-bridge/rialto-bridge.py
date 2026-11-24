# A cartoon Rialto Bridge for the country maps, built in the set's shared look (../toon.py): the white
# Istrian stone arch over the Grand Canal, its two rows of shops under their red roofs climbing the
# steps either side of the central portico, the palazzi along both banks in Venice's faded colours, a
# vaporetto stop's poles and two black gondolas on the green water. Turned a little towards the camera.
# Run: blender -b --factory-startup -P rialto-bridge.py -- rialto-bridge-1024.png 1024 rialto-bridge.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#d0c4ae', shadow_mul=(0.82, 0.8, 0.86), lift=0.2),
    'canal': toon('canal', '#4a9a90', shadow_mul=(0.78, 0.88, 0.88), lift=0.3),
    'stone': toon('stone', '#f2ecde', shadow_mul=(0.84, 0.84, 0.9), lift=0.2),
    'stoneDark': toon('stoneDark', '#d4ccba', shadow_mul=(0.84, 0.84, 0.9)),
    'roof': toon('roof', '#c4603e'),
    'dark': flat('dark', '#2e2a2a'),
    'black': toon('black', '#24242a'),
    'pink': toon('pink', '#e8a898', lift=0.1),
    'ochre': toon('ochre', '#e8c078', lift=0.1),
    'terracotta': toon('terracotta', '#d88a60', lift=0.1),
    'cream': toon('cream', '#f0e2c4', lift=0.1),
    'pole': toon('pole', '#3a5a9a'),
    'window': flat('window', '#3a3a42'),
})

G = tile(M['paving'])
before = set(bpy.data.objects)
rng = random.Random(1591)


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


CW = 0.48   # half the canal's width; the canal runs front to back, the bridge across it
loft('canal', M['canal'], [vstrip(-CW, CW, 1.42, G - 0.004), vstrip(-CW, CW, 1.42, G + 0.004)], outline=0)

# ---------- the arch ----------
L = 0.62    # the bridge's half length, its ends on the banks


def under(x):
    return G + 0.2 * max(0.0, 1 - (x / CW) ** 2)


def top(x):
    return G + 0.26 + 0.07 * (1 - (x / L) ** 2) - 0.2 * max(0.0, (abs(x) - CW) / (L - CW))


N = 24
xs = [-L + 2 * L * k / N for k in range(N + 1)]
BD = 0.34   # the bridge's breadth
rings = []
for x in xs:
    zb = min(under(x), top(x) - 0.04)
    rings.append([(x, -BD / 2, zb), (x, BD / 2, zb), (x, BD / 2, top(x)), (x, -BD / 2, top(x))])
loft('arch', M['stone'], rings, outline=0.008)
# the arch's moulded edge on both faces
for fy in (-1, 1):
    for a, b in zip(xs, xs[1:]):
        if abs(a) <= CW and abs(b) <= CW:
            bar(f'archedge{fy}{a:.3f}', M['stoneDark'], (a, fy * (BD / 2 + 0.004), under(a) + 0.01), (b, fy * (BD / 2 + 0.004), under(b) + 0.01), 0.022, outline=0)

# ---------- the shops and the portico ----------
for s in (-1, 1):
    for j in range(5):
        x0 = s * (0.07 + j * 0.1)
        x = x0 + s * 0.05
        z = top(x)
        for fy in (-1, 1):
            y = fy * 0.11
            box(f'shop{s}{j}{fy}', M['stone'], x, y, z - 0.03, 0.1, 0.1, 0.12, outline=0.004, bevel=0)
            box(f'shoparch{s}{j}{fy}', M['dark'], x, y + fy * 0.052, z + 0.0, 0.05, 0.006, 0.06, outline=0, bevel=0)
            cyl(f'shoparchtop{s}{j}{fy}', M['dark'], 0.025, 0.006, segs=10, outline=0, matrix=Matrix.Translation((x, y + fy * 0.052, z + 0.06)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
            loft(f'shoproof{s}{j}{fy}', M['roof'], [[(x - 0.05, y - 0.055, z + 0.085), (x + 0.05, y - 0.055, z + 0.085), (x + 0.05, y + 0.055, z + 0.085), (x - 0.05, y + 0.055, z + 0.085)],
                                                     [(x - 0.05, y - 0.004, z + 0.12), (x + 0.05, y - 0.004, z + 0.12), (x + 0.05, y + 0.004, z + 0.12), (x - 0.05, y + 0.004, z + 0.12)]], outline=0.002)
PZ = top(0)
box('portico', M['stone'], 0, 0, PZ - 0.03, 0.12, BD - 0.02, 0.2, outline=0.005, bevel=0)
for fy in (-1, 1):
    box(f'porticoarch{fy}', M['dark'], 0, fy * (BD / 2 - 0.006), PZ, 0.06, 0.006, 0.09, outline=0, bevel=0)
    cyl(f'porticoarchtop{fy}', M['dark'], 0.03, 0.006, segs=12, outline=0, matrix=Matrix.Translation((0, fy * (BD / 2 - 0.006), PZ + 0.09)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
loft('porticoroof', M['stone'], [[(-0.07, -BD / 2 + 0.005, PZ + 0.165), (0.07, -BD / 2 + 0.005, PZ + 0.165), (0.07, BD / 2 - 0.005, PZ + 0.165), (-0.07, BD / 2 - 0.005, PZ + 0.165)],
                                 [(-0.004, -BD / 2 + 0.005, PZ + 0.23), (0.004, -BD / 2 + 0.005, PZ + 0.23), (0.004, BD / 2 - 0.005, PZ + 0.23), (-0.004, BD / 2 - 0.005, PZ + 0.23)]], outline=0.003)

# ---------- the palazzi on the banks ----------
colours = ('pink', 'ochre', 'terracotta', 'cream')
k = 0
for s in (-1, 1):
    for y in (-0.88, -0.55, 0.45, 0.8):
        x = s * (CW + 0.17)
        if math.hypot(x, y) > 1.25:
            continue
        h = rng.uniform(0.22, 0.34)
        box(f'palazzo{k}', M[colours[k % 4]], x, y, G - 0.005, 0.32, 0.3, h, outline=0.006, bevel=0)
        for row in range(3):
            for j in range(3):
                box(f'palwin{k}{row}{j}', M['window'], x - s * 0.163, y - 0.09 + j * 0.09, G + 0.05 + row * 0.07, 0.006, 0.03, 0.04, outline=0, bevel=0)
        loft(f'palroof{k}', M['roof'], [[(x - 0.16, y - 0.15, G + h - 0.005), (x + 0.16, y - 0.15, G + h - 0.005), (x + 0.16, y + 0.15, G + h - 0.005), (x - 0.16, y + 0.15, G + h - 0.005)],
                                        [(x - 0.004, y - 0.15, G + h + 0.06), (x + 0.004, y - 0.15, G + h + 0.06), (x + 0.004, y + 0.15, G + h + 0.06), (x - 0.004, y + 0.15, G + h + 0.06)]], outline=0.003)
        k += 1

# ---------- gondolas and mooring poles ----------
for k, (x, y, a) in enumerate(((-0.15, -0.6, 0.2), (0.2, 0.55, -0.15))):
    g = ball(f'gondola{k}', M['black'], 0, 0, 0, 0.05, outline=0.004)
    g.scale = (0.45, 3.2, 0.35)
    g.location = (x, y, G + 0.02)
    g.rotation_euler = (0, 0, a)
    rod(f'ferro{k}', M['stoneDark'], (x - 0.15 * math.sin(-a), y - 0.15 * math.cos(-a), G + 0.02), (x - 0.17 * math.sin(-a), y - 0.17 * math.cos(-a), G + 0.07), 0.006, segs=4, outline=0)
for k, y in enumerate((-0.35, -0.48, 0.28)):
    rod(f'pole{k}', M['pole'], (CW - 0.06, y, G), (CW - 0.06, y, G + 0.16), 0.008, segs=6, outline=0.001)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
