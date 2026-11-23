# A cartoon Ennedi Massif for the country maps, built in the set's shared look (../toon.py): Chad's
# sandstone plateau in the Sahara, the Aloba Arch soaring over the sand, the massif's pillars and
# towers of red rock, a guelta's water between the cliffs, and camels. Turned a little towards the
# camera.
# Run: blender -b --factory-startup -P ennedi.py -- ennedi-1024.png 1024 ennedi.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sand': toon('sand', '#e8c088', shadow_mul=(0.84, 0.76, 0.72), lift=0.25),
    'rock': toon('rock', '#b8603a', shadow_mul=(0.84, 0.72, 0.72)),
    'rockDark': toon('rockDark', '#9a4a2e', shadow_mul=(0.84, 0.72, 0.72)),
    'water': toon('water', '#4a8a8a', shadow_mul=(0.74, 0.82, 0.86), lift=0.3),
    'camel': toon('camel', '#c89a5e'),
    'scrub': toon('scrub', '#8a9a5a', shadow_mul=(0.72, 0.78, 0.76)),
})

G = tile(M['sand'])
before = set(bpy.data.objects)
rng = random.Random(983)


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


# ---------- the Aloba Arch: a band of rock swept over a tall half-circle, massive at its feet ----------
AX, AY, SPAN, HEIGHT = -0.05, 0.25, 0.42, 0.62
rings = []
for k in range(21):
    t = math.pi * k / 20
    cx, cz = AX + SPAN * math.cos(t), HEIGHT * math.sin(t)
    nx, nz = math.cos(t), math.sin(t) * SPAN / HEIGHT
    n = math.hypot(nx, nz)
    nx, nz = nx / n, nz / n
    thick = 0.07 + 0.12 * (1 - math.sin(t)) ** 2
    depth = 0.09 + 0.06 * (1 - math.sin(t))
    rings.append([(cx - nx * thick, AY - depth, G + max(-0.01, cz - nz * thick)), (cx + nx * thick, AY - depth, G + max(-0.01, cz + nz * thick)),
                  (cx + nx * thick, AY + depth, G + max(-0.01, cz + nz * thick)), (cx - nx * thick, AY + depth, G + max(-0.01, cz - nz * thick))])
arch = loft('arch', M['rock'], rings, outline=0.02)
arch.visible_shadow = False
for s in (-1, 1):
    foot = loft(f'archfoot{s}', M['rockDark'], [[(AX + s * SPAN + dx, AY + dy, G - 0.01) for dx, dy in ((-0.2, -0.17), (0.2, -0.17), (0.2, 0.17), (-0.2, 0.17))],
                                                [(AX + s * SPAN + dx, AY + dy, G + 0.2) for dx, dy in ((-0.15, -0.13), (0.15, -0.13), (0.15, 0.13), (-0.15, 0.13))]], outline=0.016)
    foot.visible_shadow = False

# ---------- pillars and towers of the massif ----------
for k, (x, y, r, h) in enumerate(((0.7, 0.55, 0.12, 0.45), (0.85, 0.2, 0.09, 0.32), (-0.75, 0.6, 0.11, 0.38), (-0.9, 0.2, 0.08, 0.26), (0.5, 0.85, 0.1, 0.36))):
    lathe(f'pillar{k}', M['rock' if k % 2 else 'rockDark'], ((r * 1.2, 0), (r, h * 0.3), (r * 0.9, h * 0.8), (r * 1.1, h * 0.9), (r * 0.6, h)), G - 0.01, x, y, segs=8, outline=0.014,
          smooth=False)
for k in range(5):
    x, y = rng.uniform(-1.1, 1.1), rng.uniform(-0.9, -0.2)
    if math.hypot(x, y) > 1.2:
        continue
    squashed(f'boulder{k}', M['rockDark'], x, y, G + 0.02, rng.uniform(0.04, 0.07), 1.3, 1.0, 0.7, outline=0.008)

# ---------- the guelta, scrub and camels ----------
cyl('guelta', M['water'], 1.0, 0.006, segs=20, outline=0.006, matrix=Matrix.Translation((0.55, 0.15, G + 0.003)) @ Matrix.Scale(0.18, 4, (1, 0, 0)) @ Matrix.Scale(0.1, 4, (0, 1, 0)))
for k in range(8):
    x, y = rng.uniform(-1.0, 1.0), rng.uniform(-1.0, 0.0)
    if math.hypot(x, y) > 1.2:
        continue
    squashed(f'scrub{k}', M['scrub'], x, y, G + 0.02, 0.04, 1.3, 1.3, 0.6, outline=0.006)
for k, (x, y, deg) in enumerate(((-0.35, -0.6, 200), (0.05, -0.68, 190))):
    made = set(bpy.data.objects)
    for dx in (-0.08, 0.08):
        for sy in (-1, 1):
            rod(f'camelleg{k}{dx}{sy}', M['camel'], (dx, sy * 0.035, G), (dx, sy * 0.035, G + 0.17), 0.012, segs=8, outline=0.004)
    squashed(f'camelbody{k}', M['camel'], 0, 0, G + 0.2, 0.1, 1.5, 0.8, 0.7, outline=0.012)
    ball(f'camelhump{k}', M['camel'], -0.01, 0, G + 0.26, 0.06, outline=0.01)
    rod(f'camelneck{k}', M['camel'], (0.12, 0, G + 0.2), (0.2, 0, G + 0.3), 0.025, r2=0.02, segs=10, outline=0.006)
    squashed(f'camelhead{k}', M['camel'], 0.23, 0, G + 0.31, 0.035, 1.5, 0.9, 0.8, outline=0.006)
    place(made, deg, x, y)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
