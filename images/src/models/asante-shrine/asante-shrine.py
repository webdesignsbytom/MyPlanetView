# A cartoon Asante Traditional Buildings for the country maps, built in the set's shared look
# (../toon.py): the last shrine houses of the Asante kingdom near Kumasi, Ghana, such as
# Besease: four rooms round a courtyard under steep thatched roofs, their earth walls in a
# polished deep red below and white above, carved all over with swirling Adinkra relief, and
# the palms and plantains round them. Turned a little towards the camera.
# Run: blender -b --factory-startup -P asante-shrine.py -- asante-shrine-1024.png 1024 asante-shrine.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#8cc05a', shadow_mul=(0.7, 0.78, 0.8), lift=0.22),
    'earth': toon('earth', '#c47c52', lift=0.15),
    'red': toon('red', '#9a3a2a', shadow_mul=(0.78, 0.7, 0.74), lift=0.12),
    'white': toon('white', '#f2ece0', lift=0.22),
    'relief': toon('relief', '#d8ccb4'),
    'thatch': toon('thatch', '#c8a458', shadow_mul=(0.8, 0.76, 0.76), lift=0.15),
    'dark': flat('dark', '#2e2622'),
    'palm': toon('palm', '#5aa048', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#7a5a3e'),
})

G = tile()
before = set(bpy.data.objects)
def palm(name, x, y, h=0.3):
    rod(name + "trunk", M["trunk"], (x, y, G), (x + 0.03, y, G + h), 0.012, segs=6, outline=0.002)
    for j in range(6):
        a = 2 * math.pi * j / 6
        bar(f"{name}frond{j}", M["palm"], (x + 0.03, y, G + h), (x + 0.03 + 0.13 * math.cos(a), y + 0.13 * math.sin(a), G + h - 0.05), 0.03, outline=0.002)


box('yard', M['earth'], 0.0, 0.0, G - 0.004, 1.1, 0.9, 0.008, outline=0.001, bevel=0)


def shrine_room(name, x, y, w, d, ridge_x):
    box(name + 'low', M['red'], x, y, G - 0.005, w, d, 0.08, outline=0.005, bevel=0)
    box(name + 'up', M['white'], x, y, G + 0.075, w, d, 0.08, outline=0.005, bevel=0)
    # the relief swirls on the front
    for j in range(3):
        cx = x - w / 3 + j * w / 3
        cyl(f'{name}swirl{j}', M['relief'], 0.025, 0.008, segs=12, outline=0, matrix=Matrix.Translation((cx, y - d / 2 - 0.004, G + 0.115)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
        cyl(f'{name}swirlin{j}', M['white'], 0.013, 0.01, segs=12, outline=0, matrix=Matrix.Translation((cx, y - d / 2 - 0.005, G + 0.115)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
        bar(f'{name}zig{j}', M['relief'], (cx - 0.03, y - d / 2 - 0.004, G + 0.03), (cx + 0.03, y - d / 2 - 0.004, G + 0.06), 0.008, outline=0)
    gable(name + 'roof', M['thatch'], x, y, G + 0.15, w, d, 0.2, ridge_x=ridge_x, over=0.04, outline=0.006)


shrine_room('room1', -0.05, 0.3, 0.5, 0.2, True)
shrine_room('room2', -0.42, 0.0, 0.2, 0.42, False)
shrine_room('room3', 0.32, 0.0, 0.2, 0.42, False)
box('frontwall', M['red'], -0.3, -0.28, G - 0.005, 0.2, 0.05, 0.12, outline=0.004, bevel=0)
box('frontwallw', M['white'], -0.3, -0.28, G + 0.115, 0.2, 0.05, 0.04, outline=0.003, bevel=0)
box('frontwall2', M['red'], 0.2, -0.28, G - 0.005, 0.2, 0.05, 0.12, outline=0.004, bevel=0)
box('frontwall2w', M['white'], 0.2, -0.28, G + 0.115, 0.2, 0.05, 0.04, outline=0.003, bevel=0)
box('entry', M['dark'], -0.05, -0.28, G - 0.004, 0.16, 0.05, 0.004, outline=0, bevel=0)

for k, (x, y) in enumerate(((-0.85, -0.45), (0.85, -0.45), (-0.9, 0.45), (0.9, 0.45), (0.0, 0.85))):
    palm(f'palm{k}', x, y, h=0.32)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
