# A cartoon Elephanta Caves for the country maps, built in the set's shared look (../toon.py): the
# great cave temple cut into the rocky hill of Elephanta Island, its pillared entrance hall opening
# in the cliff, and inside, at the back, the huge three-headed Trimurti of Shiva carved out of the
# basalt, with the guardians either side; the wooded island's slopes and Mumbai harbour's water
# round it. Turned a little towards the camera.
# Run: blender -b --factory-startup -P elephanta.py -- elephanta-1024.png 1024 elephanta.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sea': toon('sea', '#3a7aa0', shadow_mul=(0.76, 0.84, 0.92), lift=0.3),
    'rock': toon('rock', '#7a7268', shadow_mul=(0.84, 0.84, 0.9), lift=0.1),
    'rockDark': toon('rockDark', '#5a524a'),
    'basalt': toon('basalt', '#8a8278', lift=0.12),
    'cave': flat('cave', '#2a2420'),
    'floor': toon('floor', '#a89c88', lift=0.15),
    'forest': toon('forest', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
    'sand': toon('sand', '#d8c8a0'),
})

G = tile(M['sea'])
before = set(bpy.data.objects)
rng = random.Random(550)

# ---------- the island and its hill ----------
isl = [(1.1 * math.cos(2 * math.pi * k / 24) * (1 + 0.04 * math.sin(4 * 2 * math.pi * k / 24)), 0.15 + 0.95 * math.sin(2 * math.pi * k / 24)) for k in range(24)]
loft('beach', M['sand'], [[(x, y, G - 0.01) for x, y in isl], [(x * 0.98, 0.15 + (y - 0.15) * 0.98, G + 0.03) for x, y in isl]], outline=0.006)
hill = lathe('hill', M['forest'], ((0.7, 0), (0.62, 0.12), (0.45, 0.3), (0.28, 0.42), (0.0, 0.46)), G + 0.02, 0, 0.4, segs=32, outline=0.008)
hill.visible_shadow = False

# ---------- the cliff face with the cave cut into it ----------
CY = -0.3          # the cliff's face
CZ, CH = G + 0.03, 0.34
box('cliff', M['rock'], 0, CY + 0.2, CZ, 1.0, 0.4, CH, outline=0.008, bevel=0)
for k in range(10):
    ball(f'cliffrock{k}', M['rockDark'], rng.uniform(-0.48, 0.48), CY + rng.uniform(0.0, 0.03), CZ + CH - rng.uniform(0.0, 0.05), rng.uniform(0.03, 0.06), outline=0.003)
box('forecourt', M['floor'], 0, CY - 0.16, G + 0.025, 0.7, 0.32, 0.01, outline=0.002, bevel=0)
# the cave's dark mouth and the pillars of its hall
box('cavemouth', M['cave'], 0, CY - 0.002, CZ, 0.62, 0.006, 0.22, outline=0, bevel=0)
for j, x in enumerate((-0.27, -0.15, 0.15, 0.27)):   # the middle left open on the Trimurti
    rod(f'pillar{j}', M['basalt'], (x, CY - 0.1, CZ), (x, CY - 0.1, CZ + 0.22), 0.02, segs=8, outline=0.003)
    lathe(f'pillarcushion{j}', M['basalt'], ((0.02, 0), (0.03, 0.02), (0.02, 0.035)), CZ + 0.15, x, CY - 0.1, segs=10, outline=0.001)
# the rock overhang above the pillars
box('porchroof', M['rock'], 0, CY - 0.06, CZ + 0.215, 0.66, 0.14, 0.04, outline=0.004, bevel=0)

# ---------- the Trimurti, looming out of the cave's darkness ----------
TX, TY = 0.0, CY - 0.035
TZ = CZ + 0.005
box('trimurtibust', M['basalt'], TX, TY, TZ, 0.18, 0.06, 0.1, outline=0.004, bevel=0)
for k, (dx, tilt) in enumerate(((-0.055, 0.7), (0.0, 0.0), (0.055, -0.7))):
    hx = TX + dx
    head = ball(f'trimurtihead{k}', M['basalt'], 0, 0, 0, 0.035, outline=0.004)
    head.scale = (0.8, 0.8, 1.15)
    head.location = (hx, TY - 0.01 - 0.01 * (k == 1), TZ + 0.14)
    lathe(f'trimurticrown{k}', M['basalt'], ((0.026, 0), (0.024, 0.03), (0.012, 0.05)), TZ + 0.17, hx, TY - 0.01, segs=10, outline=0.002)
for s in (-1, 1):
    # the guardians (dvarapalas) either side, carved in the rock
    rod(f'guardian{s}', M['basalt'], (TX + s * 0.18, TY, TZ), (TX + s * 0.18, TY, TZ + 0.16), 0.024, r2=0.018, segs=8, outline=0.003)
    ball(f'guardianhead{s}', M['basalt'], TX + s * 0.18, TY, TZ + 0.18, 0.02, outline=0.002)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
