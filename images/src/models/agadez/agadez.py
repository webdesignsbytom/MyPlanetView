# A cartoon Historic Centre of Agadez for the country maps, built in the set's shared look
# (../toon.py): Niger's Saharan city, the Great Mosque's tall tapering mud-brick minaret bristling
# with the wooden beams that hold its scaffolding, the low mud houses round it with their parapets,
# and a camel caravan setting out across the sand. Turned a little towards the camera.
# Run: blender -b --factory-startup -P agadez.py -- agadez-1024.png 1024 agadez.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sand': toon('sand', '#e6c890', shadow_mul=(0.84, 0.76, 0.72), lift=0.25),
    'mud': toon('mud', '#c4875a', shadow_mul=(0.84, 0.74, 0.72)),
    'mudDark': toon('mudDark', '#a86e48', shadow_mul=(0.84, 0.74, 0.72)),
    'beam': toon('beam', '#6b4a33'),
    'window': flat('window', '#3a3030'),
    'door': toon('door', '#3f7fc0'),
    'camel': toon('camel', '#c89a5e'),
    'cloth': toon('cloth', '#3f5fb0'),
    'skin': toon('skin', '#6b4430'),
    'tree': toon('tree', '#6a9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#6b5040'),
})

G = tile(M['sand'])
before = set(bpy.data.objects)
rng = random.Random(859)


def place(made_before, degrees, x, y):
    m = Matrix.Translation((x, y, 0)) @ Matrix.Rotation(math.radians(degrees), 4, 'Z')
    bpy.context.view_layer.update()
    for ob in set(bpy.data.objects) - made_before:
        ob.matrix_world = m @ ob.matrix_world


def squashed(name, mat, x, y, z, r, sx, sy, sz, outline=0.02):
    b = ball(name, mat, 0, 0, 0, r, outline=outline)
    b.scale = (sx, sy, sz)
    b.location = (x, y, z)
    return b


# ---------- the Great Mosque's minaret ----------
MX, MY, MH = 0.05, 0.3, 0.75
loft('minaret', M['mud'], [[(MX - 0.11, MY - 0.11, G - 0.005), (MX + 0.11, MY - 0.11, G - 0.005), (MX + 0.11, MY + 0.11, G - 0.005), (MX - 0.11, MY + 0.11, G - 0.005)],
                           [(MX - 0.035, MY - 0.035, G + MH), (MX + 0.035, MY - 0.035, G + MH), (MX + 0.035, MY + 0.035, G + MH), (MX - 0.035, MY + 0.035, G + MH)]],
     outline=0.014)
for sx in (-1, 1):
    for sy in (-1, 1):
        lathe(f'pinnacle{sx}{sy}', M['mud'], ((0.012, 0), (0.004, 0.05)), G + MH - 0.005, MX + sx * 0.03, MY + sy * 0.03, segs=6, outline=0.003)
# the toron: beams sticking out of every face, in rows up the tower
for row in range(9):
    z = 0.06 + row * 0.075
    half = 0.11 - (0.11 - 0.035) * z / MH
    for face in range(4):
        a = face * math.pi / 2
        ox, oy = -math.sin(a), -math.cos(a)            # the face's outward direction (the front first)
        tx, ty = math.cos(a), -math.sin(a)             # along the face
        for j in (-1, 0, 1):
            px = MX + ox * half + tx * j * half * 0.6
            py = MY + oy * half + ty * j * half * 0.6
            bar(f'beam{row}{face}{j}', M['beam'], (px - ox * 0.01, py - oy * 0.01, G + z), (px + ox * 0.05, py + oy * 0.05, G + z), 0.012, outline=0.002)
box('minaretdoor', M['window'], MX, MY - 0.112, G, 0.04, 0.01, 0.07, outline=0, bevel=0)
box('prayerhall', M['mudDark'], MX - 0.2, MY + 0.15, G - 0.005, 0.34, 0.26, 0.1, outline=0.012, bevel=0)

# ---------- the mud houses with their parapets ----------
for k, (x, y, w, d) in enumerate(((-0.55, -0.1, 0.22, 0.18), (-0.25, -0.3, 0.18, 0.16), (0.35, -0.15, 0.2, 0.18), (0.62, 0.15, 0.18, 0.2), (-0.62, 0.32, 0.2, 0.16),
                                  (0.1, -0.45, 0.2, 0.14), (0.55, -0.45, 0.16, 0.14))):
    h = rng.uniform(0.09, 0.13)
    box(f'house{k}', M['mud' if k % 2 else 'mudDark'], x, y, G - 0.005, w, d, h, outline=0.01, bevel=0)
    for j in range(3):
        box(f'parapet{k}{j}', M['mud'], x - w / 3 + j * w / 3, y - d / 2 + 0.008, G + h - 0.005, 0.03, 0.016, 0.03, outline=0.003, bevel=0)
    box(f'housedoor{k}', M['door' if k % 3 == 0 else 'window'], x, y - d / 2 - 0.004, G, 0.035, 0.01, 0.06, outline=0, bevel=0)
for k, (x, y) in enumerate(((-0.95, 0.0), (0.95, -0.1), (-0.35, 0.75))):
    rod(f'treetrunk{k}', M['trunk'], (x, y, G), (x, y, G + 0.12), 0.014, segs=6, outline=0.004)
    squashed(f'tree{k}', M['tree'], x, y, G + 0.15, 0.1, 1.4, 1.2, 0.45, outline=0.012)


# ---------- a camel caravan setting out ----------
def camel(name, x, y, deg, rider=False):
    made = set(bpy.data.objects)
    for dx in (-0.08, 0.08):
        for sy in (-1, 1):
            rod(f'{name}leg{dx}{sy}', M['camel'], (dx, sy * 0.035, G), (dx, sy * 0.035, G + 0.17), 0.012, segs=8, outline=0.004)
    squashed(f'{name}body', M['camel'], 0, 0, G + 0.2, 0.1, 1.5, 0.8, 0.7, outline=0.012)
    ball(f'{name}hump', M['camel'], -0.01, 0, G + 0.26, 0.06, outline=0.01)
    rod(f'{name}neck', M['camel'], (0.12, 0, G + 0.2), (0.2, 0, G + 0.3), 0.025, r2=0.02, segs=10, outline=0.006)
    squashed(f'{name}head', M['camel'], 0.23, 0, G + 0.31, 0.035, 1.5, 0.9, 0.8, outline=0.006)
    if rider:
        rod(f'{name}riderbody', M['cloth'], (0.0, 0, G + 0.3), (0.0, 0, G + 0.38), 0.022, segs=8, outline=0.004)
        ball(f'{name}riderhead', M['cloth'], 0.0, 0, G + 0.4, 0.022, outline=0.004)
    place(made, deg, x, y)


camel('camel1', -0.3, -0.75, 200, rider=True)
camel('camel2', 0.05, -0.82, 195)
camel('camel3', 0.38, -0.85, 190)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
