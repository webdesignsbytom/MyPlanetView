# A cartoon Quebrada de Humahuaca for the country maps, built in the set's shared look
# (../toon.py): the Hill of Seven Colours over Purmamarca, its bands of red, cream, purple, ochre
# and green rock, the village's flat-roofed adobe houses and its whitewashed church with a bell
# gable, cardón cacti, an algarrobo tree, and a llama. Turned a little towards the camera.
# Run: blender -b --factory-startup -P humahuaca.py -- humahuaca-1024.png 1024 humahuaca.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
BANDS = ['#c8664a', '#ecd2a4', '#9a5a86', '#d89a48', '#7a9270', '#c84e46', '#e8cfa0', '#8a5a7a']
M.update({f'band{k}': toon(f'band{k}', c, shadow_mul=(0.84, 0.78, 0.8)) for k, c in enumerate(BANDS)})
M.update({
    'ground': toon('ground', '#d8b88a', shadow_mul=(0.86, 0.78, 0.74), lift=0.25),
    'adobe': toon('adobe', '#c8a078', shadow_mul=(0.86, 0.78, 0.74)),
    'adobeRoof': toon('adobeRoof', '#a8805a'),
    'white': toon('white', '#f8f6f0', shadow_mul=(0.8, 0.82, 0.92), lift=0.2),
    'door': flat('door', '#4a3a30'),
    'bell': toon('bell', '#c8963a', lift=0.3),
    'cactus': toon('cactus', '#5a8a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'tree': toon('tree', '#6a8a3a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#7a5a40'),
    'llama': toon('llama', '#f2ebe0', shadow_mul=(0.84, 0.8, 0.86), lift=0.2),
    'llamaBrown': toon('llamaBrown', '#8a5a3a'),
    'tassel': toon('tassel', '#e8402c'),
})

G = tile(M['ground'])
before = set(bpy.data.objects)
rng = random.Random(1237)


def ring(cx, cy, rx, ry, z, sides=24):
    return [(cx + rx * math.cos(t) * (1 + 0.06 * math.sin(3 * t + 1)), cy + ry * math.sin(t) * (1 + 0.05 * math.cos(2 * t + 1)), G + z) for t in (2 * math.pi * j / sides for j in range(sides))]


def squashed(name, mat, x, y, z, r, sx, sy, sz, outline=0.02):
    b = ball(name, mat, 0, 0, 0, r, outline=outline)
    b.scale = (sx, sy, sz)
    b.location = (x, y, z)
    return b


# ---------- the Hill of Seven Colours: stacked bands, each a tier of its own colour ----------
HX, HY = -0.05, 0.6
N = len(BANDS)
for k in range(N):
    f0, f1 = k / N, (k + 1) / N
    s0, s1 = 1 - 0.78 * f0 ** 1.2, 1 - 0.78 * f1 ** 1.2
    tier = loft(f'tier{k}', M[f'band{k}'], [ring(HX, HY + 0.12 * f0, 1.0 * s0, 0.5 * s0, -0.01 + 0.72 * f0), ring(HX, HY + 0.12 * f1, 1.0 * s1, 0.5 * s1, -0.01 + 0.72 * f1)],
                outline=0.014)
    tier.visible_shadow = False

# ---------- Purmamarca: adobe houses and the church ----------
for k, (x, y, w, d, h) in enumerate(((-0.75, -0.05, 0.2, 0.14, 0.09), (-0.5, -0.2, 0.16, 0.13, 0.08), (0.5, -0.1, 0.2, 0.14, 0.09), (0.75, -0.3, 0.16, 0.12, 0.08),
                                     (-0.25, -0.45, 0.18, 0.13, 0.08), (0.3, -0.5, 0.16, 0.12, 0.07), (0.85, 0.15, 0.15, 0.12, 0.08))):
    box(f'house{k}', M['adobe'], x, y, G - 0.005, w, d, h, outline=0.009, bevel=0)
    box(f'houseroof{k}', M['adobeRoof'], x, y, G + h - 0.01, w + 0.02, d + 0.02, 0.02, outline=0.005, bevel=0)
    box(f'housedoor{k}', M['door'], x, y - d / 2 - 0.004, G, 0.035, 0.008, 0.055, outline=0, bevel=0)
CX, CY = 0.1, -0.15
box('church', M['white'], CX, CY + 0.08, G - 0.005, 0.18, 0.3, 0.12, outline=0.012, bevel=0)
loft('churchroof', M['adobeRoof'], [[(CX - 0.1, CY - 0.07, G + 0.115), (CX + 0.1, CY - 0.07, G + 0.115), (CX + 0.1, CY + 0.235, G + 0.115), (CX - 0.1, CY + 0.235, G + 0.115)],
                                    [(CX - 0.004, CY - 0.07, G + 0.17), (CX + 0.004, CY - 0.07, G + 0.17), (CX + 0.004, CY + 0.235, G + 0.17), (CX - 0.004, CY + 0.235, G + 0.17)]],
     outline=0.01)
GX = CX - 0.17
box('bellgable', M['white'], GX, CY - 0.06, G - 0.005, 0.12, 0.05, 0.22, outline=0.01, bevel=0)
pyramid('bellgabletop', M['white'], GX, CY - 0.06, G + 0.21, 0.08, 0.05, outline=0.006)
box('bellarch', M['door'], GX, CY - 0.087, G + 0.13, 0.045, 0.008, 0.06, outline=0, bevel=0)
ball('bell', M['bell'], GX, CY - 0.085, G + 0.15, 0.018, outline=0.003)
box('churchdoor', M['door'], CX, CY - 0.074, G, 0.05, 0.008, 0.08, outline=0, bevel=0)

# ---------- cardón cacti, an algarrobo, and a llama ----------
for k, (x, y, h) in enumerate(((-0.95, -0.35, 0.28), (0.95, -0.05, 0.24), (-0.15, -0.75, 0.2), (0.6, -0.7, 0.26), (-1.05, 0.2, 0.22))):
    rod(f'cardon{k}', M['cactus'], (x, y, G), (x, y, G + h), 0.024, segs=10, outline=0.006)
    for s in (-1, 1):
        rod(f'cardonarm{k}{s}', M['cactus'], (x, y, G + h * 0.45), (x + s * 0.06, y, G + h * 0.5), 0.016, segs=8, outline=0.004)
        rod(f'cardonarmup{k}{s}', M['cactus'], (x + s * 0.06, y, G + h * 0.5), (x + s * 0.06, y, G + h * 0.8), 0.016, segs=8, outline=0.004)
rod('algarrobotrunk', M['trunk'], (-0.65, -0.6, G), (-0.62, -0.6, G + 0.12), 0.018, segs=6, outline=0.005)
squashed('algarrobo', M['tree'], -0.62, -0.6, G + 0.17, 0.11, 1.5, 1.2, 0.6, outline=0.012)
LX, LY = 0.3, -0.85
for fx in (-0.04, 0.04):
    for side in (-1, 1):
        rod(f'llamaleg{fx}{side}', M['llama'], (LX + fx, LY + side * 0.02, G), (LX + fx, LY + side * 0.02, G + 0.09), 0.009, segs=6, outline=0.003)
squashed('llamabody', M['llama'], LX, LY, G + 0.11, 0.045, 1.5, 0.85, 0.8, outline=0.008)
rod('llamaneck', M['llama'], (LX + 0.055, LY, G + 0.12), (LX + 0.07, LY, G + 0.22), 0.016, segs=8, outline=0.004)
squashed('llamahead', M['llama'], LX + 0.085, LY, G + 0.23, 0.02, 1.5, 0.9, 0.9, outline=0.004)
for side in (-1, 1):
    bar(f'llamaear{side}', M['llamaBrown'], (LX + 0.07, LY + side * 0.01, G + 0.245), (LX + 0.07, LY + side * 0.014, G + 0.275), 0.008, outline=0.002)
    ball(f'llamatassel{side}', M['tassel'], LX + 0.07, LY + side * 0.014, G + 0.275, 0.008, outline=0)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
