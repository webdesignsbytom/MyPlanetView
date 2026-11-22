# A cartoon Statue of Liberty for the country maps, built from primitives in the set's shared
# look (../toon.py: toon shading, outline, grass tile, camera, sun): Fort Wood's eleven-pointed
# star, the granite pedestal, and the copper-green figure in her robe, with her crown of seven
# rays, the torch raised in her right hand and the tablet in her left, turned to face the camera.
# Run: blender -b --factory-startup -P statue-of-liberty.py -- statue-of-liberty-1024.png 1024 statue-of-liberty.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'copper': toon('copper', '#86cbb0', shadow_mul=(0.62, 0.74, 0.80), lift=0.3),
    'granite': toon('granite', '#e0d1b2'),
    'graniteDark': toon('graniteDark', '#c8b48e'),
    'fort': toon('fort', '#c9ad83'),
    'window': flat('window', '#4b3a55'),
})

G = tile()
box('path', M['path'], 0, -1.25, G - 0.01, 0.42, 0.4, 0.02, outline=0.015, bevel=0.0)


def rod(name, mat, p0, p1, r, r2=None, segs=12, outline=0.03):
    """A round rod (or a cone, with r2) from p0 to p1."""
    p0, p1 = Vector(p0), Vector(p1)
    d = p1 - p0
    rot = d.normalized().to_track_quat('Z', 'Y').to_matrix().to_4x4()
    return cyl(name, mat, r, d.length, segs=segs, r2=r2, outline=outline, smooth=True,
               matrix=Matrix.Translation((p0 + p1) / 2) @ rot)


# ---------- Fort Wood: an eleven-pointed star ----------
POINTS = 11
star = []
for k in range(POINTS * 2):
    a = math.pi / 2 + math.pi * k / POINTS
    r = 1.26 if k % 2 == 0 else 1.0
    star.append((r * math.cos(a), r * math.sin(a)))
Z_FORT = G + 0.17
loft('fort', M['fort'], [[(x, y, G - 0.01) for x, y in star], [(x, y, Z_FORT) for x, y in star]], outline=0.035)

# ---------- the pedestal ----------
box('plinth', M['graniteDark'], 0, 0, Z_FORT, 1.1, 1.1, 0.2, bevel=0.02)
Z_SHAFT = Z_FORT + 0.2
SHAFT_H = 0.95
loft('pedestal', M['granite'],
     [[(x * w, y * w, z) for x, y in ((1, 1), (-1, 1), (-1, -1), (1, -1))]
      for w, z in ((0.47, Z_SHAFT), (0.41, Z_SHAFT + SHAFT_H))],
     outline=0.04, bevel=0.015)
Z_LOGGIA = Z_SHAFT + SHAFT_H - 0.3
box('cornice', M['graniteDark'], 0, 0, Z_SHAFT + SHAFT_H, 0.96, 0.96, 0.08, bevel=0.015)
box('top', M['granite'], 0, 0, Z_SHAFT + SHAFT_H + 0.08, 0.8, 0.8, 0.1, bevel=0.015)
Z_STATUE = Z_SHAFT + SHAFT_H + 0.18


def loggia(i, a, at):
    # the row of small arched windows near the top of each side
    for col in (-0.2, 0.0, 0.2):
        half = 0.41 + (0.47 - 0.41) * 0.3 / SHAFT_H  # the side's half-width at the windows
        x, y = at(col, -half - 0.01)
        box(f'win{i}{col}', M['window'], x, y, Z_LOGGIA, 0.09, 0.02, 0.13, rot_z=a, outline=0, bevel=0)
        cyl(f'wintop{i}{col}', M['window'], 0.045, 0.02, segs=12, outline=0,
            matrix=Matrix.Translation((x, y, Z_LOGGIA + 0.13)) @ Matrix.Rotation(a, 4, 'Z') @ Matrix.Rotation(math.pi / 2, 4, 'X'))


each_side(loggia)

# ---------- the figure ----------
# Built facing the front (-Y), then turned on the pedestal to face the camera, as a sculptor
# would: the crown's rays then fan out evenly, the torch rises on the left, the tablet on the right
before = set(bpy.data.objects)
S = Z_STATUE
# The robe: wide at the hem, in at the waist, out at the chest, round to the shoulders
PROFILE = ((0.0, 0.44), (0.08, 0.43), (0.35, 0.37), (0.8, 0.31), (1.15, 0.34), (1.42, 0.33), (1.55, 0.26), (1.62, 0.13))
SEGS = 24
loft('robe', M['copper'],
     [[(r * math.cos(2 * math.pi * k / SEGS), 0.82 * r * math.sin(2 * math.pi * k / SEGS), S + z) for k in range(SEGS)]
      for z, r in PROFILE],
     outline=0.04, smooth=True)

# head, neck and crown
rod('neck', M['copper'], (0, 0, S + 1.55), (0, 0, S + 1.75), 0.09, outline=0.025)
HEAD = Vector((0, -0.02, S + 1.88))
ball('head', M['copper'], *HEAD, 0.22, outline=0.035)
CROWN = HEAD + Vector((0, 0, 0.14))
cyl('crownband', M['copper'], 0.2, 0.06, segs=24, outline=0.025, smooth=True, matrix=Matrix.Translation(CROWN))
# seven rays fanned like a sunburst across her face's plane (as a cartoon draws the crown: rays
# pointing straight at the viewer would shrink to nothing), tipped a little back
for k in range(7):
    th = math.radians(12 + 26 * k)
    out = Vector((math.cos(th), 0.3, math.sin(th))).normalized()
    base = CROWN + Vector((0.16 * math.cos(th), 0.02, 0.05 * math.sin(th)))
    rod(f'ray{k}', M['copper'], base, base + out * 0.33, 0.05, r2=0.0, segs=8, outline=0.022)

# the raised right arm and the torch (her right is the camera's left, -X)
SHOULDER_R = Vector((-0.27, 0.0, S + 1.46))
HAND_R = Vector((-0.36, 0.04, S + 2.42))
rod('armR', M['copper'], SHOULDER_R, HAND_R, 0.1, r2=0.085, outline=0.035)
ball('handR', M['copper'], *HAND_R, 0.095, outline=0.03)
rod('torch', M['copper'], HAND_R, HAND_R + Vector((0, 0, 0.18)), 0.055, outline=0.025)
CUP = HAND_R + Vector((0, 0, 0.18))
rod('cup', M['gold'], CUP, CUP + Vector((0, 0, 0.1)), 0.07, r2=0.13, segs=16, outline=0.025)
FLAME = CUP + Vector((0, 0, 0.12))
ball('flame', M['gold'], *FLAME, 0.1, outline=0.03)
rod('flametip', M['gold'], FLAME, FLAME + Vector((0, 0, 0.24)), 0.095, r2=0.0, segs=16, outline=0.03)

# the left arm, bent, holding the tablet against her side (+X)
SHOULDER_L = Vector((0.27, 0.0, S + 1.42))
ELBOW_L = Vector((0.4, -0.06, S + 1.0))
HAND_L = Vector((0.31, -0.25, S + 1.1))  # behind the tablet
rod('upperL', M['copper'], SHOULDER_L, ELBOW_L, 0.085, outline=0.03)
rod('forearmL', M['copper'], ELBOW_L, HAND_L, 0.075, outline=0.03)
tablet = box('tablet', M['copper'], 0, 0, 0, 0.3, 0.06, 0.44, outline=0.03, bevel=0.01)
tablet.matrix_world = (Matrix.Translation((0.36, -0.3, S + 0.95)) @ Matrix.Rotation(math.radians(-25), 4, 'Z')
                       @ Matrix.Rotation(math.radians(-12), 4, 'Y'))

TURN = Matrix.Rotation(math.radians(-32), 4, 'Z')
for ob in set(bpy.data.objects) - before:
    ob.matrix_world = TURN @ ob.matrix_world

render(G)
