# A cartoon Marrakesh (Jemaa el-Fnaa and the Koutoubia) for the country maps, built in the set's
# shared look (../toon.py) on a tile of terracotta ground: the Koutoubia's pink sandstone minaret
# with its carved arches, its band of green tiles, its battlements and its little lantern tower
# topped by three golden balls; in the square, stalls under coloured awnings and parasols, an
# orange-juice cart piled with oranges, and palms. Turned a little towards the camera.
# Run: blender -b --factory-startup -P marrakesh.py -- marrakesh-1024.png 1024 marrakesh.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'ground': toon('ground', '#e3b98a', lift=0.25),
    'sandstone': toon('sandstone', '#d08a5e', shadow_mul=(0.8, 0.7, 0.72)),
    'recess': toon('recess', '#a9623e', shadow_mul=(0.8, 0.7, 0.72)),
    'tile': toon('tile', '#2f9a7f', shadow_mul=(0.7, 0.78, 0.8)),
    'wood': toon('wood', '#8a5a3c'),
    'red': toon('red', '#d8463a'),
    'orangeCloth': toon('orangeCloth', '#f0883a'),
    'yellow': toon('yellow', '#f4c83c', shadow_mul=(0.8, 0.68, 0.55)),
    'green': toon('green', '#3aa56b', shadow_mul=(0.7, 0.78, 0.8)),
    'white': toon('white', '#f6f3ec', shadow_mul=(0.82, 0.82, 0.92)),
    'orange': toon('orange', '#f39c2c', shadow_mul=(0.82, 0.66, 0.55), lift=0.3),
    'palm': toon('palm', '#5fa04a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#9b6b43'),
})

G = tile(M['ground'])
before = set(bpy.data.objects)

# ---------- the Koutoubia minaret ----------
MX, MY, MW, MH = -0.38, 0.42, 0.32, 1.15
box('minaret', M['sandstone'], MX, MY, G - 0.005, MW, MW, MH, outline=0.035, bevel=0.006)


def arches(i, a, at):
    # three tiers of carved arch panels on each face
    for k, (z0, h, w) in enumerate(((0.2, 0.2, 0.16), (0.5, 0.2, 0.16), (0.78, 0.12, 0.2))):
        x, y = at(0, -MW / 2 - 0.006)
        box(f'panel{i}{k}', M['recess'], MX + x, MY + y, G + z0, w, 0.02, h - w * 0.35, rot_z=a, outline=0, bevel=0)
        cyl(f'paneltop{i}{k}', M['recess'], w / 2, 0.02, segs=16, outline=0,
            matrix=Matrix.Translation((MX + x, MY + y, G + z0 + h - w * 0.35)) @ Matrix.Rotation(a, 4, 'Z')
            @ Matrix.Rotation(math.pi / 2, 4, 'X'))


each_side(arches)
box('tileband', M['tile'], MX, MY, G + MH - 0.1, MW + 0.01, MW + 0.01, 0.05, outline=0.012, bevel=0)
for i in range(4):
    a = i * math.pi / 2
    for c in (-0.11, 0.0, 0.11):
        x = c * math.cos(a) - (-MW / 2 + 0.025) * math.sin(a)
        y = c * math.sin(a) + (-MW / 2 + 0.025) * math.cos(a)
        box(f'merlon{i}{c}', M['sandstone'], MX + x, MY + y, G + MH - 0.005, 0.06, 0.05, 0.06, rot_z=a, outline=0.012, bevel=0)
box('lantern', M['sandstone'], MX, MY, G + MH - 0.005, 0.13, 0.13, 0.2, outline=0.02, bevel=0.004)
lathe('lanterndome', M['tile'], ((0.075, 0), (0.06, 0.04), (0.01, 0.07)), G + MH + 0.19, MX, MY, segs=16, outline=0.012)
rod('finial', M['gold'], (MX, MY, G + MH + 0.25), (MX, MY, G + MH + 0.42), 0.008, segs=6, outline=0.006)
for k, (dz, r) in enumerate(((0.29, 0.03), (0.34, 0.025), (0.385, 0.02))):
    ball(f'goldball{k}', M['gold'], MX, MY, G + MH + dz, r, outline=0.008)

# ---------- stalls under awnings, and parasols ----------
for k, (x, y, colour) in enumerate(((0.25, 0.25, 'red'), (0.62, 0.05, 'orangeCloth'), (0.35, -0.3, 'green'))):
    box(f'stall{k}', M['wood'], x, y, G - 0.005, 0.24, 0.14, 0.09, outline=0.014, bevel=0.003)
    for px in (-0.11, 0.11):
        for py in (-0.06, 0.06):
            rod(f'stallpole{k}{px}{py}', M['wood'], (x + px, y + py, G), (x + px, y + py, G + 0.22 + (0.03 if py > 0 else 0)), 0.007,
                segs=6, outline=0)
    loft(f'awning{k}', M[colour], [[(x - 0.14, y - 0.1, G + 0.21), (x + 0.14, y - 0.1, G + 0.21), (x + 0.14, y - 0.1, G + 0.225),
                                    (x - 0.14, y - 0.1, G + 0.225)],
                                   [(x - 0.14, y + 0.09, G + 0.255), (x + 0.14, y + 0.09, G + 0.255), (x + 0.14, y + 0.09, G + 0.27),
                                    (x - 0.14, y + 0.09, G + 0.27)]], outline=0.01)
    box(f'valance{k}', M['white'], x, y - 0.1, G + 0.19, 0.28, 0.01, 0.025, outline=0, bevel=0)
for k, (x, y, colour) in enumerate(((-0.5, -0.38, 'yellow'), (-0.1, -0.62, 'red'), (0.82, -0.42, 'green'))):
    rod(f'parasolpole{k}', M['wood'], (x, y, G), (x, y, G + 0.24), 0.008, segs=6, outline=0)
    lathe(f'parasol{k}', M[colour], ((0.14, 0), (0.1, 0.03), (0.004, 0.06)), G + 0.22, x, y, segs=16, outline=0.012)
    box(f'parasoltable{k}', M['wood'], x, y, G - 0.005, 0.14, 0.1, 0.07, outline=0.012, bevel=0.003)

# ---------- an orange-juice cart piled with oranges ----------
CX, CY = 0.15, -0.88
box('cart', M['green'], CX, CY, G + 0.05, 0.26, 0.14, 0.08, outline=0.014, bevel=0.005)
for wx in (-0.09, 0.09):
    cyl(f'cartwheel{wx}', M['wood'], 0.045, 0.02, segs=14, outline=0.008,
        matrix=Matrix.Translation((CX + wx, CY - 0.075, G + 0.045)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
for k, (dx, dy, dz) in enumerate(((-0.07, -0.03, 0), (0, -0.03, 0), (0.07, -0.03, 0), (-0.035, 0.025, 0), (0.035, 0.025, 0),
                                  (-0.035, -0.005, 0.04), (0.035, -0.005, 0.04), (0.0, 0.0, 0.075))):
    ball(f'orange{k}', M['orange'], CX + dx, CY + dy, G + 0.155 + dz, 0.032, outline=0.008)

# ---------- palms ----------
for k, (x, y) in enumerate(((-1.05, 0.1), (1.0, 0.52))):
    top = Vector((x, y, G + 0.6))
    rod(f'trunk{k}', M['trunk'], (x, y, G), top, 0.03, r2=0.022, segs=8, outline=0.015)
    for j in range(6):
        a = 2 * math.pi * j / 6 + k
        rod(f'leaf{k}{j}', M['palm'], top, top + Vector((0.2 * math.cos(a), 0.2 * math.sin(a), -0.08)), 0.045, r2=0.0, segs=6,
            outline=0.014)

turn(before, -20)
render(G)
