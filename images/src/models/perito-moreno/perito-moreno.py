# A cartoon Perito Moreno Glacier for the country maps, built in the set's shared look
# (../toon.py) on a tile of turquoise lake: the glacier's tongue coming down its valley between
# dark snow-capped mountains, its jagged ice front standing in the lake streaked with blue
# crevasses and crowned with seracs, and icebergs floating off it. Turned a little to the camera.
# Run: blender -b --factory-startup -P perito-moreno.py -- perito-moreno-1024.png 1024 perito-moreno.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'lake': toon('lake', '#58b9c9', shadow_mul=(0.72, 0.82, 0.86), lift=0.3),
    'ice': toon('ice', '#e9f5fc', shadow_mul=(0.78, 0.86, 0.96), lift=0.1),
    'iceBlue': toon('iceBlue', '#8fc8ea', shadow_mul=(0.75, 0.84, 0.95), lift=0.2),
    'crevasse': flat('crevasse', '#4f93c9'),
    'mountain': toon('mountain', '#6c6670', shadow_mul=(0.75, 0.74, 0.84)),
    'snow': toon('snow', '#f7f8fb', shadow_mul=(0.80, 0.84, 0.95), lift=0.15),
    'forest': toon('forest', '#4f8a4a', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['lake'])
before = set(bpy.data.objects)
rng = random.Random(17)


def ring(cx, cy, r, z, jitter, sides=10):
    return [(cx + r * (1 + rng.uniform(-jitter, jitter)) * math.cos(2 * math.pi * k / sides),
             cy + r * (1 + rng.uniform(-jitter, jitter)) * math.sin(2 * math.pi * k / sides), G + z) for k in range(sides)]


def mountain(name, cx, cy, r, h):
    body = loft(name, M['mountain'], [ring(cx, cy, r, -0.01, 0.0), ring(cx, cy, r * 0.72, h * 0.4, 0.12),
                                      ring(cx, cy, r * 0.42, h * 0.72, 0.14), ring(cx, cy, 0.03, h, 0.0)], outline=0.035)
    cap = loft(name + 'snow', M['snow'], [ring(cx, cy, r * 0.46, h * 0.68, 0.16), ring(cx, cy, r * 0.25, h * 0.86, 0.12),
                                          ring(cx, cy, 0.04, h + 0.01, 0.0)], outline=0.025)
    foot = loft(name + 'forest', M['forest'], [ring(cx, cy, r * 1.02, -0.01, 0.0), ring(cx, cy, r * 0.86, h * 0.18, 0.08)],
                outline=0.02)
    body.visible_shadow = cap.visible_shadow = foot.visible_shadow = False


# ---------- the mountains either side of the valley ----------
mountain('west', -0.82, 0.55, 0.5, 1.05)
mountain('east', 0.78, 0.6, 0.48, 0.92)
mountain('back', 0.05, 1.05, 0.4, 0.78)

# ---------- the glacier's tongue, its jagged ice front in the lake ----------
FRONT_Y = -0.28
front = []
for k in range(25):
    x = -0.72 + 1.44 * k / 24
    front.append((x, FRONT_Y + rng.uniform(-0.04, 0.04) + 0.08 * (x / 0.72) ** 2))
back = [(0.42, 1.05), (0.15, 1.25), (-0.15, 1.25), (-0.42, 1.05)]
outline_pts = front + back
FRONT_H = 0.34
heights = [FRONT_H] * len(front) + [0.55, 0.62, 0.62, 0.55]   # rising up the valley
ice = loft('glacier', M['ice'], [[(x, y, G - 0.01) for x, y in outline_pts],
                                 [(x, y, G + h) for (x, y), h in zip(outline_pts, heights)]], outline=0.03)
ice.visible_shadow = False
# blue crevasses down the ice front
for k in range(1, 24, 2):
    (x0, y0), (x1, y1) = front[k], front[k + 1]
    x, y = (x0 + x1) / 2, (y0 + y1) / 2 - 0.012
    a = math.atan2(y1 - y0, x1 - x0)
    box(f'crevasse{k}', M['crevasse'], x, y, G + 0.03, 0.025, 0.015, FRONT_H * rng.uniform(0.55, 0.9), rot_z=a, outline=0, bevel=0)
# seracs: little spikes of ice along the top of the front
for k in range(0, 25, 2):
    x, y = front[k]
    pyramid(f'serac{k}', M['iceBlue'] if k % 4 == 0 else M['ice'], x, y + 0.08, G + FRONT_H - 0.01, 0.1, rng.uniform(0.06, 0.12),
            outline=0.014)

# ---------- icebergs ----------
for k, (x, y, s) in enumerate(((-0.5, -0.62, 0.12), (0.12, -0.75, 0.09), (0.55, -0.55, 0.11), (-0.1, -1.05, 0.07), (0.85, -0.95, 0.08))):
    box(f'berg{k}', M['ice'] if k % 2 == 0 else M['iceBlue'], x, y, G - 0.005, s * 1.4, s, s * 0.6, rot_z=rng.uniform(0, 1.5),
        outline=0.015, bevel=0.01)

turn(before, -20)
render(G)
