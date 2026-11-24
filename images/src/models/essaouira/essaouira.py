# A cartoon Essaouira for the country maps, built in the set's shared look (../toon.py): the Skala
# de la Ville, the sea rampart of the Atlantic port with its battlements and rows of old bronze
# cannons pointing out to sea, the square bastion tower at its end, the white houses of the medina
# with their blue shutters behind, and the blue fishing boats in the water. Turned a little towards
# the camera.
# Run: blender -b --factory-startup -P essaouira.py -- essaouira-1024.png 1024 essaouira.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#d8ccb0', shadow_mul=(0.84, 0.82, 0.86), lift=0.2),
    'sea': toon('sea', '#2f7ab8', shadow_mul=(0.76, 0.84, 0.92), lift=0.3),
    'rock': toon('rock', '#9a9080'),
    'wall': toon('wall', '#c8b088', shadow_mul=(0.86, 0.82, 0.76), lift=0.06),
    'wallDark': toon('wallDark', '#a8905e'),
    'bronze': toon('bronze', '#5a6a50'),
    'white': toon('white', '#f6f4ee', lift=0.15),
    'blue': toon('blue', '#2a6ab8', lift=0.12),
    'dark': flat('dark', '#2e2a28'),
})

G = tile(M['paving'])
before = set(bpy.data.objects)
rng = random.Random(2447)


def strip(y0, y1, r, z, n=6):
    xa0, xa1 = math.sqrt(r * r - y0 * y0), math.sqrt(r * r - y1 * y1)
    a0, a1 = math.asin(y0 / r), math.asin(y1 / r)
    pts = [(-xa0, y0), (xa0, y0)]
    pts += [(r * math.cos(a0 + (a1 - a0) * k / n), r * math.sin(a0 + (a1 - a0) * k / n)) for k in range(1, n)]
    pts += [(xa1, y1), (-xa1, y1)]
    pts += [(r * math.cos(math.pi - a1 + (a1 - a0) * k / n), r * math.sin(math.pi - a1 + (a1 - a0) * k / n)) for k in range(1, n)]
    return [(x, y, G + z) for x, y in pts]


loft('sea', M['sea'], [strip(-1.25, -0.38, 1.33, -0.004), strip(-1.25, -0.38, 1.33, 0.006)], outline=0.004)
for k in range(9):
    ball(f'rock{k}', M['rock'], -0.8 + k * 0.2 + rng.uniform(-0.05, 0.05), -0.44, G, rng.uniform(0.04, 0.07), outline=0.004)

# ---------- the rampart ----------
RY, RH = -0.24, 0.2
box('rampart', M['wall'], -0.1, RY, G - 0.005, 1.5, 0.22, RH, outline=0.009, bevel=0)
for j in range(14):
    x = -0.82 + j * 0.105
    box(f'merlon{j}', M['wallDark'], x, RY - 0.1, G + RH - 0.005, 0.05, 0.03, 0.05, outline=0.001, bevel=0)
    if j < 13:
        cx = x + 0.0525
        rod(f'cannon{j}', M['bronze'], (cx, RY - 0.03, G + RH + 0.025), (cx, RY - 0.15, G + RH + 0.03), 0.014, r2=0.011, segs=10, outline=0.002)
        cyl(f'carriage{j}', M['dark'], 0.022, 0.03, segs=10, outline=0.001, matrix=Matrix.Translation((cx, RY - 0.03, G + RH + 0.012)) @ Matrix.Rotation(math.pi / 2, 4, 'Y'))
for j in range(5):
    box(f'embrasure{j}', M['dark'], -0.7 + j * 0.3, RY - 0.113, G + 0.06, 0.04, 0.006, 0.04, outline=0, bevel=0)

# ---------- the bastion tower ----------
BX = 0.72
box('bastion', M['wall'], BX, RY + 0.02, G - 0.005, 0.24, 0.26, 0.32, outline=0.008, bevel=0)
for sx in (-1, 1):
    for sy in (-1, 1):
        box(f'bastionmerlon{sx}{sy}', M['wallDark'], BX + sx * 0.1, RY + 0.02 + sy * 0.11, G + 0.315, 0.04, 0.04, 0.05, outline=0.001, bevel=0)
box('bastionslit', M['dark'], BX, RY - 0.113, G + 0.2, 0.02, 0.006, 0.06, outline=0, bevel=0)
box('turret', M['wall'], BX - 0.08, RY - 0.08, G + 0.315, 0.06, 0.06, 0.08, outline=0.003, bevel=0)

# ---------- the medina ----------
for k in range(14):
    x = -0.8 + (k % 7) * 0.24 + rng.uniform(-0.03, 0.03)
    y = 0.05 + (k // 7) * 0.28 + rng.uniform(-0.03, 0.03)
    if math.hypot(x, y) > 1.05:
        continue
    h = rng.uniform(0.12, 0.2)
    box(f'house{k}', M['white'], x, y, G - 0.005, 0.2, 0.2, h, outline=0.005, bevel=0)
    for j in range(2):
        box(f'shutter{k}{j}', M['blue'], x - 0.05 + j * 0.1, y - 0.103, G + h * 0.55, 0.035, 0.006, 0.045, outline=0, bevel=0)
    box(f'door{k}', M['blue'], x, y - 0.103, G - 0.005, 0.04, 0.006, 0.07, outline=0, bevel=0)

# ---------- the blue boats ----------
for k, (x, y, a) in enumerate(((-0.55, -0.68, 0.2), (-0.25, -0.78, -0.1), (0.1, -0.7, 0.15), (0.4, -0.8, -0.2), (-0.05, -0.95, 0.05))):
    c, s_ = math.cos(a), math.sin(a)
    p = lambda u, v, z: (x + u * c - v * s_, y + u * s_ + v * c, G + z)
    loft(f'boat{k}', M['blue'], [[p(-0.06, -0.025, 0.0), p(0.06, -0.025, 0.0), p(0.06, 0.025, 0.0), p(-0.06, 0.025, 0.0)],
                                 [p(-0.09, -0.04, 0.04), p(0.09, -0.04, 0.04), p(0.09, 0.04, 0.04), p(-0.09, 0.04, 0.04)]], outline=0.003)
    box(f'boatseat{k}', M['white'], x, y, G + 0.03, 0.03, 0.06, 0.012, rot_z=a, outline=0, bevel=0)

turn(before, -20)
render(G)
