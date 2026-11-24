# A cartoon Haeinsa for the country maps, built in the set's shared look (../toon.py): the temple on the
# slopes of Gayasan in Korea, its terraces climbing the mountainside: below, the main hall painted in
# the bright dancheong colours under its grey tiled roof, and on the top terrace the two long plain
# wooden halls of the Janggyeong Panjeon with their slatted windows, built to keep the Tripitaka
# Koreana's 81,000 printing blocks, and the pines and the mountain behind. Turned a little towards
# the camera.
# Run: blender -b --factory-startup -P haeinsa.py -- haeinsa-1024.png 1024 haeinsa.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'mountain': toon('mountain', '#4f8a44', shadow_mul=(0.7, 0.78, 0.8)),
    'granite': toon('granite', '#c8c4bc', shadow_mul=(0.82, 0.84, 0.9), lift=0.18),
    'wood': toon('wood', '#a07a56'),
    'woodDark': flat('woodDark', '#5e4630'),
    'plaster': toon('plaster', '#f0ebe0', lift=0.2),
    'red': toon('red', '#b8402e', lift=0.12),
    'green': toon('green', '#4a9a7a', lift=0.15),
    'roof': toon('roof', '#4a4e56', shadow_mul=(0.8, 0.82, 0.9)),
    'dark': flat('dark', '#2e2a2a'),
    'pine': toon('pine', '#3a6e3a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#8a5a3e'),
})

G = tile(M['grass'])
before = set(bpy.data.objects)

# ---------- the mountain behind ----------
mt = lathe('gayasan', M['mountain'], ((0.42, 0), (0.34, 0.2), (0.22, 0.42), (0.09, 0.53), (0.0, 0.55)), G - 0.01, 0.0, 0.92, segs=32, outline=0.008)
mt.visible_shadow = False


def hipped_roof(name, x, y, z0, hx, hy, h):
    loft(name, M['roof'], [[(x - hx, y - hy, z0), (x + hx, y - hy, z0), (x + hx, y + hy, z0), (x - hx, y + hy, z0)],
                           [(x - hx + 0.02, y - hy * 0.5, z0 + h * 0.5), (x + hx - 0.02, y - hy * 0.5, z0 + h * 0.5), (x + hx - 0.02, y + hy * 0.5, z0 + h * 0.5), (x - hx + 0.02, y + hy * 0.5, z0 + h * 0.5)],
                           [(x - hx + 0.06, y - 0.005, z0 + h), (x + hx - 0.06, y - 0.005, z0 + h), (x + hx - 0.06, y + 0.005, z0 + h), (x - hx + 0.06, y + 0.005, z0 + h)]], outline=0.005)


# ---------- the terraces ----------
T1, T2 = G + 0.08, G + 0.17
box('terrace1', M['granite'], 0.0, -0.1, G - 0.005, 1.2, 0.5, T1 - G + 0.005, outline=0.005, bevel=0)
box('terrace2', M['granite'], 0.0, 0.3, G - 0.005, 1.1, 0.36, T2 - G + 0.005, outline=0.005, bevel=0)
for i in range(4):
    box(f'stairlow{i}', M['granite'], 0.0, -0.36 - i * 0.02, G - 0.005, 0.12, 0.02, (T1 - G) * (1 - (i + 1) / 5) + 0.005, outline=0.001, bevel=0)
    box(f'stairhigh{i}', M['granite'], 0.0, 0.11 - i * 0.02, T1 - 0.005, 0.12, 0.02, (T2 - T1) * (1 - (i + 1) / 5) + 0.005, outline=0.001, bevel=0)

# ---------- the main hall on the lower terrace ----------
HX, HY = 0.0, -0.08
box('hallwall', M['red'], HX, HY, T1, 0.42, 0.2, 0.12, outline=0.005, bevel=0)
for k in range(6):
    x = HX - 0.18 + k * 0.072
    box(f'halldoor{k}', M['wood'], x + 0.036, HY - 0.103, T1 + 0.005, 0.06, 0.006, 0.1, outline=0, bevel=0)
    rod(f'hallpillar{k}', M['red'], (x, HY - 0.11, T1), (x, HY - 0.11, T1 + 0.12), 0.009, segs=8, outline=0.001)
box('dancheong', M['green'], HX, HY, T1 + 0.115, 0.44, 0.22, 0.03, outline=0.002, bevel=0)
hipped_roof('hallroof', HX, HY, T1 + 0.14, 0.27, 0.16, 0.14)

# ---------- the two long Tripitaka halls on the top terrace ----------
for k, y in enumerate((0.22, 0.4)):
    box(f'depository{k}', M['plaster'], 0.0, y, T2, 0.84, 0.12, 0.1, outline=0.005, bevel=0)
    for j in range(16):
        x = -0.4 + j * 0.8 / 15
        rod(f'deppost{k}{j}', M['wood'], (x, y - 0.062, T2), (x, y - 0.062, T2 + 0.1), 0.006, segs=6, outline=0.001)
        if j < 15:
            for row in range(2):
                for bar_i in range(3):
                    bx = x + 0.012 + bar_i * 0.012
                    bar(f'slat{k}{j}{row}{bar_i}', M['woodDark'], (bx, y - 0.063, T2 + 0.015 + row * 0.05), (bx, y - 0.063, T2 + 0.04 + row * 0.05), 0.004, outline=0)
    loft(f'depositoryroof{k}', M['roof'], [[(-0.46, y - 0.09, T2 + 0.095), (0.46, y - 0.09, T2 + 0.095), (0.46, y + 0.09, T2 + 0.095), (-0.46, y + 0.09, T2 + 0.095)],
                                            [(-0.44, y - 0.004, T2 + 0.16), (0.44, y - 0.004, T2 + 0.16), (0.44, y + 0.004, T2 + 0.16), (-0.44, y + 0.004, T2 + 0.16)]], outline=0.004)

# ---------- pines ----------
for k, (x, y) in enumerate(((-0.85, -0.3), (-0.75, 0.25), (0.8, -0.35), (0.85, 0.2), (-0.4, -0.65), (0.45, -0.68))):
    rod(f'pinetrunk{k}', M['trunk'], (x, y, G), (x + 0.02, y, G + 0.18), 0.014, segs=6, outline=0.002)
    b = ball(f'pine{k}', M['pine'], 0, 0, 0, 0.1, outline=0.008)
    b.scale = (1.2, 1.0, 0.6)
    b.location = (x + 0.02, y, G + 0.21)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
