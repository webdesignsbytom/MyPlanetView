# A cartoon Palmyra for the country maps, built in the set's shared look (../toon.py) on a tile of
# desert sand: the Great Colonnade's double row of columns running through the city with lengths of
# entablature still on top, the Monumental Arch across it, the Temple of Bel's cella with its
# columns, tower tombs on the hills behind, the Arab castle on its peak, and the palms of the oasis.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P palmyra.py -- palmyra-1024.png 1024 palmyra.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sand': toon('sand', '#e8cf9e', shadow_mul=(0.84, 0.74, 0.62), lift=0.25),
    'stone': toon('stone', '#e0c095', shadow_mul=(0.84, 0.74, 0.68)),
    'stoneDark': toon('stoneDark', '#c4a274', shadow_mul=(0.84, 0.74, 0.68)),
    'hill': toon('hill', '#c9a878', shadow_mul=(0.84, 0.74, 0.7)),
    'door': flat('door', '#4a3428'),
    'palm': toon('palm', '#5a9e4a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#8a6448'),
})

G = tile(M['sand'])
before = set(bpy.data.objects)
rng = random.Random(353)


def ring(cx, cy, rx, ry, z, jitter, sides=14):
    return [(cx + rx * (1 + rng.uniform(-jitter, jitter)) * math.cos(2 * math.pi * k / sides),
             cy + ry * (1 + rng.uniform(-jitter, jitter)) * math.sin(2 * math.pi * k / sides), G + z) for k in range(sides)]


def column(name, x, y, z0, h, r):
    lathe(f'{name}base', M['stoneDark'], ((r * 1.4, 0), (r * 1.4, 0.02), (r * 1.1, 0.03)), z0, x, y, segs=10, outline=0.006)
    rod(name, M['stone'], (x, y, z0 + 0.03), (x, y, z0 + h - 0.03), r, r2=r * 0.88, segs=10, outline=0.009)
    lathe(f'{name}capital', M['stoneDark'], ((r * 0.9, 0), (r * 1.4, 0.03)), z0 + h - 0.03, x, y, segs=10, outline=0.006)
    # the bracket halfway up, where a statue once stood
    box(f'{name}bracket', M['stoneDark'], x, y - r - 0.01, z0 + h * 0.55, 0.03, 0.025, 0.02, outline=0.004, bevel=0)


# ---------- the hills behind, tower tombs and the Arab castle ----------
for k, (cx, cy, r, h) in enumerate(((-0.55, 0.92, 0.4, 0.5), (0.4, 1.02, 0.4, 0.32))):
    hl = loft(f'hill{k}', M['hill'], [ring(cx, cy, r, r * 0.5, -0.01, 0.03), ring(cx, cy, r * 0.65, r * 0.32, h * 0.6, 0.08), ring(cx, cy, r * 0.25, r * 0.14, h, 0.08)],
              outline=0.03)
    hl.visible_shadow = False
CX, CY, CZ = -0.55, 0.94, G + 0.5
box('castle', M['stoneDark'], CX, CY, CZ - 0.04, 0.2, 0.14, 0.12, outline=0.014, bevel=0)
for sx in (-1, 1):
    lathe(f'castletower{sx}', M['stoneDark'], ((0.04, 0), (0.035, 0.16)), CZ - 0.04, CX + sx * 0.1, CY - 0.06, segs=10, outline=0.01)
for k, (x, y, h) in enumerate(((0.15, 0.85, 0.32), (0.4, 0.8, 0.26), (0.62, 0.88, 0.3), (0.85, 0.7, 0.22))):
    box(f'tomb{k}', M['stone'], x, y, G - 0.005, 0.1, 0.1, h, outline=0.014, bevel=0)
    box(f'tombdoor{k}', M['door'], x, y - 0.051, G + h * 0.35, 0.025, 0.01, 0.05, outline=0, bevel=0)

# ---------- the Great Colonnade, the Monumental Arch across it ----------
AX = -0.25
for side in (-1, 1):
    y = 0.15 + side * 0.11
    xs = [-1.05 + k * 0.13 for k in range(15)]
    standing = [x for x in xs if abs(x - AX) > 0.12 and not (0.45 < x < 0.62)]
    for k, x in enumerate(standing):
        h = 0.38 if (k + side) % 5 else rng.uniform(0.12, 0.22)
        column(f'col{side}{k}', x, y, G - 0.005, h, 0.024)
    for x0 in (-0.95, -0.17, 0.25):
        box(f'entab{side}{x0}', M['stone'], x0 + 0.13, y, G + 0.375, 0.28, 0.06, 0.035, outline=0.008, bevel=0)
box('street', M['stoneDark'], -0.1, 0.15, G - 0.005, 2.0, 0.14, 0.008, outline=0, bevel=0)
# the arch: three openings, the middle one tallest, its face turned a little
arch_made = set(bpy.data.objects)
box('archbody', M['stone'], 0, 0, G - 0.005, 0.12, 0.42, 0.48, outline=0.018, bevel=0)
for k, (dy, w, h) in enumerate(((0.0, 0.14, 0.32), (-0.15, 0.07, 0.2), (0.15, 0.07, 0.2))):
    box(f'archopening{k}', M['door'], -0.061, dy, G, 0.01, w, h, outline=0, bevel=0)
    cyl(f'archtop{k}', M['door'], w / 2, 0.01, segs=16, outline=0, matrix=Matrix.Translation((-0.061, dy, G + h)) @ Matrix.Rotation(math.pi / 2, 4, 'Y'))
box('archcornice', M['stoneDark'], 0, 0, G + 0.47, 0.15, 0.45, 0.035, outline=0.01, bevel=0)
bpy.context.view_layer.update()
m = Matrix.Translation((AX, 0.15, 0)) @ Matrix.Rotation(math.radians(-12), 4, 'Z')
for ob in set(bpy.data.objects) - arch_made:
    ob.matrix_world = m @ ob.matrix_world

# ---------- the Temple of Bel ----------
TX, TY = 0.55, -0.45
box('belplatform', M['stoneDark'], TX, TY, G - 0.005, 0.62, 0.44, 0.05, outline=0.014, bevel=0)
box('belcella', M['stone'], TX, TY + 0.02, G + 0.045, 0.42, 0.24, 0.3, outline=0.018, bevel=0)
box('beldoor', M['door'], TX, TY + 0.02 - 0.121, G + 0.045, 0.08, 0.01, 0.17, outline=0, bevel=0)
box('belframe', M['stoneDark'], TX, TY + 0.02 - 0.124, G + 0.215, 0.12, 0.01, 0.03, outline=0, bevel=0)
for k, (dx, ok) in enumerate(((-0.27, True), (-0.18, True), (0.27, True), (0.18, False))):
    if ok:
        column(f'belcol{k}', TX + dx, TY - 0.18, G + 0.045, 0.36, 0.022)
for k in range(5):
    pyramid(f'merlon{k}', M['stoneDark'], TX - 0.18 + k * 0.09, TY + 0.02 - 0.115, G + 0.345, 0.04, 0.04, outline=0.004)

# ---------- palms of the oasis ----------
for k, (x, y) in enumerate(((-1.05, -0.45), (-0.8, -0.7), (-0.5, -0.85), (-1.1, -0.1), (-0.25, -0.95), (1.05, -0.25))):
    h = rng.uniform(0.28, 0.36)
    rod(f'palmtrunk{k}', M['trunk'], (x, y, G), (x + 0.02, y, G + h), 0.016, r2=0.012, segs=8, outline=0.007)
    for f in range(7):
        b = 2 * math.pi * f / 7 + k
        bar(f'frond{k}{f}', M['palm'], (x + 0.02, y, G + h), (x + 0.02 + 0.12 * math.cos(b), y + 0.12 * math.sin(b), G + h - 0.06), 0.024, outline=0.006)

turn(before, -20)
render(G)
