# A cartoon Svaneti for the country maps, built in the set's shared look (../toon.py): Ushguli's
# medieval stone defence towers, tall and square with slate roofs, among the village's stone houses
# on the green meadows, the snowy wall of Shkhara behind, and a cow. Turned a little towards the
# camera.
# Run: blender -b --factory-startup -P svaneti-towers.py -- svaneti-towers-1024.png 1024 svaneti-towers.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'meadow': toon('meadow', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'stone': toon('stone', '#a89a88', shadow_mul=(0.84, 0.82, 0.86)),
    'stoneDark': toon('stoneDark', '#8a7e70', shadow_mul=(0.84, 0.82, 0.86)),
    'slate': toon('slate', '#5a5654', shadow_mul=(0.8, 0.8, 0.88)),
    'window': flat('window', '#2e2a28'),
    'rock': toon('rock', '#7e7a78', shadow_mul=(0.84, 0.84, 0.9)),
    'snow': toon('snow', '#fbfbfd', shadow_mul=(0.8, 0.86, 0.96), lift=0.15),
    'cow': toon('cow', '#8a5a3a'),
    'cowWhite': toon('cowWhite', '#f4f0e6', lift=0.2),
})

G = tile(M['meadow'])
before = set(bpy.data.objects)
rng = random.Random(1567)


def segment(c, r, z, n=26):
    a0 = math.asin(c / r)
    return [(r * math.cos(a), r * math.sin(a), G + z) for a in (a0 + (math.pi - 2 * a0) * j / (n - 1) for j in range(n))]


# ---------- Shkhara behind ----------
mt = loft('shkhara', M['rock'], [segment(0.55, 1.38, -0.01), segment(0.72, 1.24, 0.5), segment(0.88, 1.06, 0.72)], outline=0.018)
mt.visible_shadow = False
sn = loft('shkharasnow', M['snow'], [segment(0.7, 1.258, 0.455), segment(0.8, 1.172, 0.612), segment(0.875, 1.078, 0.735)], outline=0.012, smooth=True)
sn.visible_shadow = False


# ---------- the towers and houses ----------
def tower(name, x, y, h, w=0.1):
    loft(name, M['stone'], [[(x - w / 2, y - w / 2, G - 0.005), (x + w / 2, y - w / 2, G - 0.005), (x + w / 2, y + w / 2, G - 0.005), (x - w / 2, y + w / 2, G - 0.005)],
                            [(x - w * 0.42, y - w * 0.42, G + h), (x + w * 0.42, y - w * 0.42, G + h), (x + w * 0.42, y + w * 0.42, G + h), (x - w * 0.42, y + w * 0.42, G + h)]],
         outline=0.01)
    pyramid(f'{name}roof', M['slate'], x, y, G + h - 0.005, w * 0.95, 0.07, outline=0.007)
    for k in range(3):
        box(f'{name}win{k}', M['window'], x, y - w * 0.45, G + h * (0.45 + 0.17 * k), 0.016, 0.006, 0.03, outline=0, bevel=0)


for k, (x, y, h) in enumerate(((-0.45, 0.2, 0.5), (-0.2, 0.35, 0.56), (0.1, 0.25, 0.48), (0.35, 0.4, 0.54), (0.6, 0.18, 0.46), (-0.7, 0.42, 0.44), (0.2, -0.05, 0.42))):
    tower(f'tower{k}', x, y, h)
for k, (x, y) in enumerate(((-0.6, 0.0), (-0.3, -0.1), (0.45, 0.0), (-0.05, 0.05), (0.75, 0.35), (-0.85, 0.2))):
    box(f'house{k}', M['stoneDark'], x, y, G - 0.005, 0.18, 0.14, 0.09, outline=0.008, bevel=0)
    loft(f'houseroof{k}', M['slate'], [[(x - 0.1, y - 0.08, G + 0.085), (x + 0.1, y - 0.08, G + 0.085), (x + 0.1, y + 0.08, G + 0.085), (x - 0.1, y + 0.08, G + 0.085)],
                                       [(x - 0.1, y - 0.004, G + 0.13), (x + 0.1, y - 0.004, G + 0.13), (x + 0.1, y + 0.004, G + 0.13), (x - 0.1, y + 0.004, G + 0.13)]],
         outline=0.006)
for k in range(10):
    x = -1.0 + k * 0.22
    box(f'drystone{k}', M['stoneDark'], x, -0.45, G - 0.005, 0.2, 0.04, 0.04, outline=0.003, bevel=0)

# ---------- a cow on the meadow ----------
CX, CY = 0.45, -0.7
for fx in (-0.05, 0.05):
    for side in (-1, 1):
        rod(f'cowleg{fx}{side}', M['cow'], (CX + fx, CY + side * 0.025, G), (CX + fx, CY + side * 0.025, G + 0.06), 0.011, segs=6, outline=0.003)
b = ball('cowbody', M['cow'], 0, 0, 0, 0.05, outline=0.006)
b.scale = (1.5, 0.85, 0.8)
b.location = (CX, CY, G + 0.085)
ball('cowpatch', M['cowWhite'], CX - 0.02, CY - 0.035, G + 0.095, 0.025, outline=0)
ball('cowhead', M['cow'], CX + 0.08, CY, G + 0.1, 0.026, outline=0.004)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
