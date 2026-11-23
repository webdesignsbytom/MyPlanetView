# A cartoon Dakhla Bay for the country maps, built in the set's shared look (../toon.py): the
# turquoise lagoon of Dakhla, the Saharan dunes along its shore and the white dune of Dragon Island,
# kitesurfers under their curved kites, a kite camp's cabins, and a camel. Turned a little towards
# the camera.
# Run: blender -b --factory-startup -P dakhla.py -- dakhla-1024.png 1024 dakhla.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'lagoon': toon('lagoon', '#3ec4c4', shadow_mul=(0.74, 0.84, 0.88), lift=0.35),
    'sand': toon('sand', '#e8c486', shadow_mul=(0.86, 0.78, 0.72), lift=0.25),
    'dune': toon('dune', '#dcb070', shadow_mul=(0.86, 0.78, 0.72), lift=0.2),
    'whitedune': toon('whitedune', '#f6efde', shadow_mul=(0.84, 0.82, 0.88), lift=0.2),
    'cabin': toon('cabin', '#f8f6f0', shadow_mul=(0.8, 0.82, 0.92), lift=0.2),
    'door': toon('door', '#3f7fc0'),
    'camel': toon('camel', '#c8965a', shadow_mul=(0.86, 0.76, 0.7)),
    'board': toon('board', '#f8f6f0', lift=0.2),
    'wetsuit': toon('wetsuit', '#2e2a30'),
    'skin': toon('skin', '#c08a64'),
    'k0': toon('k0', '#e8402c'), 'k1': toon('k1', '#f0c030'), 'k2': toon('k2', '#7a3ac0'),
    'line': flat('line', '#4a4650'),
})

G = tile(M['lagoon'])
before = set(bpy.data.objects)
rng = random.Random(1097)


def squashed(name, mat, x, y, z, r, sx, sy, sz, outline=0.02):
    b = ball(name, mat, 0, 0, 0, r, outline=outline)
    b.scale = (sx, sy, sz)
    b.location = (x, y, z)
    return b


def segment(c, r, z, n=22):
    a0 = math.asin(c / r)
    return [(r * math.cos(a), r * math.sin(a), G + z) for a in (a0 + (math.pi - 2 * a0) * j / (n - 1) for j in range(n))]


def ring(cx, cy, rx, ry, z, k, sides=20):
    return [(cx + rx * math.cos(t) * (1 + 0.06 * math.sin(3 * t + k)), cy + ry * math.sin(t) * (1 + 0.06 * math.cos(2 * t + k)), G + z) for t in (2 * math.pi * j / sides for j in range(sides))]


# ---------- the shore and the dunes at the back ----------
shore = loft('shore', M['sand'], [segment(0.3, 1.4, -0.01), segment(0.36, 1.37, 0.05)], outline=0.014)
shore.visible_shadow = False
for k, (x, y, rx, ry, h) in enumerate(((-0.5, 0.9, 0.48, 0.26, 0.22), (0.25, 1.0, 0.42, 0.2, 0.16), (-0.95, 0.55, 0.25, 0.16, 0.12))):
    d = loft(f'dune{k}', M['dune'], [ring(x, y, rx, ry, 0.04, k), ring(x + 0.04, y + 0.02, rx * 0.6, ry * 0.55, h * 0.7, k), ring(x + 0.06, y + 0.03, rx * 0.2, ry * 0.2, h, k)],
             outline=0.014, smooth=True)
    d.visible_shadow = False

# ---------- Dragon Island's white dune in the lagoon ----------
w = loft('dragonisland', M['whitedune'], [ring(-0.45, -0.1, 0.36, 0.2, -0.01, 4), ring(-0.42, -0.08, 0.22, 0.12, 0.09, 4), ring(-0.4, -0.07, 0.08, 0.05, 0.13, 4)],
         outline=0.014, smooth=True)
w.visible_shadow = False

# ---------- the kite camp's cabins and a camel ----------
for k in range(3):
    x, y = 0.55 + k * 0.17, 0.5 + k * 0.06
    box(f'cabin{k}', M['cabin'], x, y, G + 0.045, 0.12, 0.1, 0.08, outline=0.007, bevel=0)
    box(f'cabindoor{k}', M['door'], x, y - 0.052, G + 0.05, 0.035, 0.006, 0.055, outline=0, bevel=0)
CX, CY, CZ = 0.05, 0.55, G + 0.05
for fx in (-0.06, 0.06):
    for side in (-1, 1):
        rod(f'camelleg{fx}{side}', M['camel'], (CX + fx, CY + side * 0.025, CZ), (CX + fx, CY + side * 0.025, CZ + 0.13), 0.011, segs=6, outline=0.004)
squashed('camelbody', M['camel'], CX, CY, CZ + 0.16, 0.06, 1.55, 0.85, 0.75, outline=0.01)
ball('camelhump', M['camel'], CX - 0.005, CY, CZ + 0.2, 0.042, outline=0.008)
rod('camelneck', M['camel'], (CX + 0.08, CY, CZ + 0.16), (CX + 0.13, CY, CZ + 0.25), 0.018, segs=8, outline=0.005)
squashed('camelhead', M['camel'], CX + 0.15, CY, CZ + 0.26, 0.025, 1.6, 0.85, 0.8, outline=0.006)
rod('cameltail', M['camel'], (CX - 0.09, CY, CZ + 0.17), (CX - 0.1, CY, CZ + 0.1), 0.006, segs=5, outline=0.002)


# ---------- kitesurfers under their kites ----------
def kitesurfer(name, x, y, mat, kx, ky, kz, a, S=1.6):
    box(f'{name}board', M['board'], x, y, G - 0.002, 0.1 * S, 0.03 * S, 0.01 * S, rot_z=a, outline=0.004, bevel=0)
    rod(f'{name}legs', M['wetsuit'], (x, y, G + 0.008 * S), (x - 0.01 * S, y, G + 0.06 * S), 0.011 * S, segs=6, outline=0.003)
    rod(f'{name}body', M['wetsuit'], (x - 0.01 * S, y, G + 0.06 * S), (x - 0.025 * S, y, G + 0.11 * S), 0.014 * S, segs=6, outline=0.003)
    ball(f'{name}head', M['skin'], x - 0.03 * S, y, G + 0.128 * S, 0.016 * S, outline=0.003)
    hand = (x + 0.01 * S, y, G + 0.095 * S)
    rod(f'{name}arm', M['wetsuit'], (x - 0.022 * S, y, G + 0.1 * S), hand, 0.006 * S, segs=5, outline=0.002)
    pts = []
    for j in range(7):
        t = -1.25 + 2.5 * j / 6
        pts.append((kx + 0.15 * S * math.sin(t), ky, kz + 0.07 * S * math.cos(t)))
    for j in range(6):
        bar(f'{name}kite{j}', mat, pts[j], pts[j + 1], 0.05 * S, outline=0.006)
    for end in (pts[0], pts[-1]):
        rod(f'{name}line{end[0]:.2f}', M['line'], hand, (end[0], end[1], end[2] - 0.02), 0.0025, segs=4, outline=0)


kitesurfer('ks0', 0.1, -0.5, M['k0'], 0.42, -0.45, G + 0.62, 0.4)
kitesurfer('ks1', -0.7, -0.6, M['k1'], -0.45, -0.55, G + 0.52, -0.3)
kitesurfer('ks2', 0.62, -0.05, M['k2'], 0.85, 0.0, G + 0.5, 0.2)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
