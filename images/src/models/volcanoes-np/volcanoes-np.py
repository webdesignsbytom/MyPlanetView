# A cartoon Volcanoes National Park for the country maps, built in the set's shared look
# (../toon.py): the Virunga volcanoes behind, forested up their sides, Bisoke with the lake in its
# crater and mist drifting on their flanks; bamboo at the forest edge; and in front a family of
# mountain gorillas: the big silverback sitting, and a mother with her baby on her back.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P volcanoes-np.py -- volcanoes-np-1024.png 1024 volcanoes-np.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'meadow': toon('meadow', '#7cbf5a', shadow_mul=(0.7, 0.78, 0.8), lift=0.25),
    'slope': toon('slope', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'heath': toon('heath', '#7f9a6a', shadow_mul=(0.74, 0.8, 0.8)),
    'rock': toon('rock', '#7f7a74', shadow_mul=(0.78, 0.78, 0.86)),
    'lake': toon('lake', '#4aa6dc', shadow_mul=(0.75, 0.82, 0.9), lift=0.35),
    'mist': toon('mist', '#f4f6f8', shadow_mul=(0.82, 0.85, 0.95), lift=0.1),
    'bamboo': toon('bamboo', '#9ac05a', shadow_mul=(0.72, 0.8, 0.76)),
    'leaf': toon('leaf', '#5aa652', shadow_mul=(0.7, 0.78, 0.8)),
    'fur': toon('fur', '#4a4552', shadow_mul=(0.8, 0.8, 0.9), lift=0.3),
    'silver': toon('silver', '#b4b4c0', shadow_mul=(0.8, 0.8, 0.9), lift=0.25),
    'face': toon('face', '#7a7280', shadow_mul=(0.8, 0.8, 0.9), lift=0.25),
    'brow': toon('brow', '#3a3640', lift=0.25),
    'eye': flat('eye', '#1a161c'),
    'shine': flat('shine', '#ffffff'),
})

G = tile(M['meadow'])
before = set(bpy.data.objects)
rng = random.Random(223)


def ring(cx, cy, rx, ry, z, jitter, sides=16):
    return [(cx + rx * (1 + rng.uniform(-jitter, jitter)) * math.cos(2 * math.pi * k / sides),
             cy + ry * (1 + rng.uniform(-jitter, jitter)) * math.sin(2 * math.pi * k / sides), G + z) for k in range(sides)]


def squashed(name, mat, x, y, z, r, sx, sy, sz, outline=0.02):
    b = ball(name, mat, 0, 0, 0, r, outline=outline)
    b.scale = (sx, sy, sz)
    b.location = (x, y, z)
    return b


# ---------- the volcanoes ----------
def volcano(name, cx, cy, r, h, crater=False):
    body = loft(name, M['slope'], [ring(cx, cy, r, r * 0.6, -0.01, 0.02), ring(cx, cy, r * 0.66, r * 0.4, h * 0.45, 0.05),
                                   ring(cx, cy, r * 0.4, r * 0.24, h * 0.75, 0.05)], outline=0.035)
    top_r = 0.18 if crater else 0.02
    cap = loft(name + 'top', M['heath'], [ring(cx, cy, r * 0.41, r * 0.245, h * 0.74, 0.03), ring(cx, cy, top_r, top_r * 0.6, h, 0.04)],
               outline=0.025)
    body.visible_shadow = cap.visible_shadow = False
    if crater:
        cyl(name + 'lake', M['lake'], top_r * 0.8, 0.01, segs=20, outline=0.008,
            matrix=Matrix.Translation((cx, cy, G + h + 0.002)) @ Matrix.Scale(0.6, 4, (0, 1, 0)))
    for k in range(7):
        a = 2 * math.pi * k / 7 + rng.uniform(-0.2, 0.2)
        t = rng.uniform(0.1, 0.5)
        rr = r * (1 - 0.65 * t)
        ball(f'{name}tree{k}', M['leaf'], cx + rr * math.cos(a), cy + rr * 0.6 * math.sin(a), G + h * t * 0.9 + 0.02, r * 0.14, outline=0.016)


volcano('karisimbi', -0.4, 0.82, 0.55, 1.15)
volcano('bisoke', 0.5, 0.85, 0.45, 0.85, crater=True)
for k, (x, y, z, r) in enumerate(((-0.1, 0.7, 0.42, 0.12), (0.08, 0.72, 0.45, 0.1), (-0.25, 0.75, 0.48, 0.09), (0.85, 0.6, 0.32, 0.09))):
    ball(f'mist{k}', M['mist'], x, y, G + z, r, outline=0.018)

# ---------- bamboo at the forest edge ----------
for c, (cx, cy) in enumerate(((-0.95, 0.15), (1.0, 0.1), (-0.75, 0.45), (0.85, 0.45))):
    for k in range(6):
        x, y = cx + rng.uniform(-0.1, 0.1), cy + rng.uniform(-0.08, 0.08)
        h = rng.uniform(0.35, 0.55)
        rod(f'bamboo{c}{k}', M['bamboo'], (x, y, G), (x + rng.uniform(-0.03, 0.03), y, G + h), 0.012, segs=6, outline=0.004)
        squashed(f'bambooleaf{c}{k}', M['leaf'], x, y, G + h, 0.05, 1.4, 1.0, 0.5, outline=0.008)


# ---------- the silverback, sitting ----------
def gorilla(name, x, y, s, facing, silverback=False, baby=False):
    a = math.radians(facing)
    fx, fy = math.cos(a), math.sin(a)          # the way it faces
    px, py = -fy, fx                           # across it
    squashed(f'{name}body', M['fur'], x, y, G + 0.17 * s, 0.16 * s, 1.0, 1.0, 1.15, outline=0.02)
    if silverback:
        squashed(f'{name}saddle', M['silver'], x - fx * 0.06 * s, y - fy * 0.06 * s, G + 0.2 * s, 0.13 * s, 0.9, 0.9, 1.0, outline=0.014)
    squashed(f'{name}head', M['fur'], x + fx * 0.06 * s, y + fy * 0.06 * s, G + 0.37 * s, 0.085 * s, 1.0, 1.0, 1.3 if silverback else 1.05, outline=0.016)
    squashed(f'{name}face', M['face'], x + fx * 0.11 * s, y + fy * 0.11 * s, G + 0.35 * s, 0.06 * s, 0.75, 1.15, 1.05, outline=0.008)
    squashed(f'{name}muzzle', M['face'], x + fx * 0.15 * s, y + fy * 0.15 * s, G + 0.325 * s, 0.035 * s, 0.9, 1.3, 0.8, outline=0.006)
    squashed(f'{name}brow', M['brow'], x + fx * 0.14 * s, y + fy * 0.14 * s, G + 0.385 * s, 0.03 * s, 0.6, 1.9, 0.45, outline=0.005)
    for side in (-1, 1):
        ex, ey = x + fx * 0.165 * s + px * side * 0.022 * s, y + fy * 0.165 * s + py * side * 0.022 * s
        ball(f'{name}eye{side}', M['eye'], ex, ey, G + 0.36 * s, 0.011 * s, outline=0)
        ball(f'{name}shine{side}', M['shine'], ex + fx * 0.008 * s, ey + fy * 0.008 * s, G + 0.364 * s, 0.004 * s, outline=0)
        # the long arms down to the knuckles
        sx, sy = x + px * side * 0.15 * s + fx * 0.03 * s, y + py * side * 0.15 * s + fy * 0.03 * s
        rod(f'{name}arm{side}', M['fur'], (sx, sy, G + 0.29 * s), (sx + fx * 0.09 * s + px * side * 0.02 * s, sy + fy * 0.09 * s + py * side * 0.02 * s, G + 0.03 * s), 0.048 * s, r2=0.036 * s, segs=10,
            outline=0.012)
        ball(f'{name}knuckle{side}', M['face'], sx + fx * 0.095 * s + px * side * 0.02 * s, sy + fy * 0.095 * s + py * side * 0.02 * s, G + 0.03 * s, 0.038 * s, outline=0.008)
        # the legs folded in front
        lx, ly = x + px * side * 0.08 * s, y + py * side * 0.08 * s
        squashed(f'{name}leg{side}', M['fur'], lx + fx * 0.08 * s, ly + fy * 0.08 * s, G + 0.05 * s, 0.065 * s, 1.3, 1.0, 0.75, outline=0.012)
    if baby:
        bx, by = x - fx * 0.08 * s, y - fy * 0.08 * s
        squashed(f'{name}baby', M['fur'], bx, by, G + 0.33 * s, 0.07 * s, 1.0, 1.0, 0.9, outline=0.012)
        ball(f'{name}babyhead', M['fur'], bx + px * 0.05 * s, by + py * 0.05 * s, G + 0.41 * s, 0.045 * s, outline=0.01)
        ball(f'{name}babyface', M['face'], bx + px * 0.05 * s + fx * 0.035 * s, by + py * 0.05 * s + fy * 0.035 * s, G + 0.405 * s, 0.025 * s,
             outline=0.005)


gorilla('silverback', -0.2, -0.3, 1.55, -150, silverback=True)
gorilla('mother', 0.45, -0.45, 1.1, -95, baby=True)
for k, (x, y) in enumerate(((-0.6, -0.75), (0.1, -0.95), (0.85, -0.55))):
    squashed(f'shrub{k}', M['leaf'], x, y, G + 0.04, 0.09, 1.3, 1.0, 0.6, outline=0.014)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
