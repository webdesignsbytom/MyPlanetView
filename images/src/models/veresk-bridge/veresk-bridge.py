# A cartoon Veresk Bridge for the country maps, built in the set's shared look (../toon.py): the
# Trans-Iranian Railway's famous bridge high in the Alborz mountains, its great stone arch leaping
# across the deep gorge between the rock walls with the smaller arches at its ends, the line running
# out of the tunnels on both sides, a train crossing high above the stream far below. Turned a
# little towards the camera.
# Run: blender -b --factory-startup -P veresk-bridge.py -- veresk-bridge-1024.png 1024 veresk-bridge.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'valley': toon('valley', '#9aa878', shadow_mul=(0.78, 0.78, 0.82), lift=0.15),
    'rock': toon('rock', '#a89a86', shadow_mul=(0.8, 0.78, 0.84)),
    'stone': toon('stone', '#d4c4a4', shadow_mul=(0.82, 0.8, 0.86), lift=0.15),
    'water': toon('water', '#4a9ab0', lift=0.3),
    'rail': toon('rail', '#5a5e66'),
    'loco': toon('loco', '#3a3e46'),
    'carRed': toon('carRed', '#b8402e', lift=0.12),
    'carGreen': toon('carGreen', '#3a7a5a', lift=0.12),
    'dark': flat('dark', '#2e2a2a'),
    'shrub': toon('shrub', '#6a8a4a', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['valley'])
before = set(bpy.data.objects)


def vstrip(x0, x1, r, z):
    a0, a1 = math.acos(x1 / r), math.acos(x0 / r)
    bottom = [(r * math.cos(-a1 + (a1 - a0) * k / 12), r * math.sin(-a1 + (a1 - a0) * k / 12), z) for k in range(13)]
    top = [(r * math.cos(a0 + (a1 - a0) * k / 12), r * math.sin(a0 + (a1 - a0) * k / 12), z) for k in range(13)]
    return bottom + top


# ---------- the gorge: two rock walls and the stream ----------
GW, DZ = 0.36, G + 0.52
for s in (-1, 1):
    x0, x1 = (GW, 1.31) if s > 0 else (-1.31, -GW)
    wall = loft(f'gorgewall{s}', M['rock'], [vstrip(x0, x1, 1.32, G - 0.01), vstrip(x0, x1, 1.32, DZ - 0.04)], outline=0.007)
    wall.visible_shadow = False
    for j in range(4):
        b = ball(f'shrub{s}{j}', M['shrub'], 0, 0, 0, 0.05, outline=0.005)
        b.scale = (1.2, 1.0, 0.5)
        b.location = (s * (0.5 + 0.1 * j), 0.55 - 0.3 * j, DZ - 0.035)
loft('stream', M['water'], [vstrip(-0.12, 0.12, 1.32, G - 0.004), vstrip(-0.12, 0.12, 1.32, G + 0.008)], outline=0.002)

# ---------- the bridge: the great arch, filled to the deck in slices ----------
AY, AD = 0.0, 0.1
SPRING, RISE = G + 0.05, 0.34
N = 18
for j in range(N):
    u = (j + 0.5) / N
    x = -GW + 2 * GW * u
    z = SPRING + RISE * math.sqrt(max(0.0, 1 - (2 * u - 1) ** 2))
    box(f'archslice{j}', M['stone'], x, AY, z, 2 * GW / N + 0.002, AD, DZ - z, outline=0.003, bevel=0)
# the arch's ring and the little arches over its haunches
for s in (-1, 1):
    for k in range(2):
        cx = s * (0.12 + k * 0.1)
        cz = DZ - 0.07
        cyl(f'spandrel{s}{k}', M['dark'], 0.028, 0.006, segs=10, outline=0, matrix=Matrix.Translation((cx, AY - AD / 2 - 0.004, cz)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
        box(f'spandrelopen{s}{k}', M['dark'], cx, AY - AD / 2 - 0.004, cz - 0.05, 0.056, 0.006, 0.05, outline=0, bevel=0)
box('deck', M['stone'], 0.0, AY, DZ - 0.005, 2 * GW, AD + 0.02, 0.03, outline=0.004, bevel=0)
for s in (-1, 1):
    bar(f'parapet{s}', M['stone'], (-GW, AY + s * (AD / 2 + 0.005), DZ + 0.04), (GW, AY + s * (AD / 2 + 0.005), DZ + 0.04), 0.012, outline=0.002)
# the track, running across the plateaus into the tunnels in the rocky knolls
for s in (-1, 1):
    bar(f'rail{s}', M['rail'], (-0.82, AY + s * 0.02, DZ + 0.03), (0.82, AY + s * 0.02, DZ + 0.03), 0.006, outline=0)
for s in (-1, 1):
    box(f'ballast{s}', M['stone'], s * (GW + 0.23), AY, DZ - 0.045, 0.46, AD, 0.07, outline=0.003, bevel=0)
    knoll = lathe(f'knoll{s}', M['rock'], ((0.3, 0), (0.24, 0.12), (0.12, 0.24), (0.0, 0.27)), DZ - 0.045, s * 0.98, AY, segs=24, outline=0.006)
    knoll.visible_shadow = False
    box(f'portal{s}', M['stone'], s * 0.72, AY, DZ - 0.045, 0.04, 0.16, 0.17, outline=0.004, bevel=0)
    box(f'tunnel{s}', M['dark'], s * 0.698, AY, DZ + 0.02, 0.006, 0.08, 0.06, outline=0, bevel=0)
    cyl(f'tunneltop{s}', M['dark'], 0.04, 0.006, segs=12, outline=0, matrix=Matrix.Translation((s * 0.698, AY, DZ + 0.08)) @ Matrix.Rotation(math.pi / 2, 4, 'Y'))

# ---------- the train crossing ----------
TZ = DZ + 0.035
box('loco', M['loco'], 0.14, AY, TZ, 0.14, 0.06, 0.06, outline=0.003, bevel=0)
box('cab', M['loco'], 0.1, AY, TZ + 0.055, 0.06, 0.06, 0.04, outline=0.002, bevel=0)
rod('chimney', M['loco'], (0.19, AY, TZ + 0.055), (0.19, AY, TZ + 0.085), 0.01, segs=8, outline=0.001)
for k, (x, mat) in enumerate(((-0.02, 'carRed'), (-0.17, 'carGreen'))):
    box(f'car{k}', M[mat], x, AY, TZ, 0.13, 0.06, 0.07, outline=0.003, bevel=0)
    for j in range(3):
        box(f'carwin{k}{j}', M['dark'], x - 0.04 + j * 0.04, AY - 0.031, TZ + 0.035, 0.025, 0.004, 0.02, outline=0, bevel=0)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
