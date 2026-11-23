# A cartoon Pont du Gard for the country maps, built in the set's shared look (../toon.py): the
# Roman aqueduct bridge's three tiers of golden limestone arches, big below and small along the top,
# over the green Gardon between its rocky banks and the garrigue's trees. Turned a little towards
# the camera.
# Run: blender -b --factory-startup -P pont-du-gard.py -- pont-du-gard-1024.png 1024 pont-du-gard.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'river': toon('river', '#3f9a8a', shadow_mul=(0.74, 0.84, 0.86), lift=0.3),
    'bank': toon('bank', '#8aa058', shadow_mul=(0.72, 0.8, 0.74)),
    'rock': toon('rock', '#c8b48e', shadow_mul=(0.86, 0.8, 0.78)),
    'stone': toon('stone', '#e2c48e', shadow_mul=(0.86, 0.78, 0.72), lift=0.15),
    'stoneDark': toon('stoneDark', '#c8a874', shadow_mul=(0.86, 0.78, 0.72)),
    'tree': toon('tree', '#5a8a48', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['river'])
before = set(bpy.data.objects)
rng = random.Random(1531)


def bank(name, a0, a1, h):
    pts = [(1.41 * math.cos(math.radians(a)), 1.41 * math.sin(math.radians(a))) for a in range(a0, a1 + 1, 5)]
    b = loft(name, M['bank'], [[(x, y, G - 0.01) for x, y in pts], [(x * 0.97, y * 0.97, G + h) for x, y in pts]], outline=0.016)
    b.visible_shadow = False


bank('bankleft', 115, 245, 0.16)
bank('bankright', -65, 65, 0.16)
for k, (x, y) in enumerate(((-1.0, 0.55), (-1.15, 0.1), (-0.95, -0.5), (1.0, 0.5), (1.15, 0.0), (0.95, -0.55))):
    ball(f'tree{k}', M['tree'], x, y, G + 0.22, rng.uniform(0.07, 0.09), outline=0.011)


def tier(name, n, span, pier, z0, spring, rise, top, depth):
    L = n * span + (n + 1) * pier
    x0 = -L / 2
    for k in range(n + 1):
        box(f'{name}pier{k}', M['stone'], x0 + pier / 2 + k * (span + pier), 0.0, z0, pier, depth, top - z0, outline=0.005, bevel=0)
    for k in range(n):
        xs = x0 + pier + k * (span + pier)
        for j in range(5):
            um = (j + 0.5) / 5
            z = spring + rise * math.sqrt(max(0.0, 1 - (2 * um - 1) ** 2))
            box(f'{name}arch{k}_{j}', M['stone'], xs + span * um, 0.0, z, span / 5 + 0.002, depth - 0.004, top - z, outline=0.002, bevel=0)
    box(f'{name}course', M['stoneDark'], 0.0, 0.0, top - 0.004, L + 0.01, depth + 0.012, 0.018, outline=0.004, bevel=0)
    return L


# ---------- the three tiers ----------
tier('lower', 6, 0.22, 0.09, G - 0.01, G + 0.12, 0.1, G + 0.24, 0.14)
tier('middle', 11, 0.13, 0.065, G + 0.24, G + 0.33, 0.06, G + 0.41, 0.12)
tier('upper', 26, 0.048, 0.028, G + 0.41, G + 0.44, 0.022, G + 0.47, 0.1)
box('channel', M['stoneDark'], 0.0, 0.0, G + 0.465, 2.0, 0.1, 0.03, outline=0.006, bevel=0)
for s in (-1, 1):
    ball(f'bankrock{s}', M['rock'], s * 0.95, -0.25, G + 0.04, 0.07, outline=0.008)

turn(before, -20)
render(G)
