# A cartoon Sigiriya (Lion Rock) for the country maps, built in the set's shared look
# (../toon.py): the great monolith rising sheer from the jungle, flat on top with its green
# summit, the lion terrace at its foot with the two huge stone paws either side of the stairs,
# and the water gardens in front. Turned a little towards the camera.
# Run: blender -b --factory-startup -P sigiriya.py -- sigiriya-1024.png 1024 sigiriya.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'rock': toon('rock', '#8f6f5a', shadow_mul=(0.78, 0.72, 0.78)),
    'rockDark': toon('rockDark', '#6f5546', shadow_mul=(0.78, 0.72, 0.78)),
    'summit': toon('summit', '#6fae55', shadow_mul=(0.7, 0.78, 0.8)),
    'jungle': toon('jungle', '#3f8a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'terrace': toon('terrace', '#c9b08a'),
    'paw': toon('paw', '#bfa27c'),
    'stairs': toon('stairs', '#e0cfae'),
    'water': toon('water', '#4aa6dc', shadow_mul=(0.75, 0.82, 0.9), lift=0.35),
    'trunk': toon('trunk', '#7a5238'),
})

G = tile()
before = set(bpy.data.objects)
rng = random.Random(7)


def ring(cx, cy, r, z, jitter, sides=13, squash=0.8):
    return [(cx + r * (1 + rng.uniform(-jitter, jitter)) * math.cos(2 * math.pi * k / sides),
             cy + r * squash * (1 + rng.uniform(-jitter, jitter)) * math.sin(2 * math.pi * k / sides), G + z) for k in range(sides)]


# ---------- the rock: sheer sides, a little bulge, a flat top ----------
RX, RY, H = 0.05, 0.42, 1.1
rock = loft('lionrock', M['rock'], [ring(RX, RY, 0.66, -0.01, 0.04), ring(RX, RY, 0.7, H * 0.3, 0.05), ring(RX, RY, 0.66, H * 0.65, 0.05),
                                    ring(RX, RY, 0.56, H * 0.92, 0.04), ring(RX, RY, 0.5, H, 0.0)], outline=0.04)
rock.visible_shadow = False
# dark streaks down its face, and the green summit
for k in range(6):
    a = math.radians(225 + k * 18)
    x, y = RX + 0.68 * math.cos(a), RY + 0.55 * math.sin(a)
    box(f'streak{k}', M['rockDark'], x, y, G + H * rng.uniform(0.25, 0.45), 0.04, 0.03, H * rng.uniform(0.3, 0.45),
        rot_z=a + math.pi / 2, outline=0, bevel=0)
cap = loft('summit', M['summit'], [ring(RX, RY, 0.5, H - 0.005, 0.0), ring(RX, RY, 0.46, H + 0.035, 0.05), ring(RX, RY, 0.3, H + 0.06, 0.05)],
           outline=0.025)
cap.visible_shadow = False

# ---------- the lion terrace: two great paws either side of the stairs ----------
TY = RY - 0.48
box('terrace', M['terrace'], RX, TY, G - 0.005, 0.7, 0.32, 0.14, outline=0.025, bevel=0.008)
for k in range(6):
    box(f'stair{k}', M['stairs'], RX, TY - 0.08 + k * 0.05, G + 0.14 + k * 0.05, 0.14, 0.08, 0.05, outline=0.01, bevel=0)
for side in (-1, 1):
    px = RX + side * 0.2
    box(f'paw{side}', M['paw'], px, TY - 0.05, G + 0.13, 0.17, 0.22, 0.12, outline=0.02, bevel=0.03)
    for c in (-0.05, 0.0, 0.05):
        ball(f'claw{side}{c}', M['paw'], px + c, TY - 0.165, G + 0.16, 0.03, outline=0.01)

# ---------- the water gardens in front ----------
box('gardenpath', M['path'], RX, -0.92, G - 0.006, 0.16, 0.6, 0.02, outline=0.012, bevel=0)
for side in (-1, 1):
    box(f'pool{side}', M['water'], RX + side * 0.3, -0.9, G - 0.005, 0.34, 0.32, 0.022, outline=0.012, bevel=0)

# ---------- jungle round the rock's foot ----------
for k, (x, y, r) in enumerate(((-0.92, 0.1, 0.17), (-0.75, -0.42, 0.15), (0.92, 0.0, 0.17), (0.8, -0.48, 0.14), (-1.0, 0.62, 0.15),
                               (1.0, 0.62, 0.16), (-0.5, -0.75, 0.12), (0.62, -0.82, 0.12))):
    rod(f'trunk{k}', M['trunk'], (x, y, G), (x, y, G + 0.12), 0.025, segs=8, outline=0.012)
    ball(f'tree{k}', M['jungle'], x, y, G + 0.18, r, outline=0.022)

turn(before, -20)
render(G)
