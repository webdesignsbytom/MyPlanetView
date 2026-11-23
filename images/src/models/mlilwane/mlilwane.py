# A cartoon Mlilwane Wildlife Sanctuary for the country maps, built in the set's shared look
# (../toon.py): Eswatini's Ezulwini Valley under the bare granite dome of Nyonyane, the Execution
# Rock, grassland with zebras, a warthog, Swazi beehive huts of grass, and the dam's water. Turned a
# little towards the camera.
# Run: blender -b --factory-startup -P mlilwane.py -- mlilwane-1024.png 1024 mlilwane.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grassland', '#a8c065', shadow_mul=(0.74, 0.78, 0.74), lift=0.25),
    'granite': toon('granite', '#a89a8a', shadow_mul=(0.8, 0.8, 0.88)),
    'slope': toon('slope', '#5f9e55', shadow_mul=(0.7, 0.78, 0.8)),
    'water': toon('water', '#4aa6c8', shadow_mul=(0.74, 0.82, 0.9), lift=0.35),
    'thatch': toon('thatch', '#c9a85a', shadow_mul=(0.84, 0.76, 0.62)),
    'window': flat('window', '#3a3640'),
    'zebra': toon('zebra', '#f6f3ec', shadow_mul=(0.8, 0.8, 0.9), lift=0.2),
    'stripe': flat('stripe', '#2a2626'),
    'warthog': toon('warthog', '#7a6a62'),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#6b5040'),
})

G = tile(M['grass'])
before = set(bpy.data.objects)
rng = random.Random(977)


def flat_face(name, mat, pts, z, outline=0.0):
    bm = bmesh.new()
    bmesh.ops.triangulate(bm, faces=[bm.faces.new([bm.verts.new((x, y, z)) for x, y in pts])])
    return finish(name, bm, mat, outline=outline)


# ---------- Nyonyane: green foothills and the bare granite dome ----------
NX, NY = -0.2, 0.7
hills = loft('foothills', M['slope'], [[(NX + 0.95 * math.cos(t), NY + 0.42 * math.sin(t), G - 0.01) for t in (2 * math.pi * j / 22 for j in range(22))],
                                     [(NX + 0.6 * math.cos(t), NY + 0.28 * math.sin(t), G + 0.18) for t in (2 * math.pi * j / 22 for j in range(22))]], outline=0.022, smooth=True)
hills.visible_shadow = False
dome = loft('dome', M['granite'], [[(NX + 0.6 * math.cos(t), NY + 0.28 * math.sin(t), G + 0.18) for t in (2 * math.pi * j / 22 for j in range(22))],
                                  [(NX + 0.45 * math.cos(t), NY + 0.22 * math.sin(t), G + 0.42) for t in (2 * math.pi * j / 22 for j in range(22))],
                                  [(NX + 0.25 * math.cos(t), NY + 0.13 * math.sin(t), G + 0.56) for t in (2 * math.pi * j / 22 for j in range(22))],
                                  [(NX + 0.05 * math.cos(t), NY + 0.03 * math.sin(t), G + 0.6) for t in (2 * math.pi * j / 22 for j in range(22))]], outline=0.022, smooth=True)
dome.visible_shadow = False
for k in range(8):
    a = math.radians(200 + k * 18)
    ball(f'hilltree{k}', M['tree'], NX + 0.78 * math.cos(a), NY + 0.35 * math.sin(a), G + 0.09, 0.07, outline=0.012)

# ---------- the dam ----------
flat_face('dam', M['water'], [(0.6 + 0.35 * math.cos(t), -0.05 + 0.2 * math.sin(t)) for t in (2 * math.pi * j / 20 for j in range(20))], G + 0.004, outline=0.008)

# ---------- Swazi beehive huts ----------
for k, (x, y, r) in enumerate(((-0.6, -0.15, 0.1), (-0.35, -0.3, 0.085), (-0.75, -0.45, 0.09))):
    lathe(f'beehive{k}', M['thatch'], ((r, 0), (r * 0.98, 0.04), (r * 0.85, 0.09), (r * 0.55, 0.14), (0.004, 0.17)), G - 0.005, x, y, segs=16, outline=0.01)
    box(f'beehivedoor{k}', M['window'], x, y - r + 0.01, G, 0.035, 0.01, 0.04, outline=0, bevel=0)


# ---------- zebras and a warthog ----------
def zebra(name, x, y, a):
    c, s = math.cos(a), math.sin(a)
    at = lambda dx, dy, z: (x + dx * c - dy * s, y + dx * s + dy * c, G + z)
    for j, (dx, dy) in enumerate(((-0.04, -0.015), (-0.04, 0.015), (0.04, -0.015), (0.04, 0.015))):
        rod(f'{name}leg{j}', M['zebra'], at(dx, dy, 0), at(dx, dy, 0.07), 0.007, segs=6, outline=0.002)
    bx, by, _ = at(0, 0, 0)
    box(f'{name}body', M['zebra'], bx, by, G + 0.065, 0.11, 0.04, 0.045, rot_z=a, outline=0.006, bevel=0.012)
    for j in range(5):
        for side in (-1, 1):
            px, py, _ = at(-0.04 + j * 0.02, side * 0.021, 0)
            box(f'{name}stripe{j}{side}', M['stripe'], px, py, G + 0.07, 0.007, 0.004, 0.035, rot_z=a, outline=0, bevel=0)
    rod(f'{name}neck', M['zebra'], at(0.045, 0, 0.09), at(0.07, 0, 0.13), 0.013, segs=6, outline=0.003)
    hx, hy, _ = at(0.085, 0, 0)
    box(f'{name}head', M['zebra'], hx, hy, G + 0.12, 0.045, 0.022, 0.022, rot_z=a, outline=0.003, bevel=0.006)
    mx, my, _ = at(0.055, 0, 0)
    box(f'{name}mane', M['stripe'], mx, my, G + 0.13, 0.03, 0.006, 0.012, rot_z=a + 0.6, outline=0, bevel=0)


zebra('zebra1', 0.1, -0.45, 2.6)
zebra('zebra2', 0.3, -0.55, 2.9)
zebra('zebra3', 0.0, -0.7, 2.4)
WX, WY = 0.55, -0.55
box('warthog', M['warthog'], WX, WY, G + 0.025, 0.08, 0.04, 0.04, outline=0.005, bevel=0.012)
box('warthoghead', M['warthog'], WX + 0.05, WY, G + 0.02, 0.03, 0.03, 0.03, outline=0.004, bevel=0.008)
for side in (-1, 1):
    bar(f'tusk{side}', M['zebra'], (WX + 0.065, WY + side * 0.012, G + 0.025), (WX + 0.075, WY + side * 0.016, G + 0.045), 0.005, outline=0.001)
for j, (dx, dy) in enumerate(((-0.025, -0.012), (-0.025, 0.012), (0.025, -0.012), (0.025, 0.012))):
    rod(f'warthogleg{j}', M['warthog'], (WX + dx, WY + dy, G), (WX + dx, WY + dy, G + 0.03), 0.005, segs=5, outline=0.002)

# ---------- trees ----------
for k, (x, y) in enumerate(((0.95, 0.4), (-1.0, 0.1), (0.85, -0.6), (-0.3, -0.95), (0.35, 0.3))):
    h = rng.uniform(0.12, 0.18)
    rod(f'trunk{k}', M['trunk'], (x, y, G), (x, y, G + h), 0.016, segs=6, outline=0.005)
    ball(f'tree{k}', M['tree'], x, y, G + h + 0.06, rng.uniform(0.09, 0.11), outline=0.014)

turn(before, -20)
render(G)
