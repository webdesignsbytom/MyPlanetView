# A cartoon Eiffel Tower for the country maps, built from primitives in the set's shared look
# (../toon.py: toon shading, outline, grass tile, camera, sun): four curved legs joined by the
# great arches under the first floor, a second floor, the tapering top with its cabin and
# antenna, and a little tricolour.
# Run: blender -b --factory-startup -P eiffel-tower.py -- eiffel-tower-1024.png 1024 eiffel-tower.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'iron': toon('iron', '#8f5f3e'),
    'ironLight': toon('ironLight', '#b07a4e'),
    'blue': toon('blue', '#2f55b0', shadow_mul=(0.72, 0.72, 0.82)),
    'white': toon('white', '#f7f3ea', shadow_mul=(0.88, 0.84, 0.86)),
    'red': toon('red', '#d23a3a'),
})

G = tile()
# The gravel under the tower and a path to it
box('esplanade', M['path'], 0, 0, G - 0.01, 1.8, 1.8, 0.02, outline=0.015, bevel=0.0)
box('path', M['path'], 0, -1.15, G - 0.01, 0.46, 0.6, 0.02, outline=0.015, bevel=0.0)

# ---------- the shape: half the tower's width at a height above the grass ----------
# Taller than Big Ben, as it should be (every model is drawn at the same scale), and slender
S = 1.2
Z1, Z2, Z3 = 0.80 * S, 1.62 * S, 3.85 * S   # the first, second and top floors


def half_width(z):
    return 0.07 + 0.78 * math.exp(-z / (1.35 * S))


def leg_width(z):
    # a leg's thickness, thinning from the ground to the second floor
    return 0.13 + 0.17 * (1 - min(z, Z2) / Z2)


def rings_between(z0, z1, step=0.1):
    n = max(2, round((z1 - z0) / step))
    return [z0 + (z1 - z0) * i / n for i in range(n + 1)]


# ---------- the four legs, from the ground to the second floor ----------
for sx in (-1, 1):
    for sy in (-1, 1):
        rings = []
        for z in rings_between(0, Z2 + 0.02):
            w, t = half_width(z), leg_width(z)
            ring = [(sx * w, sy * w), (sx * (w - t), sy * w), (sx * (w - t), sy * (w - t)), (sx * w, sy * (w - t))]
            if sx * sy < 0:
                ring.reverse()  # keep every ring counter-clockwise
            rings.append([(x, y, G + z) for x, y in ring])
        loft(f'leg{sx}{sy}', M['iron'], rings, outline=0.04, bevel=0.015)


# ---------- each face: the great arch, and the bracing up to the second floor ----------
def face(i, a, at):
    # The great arch, on the legs' outer faces: in the floors' lighter brown, its ends tucked
    # into the legs, its crown low enough to show under the first floor from the camera
    zs, apex = 0.25 * S, 0.60 * S
    span = half_width(zs) - leg_width(zs) + 0.04
    rise = apex - zs
    band, depth = 0.085, 0.035
    sections = []
    for k in range(25):
        th = math.pi * k / 24
        z_out = zs + rise * math.sin(th)
        mid = -(half_width(z_out) - depth - 0.01)
        pts = []
        for r_x, r_z, dy in ((span, rise, -depth), (span - band, rise - band, -depth),
                             (span - band, rise - band, depth), (span, rise, depth)):
            x = r_x * math.cos(th)
            z = zs + r_z * math.sin(th)
            pts.append((*at(x, mid + dy), G + z))
        sections.append(pts)
    loft(f'arch{i}', M['ironLight'], sections, outline=0.03)

    # Crossed braces between the legs, from the first floor to the second
    def edge(z, side):
        w, t = half_width(z), leg_width(z)
        return (*at(side * (w - t * 0.6), -(w - t / 2)), G + z)
    bar(f'braceA{i}', M['iron'], edge(Z1 + 0.08, -1), edge(Z2 - 0.06, 1), 0.045, outline=0.025)
    bar(f'braceB{i}', M['iron'], edge(Z1 + 0.08, 1), edge(Z2 - 0.06, -1), 0.045, outline=0.025)


each_side(face)


# ---------- the floors, each with a gold railing ----------
def floor(name, z, half, thick):
    box(name, M['ironLight'], 0, 0, G + z - thick / 2, half * 2, half * 2, thick, outline=0.035, bevel=0.012)
    top = G + z + thick / 2
    for k, (x, y, sx, sy) in enumerate(((0, -half, half * 2, 0.035), (0, half, half * 2, 0.035),
                                        (-half, 0, 0.035, half * 2), (half, 0, 0.035, half * 2))):
        box(f'{name}rail{k}', M['gold'], x, y, top, sx, sy, 0.06, outline=0.02, bevel=0.0)


floor('floor1', Z1, half_width(Z1) + 0.09, 0.17)
floor('floor2', Z2, half_width(Z2) + 0.07, 0.13)

# ---------- the top: a tapering shaft, a band half-way, the top floor and its cabin ----------
loft('shaft', M['iron'],
     [[(x * half_width(z), y * half_width(z), G + z) for x, y in ((1, 1), (-1, 1), (-1, -1), (1, -1))]
      for z in rings_between(Z2, Z3, 0.12)],
     outline=0.04, bevel=0.012)
ZB = 2.62 * S


# The lattice, hinted: a cross on each face of the shaft, below and above its band
def lattice(i, a, at):
    for k, (za, zb) in enumerate(((Z2 + 0.08, ZB - 0.08), (ZB + 0.08, Z3 - 0.08))):
        for side in (-1, 1):
            p0 = (*at(side * half_width(za) * 0.78, -half_width(za) - 0.012), G + za)
            p1 = (*at(-side * half_width(zb) * 0.78, -half_width(zb) - 0.012), G + zb)
            bar(f'lattice{i}{k}{side}', M['iron'], p0, p1, 0.028, outline=0.018)


each_side(lattice)
box('band',M['ironLight'], 0, 0, G + ZB - 0.04, half_width(ZB) * 2 + 0.08, half_width(ZB) * 2 + 0.08, 0.08, outline=0.03, bevel=0.01)
floor('floor3', Z3, half_width(Z3) + 0.07, 0.09)
box('cabin', M['ironLight'], 0, 0, G + Z3 + 0.045, 0.2, 0.2, 0.16, outline=0.03, bevel=0.01)
pyramid('cap', M['iron'], 0, 0, G + Z3 + 0.205, 0.24, 0.12, outline=0.03)
cyl('antenna', M['iron'], 0.022, 0.42, segs=8, outline=0.02, matrix=Matrix.Translation((0, 0, G + Z3 + 0.32 + 0.21)))
ball('tip', M['gold'], 0, 0, G + Z3 + 0.75, 0.04)

# A little tricolour on the antenna, facing the camera
for k, colour in enumerate(('blue', 'white', 'red')):
    box(f'flag{k}', M[colour], 0.03 + 0.055 * k + 0.0275, 0, G + Z3 + 0.55, 0.055, 0.012, 0.11, outline=0.012, bevel=0.0)

render(G)
