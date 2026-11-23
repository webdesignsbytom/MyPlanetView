# A cartoon Wadi Rum for the country maps, built in the set's shared look (../toon.py): the red
# desert's great rock mountains rising sheer from the sand, their flanks streaked and eroded, a
# Bedouin camp of black goat-hair tents, camels resting, and a jeep on the sand.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P wadi-rum.py -- wadi-rum-1024.png 1024 wadi-rum.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sand': toon('redSand', '#e08a52', shadow_mul=(0.86, 0.76, 0.72), lift=0.25),
    'rock': toon('rock', '#b8603e', shadow_mul=(0.86, 0.74, 0.72)),
    'rockDark': toon('rockDark', '#985036', shadow_mul=(0.86, 0.74, 0.72)),
    'rockTop': toon('rockTop', '#d8a074', shadow_mul=(0.86, 0.78, 0.74)),
    'tent': toon('tent', '#2e2a30'),
    'rug': toon('rug', '#c8302a'),
    'camel': toon('camel', '#c8965a', shadow_mul=(0.86, 0.76, 0.7)),
    'jeep': toon('jeep', '#e8e2d4', lift=0.2),
    'tyre': toon('tyre', '#2e2a30'),
})

G = tile(M['sand'])
before = set(bpy.data.objects)
rng = random.Random(1669)


def ring(cx, cy, rx, ry, z, k, sides=18):
    return [(cx + rx * math.cos(t) * (1 + 0.08 * math.sin(3 * t + k)), cy + ry * math.sin(t) * (1 + 0.08 * math.cos(2 * t + k)), G + z) for t in (2 * math.pi * j / sides for j in range(sides))]


# ---------- the jebels ----------
for k, (x, y, rx, ry, h) in enumerate(((-0.55, 0.6, 0.45, 0.32, 0.62), (0.3, 0.75, 0.5, 0.3, 0.7), (0.95, 0.2, 0.28, 0.32, 0.48), (-1.0, 0.05, 0.22, 0.3, 0.4))):
    m = loft(f'jebel{k}', M['rock' if k % 2 else 'rockDark'], [ring(x, y, rx, ry, -0.01, k), ring(x, y, rx * 0.92, ry * 0.9, h * 0.8, k), ring(x, y, rx * 0.7, ry * 0.68, h, k)],
             outline=0.018)
    m.visible_shadow = False
    top = loft(f'jebeltop{k}', M['rockTop'], [ring(x, y, rx * 0.7, ry * 0.68, h - 0.005, k), ring(x, y, rx * 0.4, ry * 0.38, h + 0.06, k)], outline=0.01, smooth=True)
    top.visible_shadow = False
    for j in range(5):
        t = math.radians(210 + j * 25)
        bar(f'streak{k}{j}', M['rockDark' if k % 2 else 'rock'], (x + rx * 1.0 * math.cos(t), y + ry * 1.0 * math.sin(t), G + 0.02),
            (x + rx * 0.9 * math.cos(t), y + ry * 0.88 * math.sin(t), G + h * 0.78), 0.03, outline=0)

# ---------- the Bedouin camp ----------
for k, (x, y) in enumerate(((-0.3, -0.15), (0.05, -0.2))):
    loft(f'tent{k}', M['tent'], [[(x - 0.14, y - 0.07, G - 0.005), (x + 0.14, y - 0.07, G - 0.005), (x + 0.14, y + 0.07, G - 0.005), (x - 0.14, y + 0.07, G - 0.005)],
                                 [(x - 0.12, y - 0.03, G + 0.08), (x + 0.12, y - 0.03, G + 0.08), (x + 0.12, y + 0.03, G + 0.08), (x - 0.12, y + 0.03, G + 0.08)]], outline=0.006)
    box(f'rug{k}', M['rug'], x, y - 0.12, G - 0.004, 0.12, 0.06, 0.006, outline=0.002, bevel=0)


# ---------- camels resting, a jeep ----------
def camel(name, x, y, a, sitting=False):
    c, s = math.cos(a), math.sin(a)
    z = G + (0.04 if sitting else 0.12)
    if not sitting:
        for u in (-0.05, 0.05):
            for v in (-1, 1):
                rod(f'{name}leg{u}{v}', M['camel'], (x + u * c - v * 0.02 * s, y + u * s + v * 0.02 * c, G), (x + u * c - v * 0.02 * s, y + u * s + v * 0.02 * c, z), 0.01,
                    segs=6, outline=0.003)
    b = ball(f'{name}body', M['camel'], 0, 0, 0, 0.05, outline=0.007)
    b.scale = (1.5, 0.85, 0.75)
    b.rotation_euler = (0, 0, a)
    b.location = (x, y, z + 0.02)
    ball(f'{name}hump', M['camel'], x - 0.005 * c, y - 0.005 * s, z + 0.055, 0.035, outline=0.006)
    rod(f'{name}neck', M['camel'], (x + 0.07 * c, y + 0.07 * s, z + 0.02), (x + 0.11 * c, y + 0.11 * s, z + 0.1), 0.015, segs=8, outline=0.004)
    ball(f'{name}head', M['camel'], x + 0.125 * c, y + 0.125 * s, z + 0.105, 0.02, outline=0.004)


camel('camel0', 0.45, -0.45, 2.8, sitting=True)
camel('camel1', 0.62, -0.35, 2.6, sitting=True)
camel('camel2', -0.6, -0.55, 0.3)
JX, JY = 0.15, -0.75
box('jeep', M['jeep'], JX, JY, G + 0.03, 0.2, 0.1, 0.07, rot_z=0.2, outline=0.008, bevel=0)
box('jeepcab', M['jeep'], JX - 0.03, JY - 0.006, G + 0.1, 0.1, 0.09, 0.04, rot_z=0.2, outline=0.006, bevel=0)
for u in (-0.065, 0.065):
    for v in (-0.055, 0.055):
        cyl(f'wheel{u}{v}', M['tyre'], 0.03, 0.022, segs=14, outline=0.003,
            matrix=Matrix.Translation((JX + u * math.cos(0.2) - v * math.sin(0.2), JY + u * math.sin(0.2) + v * math.cos(0.2), G + 0.03)) @ Matrix.Rotation(0.2, 4, 'Z')
            @ Matrix.Rotation(math.pi / 2, 4, 'X'))

bpy.context.view_layer.update()
turn(before, -20)
render(G)
