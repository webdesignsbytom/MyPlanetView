# A cartoon Múlafossur for the country maps, built in the set's shared look (../toon.py): the
# waterfall that pours off the cliff at Gásadalur, on Vágar, straight into the North Atlantic, the
# village's dark houses under turf roofs on the green clifftop, sheep, and the steep mountain behind.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P mulafossur.py -- mulafossur-1024.png 1024 mulafossur.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sea': toon('sea', '#2a6aa0', shadow_mul=(0.74, 0.82, 0.9), lift=0.3),
    'surf': toon('surf', '#f4f8fb', shadow_mul=(0.82, 0.86, 0.95), lift=0.1),
    'rock': toon('rock', '#5e5852', shadow_mul=(0.84, 0.84, 0.9)),
    'grass': toon('grass', '#6aa54a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'mountain': toon('mountain', '#5a9248', shadow_mul=(0.7, 0.78, 0.8)),
    'scree': toon('scree', '#8a8478', shadow_mul=(0.84, 0.84, 0.9)),
    'water': toon('water', '#d8eef8', shadow_mul=(0.82, 0.88, 0.96), lift=0.2),
    'stream': toon('stream', '#4a8ac0', lift=0.3),
    'tar': toon('tar', '#34323a', shadow_mul=(0.8, 0.8, 0.9), lift=0.15),
    'red': toon('red', '#a83a2c'),
    'turf': toon('turf', '#7ab05a', shadow_mul=(0.7, 0.78, 0.8)),
    'frame': toon('frame', '#f8f6f0', lift=0.2),
    'sheep': toon('sheep', '#f6f3ec', shadow_mul=(0.82, 0.82, 0.9), lift=0.2),
    'sheepface': toon('sheepface', '#3a3640'),
})

G = tile(M['sea'])
before = set(bpy.data.objects)
rng = random.Random(1109)


def segment(c, r, z, n=24):
    a0 = math.asin(c / r)
    return [(r * math.cos(a), r * math.sin(a), G + z) for a in (a0 + (math.pi - 2 * a0) * j / (n - 1) for j in range(n))]


def ring(cx, cy, rx, ry, z, k, sides=20):
    return [(cx + rx * math.cos(t) * (1 + 0.06 * math.sin(3 * t + k)), cy + ry * math.sin(t) * (1 + 0.06 * math.cos(2 * t + k)), G + z) for t in (2 * math.pi * j / sides for j in range(sides))]


# ---------- the sea cliff and the green clifftop ----------
cliff = loft('cliff', M['rock'], [segment(-0.12, 1.41, -0.01), segment(-0.1, 1.4, 0.36)], outline=0.02)
cliff.visible_shadow = False
top = loft('clifftop', M['grass'], [segment(-0.1, 1.4, 0.355), segment(-0.08, 1.38, 0.39)], outline=0.012)
top.visible_shadow = False
T = G + 0.39
for k in range(12):
    x = -1.2 + k * 0.22
    ball(f'cliffsurf{k}', M['surf'], x, -0.16 + 0.02 * math.sin(k), G + 0.004, rng.uniform(0.025, 0.035), outline=0.004)

# ---------- the mountain behind ----------
mt = loft('mountain', M['mountain'], [ring(-0.25, 0.82, 0.78, 0.42, 0.38, 1), ring(-0.2, 0.85, 0.48, 0.26, 0.66, 1), ring(-0.16, 0.88, 0.2, 0.12, 0.88, 1),
                                      ring(-0.14, 0.89, 0.04, 0.03, 0.92, 1)], outline=0.018, smooth=True)
mt.visible_shadow = False
for k, (x, z) in enumerate(((-0.45, 0.55), (0.05, 0.6), (-0.22, 0.75))):
    bar(f'scree{k}', M['scree'], (x, 0.55 + 0.1 * k, G + z - 0.1), (x + 0.04, 0.62 + 0.1 * k, G + z + 0.05), 0.05, outline=0.004)

# ---------- the stream and Múlafossur pouring off the edge into the sea ----------
WX = 0.38
box('stream', M['stream'], WX, 0.28, T - 0.004, 0.1, 0.72, 0.008, outline=0.003, bevel=0)
box('fall', M['water'], WX, -0.125, G - 0.005, 0.13, 0.04, 0.405, outline=0.008, bevel=0)
for k in range(7):
    a = math.radians(180 + k * 30)
    ball(f'fallfoam{k}', M['surf'], WX + 0.1 * math.cos(a), -0.15 + 0.05 * math.sin(a), G + 0.01, rng.uniform(0.035, 0.05), outline=0.005)


# ---------- the village: dark houses under turf roofs ----------
def house(name, x, y, w, d, h, wall):
    box(name, M[wall], x, y, T - 0.005, w, d, h, outline=0.008, bevel=0)
    loft(f'{name}turf', M['turf'], [[(x - w / 2 - 0.012, y - d / 2 - 0.012, T + h - 0.006), (x + w / 2 + 0.012, y - d / 2 - 0.012, T + h - 0.006),
                                     (x + w / 2 + 0.012, y + d / 2 + 0.012, T + h - 0.006), (x - w / 2 - 0.012, y + d / 2 + 0.012, T + h - 0.006)],
                                    [(x - w / 2 - 0.012, y - 0.004, T + h + 0.06), (x + w / 2 + 0.012, y - 0.004, T + h + 0.06), (x + w / 2 + 0.012, y + 0.004, T + h + 0.06),
                                     (x - w / 2 - 0.012, y + 0.004, T + h + 0.06)]], outline=0.007)
    for j in range(2):
        box(f'{name}win{j}', M['frame'], x - w / 4 + j * w / 2, y - d / 2 - 0.004, T + h * 0.35, 0.03, 0.006, 0.03, outline=0, bevel=0)


house('house0', -0.52, 0.2, 0.2, 0.12, 0.07, 'tar')
house('house1', -0.22, 0.12, 0.16, 0.11, 0.065, 'red')
house('house2', 0.02, 0.26, 0.18, 0.12, 0.07, 'tar')
house('house3', -0.75, 0.42, 0.15, 0.11, 0.06, 'tar')
house('house4', 0.7, 0.3, 0.16, 0.11, 0.065, 'red')

# ---------- sheep on the clifftop ----------
for k, (x, y) in enumerate(((-0.95, 0.12), (0.62, 0.05), (0.85, 0.15), (-0.35, 0.38))):
    ball(f'sheep{k}', M['sheep'], x, y, T + 0.035, 0.032, outline=0.006)
    ball(f'sheephead{k}', M['sheepface'], x + 0.032, y - 0.01, T + 0.04, 0.015, outline=0.002)

turn(before, -20)
render(G)
