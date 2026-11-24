# A cartoon Wat Arun, the Temple of Dawn, for the country maps, built in the set's shared look
# (../toon.py): the great central prang on the bank of the Chao Phraya, its steep tiered tower
# encrusted with coloured porcelain and seashells, the four smaller prangs at its corners, the
# terraces and steep stairs climbing it, the gilded spire on top, and the river in front with a
# long-tail boat. Turned a little towards the camera.
# Run: blender -b --factory-startup -P wat-arun.py -- wat-arun-1024.png 1024 wat-arun.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#e0d8c8', shadow_mul=(0.82, 0.8, 0.88), lift=0.2),
    'river': toon('river', '#8a9a6a', shadow_mul=(0.8, 0.86, 0.82), lift=0.25),
    'porcelain': toon('porcelain', '#ece6dc', shadow_mul=(0.82, 0.84, 0.9), lift=0.2),
    'porcelainDark': toon('porcelainDark', '#c8c0b4'),
    'blue': toon('blue', '#4a7ac0', lift=0.15),
    'pink': toon('pink', '#e08aa0', lift=0.15),
    'green': toon('green', '#5ab08a', lift=0.15),
    'gold': toon('gold', '#f0c040', lift=0.3),
    'dark': flat('dark', '#2e2a2a'),
    'wood': toon('wood', '#7a5236'),
    'red': toon('red', '#c83a30'),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['paving'])
before = set(bpy.data.objects)
rng = random.Random(1851)
DOTS = ('blue', 'pink', 'green')


def strip(y0, y1, r, z, n=6):
    """The band of the tile's disc between y0 and y1 (counter-clockwise from above)."""
    xa0, xa1 = math.sqrt(r * r - y0 * y0), math.sqrt(r * r - y1 * y1)
    a0, a1 = math.asin(y0 / r), math.asin(y1 / r)
    pts = [(-xa0, y0), (xa0, y0)]
    pts += [(r * math.cos(a0 + (a1 - a0) * k / n), r * math.sin(a0 + (a1 - a0) * k / n)) for k in range(1, n)]
    pts += [(xa1, y1), (-xa1, y1)]
    pts += [(r * math.cos(math.pi - a1 + (a1 - a0) * k / n), r * math.sin(math.pi - a1 + (a1 - a0) * k / n)) for k in range(1, n)]
    return [(x, y, G + z) for x, y in pts]


loft('river', M['river'], [strip(-1.41, -0.6, 1.42, -0.004), strip(-1.41, -0.6, 1.42, 0.004)], outline=0)


def prang(name, x, y, z, base, h, dots=12):
    """A Khmer-style prang: square terraces, then a tall bulging tower narrowing to a spire."""
    s = base
    zz = z
    for k in range(3):
        box(f'{name}terrace{k}', M['porcelain'], x, y, zz, s, s, h * 0.06, outline=0.004, bevel=0)
        zz += h * 0.06
        s *= 0.82
    prof = [(s / 2 * 1.2, 0), (s / 2 * 1.25, h * 0.18), (s / 2 * 1.05, h * 0.42), (s / 2 * 0.7, h * 0.6), (s / 2 * 0.3, h * 0.72), (0.004, h * 0.8)]
    lathe(f'{name}tower', M['porcelain'], prof, zz, x, y, segs=12, outline=0.005, smooth=False)
    for r in range(4):
        zr = zz + h * (0.1 + r * 0.14)
        rr = s / 2 * (1.24 - r * 0.22)
        lathe(f'{name}band{r}', M['porcelainDark'], ((rr + 0.004, 0), (rr + 0.004, h * 0.02)), zr, x, y, segs=12, outline=0.001, smooth=False)
        for j in range(dots):
            a = 2 * math.pi * j / dots
            if math.sin(a) > 0.3:
                continue
            ball(f'{name}dot{r}{j}', M[DOTS[(r + j) % 3]], x + (rr + 0.006) * math.cos(a), y + (rr + 0.006) * math.sin(a), zr + h * 0.05, h * 0.015, outline=0)
    rod(f'{name}spire', M['gold'], (x, y, zz + h * 0.78), (x, y, zz + h), 0.006 * (h / 0.5), segs=6, outline=0.001)
    return zz


# ---------- the central prang and the four small ones ----------
PX, PY = 0.0, 0.2
prang('central', PX, PY, G - 0.005, 0.6, 0.9, dots=16)
# the steep stairways up the front of the central terraces
for i in range(6):
    box(f'stair{i}', M['porcelainDark'], PX, PY - 0.3 - 0.015 + i * 0.012, G - 0.005, 0.08, 0.03, 0.02 + i * 0.02, outline=0.001, bevel=0)
for sx in (-1, 1):
    for sy in (-1, 1):
        prang(f'small{sx}{sy}', PX + sx * 0.45, PY + sy * 0.38, G - 0.005, 0.18, 0.45)
# the gilded guardian figures (yaksha) at the stair's foot
for s in (-1, 1):
    rod(f'guardian{s}', M['green'], (PX + s * 0.08, PY - 0.36, G), (PX + s * 0.08, PY - 0.36, G + 0.1), 0.014, segs=6, outline=0.002)
    ball(f'guardianhead{s}', M['gold'], PX + s * 0.08, PY - 0.36, G + 0.115, 0.012, outline=0.001)

# ---------- the long-tail boat and the trees ----------
BX, BY = -0.35, -0.85
hull = ball('longtail', M['wood'], 0, 0, 0, 0.05, outline=0.004)
hull.scale = (4.0, 0.7, 0.45)
hull.location = (BX, BY, G + 0.01)
box('canopy', M['red'], BX + 0.04, BY, G + 0.05, 0.16, 0.06, 0.008, outline=0.002, bevel=0)
for k, x in enumerate((-0.04, 0.12)):
    rod(f'canopypost{k}', M['wood'], (BX + x, BY, G + 0.02), (BX + x, BY, G + 0.05), 0.003, segs=4, outline=0)
bar('motorpole', M['dark'], (BX + 0.18, BY, G + 0.03), (BX + 0.3, BY, G + 0.0), 0.006, outline=0)
for k, (x, y) in enumerate(((-0.9, 0.0), (0.9, 0.0), (-0.75, 0.7), (0.75, 0.7))):
    ball(f'tree{k}', M['tree'], x, y, G + 0.13, 0.11, outline=0.012)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
