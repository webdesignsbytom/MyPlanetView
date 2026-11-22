# A cartoon Old City of Sanaa for the country maps, built in the set's shared look (../toon.py): a
# cluster of the old city's tower houses in brown stone and brick, each storey ringed with white
# gypsum bands, windows framed in white under round qamariya fanlights of coloured glass, white
# crenellations along their roofs; a slender white minaret among them, the gate of Bab al-Yemen in
# front, and the bare mountain of Jabal Nuqum behind. Turned a little towards the camera.
# Run: blender -b --factory-startup -P sanaa.py -- sanaa-1024.png 1024 sanaa.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'ground': toon('ground', '#d9c39a', lift=0.25),
    'stone': toon('stone', '#7a5a46', shadow_mul=(0.82, 0.76, 0.82)),
    'brick': toon('brick', '#9a6a4a', shadow_mul=(0.82, 0.74, 0.78)),
    'brickLight': toon('brickLight', '#b07c54', shadow_mul=(0.82, 0.74, 0.78)),
    'white': toon('white', '#f6f3ec', shadow_mul=(0.8, 0.8, 0.9), lift=0.2),
    'window': flat('window', '#33303d'),
    'glassRed': flat('glassRed', '#e0453a'),
    'glassBlue': flat('glassBlue', '#3c8ad8'),
    'glassYellow': flat('glassYellow', '#f4c83c'),
    'mountain': toon('mountain', '#8a6a52', shadow_mul=(0.78, 0.72, 0.78)),
    'door': flat('door', '#4a3428'),
})

G = tile(M['ground'])
before = set(bpy.data.objects)
rng = random.Random(197)
GLASS = ('glassRed', 'glassBlue', 'glassYellow')


def ring(cx, cy, rx, ry, z, jitter, sides=12):
    return [(cx + rx * (1 + rng.uniform(-jitter, jitter)) * math.cos(2 * math.pi * k / sides),
             cy + ry * (1 + rng.uniform(-jitter, jitter)) * math.sin(2 * math.pi * k / sides), G + z) for k in range(sides)]


# ---------- Jabal Nuqum behind ----------
m = loft('nuqum', M['mountain'], [ring(0.1, 0.95, 0.8, 0.28, -0.01, 0.04), ring(0.08, 0.97, 0.56, 0.19, 0.4, 0.1), ring(0.05, 1.0, 0.24, 0.09, 0.72, 0.1),
                                  ring(0.0, 1.0, 0.03, 0.03, 0.8, 0.0)], outline=0.035)
m.visible_shadow = False


def facade_windows(name, x0, x1, y, z0, floors, fh, per_floor, side=False, fx=None):
    """White-framed windows, each under its round fanlight, on the front face (y) or the left face (fx)."""
    for f in range(1, floors):
        for c in range(per_floor):
            t = (c + 0.5) / per_floor
            z = z0 + f * fh + 0.02
            glass = M[rng.choice(GLASS)]
            if not side:
                x = x0 + (x1 - x0) * t
                box(f'{name}frame{f}{c}', M['white'], x, y - 0.004, z, 0.045, 0.01, 0.06, outline=0, bevel=0)
                box(f'{name}win{f}{c}', M['window'], x, y - 0.008, z + 0.008, 0.028, 0.01, 0.04, outline=0, bevel=0)
                cyl(f'{name}fan{f}{c}', M['white'], 0.024, 0.01, segs=16, outline=0, matrix=Matrix.Translation((x, y - 0.004, z + 0.065)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
                cyl(f'{name}glass{f}{c}', glass, 0.015, 0.01, segs=16, outline=0, matrix=Matrix.Translation((x, y - 0.008, z + 0.065)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
            else:
                yy = x0 + (x1 - x0) * t
                box(f'{name}sframe{f}{c}', M['white'], fx - 0.004, yy, z, 0.01, 0.045, 0.06, outline=0, bevel=0)
                box(f'{name}swin{f}{c}', M['window'], fx - 0.008, yy, z + 0.008, 0.01, 0.028, 0.04, outline=0, bevel=0)
                cyl(f'{name}sfan{f}{c}', M['white'], 0.024, 0.01, segs=16, outline=0, matrix=Matrix.Translation((fx - 0.004, yy, z + 0.065)) @ Matrix.Rotation(math.pi / 2, 4, 'Y'))
                cyl(f'{name}sglass{f}{c}', glass, 0.015, 0.01, segs=16, outline=0, matrix=Matrix.Translation((fx - 0.008, yy, z + 0.065)) @ Matrix.Rotation(math.pi / 2, 4, 'Y'))


def tower_house(name, x, y, w, d, floors):
    fh = 0.12
    h = floors * fh
    box(f'{name}base', M['stone'], x, y, G - 0.005, w, d, fh, outline=0.02, bevel=0)
    box(name, M[rng.choice(('brick', 'brickLight'))], x, y, G + fh - 0.005, w, d, h - fh, outline=0.022, bevel=0)
    for f in range(1, floors):
        box(f'{name}band{f}', M['white'], x, y, G + f * fh - 0.012, w + 0.006, d + 0.006, 0.014, outline=0, bevel=0)
    facade_windows(name, x - w / 2 + 0.02, x + w / 2 - 0.02, y - d / 2, G, floors, fh, max(1, int(w / 0.08)))
    facade_windows(name, y - d / 2 + 0.02, y + d / 2 - 0.02, None, G, floors, fh, max(1, int(d / 0.09)), side=True, fx=x - w / 2)
    box(f'{name}door', M['door'], x, y - d / 2 - 0.004, G, 0.05, 0.01, 0.08, outline=0, bevel=0)
    # white crenellations round the roof
    box(f'{name}roofband', M['white'], x, y, G + h - 0.005, w + 0.008, d + 0.008, 0.02, outline=0.01, bevel=0)
    for c in range(int(w / 0.05) + 1):
        box(f'{name}crenf{c}', M['white'], x - w / 2 + c * w / int(w / 0.05), y - d / 2, G + h + 0.015, 0.02, 0.02, 0.03, outline=0, bevel=0)
    for c in range(int(d / 0.05) + 1):
        box(f'{name}crens{c}', M['white'], x - w / 2, y - d / 2 + c * d / int(d / 0.05), G + h + 0.015, 0.02, 0.02, 0.03, outline=0, bevel=0)


# ---------- the tower houses, the tallest in the middle ----------
HOUSES = [(-0.25, 0.15, 0.24, 0.22, 7), (0.08, 0.3, 0.22, 0.22, 8), (0.38, 0.12, 0.22, 0.2, 6), (-0.6, 0.4, 0.22, 0.2, 6), (0.65, 0.45, 0.2, 0.2, 5),
          (-0.15, 0.6, 0.2, 0.2, 6), (0.3, 0.68, 0.2, 0.18, 5), (-0.65, -0.05, 0.2, 0.18, 4), (0.72, -0.12, 0.2, 0.18, 4)]
for k, (x, y, w, d, floors) in enumerate(HOUSES):
    tower_house(f'house{k}', x, y, w, d, floors)

# ---------- a slender white minaret ----------
MX, MY = -0.42, 0.62
lathe('minaret', M['white'], ((0.06, 0), (0.05, 0.7), (0.07, 0.72), (0.07, 0.76), (0.04, 0.78), (0.035, 0.92)), G - 0.005, MX, MY, segs=16, outline=0.016)
lathe('minaretcap', M['white'], ((0.045, 0), (0.025, 0.06), (0.004, 0.12)), G + 0.915, MX, MY, segs=16, outline=0.012)
ball('minarettop', M['gold'], MX, MY, G + 1.05, 0.012, outline=0.003)

# ---------- Bab al-Yemen at the front ----------
BX, BY = 0.0, -0.62
for s in (-1, 1):
    lathe(f'gatetower{s}', M['stone'], ((0.09, 0), (0.08, 0.3)), G - 0.005, BX + s * 0.16, BY, segs=18, outline=0.02)
    lathe(f'gatetowertop{s}', M['white'], ((0.085, 0), (0.085, 0.03)), G + 0.29, BX + s * 0.16, BY, segs=18, outline=0.01)
box('gate', M['stone'], BX, BY, G - 0.005, 0.26, 0.14, 0.26, outline=0.02, bevel=0)
box('gatetop', M['white'], BX, BY, G + 0.25, 0.27, 0.15, 0.03, outline=0.01, bevel=0)
box('gateway', M['door'], BX, BY - 0.073, G, 0.09, 0.01, 0.16, outline=0, bevel=0)
cyl('gatearch', M['door'], 0.045, 0.01, segs=16, outline=0, matrix=Matrix.Translation((BX, BY - 0.073, G + 0.16)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
for s in (-1, 1):
    box(f'citywall{s}', M['stone'], BX + s * 0.48, BY + 0.02, G - 0.005, 0.6, 0.08, 0.16, rot_z=s * -0.12, outline=0.016, bevel=0)

turn(before, -20)
render(G)
