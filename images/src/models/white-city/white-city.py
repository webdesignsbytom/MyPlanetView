# A cartoon White City of Tel Aviv for the country maps, built in the set's shared look
# (../toon.py): the thousands of white Bauhaus and International Style buildings of Tel Aviv,
# Israel: white blocks raised on pilotis with long horizontal balconies, rounded corner
# balconies and strip windows, flat roof terraces, the fountain on Dizengoff Square
# and the palms on the boulevard. Turned a little towards the camera.
# Run: blender -b --factory-startup -P white-city.py -- white-city-1024.png 1024 white-city.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#ddd4c2', shadow_mul=(0.82, 0.8, 0.84), lift=0.18),
    'grass': toon('grass2', '#8cc05a', lift=0.22),
    'white': toon('white', '#f6f4ee', shadow_mul=(0.78, 0.82, 0.9), lift=0.25),
    'glass': flat('glass', '#4a6a7a'),
    'shade': toon('shade', '#d8d4c8'),
    'water': toon('water', '#4a9ac8', lift=0.3),
    'palm': toon('palm', '#5aa048', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#7a5a3e'),
})

G = tile(M['paving'])
before = set(bpy.data.objects)
def palm(name, x, y, h=0.3):
    rod(name + "trunk", M["trunk"], (x, y, G), (x + 0.03, y, G + h), 0.012, segs=6, outline=0.002)
    for j in range(6):
        a = 2 * math.pi * j / 6
        bar(f"{name}frond{j}", M["palm"], (x + 0.03, y, G + h), (x + 0.03 + 0.13 * math.cos(a), y + 0.13 * math.sin(a), G + h - 0.05), 0.03, outline=0.002)



def bauhaus(name, x, y, w, d, floors, round_corner=False):
    """A white block on pilotis: strip windows, long balconies, a rounded corner balcony."""
    z0 = G + 0.04
    for (ex, ey) in ((-1, -1), (1, -1), (1, 1), (-1, 1)):
        rod(f'{name}pilotis{ex}{ey}', M['white'], (x + ex * (w / 2 - 0.02), y + ey * (d / 2 - 0.02), G), (x + ex * (w / 2 - 0.02), y + ey * (d / 2 - 0.02), z0), 0.01, segs=8, outline=0.001)
    box(name + 'core', M['shade'], x, y, G - 0.005, w * 0.4, d * 0.5, 0.045, outline=0.002, bevel=0)
    H = floors * 0.07
    box(name, M['white'], x, y, z0, w, d, H, outline=0.005, bevel=0)
    for f in range(floors):
        z = z0 + f * 0.07
        box(f'{name}strip{f}', M['glass'], x - 0.02, y - d / 2 - 0.003, z + 0.025, w - 0.08, 0.006, 0.025, outline=0, bevel=0)
        box(f'{name}balcony{f}', M['white'], x + 0.02, y - d / 2 - 0.025, z + 0.005, w - 0.04, 0.05, 0.02, outline=0.002, bevel=0)
        if round_corner:
            lathe(f'{name}round{f}', M['white'], ((0.05, 0), (0.05, 0.02)), z + 0.005, x + w / 2, y - d / 2, segs=16, outline=0.002)
    box(name + 'roof', M['white'], x, y, z0 + H - 0.005, w + 0.02, d + 0.02, 0.015, outline=0.002, bevel=0)
    box(name + 'pergola', M['shade'], x - w * 0.25, y, z0 + H + 0.01, w * 0.3, d * 0.4, 0.035, outline=0.002, bevel=0)


bauhaus('b1', -0.5, 0.35, 0.36, 0.26, 4, True)
bauhaus('b2', 0.15, 0.45, 0.34, 0.24, 3)
bauhaus('b3', 0.65, 0.15, 0.28, 0.3, 4, True)
bauhaus('b4', -0.65, -0.25, 0.3, 0.24, 3)
# the round building on Dizengoff Square
RX, RY = 0.15, -0.25
lathe('fountain', M['shade'], ((0.12, 0), (0.12, 0.03)), G - 0.005, RX, RY, segs=24, outline=0.003)
lathe('fountainwater', M['water'], ((0.1, 0), (0.1, 0.035)), G - 0.005, RX, RY, segs=24, outline=0)
lathe('fountainsculpt', M['white'], ((0.03, 0), (0.02, 0.1), (0.04, 0.14), (0.0, 0.16)), G + 0.02, RX, RY, segs=10, outline=0.003)
box('boulevard', M['grass'], -0.1, -0.7, G - 0.004, 1.5, 0.16, 0.01, outline=0.001, bevel=0)
for k in range(5):
    palm(f'palm{k}', -0.75 + k * 0.33, -0.7, h=0.28)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
