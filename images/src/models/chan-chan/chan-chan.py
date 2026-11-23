# A cartoon Chan Chan for the country maps, built in the set's shared look (../toon.py): the great
# adobe city of the Chimú on the desert coast of Peru, its high mud-brick walls sloping in to their
# tops round the courtyards and a ramp, the restored wall in front covered in its lattice of
# diamond openings and friezes of fish and pelicans. Turned a little towards the camera.
# Run: blender -b --factory-startup -P chan-chan.py -- chan-chan-1024.png 1024 chan-chan.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sand': toon('sand', '#d8c49a', shadow_mul=(0.86, 0.82, 0.76), lift=0.2),
    'adobe': toon('adobe', '#c8a878', shadow_mul=(0.86, 0.82, 0.76), lift=0.06),
    'adobeDark': toon('adobeDark', '#a8885a'),
    'court': toon('court', '#d0b88a'),
    'hole': flat('hole', '#6a5038'),
})

G = tile(M['sand'])
before = set(bpy.data.objects)


def wall(name, x0, y0, x1, y1, h, base=0.1, top=0.05):
    a = math.atan2(y1 - y0, x1 - x0)
    L = math.hypot(x1 - x0, y1 - y0)
    c, s = math.cos(a), math.sin(a)

    def p(u, v, z):
        return ((x0 + x1) / 2 + u * c - v * s, (y0 + y1) / 2 + u * s + v * c, G + z)
    return loft(name, M['adobe'], [[p(-L / 2, -base / 2, -0.005), p(L / 2, -base / 2, -0.005), p(L / 2, base / 2, -0.005), p(-L / 2, base / 2, -0.005)],
                                   [p(-L / 2, -top / 2, h), p(L / 2, -top / 2, h), p(L / 2, top / 2, h), p(-L / 2, top / 2, h)]], outline=0.007)


# ---------- the compound ----------
box('court1', M['court'], -0.1, 0.25, G - 0.003, 1.2, 0.7, 0.008, outline=0.002, bevel=0)
wall('back', -0.72, 0.62, 0.55, 0.62, 0.3)
wall('left', -0.72, -0.12, -0.72, 0.62, 0.28)
wall('right', 0.55, -0.12, 0.55, 0.62, 0.28)
wall('inner1', -0.2, 0.15, -0.2, 0.62, 0.2, 0.08, 0.04)
wall('inner2', -0.72, 0.3, -0.2, 0.3, 0.18, 0.08, 0.04)
wall('inner3', 0.2, 0.35, 0.55, 0.35, 0.18, 0.08, 0.04)
# a ramp up to a platform
box('platform', M['adobeDark'], 0.25, 0.5, G - 0.005, 0.26, 0.18, 0.08, outline=0.004, bevel=0)
loft('ramp', M['adobeDark'], [[(0.18, 0.18, G - 0.005), (0.32, 0.18, G - 0.005), (0.32, 0.41, G - 0.005), (0.18, 0.41, G - 0.005)],
                              [(0.18, 0.4, G + 0.075), (0.32, 0.4, G + 0.075), (0.32, 0.41, G + 0.075), (0.18, 0.41, G + 0.075)]], outline=0.003)

# ---------- the restored wall with its friezes ----------
FY, FH = -0.15, 0.3
wall('frieze', -0.8, FY, 0.62, FY, FH, 0.1, 0.07)
face = FY - 0.042


def diamond(name, mat, x, z, r, y):
    cyl(name, mat, r, 0.006, segs=4, outline=0, matrix=Matrix.Translation((x, y, z)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))


# the lattice: rows of diamond openings
for row in range(3):
    z = G + 0.06 + row * 0.04
    yy = FY - 0.05 + 0.03 * (z - G) / FH * 0.9
    for j in range(24):
        x = -0.72 + j * 0.058 + (0.029 if row % 2 else 0)
        if x > 0.56:
            continue
        diamond(f'lattice{row}{j}', M['hole'], x, z, 0.018, yy - 0.003)
# a band of fish
z = G + 0.2
yy = FY - 0.05 + 0.03 * (z - G) / FH * 0.9
for j in range(11):
    x = -0.7 + j * 0.12
    b = ball(f'fish{j}', M['adobeDark'], 0, 0, 0, 0.5, outline=0.001)
    b.scale = (0.055, 0.012, 0.025)
    b.location = (x, yy - 0.004, z)
    diamond(f'fishtail{j}', M['adobeDark'], x + 0.035, z, 0.014, yy - 0.004)
# a band of pelicans
z = G + 0.255
yy = FY - 0.05 + 0.03 * (z - G) / FH * 0.9
for j in range(11):
    x = -0.66 + j * 0.12
    ball(f'birdbody{j}', M['adobeDark'], x, yy - 0.004, z, 0.016, outline=0.001)
    ball(f'birdhead{j}', M['adobeDark'], x - 0.02, yy - 0.004, z + 0.016, 0.009, outline=0)
    bar(f'birdbeak{j}', M['adobeDark'], (x - 0.026, yy - 0.004, z + 0.016), (x - 0.05, yy - 0.004, z + 0.006), 0.006, outline=0)
box('friezegate', M['hole'], 0.4, FY - 0.04, G - 0.005, 0.07, 0.03, 0.12, outline=0, bevel=0)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
