# A cartoon Philae for the country maps, built in the set's shared look (../toon.py): the Temple of
# Isis on its island in the Nile, its great first pylon with the gateway between its two sloping
# towers, the colonnades running down to it, the second pylon behind, Trajan's Kiosk with its
# fourteen columns on the water's edge, palms, and a felucca with its white sail on the river.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P philae.py -- philae-1024.png 1024 philae.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'nile': toon('nile', '#3a8aa8', shadow_mul=(0.76, 0.86, 0.92), lift=0.3),
    'island': toon('island', '#d8c08a', shadow_mul=(0.86, 0.8, 0.74), lift=0.15),
    'stone': toon('stone', '#e0c898', shadow_mul=(0.86, 0.8, 0.76), lift=0.12),
    'stoneDark': toon('stoneDark', '#c0a270'),
    'dark': flat('dark', '#3a2e24'),
    'palm': toon('palm', '#5a9a40'),
    'trunk': toon('trunk', '#7a5a3a'),
    'sail': toon('sail', '#f6f4ee', lift=0.2),
    'wood': toon('wood', '#7a5236'),
})

G = tile(M['nile'])
before = set(bpy.data.objects)

# ---------- the island ----------
isl = [(0.95 * math.cos(2 * math.pi * k / 20) * (1 + 0.07 * math.sin(3 * 2 * math.pi * k / 20)), 0.05 + 0.75 * math.sin(2 * math.pi * k / 20)) for k in range(20)]
loft('island', M['island'], [[(x, y, G - 0.01) for x, y in isl], [(x * 0.97, 0.05 + (y - 0.05) * 0.97, G + 0.05) for x, y in isl]], outline=0.008)
T = G + 0.05


def pylon(name, x, y, w, h, d):
    """A pylon: two sloping towers either side of a gateway, each with its cornice."""
    for s in (-1, 1):
        tx = x + s * (w / 4 + 0.04)
        bw = w / 2 - 0.04
        loft(f'{name}tower{s}', M['stone'], [[(tx - bw / 2, y - d / 2, T), (tx + bw / 2, y - d / 2, T), (tx + bw / 2, y + d / 2, T), (tx - bw / 2, y + d / 2, T)],
                                              [(tx - bw / 2 + 0.03, y - d / 2 + 0.02, T + h), (tx + bw / 2 - 0.03, y - d / 2 + 0.02, T + h), (tx + bw / 2 - 0.03, y + d / 2 - 0.02, T + h), (tx - bw / 2 + 0.03, y + d / 2 - 0.02, T + h)]], outline=0.007)
        box(f'{name}cornice{s}', M['stoneDark'], tx, y, T + h - 0.005, bw - 0.04, d - 0.03, 0.025, outline=0.003, bevel=0)
        # carved reliefs on the front: a pharaoh smiting, as darker panels
        box(f'{name}relief{s}', M['stoneDark'], tx, y - d / 2 + 0.008, T + h * 0.35, bw * 0.5, 0.006, h * 0.4, outline=0, bevel=0)
    box(f'{name}gate', M['stone'], x, y, T, 0.1, d - 0.02, h * 0.62, outline=0.005, bevel=0)
    box(f'{name}gatedoor', M['dark'], x, y - d / 2 + 0.005, T, 0.05, 0.006, h * 0.5, outline=0, bevel=0)


# ---------- the temple ----------
pylon('firstpylon', 0.0, -0.05, 0.62, 0.36, 0.12)
pylon('secondpylon', 0.05, 0.32, 0.46, 0.27, 0.1)
box('sanctuary', M['stone'], 0.05, 0.52, T, 0.3, 0.26, 0.18, outline=0.007, bevel=0)
# the colonnades leading to the first pylon
for s in (-1, 1):
    x = s * 0.26
    box(f'colonnaderoof{s}', M['stone'], x, -0.39, T + 0.13, 0.1, 0.5, 0.03, outline=0.004, bevel=0)
    box(f'colonnadewall{s}', M['stone'], x + s * 0.04, -0.39, T, 0.02, 0.5, 0.13, outline=0.003, bevel=0)
    for j in range(7):
        y = -0.62 + j * 0.077
        rod(f'colonnadecol{s}{j}', M['stone'], (x - s * 0.03, y, T), (x - s * 0.03, y, T + 0.13), 0.014, segs=8, outline=0.002)
        lathe(f'colonnadecap{s}{j}', M['stoneDark'], ((0.014, 0), (0.022, 0.02)), T + 0.11, x - s * 0.03, y, segs=8, outline=0.001)

# ---------- Trajan's Kiosk on the shore ----------
KX, KY = 0.65, 0.2
box('kioskfloor', M['stoneDark'], KX, KY, T - 0.005, 0.22, 0.3, 0.02, outline=0.003, bevel=0)
for i in range(5):
    for side in (-1, 1):
        y = KY - 0.13 + i * 0.065
        rod(f'kioskcol{side}{i}', M['stone'], (KX + side * 0.09, y, T + 0.015), (KX + side * 0.09, y, T + 0.19), 0.013, segs=8, outline=0.002)
        lathe(f'kioskcap{side}{i}', M['stoneDark'], ((0.013, 0), (0.024, 0.025)), T + 0.17, KX + side * 0.09, y, segs=8, outline=0.001)
for i in range(2):
    rod(f'kioskendcol{i}', M['stone'], (KX - 0.03 + i * 0.06, KY - 0.13, T + 0.015), (KX - 0.03 + i * 0.06, KY - 0.13, T + 0.19), 0.013, segs=8, outline=0.002)
box('kioskarchitrave', M['stone'], KX, KY, T + 0.19, 0.22, 0.3, 0.035, outline=0.004, bevel=0)

# ---------- palms and a felucca ----------
for k, (x, y) in enumerate(((-0.65, 0.3), (-0.55, -0.3), (0.45, 0.55), (-0.3, 0.6), (0.6, -0.25))):
    rod(f'palmtrunk{k}', M['trunk'], (x, y, T), (x + 0.02, y, T + 0.28), 0.014, segs=6, outline=0.002)
    for j in range(7):
        a = 2 * math.pi * j / 7
        bar(f'palmleaf{k}{j}', M['palm'], (x + 0.02, y, T + 0.28), (x + 0.02 + 0.1 * math.cos(a), y + 0.1 * math.sin(a), T + 0.23), 0.022, outline=0.002)
FX, FY = -0.45, -0.95
hull = ball('felucca', M['wood'], 0, 0, 0, 0.06, outline=0.004)
hull.scale = (2.4, 0.8, 0.5)
hull.location = (FX, FY, G + 0.01)
rod('mast', M['wood'], (FX + 0.02, FY, G + 0.02), (FX + 0.02, FY, G + 0.3), 0.005, segs=4, outline=0)
loft('sail', M['sail'], [[(FX - 0.12, FY, G + 0.06), (FX + 0.02, FY, G + 0.06), (FX + 0.02, FY, G + 0.34)], [(FX - 0.12, FY + 0.004, G + 0.06), (FX + 0.02, FY + 0.004, G + 0.06), (FX + 0.02, FY + 0.004, G + 0.34)]], outline=0.003)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
