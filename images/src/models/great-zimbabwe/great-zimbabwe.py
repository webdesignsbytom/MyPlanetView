# A cartoon Great Zimbabwe for the country maps, built in the set's shared look (../toon.py): the
# Great Enclosure's curving dry-stone wall with its band of chevrons near the top and its narrow
# way in, the Conical Tower and an inner wall inside it, the hill behind heaped with granite
# boulders and walled along its top, and msasa trees. Turned a little towards the camera.
# Run: blender -b --factory-startup -P great-zimbabwe.py -- great-zimbabwe-1024.png 1024 great-zimbabwe.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'stone': toon('stone', '#a89a84', shadow_mul=(0.78, 0.76, 0.84)),
    'stoneDark': toon('stoneDark', '#8a7d69', shadow_mul=(0.78, 0.76, 0.84)),
    'chevron': flat('chevron', '#5f5548'),
    'granite': toon('granite', '#b4aca0', shadow_mul=(0.76, 0.76, 0.86)),
    'grass': toon('grass2', '#a9b46a', lift=0.25),
    'msasa': toon('msasa', '#c0763a', shadow_mul=(0.8, 0.66, 0.6)),
    'leaf': toon('leaf', '#5f9e55', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#6b4a33'),
})

G = tile(M['grass'])
before = set(bpy.data.objects)
rng = random.Random(53)
CX, CY, A, B = 0.05, -0.18, 0.78, 0.55   # the enclosure's middle and its half-length and half-width


def arc_wall(name, mat, a, b, thickness, h, a0, a1, n=48, cx=CX, cy=CY):
    """A curving wall along an ellipse from angle a0 to a1 (radians), thickness inwards."""
    outer = [(cx + a * math.cos(t), cy + b * math.sin(t)) for t in (a0 + (a1 - a0) * k / n for k in range(n + 1))]
    inner = [(cx + (a - thickness) * math.cos(t), cy + (b - thickness) * math.sin(t)) for t in (a1 - (a1 - a0) * k / n for k in range(n + 1))]
    shape = outer + inner
    wall = loft(name, mat, [[(x, y, G - 0.01) for x, y in shape], [(x, y, G + h) for x, y in shape]], outline=0.03)
    wall.visible_shadow = False
    return outer


# ---------- the Great Enclosure: its wall all round but for the way in ----------
GAP = math.radians(232), math.radians(256)   # the way in, at the front left
WALL_H = 0.36
outer = arc_wall('enclosure', M['stone'], A, B, 0.11, WALL_H, GAP[1], GAP[0] + 2 * math.pi)
# the chevron band near the top of its outer face
for k in range(0, len(outer) - 1, 2):
    (x0, y0), (x1, y1) = outer[k], outer[k + 1]
    t = math.atan2((y0 + y1) / 2 - CY, (x0 + x1) / 2 - CX)
    nx, ny = math.cos(t) * 0.006, math.sin(t) * 0.006
    tri = pyramid(f'chevron{k}', M['chevron'], 0, 0, 0, 0.05, 0.035, outline=0)
    tri.matrix_world = (Matrix.Translation(((x0 + x1) / 2 + nx, (y0 + y1) / 2 + ny, G + WALL_H - 0.08))
                        @ Matrix.Rotation(math.atan2(y1 - y0, x1 - x0), 4, 'Z') @ Matrix.Scale(0.2, 4, (0, 1, 0)))

# ---------- inside: an inner wall and the Conical Tower ----------
arc_wall('innerwall', M['stoneDark'], A * 0.62, B * 0.62, 0.07, 0.22, math.radians(-20), math.radians(140))
lathe('conicaltower', M['stone'], ((0.13, 0), (0.12, 0.18), (0.095, 0.38), (0.075, 0.52)), G - 0.01, CX + 0.38, CY + 0.12, segs=20,
      outline=0.025)
lathe('smalltower', M['stone'], ((0.06, 0), (0.05, 0.12), (0.04, 0.17)), G - 0.01, CX + 0.22, CY + 0.2, segs=16, outline=0.018)

# ---------- the hill behind: granite boulders with a wall along the top ----------
for k, (x, y, r) in enumerate(((-0.65, 0.88, 0.26), (-0.32, 0.98, 0.3), (0.05, 1.02, 0.26), (0.38, 0.96, 0.28), (0.7, 0.82, 0.22),
                               (-0.45, 0.78, 0.18), (0.2, 0.84, 0.2), (-0.1, 0.9, 0.22))):
    b = ball(f'boulder{k}', M['granite'], x, y, G + r * 0.6, r, outline=0.025)
    b.scale = (1.0, 0.85, 0.8)
    b.location = (0, y * (1 - 0.85), (G + r * 0.6) * (1 - 0.8))
    b.visible_shadow = False
box('hillwall', M['stoneDark'], -0.15, 1.0, G + 0.38, 0.6, 0.06, 0.1, rot_z=math.radians(-4), outline=0.015, bevel=0.004)

# ---------- msasa trees, red-brown in their spring leaf ----------
for k, (x, y, mat) in enumerate(((-1.0, -0.25, 'msasa'), (1.02, -0.35, 'leaf'), (-0.85, -0.72, 'leaf'), (0.95, 0.3, 'msasa'))):
    rod(f'trunk{k}', M['trunk'], (x, y, G), (x, y, G + 0.16), 0.022, segs=8, outline=0.012)
    crown = ball(f'crown{k}', M[mat], x, y, G + 0.22, 0.15, outline=0.02)
    crown.scale = (1, 1, 0.6)
    crown.location = (0, 0, (G + 0.22) * (1 - 0.6))

turn(before, -20)
render(G)
