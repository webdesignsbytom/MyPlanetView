# A cartoon Wieliczka Salt Mine for the country maps, built in the set's shared look (../toon.py) as
# a cut-away: a block of the ground opened at the front to show the Chapel of Saint Kinga deep in
# the salt, its grey salt walls and carved floor, the altar and salt figures, and two salt-crystal
# chandeliers; on the grass above, the timber headframe over the shaft and the mine's pink building.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P wieliczka.py -- wieliczka-1024.png 1024 wieliczka.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'salt': toon('salt', '#b8b4a8', shadow_mul=(0.8, 0.8, 0.88), lift=0.25),
    'saltDark': toon('saltDark', '#9a968a', shadow_mul=(0.8, 0.8, 0.88), lift=0.25),
    'saltLight': toon('saltLight', '#d8d4c8', shadow_mul=(0.8, 0.8, 0.88), lift=0.3),
    'earth': toon('earth', '#8a6a50', shadow_mul=(0.82, 0.76, 0.8)),
    'earthDark': toon('earthDark', '#6b5040', shadow_mul=(0.82, 0.76, 0.8)),
    'turf': toon('turf', '#6faa55', shadow_mul=(0.7, 0.78, 0.8)),
    'crystal': toon('crystal', '#eef4f6', shadow_mul=(0.82, 0.86, 0.95), lift=0.4),
    'lamp': flat('lamp', '#ffe08a'),
    'timber': toon('timber', '#7a5238'),
    'pink': toon('pink', '#e8b0a8', shadow_mul=(0.84, 0.74, 0.8)),
    'roof': toon('roof', '#8f4a3a'),
    'window': flat('window', '#3a3640'),
    'tree': toon('tree', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'iron': toon('iron', '#4a4a52'),
})

G = tile()
before = set(bpy.data.objects)
rng = random.Random(491)

# ---------- the block of ground, cut open at the front ----------
X0, X1, Y0, Y1, TOPZ = -0.95, 0.95, -0.3, 0.75, G + 0.62
RX0, RX1, RY1, RZ0, RZ1 = -0.5, 0.5, 0.45, G + 0.06, G + 0.44     # the chapel's room inside
for name, x0, x1, y0, y1, z0, z1 in (('left', X0, RX0, Y0, Y1, G - 0.005, TOPZ), ('right', RX1, X1, Y0, Y1, G - 0.005, TOPZ),
                                     ('floor', RX0, RX1, Y0, Y1, G - 0.005, RZ0), ('ceiling', RX0, RX1, Y0, Y1, RZ1, TOPZ), ('back', RX0, RX1, RY1, Y1, RZ0, RZ1)):
    box(name, M['salt'], (x0 + x1) / 2, (y0 + y1) / 2, z0, x1 - x0, y1 - y0, z1 - z0, outline=0.02, bevel=0)
# the cut face's earth and rock in bands, outside the room
for k, (z0, z1, mat) in enumerate(((G + 0.44, G + 0.52, 'earthDark'), (G + 0.52, TOPZ, 'earth'))):
    for name, x0, x1 in (('L', X0, RX0), ('R', RX1, X1), ('C', RX0, RX1)):
        box(f'face{k}{name}', M[mat], (x0 + x1) / 2, Y0 - 0.004, z0, x1 - x0, 0.01, z1 - z0, outline=0, bevel=0)
for k in range(4):
    z = G + 0.08 + k * 0.09
    for name, x0, x1 in (('L', X0, RX0), ('R', RX1, X1)):
        box(f'stratum{k}{name}', M['saltDark'], (x0 + x1) / 2, Y0 - 0.005, z, x1 - x0, 0.01, 0.018, outline=0, bevel=0)
# the turf on top
box('turf', M['turf'], 0, (Y0 + Y1) / 2, TOPZ - 0.005, X1 - X0 + 0.02, Y1 - Y0 + 0.02, 0.035, outline=0.014, bevel=0)

# ---------- inside the Chapel of Saint Kinga ----------
# the carved floor, a pattern of light and dark salt
for i in range(8):
    for j in range(5):
        box(f'floortile{i}{j}', M['saltLight' if (i + j) % 2 else 'saltDark'], RX0 + 0.0625 + i * 0.125, Y0 + 0.08 + j * 0.15, RZ0, 0.125, 0.15, 0.006, outline=0, bevel=0)
# the altar against the back wall, and salt figures
box('altarstep', M['saltLight'], 0, RY1 - 0.06, RZ0, 0.36, 0.12, 0.03, outline=0.008, bevel=0)
box('altar', M['saltLight'], 0, RY1 - 0.04, RZ0 + 0.03, 0.2, 0.08, 0.09, outline=0.008, bevel=0)
box('altarback', M['saltLight'], 0, RY1 - 0.01, RZ0 + 0.12, 0.16, 0.02, 0.18, outline=0.008, bevel=0)
lathe('altarfigure', M['saltLight'], ((0.025, 0), (0.02, 0.08), (0.004, 0.1)), RZ0 + 0.12, 0, RY1 - 0.035, segs=10, outline=0.005)
for s in (-1, 1):
    x = s * 0.35
    lathe(f'figure{s}', M['saltLight'], ((0.035, 0), (0.03, 0.12), (0.02, 0.14)), RZ0, x, RY1 - 0.1, segs=10, outline=0.006)
    ball(f'figurehead{s}', M['saltLight'], x, RY1 - 0.1, RZ0 + 0.165, 0.025, outline=0.005)
    # reliefs carved in the side walls
    box(f'relief{s}', M['saltLight'], s * (RX1 - 0.004), 0.05, RZ0 + 0.12, 0.008, 0.2, 0.14, outline=0.004, bevel=0)


# ---------- the salt-crystal chandeliers ----------
def chandelier(name, x, y):
    rod(f'{name}chain', M['iron'], (x, y, RZ1), (x, y, RZ1 - 0.1), 0.004, segs=4, outline=0)
    lathe(f'{name}ring', M['gold'], ((0.06, 0), (0.06, 0.012)), RZ1 - 0.15, x, y, segs=16, outline=0.004)
    for k in range(8):
        a = 2 * math.pi * k / 8
        ball(f'{name}crystal{k}', M['crystal'], x + 0.06 * math.cos(a), y + 0.06 * math.sin(a), RZ1 - 0.17, 0.014, outline=0.003)
        ball(f'{name}light{k}', M['lamp'], x + 0.06 * math.cos(a), y + 0.06 * math.sin(a), RZ1 - 0.13, 0.008, outline=0)
    lathe(f'{name}drop', M['crystal'], ((0.02, 0), (0.004, 0.05)), RZ1 - 0.2, x, y, segs=8, outline=0.003)


chandelier('chandelier1', -0.2, 0.08)
chandelier('chandelier2', 0.2, 0.08)

# ---------- on the grass above: the headframe over the shaft, the mine building, trees ----------
HX, HY = -0.55, 0.35
for sx in (-1, 1):
    for sy in (-1, 1):
        rod(f'headleg{sx}{sy}', M['timber'], (HX + sx * 0.1, HY + sy * 0.08, TOPZ + 0.03), (HX + sx * 0.035, HY + sy * 0.035, TOPZ + 0.38), 0.012, segs=6, outline=0.004)
for k, z in enumerate((0.12, 0.24)):
    box(f'headbrace{k}', M['timber'], HX, HY - 0.08 + 0.02 * k, TOPZ + 0.03 + z, 0.16 - 0.05 * k, 0.012, 0.012, outline=0, bevel=0)
cyl('wheel', M['iron'], 0.06, 0.012, segs=20, outline=0.006, matrix=Matrix.Translation((HX, HY, TOPZ + 0.4)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
box('shafthouse', M['timber'], HX, HY, TOPZ + 0.03, 0.14, 0.12, 0.07, outline=0.008, bevel=0)
BX, BY = 0.35, 0.3
box('minebuilding', M['pink'], BX, BY, TOPZ + 0.03, 0.42, 0.22, 0.14, outline=0.016, bevel=0)
loft('minebuildingroof', M['roof'], [[(BX - 0.22, BY - 0.12, TOPZ + 0.165), (BX + 0.22, BY - 0.12, TOPZ + 0.165), (BX + 0.22, BY + 0.12, TOPZ + 0.165), (BX - 0.22, BY + 0.12, TOPZ + 0.165)],
                                     [(BX - 0.2, BY - 0.004, TOPZ + 0.25), (BX + 0.2, BY - 0.004, TOPZ + 0.25), (BX + 0.2, BY + 0.004, TOPZ + 0.25), (BX - 0.2, BY + 0.004, TOPZ + 0.25)]],
     outline=0.012)
for k in range(5):
    box(f'minewin{k}', M['window'], BX - 0.16 + k * 0.08, BY - 0.112, TOPZ + 0.08, 0.03, 0.01, 0.05, outline=0, bevel=0)
for k, (x, y) in enumerate(((-0.82, -0.1), (0.8, -0.1), (0.85, 0.6), (-0.1, 0.6))):
    ball(f'tree{k}', M['tree'], x, y, TOPZ + 0.12, 0.09, outline=0.016)

turn(before, -20)
render(G)
