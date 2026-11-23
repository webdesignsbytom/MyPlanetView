# A cartoon La Soufrière for the country maps, built in the set's shared look (../toon.py): Saint
# Vincent's volcano, rainforest on its lower slopes and grey ash above, the wide crater at its top
# with its new lava dome steaming beside the crater lake, the black-sand leeward shore, and fishing
# boats. Turned a little towards the camera.
# Run: blender -b --factory-startup -P la-soufriere-svg.py -- la-soufriere-svg-1024.png 1024 la-soufriere-svg.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sea': toon('sea', '#2f8fc8', shadow_mul=(0.74, 0.82, 0.9), lift=0.35),
    'blackSand': toon('blackSand', '#4a4448', shadow_mul=(0.84, 0.84, 0.9)),
    'forest': toon('forestSlope', '#3f8a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'ash': toon('ash', '#9a948c', shadow_mul=(0.8, 0.8, 0.88)),
    'craterFloor': toon('craterFloor', '#6a625c', shadow_mul=(0.84, 0.84, 0.9)),
    'lake': toon('lake', '#5ab8a8', shadow_mul=(0.74, 0.84, 0.86), lift=0.35),
    'domeRock': toon('domeRock', '#3e3a3c', shadow_mul=(0.86, 0.86, 0.9)),
    'steam': toon('steam', '#ececf2', shadow_mul=(0.84, 0.84, 0.92), lift=0.15),
    'trees': toon('trees', '#2f7a46', shadow_mul=(0.7, 0.78, 0.8)),
    'b1': toon('b1', '#e0453a'), 'b2': toon('b2', '#f2c84a', shadow_mul=(0.84, 0.72, 0.6)),
})

G = tile(M['forest'])
before = set(bpy.data.objects)
rng = random.Random(1013)


def flat_face(name, mat, pts, z, outline=0.0):
    bm = bmesh.new()
    bmesh.ops.triangulate(bm, faces=[bm.faces.new([bm.verts.new((x, y, z)) for x, y in pts])])
    return finish(name, bm, mat, outline=outline)


def ring(cx, cy, rx, ry, z, k, sides=24):
    return [(cx + rx * math.cos(t) * (1 + 0.05 * math.sin(3 * t + k)), cy + ry * math.sin(t) * (1 + 0.04 * math.cos(2 * t + k)), G + z) for t in (2 * math.pi * j / sides for j in range(sides))]


# ---------- the leeward shore ----------
R = 1.42
flat_face('shore', M['blackSand'], [(R * math.cos(math.radians(a)), R * math.sin(math.radians(a))) for a in range(194, 347, 6)], G + 0.002, outline=0.008)
flat_face('sea', M['sea'], [(R * math.cos(math.radians(a)), R * math.sin(math.radians(a))) for a in range(206, 335, 6)], G + 0.005, outline=0.01)

# ---------- the volcano: forested foot, ash above, a wide crater ----------
VX, VY = 0.0, 0.42
low = loft('volcanolow', M['forest'], [ring(VX, VY, 0.98, 0.62, -0.01, 2), ring(VX, VY, 0.62, 0.4, 0.26, 2)], outline=0.025, smooth=True)
low.visible_shadow = False
high = loft('volcanohigh', M['ash'], [ring(VX, VY, 0.62, 0.4, 0.26, 2), ring(VX, VY, 0.42, 0.28, 0.48, 2), ring(VX, VY, 0.36, 0.24, 0.47, 2)], outline=0.022)
high.visible_shadow = False
crater = loft('crater', M['craterFloor'], [ring(VX, VY, 0.36, 0.24, 0.47, 2), ring(VX, VY, 0.3, 0.19, 0.36, 2)], outline=0.012)
crater.visible_shadow = False
cyl('craterlake', M['lake'], 1.0, 0.008, segs=20, outline=0, matrix=Matrix.Translation((VX - 0.08, VY + 0.02, G + 0.365)) @ Matrix.Scale(0.15, 4, (1, 0, 0)) @ Matrix.Scale(0.1, 4, (0, 1, 0)))
lathe('lavadome', M['domeRock'], ((0.1, 0), (0.08, 0.04), (0.04, 0.07), (0.004, 0.08)), G + 0.355, VX + 0.12, VY + 0.0, segs=12, outline=0.008, smooth=False)
for k, (dx, dz, r) in enumerate(((0.12, 0.47, 0.05), (0.15, 0.55, 0.07), (0.2, 0.64, 0.08))):
    ball(f'steam{k}', M['steam'], VX + dx, VY, G + dz, r, outline=0.01)
for k in range(24):
    a = 2 * math.pi * k / 24
    s = rng.uniform(0.7, 0.88)
    x, y = VX + s * 0.98 * math.cos(a), VY + s * 0.62 * math.sin(a)
    if y < -0.28 or math.hypot(x, y) > 1.25:
        continue
    z = 0.26 * (1 - s) / 0.38
    ball(f'tree{k}', M['trees'], x, y, G + z + 0.05, rng.uniform(0.06, 0.08), outline=0.01)

# ---------- fishing boats on the shore and sea ----------
for k, (x, y, mat) in enumerate(((-0.45, -0.42, 'b1'), (0.4, -0.45, 'b2'), (0.05, -0.85, 'b1'))):
    loft(f'boat{k}', M[mat], [[(x - 0.08, y, G + 0.003), (x + 0.04, y - 0.025, G + 0.003), (x + 0.09, y, G + 0.003), (x + 0.04, y + 0.025, G + 0.003)],
                              [(x - 0.09, y, G + 0.04), (x + 0.04, y - 0.033, G + 0.04), (x + 0.1, y, G + 0.04), (x + 0.04, y + 0.033, G + 0.04)]], outline=0.006)

turn(before, -20)
render(G)
