# Cartoon pyramids of Meroë for the country maps, built in the set's shared look (../toon.py) on a
# tile of desert sand: the Kushite kings' steep, narrow pyramids in their red-brown sandstone,
# stepped in courses, some with their tops broken off, each with its little chapel and pylon
# gateway at its foot; soft dunes drifting between them and a camel and its rider passing by.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P meroe.py -- meroe-1024.png 1024 meroe.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sand': toon('sand', '#e8c48a', shadow_mul=(0.84, 0.74, 0.62), lift=0.25),
    'dune': toon('dune', '#deb57a', shadow_mul=(0.84, 0.74, 0.62)),
    'pyramid': toon('pyramid', '#b06a43', shadow_mul=(0.82, 0.7, 0.72)),
    'pyramidDark': toon('pyramidDark', '#9a5a38', shadow_mul=(0.82, 0.7, 0.72)),
    'chapel': toon('chapel', '#c98a5a', shadow_mul=(0.82, 0.72, 0.72)),
    'door': flat('door', '#4a3428'),
    'camel': toon('camel', '#c9a06a', shadow_mul=(0.84, 0.74, 0.66)),
    'robe': toon('robe', '#f6f3ec', shadow_mul=(0.8, 0.8, 0.9), lift=0.2),
    'skin': toon('skin', '#8a5a3c'),
    'saddle': toon('saddle', '#c8402f'),
    'shrub': toon('shrub', '#8a9a5a', shadow_mul=(0.76, 0.8, 0.82)),
})

G = tile(M['sand'])
before = set(bpy.data.objects)
rng = random.Random(149)


def place(made_before, degrees, x, y):
    m = Matrix.Translation((x, y, 0)) @ Matrix.Rotation(math.radians(degrees), 4, 'Z')
    bpy.context.view_layer.update()
    for ob in set(bpy.data.objects) - made_before:
        ob.matrix_world = m @ ob.matrix_world


def pyramid_of_courses(name, x, y, base, height, courses=10, broken=0):
    """A steep pyramid in stepped courses, `broken` courses missing from its top; its chapel and pylon in front."""
    h = height / courses
    top = base * 0.12
    for k in range(courses - broken):
        w = base - (base - top) * k / (courses - 1)
        box(f'{name}course{k}', M['pyramid' if k % 2 else 'pyramidDark'], x, y, G - 0.005 + k * h, w, w, h + 0.002, outline=0.012, bevel=0)
    if not broken:
        pyramid(f'{name}cap', M['pyramid'], x, y, G - 0.005 + courses * h, top, h * 1.4, outline=0.01)
    # the chapel in front, and its pylon gateway with a door
    cy = y - base / 2 - 0.06
    box(f'{name}chapel', M['chapel'], x, cy, G - 0.005, base * 0.4, 0.12, height * 0.16, outline=0.014, bevel=0)
    py = cy - 0.07
    for s in (-1, 1):
        px = x + s * base * 0.17
        loft(f'{name}pylon{s}', M['chapel'],
             [[(px - 0.045, py - 0.022, G - 0.005), (px + 0.045, py - 0.022, G - 0.005), (px + 0.045, py + 0.022, G - 0.005), (px - 0.045, py + 0.022, G - 0.005)],
              [(px - 0.032, py - 0.016, G + height * 0.24), (px + 0.032, py - 0.016, G + height * 0.24), (px + 0.032, py + 0.016, G + height * 0.24),
               (px - 0.032, py + 0.016, G + height * 0.24)]], outline=0.012)
    box(f'{name}door', M['door'], x, py - 0.01, G - 0.005, base * 0.12, 0.02, height * 0.14, outline=0, bevel=0)


# ---------- the pyramids, in two staggered rows along the ridge ----------
PYRAMIDS = [(-0.75, 0.75, 0.24, 0.55, 3), (-0.3, 0.88, 0.28, 0.72, 0), (0.2, 0.85, 0.3, 0.8, 0), (0.68, 0.7, 0.24, 0.58, 2),
            (-0.5, 0.25, 0.26, 0.62, 0), (0.0, 0.2, 0.3, 0.78, 1), (0.5, 0.18, 0.26, 0.65, 0)]
for k, (x, y, base, height, broken) in enumerate(PYRAMIDS):
    pyramid_of_courses(f'p{k}', x, y, base, height, broken=broken)

# ---------- dunes drifting between them ----------
for k, (x, y, r) in enumerate(((-1.0, 0.35, 0.22), (0.95, 0.4, 0.22), (-0.2, 0.55, 0.16), (0.3, 1.15, 0.18), (-0.85, -0.6, 0.2), (0.9, -0.55, 0.18))):
    d = ball(f'dune{k}', M['dune'], 0, 0, 0, r, outline=0.02)
    d.scale = (1.3, 0.8, 0.35)
    d.location = (x, y, G - 0.01)
    d.visible_shadow = False
for k, (x, y) in enumerate(((-1.15, -0.1), (1.15, -0.05), (-0.35, -1.05), (0.65, -0.95))):
    ball(f'shrub{k}', M['shrub'], x, y, G + 0.04, 0.05, outline=0.01)

# ---------- a camel and its rider ----------
made = set(bpy.data.objects)
for dx in (-0.07, 0.07):
    for s in (-1, 1):
        rod(f'camelleg{dx}{s}', M['camel'], (dx, s * 0.03, G), (dx, s * 0.03, G + 0.18), 0.012, segs=8, outline=0.006)
box('camelbody', M['camel'], 0, 0, G + 0.16, 0.22, 0.08, 0.08, outline=0.01, bevel=0.02)
ball('camelhump', M['camel'], -0.02, 0, G + 0.24, 0.055, outline=0.01)
bar('camelneck', M['camel'], (0.09, 0, G + 0.2), (0.16, 0, G + 0.3), 0.04, outline=0.008)
box('camelhead', M['camel'], 0.19, 0, G + 0.28, 0.08, 0.04, 0.04, outline=0.008, bevel=0.01)
box('saddle', M['saddle'], -0.02, 0, G + 0.27, 0.09, 0.09, 0.02, outline=0.006, bevel=0)
rod('rider', M['robe'], (-0.02, 0, G + 0.29), (-0.02, 0, G + 0.37), 0.024, r2=0.018, segs=8, outline=0.006)
ball('riderhead', M['skin'], -0.02, 0, G + 0.39, 0.02, outline=0.005)
ball('turban', M['robe'], -0.02, 0, G + 0.405, 0.018, outline=0.004)
place(made, -160, 0.35, -0.65)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
