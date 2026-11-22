# A cartoon Wat Phou for the country maps, built in the set's shared look (../toon.py): the Khmer
# temple climbing the slope of Phou Kao, whose peak stands up like a lingam behind it; the long
# causeway lined with boundary posts past the reservoir, the two ruined palaces either side of it,
# the steep stone stairs up the hill between frangipani trees in white flower, and the sanctuary at
# the top. Turned a little towards the camera.
# Run: blender -b --factory-startup -P wat-phou.py -- wat-phou-1024.png 1024 wat-phou.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass2', '#8cc163', shadow_mul=(0.72, 0.8, 0.76), lift=0.25),
    'hill': toon('hill', '#5f9e55', shadow_mul=(0.7, 0.78, 0.8)),
    'forest': toon('forest', '#3f8a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'sandstone': toon('sandstone', '#a89a80', shadow_mul=(0.8, 0.78, 0.84)),
    'sandstoneDark': toon('sandstoneDark', '#8f826a', shadow_mul=(0.8, 0.78, 0.84)),
    'laterite': toon('laterite', '#b07a5a', shadow_mul=(0.84, 0.72, 0.72)),
    'door': flat('door', '#3a3030'),
    'water': toon('water', '#5fa8c8', shadow_mul=(0.75, 0.84, 0.88), lift=0.3),
    'trunk': toon('trunk', '#8a6a52'),
    'frangipani': toon('frangipani', '#6aa452', shadow_mul=(0.7, 0.78, 0.8)),
    'flower': flat('flower', '#fbf6ea'),
    'flowerHeart': flat('flowerHeart', '#f4d060'),
})

G = tile(M['grass'])
before = set(bpy.data.objects)
rng = random.Random(347)


def ring(cx, cy, rx, ry, z, jitter, sides=16):
    return [(cx + rx * (1 + rng.uniform(-jitter, jitter)) * math.cos(2 * math.pi * k / sides),
             cy + ry * (1 + rng.uniform(-jitter, jitter)) * math.sin(2 * math.pi * k / sides), G + z) for k in range(sides)]


# ---------- Phou Kao behind, its peak standing up like a lingam ----------
hill = loft('hill', M['hill'], [ring(0.0, 0.72, 1.05, 0.5, -0.01, 0.02), ring(0.0, 0.8, 0.8, 0.38, 0.22, 0.04), ring(0.05, 0.92, 0.5, 0.24, 0.42, 0.05)],
            outline=0.035)
peak = loft('peak', M['forest'], [ring(0.15, 1.0, 0.24, 0.14, 0.4, 0.04), ring(0.17, 1.02, 0.15, 0.1, 0.8, 0.04), ring(0.18, 1.03, 0.1, 0.07, 0.95, 0.02),
                                  ring(0.18, 1.03, 0.02, 0.02, 1.0, 0.0)], outline=0.03)
hill.visible_shadow = peak.visible_shadow = False
for k in range(10):
    a = math.radians(rng.uniform(20, 160))
    r = rng.uniform(0.75, 1.05)
    ball(f'hillforest{k}', M['forest'], r * math.cos(a), 0.75 + r * 0.5 * math.sin(a), G + 0.12, rng.uniform(0.08, 0.11), outline=0.016)

# ---------- the reservoir and the causeway with its boundary posts ----------
box('baray', M['water'], 0.0, -0.95, G - 0.002, 1.0, 0.28, 0.01, outline=0.01, bevel=0)
box('causeway', M['laterite'], 0.0, -0.35, G - 0.005, 0.16, 0.95, 0.02, outline=0.008, bevel=0)
for k in range(7):
    y = -0.75 + k * 0.12
    for s in (-1, 1):
        rod(f'post{k}{s}', M['sandstone'], (s * 0.1, y, G), (s * 0.1, y, G + 0.07), 0.012, segs=8, outline=0.005)
        ball(f'posttop{k}{s}', M['sandstone'], s * 0.1, y, G + 0.07, 0.012, outline=0.004)


# ---------- the two ruined palaces either side ----------
def palace(name, x, y):
    w, d, h = 0.36, 0.28, 0.16
    for k, (cx, cy, sx, sy, hh) in enumerate(((x, y - d / 2, w, 0.035, h), (x, y + d / 2, w, 0.035, h * 0.7), (x - w / 2, y, 0.035, d, h), (x + w / 2, y, 0.035, d, h * 0.85))):
        box(f'{name}wall{k}', M['sandstone'], cx, cy, G - 0.005, sx + 0.035, sy, hh, outline=0.012, bevel=0)
    box(f'{name}door', M['door'], x, y - d / 2 - 0.02, G, 0.06, 0.01, 0.1, outline=0, bevel=0)
    box(f'{name}gable', M['sandstoneDark'], x, y - d / 2 - 0.005, G + h - 0.005, 0.14, 0.04, 0.06, outline=0.008, bevel=0)
    for k in range(3):
        box(f'{name}win{k}', M['door'], x - w / 2 - 0.02, y - 0.08 + k * 0.08, G + 0.06, 0.01, 0.025, 0.05, outline=0, bevel=0)


palace('northpalace', -0.42, -0.3)
palace('southpalace', 0.42, -0.3)

# ---------- the stairs up the hill, frangipani either side ----------
STEPS = 12
for j in range(STEPS):
    t = j / STEPS
    y = 0.15 + t * 0.6
    box(f'stair{j}', M['sandstone'], 0.0, y, G - 0.005, 0.18, 0.06, 0.04 + 0.36 * t, outline=0.006, bevel=0)
for k, t in enumerate((0.05, 0.3, 0.55)):
    y = 0.15 + t * 0.6
    for s in (-1, 1):
        x = s * 0.2
        z = G + 0.36 * t
        rod(f'frangitrunk{k}{s}', M['trunk'], (x, y, z), (x + s * 0.02, y, z + 0.12), 0.012, segs=6, outline=0.005)
        crown = ball(f'frangicrown{k}{s}', M['frangipani'], 0, 0, 0, 0.07, outline=0.012)
        crown.scale = (1.2, 1.2, 0.6)
        crown.location = (x + s * 0.02, y, z + 0.14)
        for f in range(5):
            a = 2 * math.pi * f / 5 + k
            ball(f'flower{k}{s}{f}', M['flower'], x + s * 0.02 + 0.05 * math.cos(a), y + 0.05 * math.sin(a), z + 0.17, 0.014, outline=0)
            ball(f'flowerheart{k}{s}{f}', M['flowerHeart'], x + s * 0.02 + 0.05 * math.cos(a), y + 0.05 * math.sin(a), z + 0.182, 0.006, outline=0)

# ---------- the sanctuary at the top ----------
SY, SZ = 0.82, G + 0.4
box('terrace', M['laterite'], 0.0, SY, SZ - 0.02, 0.4, 0.22, 0.04, outline=0.012, bevel=0)
box('sanctuary', M['sandstone'], 0.0, SY + 0.02, SZ + 0.015, 0.22, 0.16, 0.16, outline=0.016, bevel=0)
box('sanctuarydoor', M['door'], 0.0, SY - 0.06, SZ + 0.015, 0.05, 0.01, 0.09, outline=0, bevel=0)
for k, (w, z) in enumerate(((0.2, 0.17), (0.15, 0.22), (0.1, 0.27))):
    box(f'sanctuarytier{k}', M['sandstoneDark'], 0.0, SY + 0.02, SZ + z, w, w * 0.7, 0.05, outline=0.01, bevel=0)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
