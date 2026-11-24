# A cartoon Madara Rider for the country maps, built in the set's shared look (../toon.py): the great
# early medieval rock relief in north-east Bulgaria, carved high on a sheer limestone cliff: a
# horseman thrusting his spear into a lion under his horse's hooves, his dog running behind, set in
# its weathered panel on the pale cliff face, with the stairs and the platform at the cliff's foot,
# the bushes on its top and the trees below. The relief is drawn larger than life so it reads.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P madara-rider.py -- madara-rider-1024.png 1024 madara-rider.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'rock': toon('rock', '#d2c4a2', shadow_mul=(0.82, 0.82, 0.88), lift=0.15),
    'panel': toon('panel', '#9c8c70'),
    'relief': toon('relief', '#f2e8d0', lift=0.25),
    'stone': toon('stone', '#c8c0b0', lift=0.12),
    'bush': toon('bush', '#5a8f44', shadow_mul=(0.7, 0.78, 0.8)),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['grass'])
before = set(bpy.data.objects)

# ---------- the cliff: a sheer face bowed towards the camera ----------
H = 0.86
front = [(x / 10, 0.15 + 0.15 * (x / 10) ** 2) for x in range(-10, 11)]
ring = front + [(1.0, 0.75), (-1.0, 0.75)]
cliff = loft('cliff', M['rock'], [[(x, y, G - 0.01) for x, y in ring], [(x, y, G + H) for x, y in ring]], outline=0.008)
for k, (x, y) in enumerate(((-0.8, 0.5), (-0.45, 0.45), (-0.1, 0.55), (0.3, 0.45), (0.7, 0.5), (0.55, 0.65), (-0.6, 0.66))):
    ball(f'bush{k}', M['bush'], x, y, G + H + 0.04, 0.09, outline=0.008)

# ---------- the relief, in its weathered panel ----------
Y = 0.14
box('panel', M['panel'], 0.0, 0.16, G + 0.2, 0.74, 0.03, 0.5, outline=0.004, bevel=0)


def blob(name, x, z, rx, rz):
    b = ball(name, M['relief'], 0, 0, 0, 1.0, outline=0.003)
    b.scale = (rx, 0.018, rz)
    b.location = (x, Y, z)


def limb(name, x0, z0, x1, z1, t):
    bar(name, M['relief'], (x0, Y, z0), (x1, Y, z1), t, outline=0.002)


Z = G + 0.26  # the ground line under the figures
# the horse
blob('horse', 0.0, Z + 0.16, 0.13, 0.055)
limb('horseneck', 0.09, Z + 0.18, 0.16, Z + 0.26, 0.05)
blob('horsehead', 0.19, Z + 0.25, 0.045, 0.024)
limb('horsefrontleg', 0.09, Z + 0.13, 0.11, Z, 0.024)
limb('horseraisedleg', 0.1, Z + 0.14, 0.18, Z + 0.06, 0.024)
limb('horsebackleg', -0.09, Z + 0.13, -0.11, Z, 0.024)
limb('horsebackleg2', -0.06, Z + 0.13, -0.04, Z, 0.024)
limb('horsetail', -0.12, Z + 0.18, -0.18, Z + 0.09, 0.02)
# the rider and his spear
limb('ridertorso', 0.0, Z + 0.2, 0.012, Z + 0.31, 0.042)
blob('riderhead', 0.014, Z + 0.345, 0.026, 0.028)
limb('riderleg', 0.0, Z + 0.21, 0.035, Z + 0.12, 0.024)
limb('riderarm', 0.012, Z + 0.29, 0.06, Z + 0.32, 0.02)
limb('spear', 0.04, Z + 0.37, 0.27, Z + 0.05, 0.009)
# the lion under the hooves
blob('lion', 0.25, Z + 0.045, 0.07, 0.032)
blob('lionhead', 0.31, Z + 0.07, 0.03, 0.03)
limb('lionleg', 0.21, Z + 0.03, 0.2, Z, 0.016)
limb('lionleg2', 0.28, Z + 0.03, 0.3, Z, 0.016)
limb('liontail', 0.18, Z + 0.05, 0.15, Z + 0.09, 0.012)
# the dog running behind
blob('dog', -0.26, Z + 0.075, 0.06, 0.024)
blob('doghead', -0.195, Z + 0.1, 0.024, 0.02)
limb('dogleg', -0.22, Z + 0.06, -0.19, Z + 0.005, 0.014)
limb('dogleg2', -0.3, Z + 0.06, -0.33, Z + 0.005, 0.014)
limb('dogtail', -0.32, Z + 0.085, -0.35, Z + 0.12, 0.01)

# ---------- the platform and the stairs at the foot ----------
box('platform', M['stone'], 0.0, 0.05, G - 0.005, 0.7, 0.2, 0.04, outline=0.004, bevel=0)
for i in range(5):
    box(f'step{i}', M['stone'], 0.0, -0.08 - i * 0.05, G - 0.005, 0.2, 0.05, 0.035 - i * 0.007, outline=0.001, bevel=0)
for k, (x, y) in enumerate(((-0.7, -0.15), (0.72, -0.12), (-0.45, -0.55), (0.5, -0.6), (-0.95, 0.1), (0.95, 0.15))):
    ball(f'tree{k}', M['tree'], x, y, G + 0.15, 0.13, outline=0.012)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
