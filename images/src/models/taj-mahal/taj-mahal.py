# A cartoon Taj Mahal for the country maps, built from primitives in the set's shared look
# (../toon.py): the red sandstone base and white marble plinth, the four minarets at its
# corners, the octagonal tomb with a great pointed arch on each side, its onion dome and four
# little domed kiosks, and the reflecting pool with cypresses leading up to it. Turned to face
# the camera, the postcard view.
# Run: blender -b --factory-startup -P taj-mahal.py -- taj-mahal-1024.png 1024 taj-mahal.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'marble': toon('marble', '#f6f3ec', shadow_mul=(0.80, 0.82, 0.93), lift=0.25),
    'marbleDark': toon('marbleDark', '#e4ddcf', shadow_mul=(0.80, 0.82, 0.93)),
    'recess': toon('recess', '#a79fbd', shadow_mul=(0.78, 0.78, 0.88)),
    'sandstone': toon('sandstone', '#c9775c'),
    'water': toon('water', '#5ab3e2', shadow_mul=(0.75, 0.82, 0.9), lift=0.35),
    'cypress': toon('cypress', '#3f8a4f', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile()
before = set(bpy.data.objects)


def lathe(name, mat, profile, z0, x=0.0, y=0.0, segs=28, outline=0.03):
    """A round solid from (radius, height) pairs, bottom to top, standing at (x, y)."""
    return loft(name, mat, [[(x + r * math.cos(2 * math.pi * k / segs), y + r * math.sin(2 * math.pi * k / segs), z0 + z)
                              for k in range(segs)] for r, z in profile], outline=outline, smooth=True)


def pointed_arch(name, mat, x, y, z0, width, height, angle, proud=0.0):
    """A dark pointed arch on a wall facing `angle` (0: the front, -Y)."""
    rect = height - width * 0.75
    box(name, mat, x, y, z0, width, 0.02, rect, rot_z=angle, outline=0, bevel=0)
    # a flattened pyramid: seen from the front, a triangle on top of the opening
    top = pyramid(name + 'top', mat, 0, 0, 0, width, width * 0.75, outline=0)
    top.matrix_world = (Matrix.Translation((x, y, z0 + rect)) @ Matrix.Rotation(angle, 4, 'Z')
                        @ Matrix.Scale(0.15, 4, (0, 1, 0)))
    return top


def finial(name, x, y, z, height=0.12):
    rod(name, M['gold'], (x, y, z), (x, y, z + height), 0.012, outline=0.012)
    ball(name + 'ball', M['gold'], x, y, z + height * 0.45, 0.022, outline=0.012)


# ---------- the reflecting pool, with cypresses either side ----------
box('poolpath', M['path'], 0, -1.22, G - 0.005, 0.5, 0.42, 0.02, outline=0.015, bevel=0)
box('pool', M['water'], 0, -1.22, G + 0.0, 0.16, 0.42, 0.025, outline=0.012, bevel=0)
for k, (x, y) in enumerate(((-0.34, -1.08), (0.34, -1.08), (-0.3, -1.3), (0.3, -1.3))):
    rod(f'cypress{k}', M['cypress'], (x, y, G), (x, y, G + 0.32), 0.07, r2=0.0, segs=10, outline=0.025)

# ---------- the base, the plinth and the minarets ----------
box('base', M['sandstone'], 0, 0, G, 1.9, 1.9, 0.07, bevel=0.01)
Z_P = G + 0.07 + 0.15
box('plinth', M['marbleDark'], 0, 0, G + 0.07, 1.72, 1.72, 0.15, bevel=0.012)
for sx in (-1, 1):
    for sy in (-1, 1):
        x, y = sx * 0.78, sy * 0.78
        rod(f'minaret{sx}{sy}', M['marble'], (x, y, Z_P), (x, y, Z_P + 1.1), 0.075, r2=0.06, segs=16, outline=0.03)
        for h in (0.36, 0.72, 1.04):
            cyl(f'balcony{sx}{sy}{h}', M['marbleDark'], 0.1, 0.03, segs=16, outline=0.02,
                matrix=Matrix.Translation((x, y, Z_P + h)))
        lathe(f'mincap{sx}{sy}', M['marble'], ((0.075, 0), (0.09, 0.04), (0.07, 0.1), (0.03, 0.14), (0.005, 0.16)),
              Z_P + 1.1, x, y, segs=16, outline=0.02)
        finial(f'minfin{sx}{sy}', x, y, Z_P + 1.25, 0.08)

# ---------- the tomb: an octagon with a great arch on each side ----------
HALF, CUT, TOMB_H = 0.5, 0.16, 0.6
octagon = [(HALF, -HALF + CUT), (HALF, HALF - CUT), (HALF - CUT, HALF), (-HALF + CUT, HALF),
           (-HALF, HALF - CUT), (-HALF, -HALF + CUT), (-HALF + CUT, -HALF), (HALF - CUT, -HALF)]
loft('tomb', M['marble'], [[(x, y, Z_P) for x, y in octagon], [(x, y, Z_P + TOMB_H) for x, y in octagon]],
     outline=0.04, bevel=0.01)


def iwan(i, a, at):
    # the pishtaq: a frame standing a little proud and above the parapet, with the great arch
    x, y = at(0, -HALF - 0.015)
    box(f'pishtaq{i}', M['marble'], x, y, Z_P, 0.44, 0.04, TOMB_H + 0.08, rot_z=a, outline=0.03, bevel=0.008)
    x, y = at(0, -HALF - 0.04)
    pointed_arch(f'iwan{i}', M['recess'], x, y, Z_P + 0.04, 0.25, 0.48, a)
    # two small arches, one above the other, on each corner face
    d = HALF - CUT / 2 + 0.009   # the corner face's middle, just proud of it
    for side in (-1, 1):
        ca = a + side * math.pi / 4
        cx, cy = at(side * d, -d)
        for z0 in (Z_P + 0.06, Z_P + 0.33):
            pointed_arch(f'corner{i}{side}{z0:.2f}', M['recess'], cx, cy, z0, 0.08, 0.2, ca)


each_side(iwan)

# ---------- the roof: four kiosks, the drum and the onion dome ----------
Z_R = Z_P + TOMB_H
for sx in (-1, 1):
    for sy in (-1, 1):
        x, y = sx * 0.32, sy * 0.32
        cyl(f'kiosk{sx}{sy}', M['marble'], 0.08, 0.12, segs=16, outline=0.025, matrix=Matrix.Translation((x, y, Z_R + 0.06)))
        lathe(f'kioskdome{sx}{sy}', M['marble'], ((0.09, 0), (0.1, 0.04), (0.08, 0.09), (0.04, 0.12), (0.005, 0.14)),
              Z_R + 0.12, x, y, segs=16, outline=0.02)
        finial(f'kioskfin{sx}{sy}', x, y, Z_R + 0.25, 0.07)
cyl('drum', M['marble'], 0.27, 0.16, segs=32, outline=0.03, smooth=True, matrix=Matrix.Translation((0, 0, Z_R + 0.08)))
DOME = ((0.27, 0.0), (0.33, 0.08), (0.37, 0.18), (0.36, 0.28), (0.31, 0.37), (0.22, 0.45), (0.12, 0.52),
        (0.05, 0.58), (0.015, 0.62))
lathe('dome', M['marble'], DOME, Z_R + 0.16, segs=32, outline=0.04)
finial('domefin', 0, 0, Z_R + 0.77, 0.16)

turn(before, -32)
render(G)
