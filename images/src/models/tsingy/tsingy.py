# A cartoon Tsingy de Bemaraha for the country maps, built in the set's shared look (../toon.py):
# Madagascar's forest of grey limestone needles, two jagged clusters of them rising from their rock
# with the green canyon forest between, a rope bridge slung from spire to spire across the gap, and
# a white sifaka lemur sitting at its end. Turned a little towards the camera.
# Run: blender -b --factory-startup -P tsingy.py -- tsingy-1024.png 1024 tsingy.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'lime': toon('lime', '#a7acb2', shadow_mul=(0.76, 0.78, 0.88)),
    'limeLight': toon('limeLight', '#c3c7cc', shadow_mul=(0.76, 0.78, 0.88)),
    'rock': toon('rock', '#8e9399', shadow_mul=(0.76, 0.78, 0.88)),
    'forest': toon('forest', '#3f8a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'forestLight': toon('forestLight', '#5aa652', shadow_mul=(0.7, 0.78, 0.8)),
    'plank': toon('plank', '#9a6b43'),
    'rope': flat('rope', '#6b4a33'),
    'fur': toon('fur', '#f6f3ec', shadow_mul=(0.8, 0.8, 0.9), lift=0.2),
    'face': flat('face', '#2a2530'),
})

G = tile(M['forestLight'])
before = set(bpy.data.objects)
rng = random.Random(151)


def needle(name, x, y, h, r, sides=6):
    """A jagged limestone needle: a rough, twisting point."""
    rings = []
    for z, s in ((0.0, 1.0), (0.3, 0.72), (0.6, 0.45), (0.85, 0.2)):
        twist = rng.uniform(0, 1)
        rings.append([(x + r * s * (1 + rng.uniform(-0.22, 0.22)) * math.cos(2 * math.pi * (k + twist) / sides),
                       y + r * s * (1 + rng.uniform(-0.22, 0.22)) * math.sin(2 * math.pi * (k + twist) / sides), G - 0.01 + h * z) for k in range(sides)])
    tx, ty = x + rng.uniform(-0.01, 0.01), y + rng.uniform(-0.01, 0.01)
    rings.append([(tx + 0.004 * math.cos(2 * math.pi * k / sides), ty + 0.004 * math.sin(2 * math.pi * k / sides), G - 0.01 + h) for k in range(sides)])
    ob = loft(name, M[rng.choice(('lime', 'lime', 'limeLight'))], rings, outline=0.016)
    ob.visible_shadow = False
    return ob


def cluster(name, cx, cy, spread, count, tallest):
    rock = loft(f'{name}rock', M['rock'], [[(cx + spread * 1.15 * math.cos(2 * math.pi * k / 12) * (1 + rng.uniform(-0.08, 0.08)),
                                             cy + spread * 0.85 * math.sin(2 * math.pi * k / 12) * (1 + rng.uniform(-0.08, 0.08)), G - 0.01)
                                            for k in range(12)],
                                           [(cx + spread * 1.0 * math.cos(2 * math.pi * k / 12), cy + spread * 0.72 * math.sin(2 * math.pi * k / 12), G + 0.1)
                                            for k in range(12)]], outline=0.025)
    rock.visible_shadow = False
    spots = []
    for k in range(count):
        a = rng.uniform(0, 2 * math.pi)
        d = spread * math.sqrt(rng.uniform(0, 1)) * 0.9
        x, y = cx + d * math.cos(a), cy + d * 0.72 * math.sin(a)
        h = tallest * (1 - 0.55 * d / spread) * rng.uniform(0.75, 1.0)
        needle(f'{name}needle{k}', x, y, h, rng.uniform(0.07, 0.11))
        spots.append((x, y, h))
    return spots


# ---------- two clusters of needles with the canyon forest between ----------
LX, LY, RX_, RY_ = -0.6, 0.15, 0.6, 0.2
left = cluster('left', LX, LY, 0.5, 16, 1.0)
right = cluster('right', RX_, RY_, 0.5, 16, 1.05)
cluster('back', 0.0, 0.95, 0.38, 9, 0.75)
for k in range(14):
    x = rng.uniform(-0.25, 0.25)
    y = rng.uniform(-1.0, 0.7)
    ball(f'canyon{k}', M[rng.choice(('forest', 'forestLight'))], x, y, G + rng.uniform(0.06, 0.14), rng.uniform(0.09, 0.13), outline=0.018)
for k, (x, y) in enumerate(((-0.9, -0.65), (-0.5, -0.85), (0.55, -0.8), (0.95, -0.55), (-1.15, 0.2), (1.2, 0.1))):
    ball(f'tree{k}', M['forest'], x, y, G + 0.1, 0.11, outline=0.018)

# ---------- the rope bridge across the gap ----------
A = Vector((-0.22, 0.12, G + 0.62))
B = Vector((0.24, 0.16, G + 0.62))
for k, p in enumerate((A, B)):
    needle(f'anchor{k}', p.x, p.y, p.z - G + 0.06, 0.09)
    box(f'platform{k}', M['plank'], p.x, p.y, p.z - 0.01, 0.1, 0.1, 0.02, outline=0.008, bevel=0)
N = 12


def along(t, lift=0.0, side=0.0):
    p = A.lerp(B, t)
    d = (B - A).normalized()
    n = Vector((-d.y, d.x, 0))
    return p + n * side + Vector((0, 0, lift - 0.09 * math.sin(math.pi * t)))


for k in range(1, N):
    t = k / N
    p = along(t)
    box(f'plank{k}', M['plank'], p.x, p.y, p.z, 0.03, 0.09, 0.01, rot_z=math.atan2(B.y - A.y, B.x - A.x), outline=0.004, bevel=0)
for side in (-0.045, 0.045):
    for k in range(N):
        rod(f'rope{side}{k}', M['rope'], along(k / N, 0.06, side), along((k + 1) / N, 0.06, side), 0.004, segs=4, outline=0)
    for k in range(0, N + 1, 2):
        rod(f'hanger{side}{k}', M['rope'], along(k / N, 0.0, side), along(k / N, 0.06, side), 0.003, segs=4, outline=0)

# ---------- a white sifaka sitting at the bridge's end ----------
LZ = A.z + 0.01
lx, ly = A.x - 0.02, A.y - 0.02
s = ball('sifakabody', M['fur'], 0, 0, 0, 0.04, outline=0.01)
s.scale = (0.85, 0.85, 1.35)
s.location = (lx, ly, LZ + 0.05)
ball('sifakahead', M['fur'], lx, ly - 0.005, LZ + 0.12, 0.028, outline=0.008)
ball('sifakaface', M['face'], lx - 0.012, ly - 0.022, LZ + 0.115, 0.014, outline=0)
rod('sifakatail', M['fur'], (lx + 0.02, ly + 0.02, LZ + 0.02), (lx + 0.03, ly + 0.04, LZ - 0.13), 0.012, r2=0.008, segs=8, outline=0.005)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
