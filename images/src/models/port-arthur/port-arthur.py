# A cartoon Port Arthur for the country maps, built in the set's shared look (../toon.py): the convict
# settlement on Tasmania's Tasman Peninsula, the roofless sandstone shell of the four-storey
# Penitentiary by the water with its rows of empty windows, the ruined convict-built church on its
# rise with its Gothic windows and the stump of its pinnacled tower, the green lawns, gum trees and
# the bay. Turned a little towards the camera.
# Run: blender -b --factory-startup -P port-arthur.py -- port-arthur-1024.png 1024 port-arthur.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#80b85c', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'water': toon('water', '#3a82b0', lift=0.3),
    'sandstone': toon('sandstone', '#d8b888', shadow_mul=(0.8, 0.76, 0.8), lift=0.15),
    'sandDark': toon('sandDark', '#b8986a'),
    'dark': flat('dark', '#3a2e26'),
    'gum': toon('gum', '#6a9a6a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#d8d0c0'),
})

G = tile(M['grass'])
before = set(bpy.data.objects)


def strip(y0, y1, r, z):
    a0, a1 = math.asin(y0 / r), math.asin(y1 / r)
    right = [(r * math.cos(a0 + (a1 - a0) * k / 12), r * math.sin(a0 + (a1 - a0) * k / 12), z) for k in range(13)]
    left = [(-r * math.cos(a1 + (a0 - a1) * k / 12), r * math.sin(a1 + (a0 - a1) * k / 12), z) for k in range(13)]
    return right + left


def shell(name, x, y, w, d, h, rows, cols, gothic=False):
    """A roofless shell of four walls with rows of empty windows on its front."""
    t = 0.025
    box(f'{name}front', M['sandstone'], x, y - d / 2 + t / 2, G - 0.005, w, t, h, outline=0.005, bevel=0)
    box(f'{name}back', M['sandstone'], x, y + d / 2 - t / 2, G - 0.005, w, t, h, outline=0.005, bevel=0)
    for s in (-1, 1):
        box(f'{name}side{s}', M['sandstone'], x + s * (w / 2 - t / 2), y, G - 0.005, t, d, h, outline=0.005, bevel=0)
    for r in range(rows):
        for c in range(cols):
            wx = x - w / 2 + (c + 0.5) * w / cols
            wz = G + 0.02 + r * (h - 0.03) / rows
            wh = (h - 0.03) / rows * (0.75 if gothic else 0.55)
            box(f'{name}win{r}{c}', M['dark'], wx, y - d / 2 - 0.004, wz, w / cols * 0.45, 0.006, wh, outline=0, bevel=0)
            if gothic:
                ww = w / cols * 0.45
                loft(f'{name}winpoint{r}{c}', M['dark'], [[(wx - ww / 2, y - d / 2 - 0.007, wz + wh), (wx + ww / 2, y - d / 2 - 0.007, wz + wh), (wx + 0.001, y - d / 2 - 0.007, wz + wh + ww * 0.8), (wx - 0.001, y - d / 2 - 0.007, wz + wh + ww * 0.8)],
                                                          [(wx - ww / 2, y - d / 2 - 0.001, wz + wh), (wx + ww / 2, y - d / 2 - 0.001, wz + wh), (wx + 0.001, y - d / 2 - 0.001, wz + wh + ww * 0.8), (wx - 0.001, y - d / 2 - 0.001, wz + wh + ww * 0.8)]], outline=0)


# ---------- the bay ----------
loft('bay', M['water'], [strip(-1.31, -0.55, 1.32, G - 0.004), strip(-1.31, -0.55, 1.32, G + 0.008)], outline=0.002)

# ---------- the Penitentiary ----------
shell('pen', -0.15, -0.22, 0.86, 0.22, 0.3, 4, 12)
box('penfloor', M['sandDark'], -0.15, -0.22, G - 0.004, 0.84, 0.2, 0.02, outline=0, bevel=0)
for s in (-1, 1):
    loft(f'pengable{s}', M['sandstone'], [[(-0.15 + s * 0.4425 - 0.0125, -0.33, G + 0.295), (-0.15 + s * 0.4425 + 0.0125, -0.33, G + 0.295), (-0.15 + s * 0.4425 + 0.0125, -0.11, G + 0.295), (-0.15 + s * 0.4425 - 0.0125, -0.11, G + 0.295)],
                                          [(-0.15 + s * 0.4425 - 0.0125, -0.224, G + 0.37), (-0.15 + s * 0.4425 + 0.0125, -0.224, G + 0.37), (-0.15 + s * 0.4425 + 0.0125, -0.216, G + 0.37), (-0.15 + s * 0.4425 - 0.0125, -0.216, G + 0.37)]], outline=0.003)

# ---------- the ruined church on its rise ----------
CX, CY = 0.45, 0.45
rise = lathe('rise', M['grass'], ((0.45, 0), (0.3, 0.04), (0.0, 0.05)), G - 0.01, CX, CY, segs=28, outline=0.004)
rise.visible_shadow = False
shell('church', CX + 0.05, CY + 0.05, 0.36, 0.2, 0.2, 1, 4, gothic=True)
TX, TY = CX - 0.18, CY + 0.05
box('churchtower', M['sandstone'], TX, TY, G - 0.005, 0.12, 0.12, 0.3, outline=0.005, bevel=0)
box('towerdoor', M['dark'], TX, TY - 0.063, G + 0.03, 0.035, 0.006, 0.08, outline=0, bevel=0)
box('towerwin', M['dark'], TX, TY - 0.063, G + 0.2, 0.025, 0.006, 0.05, outline=0, bevel=0)
for sx in (-1, 1):
    for sy in (-1, 1):
        lathe(f'pinnacle{sx}{sy}', M['sandstone'], ((0.015, 0), (0.012, 0.04), (0.002, 0.09)), G + 0.295, TX + sx * 0.05, TY + sy * 0.05, segs=6, outline=0.002, smooth=False)

# ---------- gum trees ----------
for k, (x, y) in enumerate(((-0.85, 0.3), (-0.5, 0.6), (0.0, 0.75), (0.9, 0.0), (0.85, -0.35), (-0.95, -0.2))):
    rod(f'gumtrunk{k}', M['trunk'], (x, y, G), (x + 0.02, y, G + 0.22), 0.014, segs=6, outline=0.002)
    for j in range(3):
        b = ball(f'gum{k}{j}', M['gum'], 0, 0, 0, 0.07, outline=0.006)
        b.scale = (1.2, 1.0, 0.7)
        b.location = (x + 0.02 + (j - 1) * 0.06, y, G + 0.24 + 0.04 * (j % 2))

bpy.context.view_layer.update()
turn(before, -20)
render(G)
