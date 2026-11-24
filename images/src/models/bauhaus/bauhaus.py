# A cartoon Bauhaus Dessau for the country maps, built in the set's shared look (../toon.py): Walter
# Gropius's school building, its workshop wing wrapped in a curtain wall of glass, the bridge wing
# spanning the road on its pillars, the white blocks and the five-storey studio wing with its little
# balconies, the BAUHAUS lettering down the corner, and the flat roofs and lawns round it. Turned a
# little towards the camera.
# Run: blender -b --factory-startup -P bauhaus.py -- bauhaus-1024.png 1024 bauhaus.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'lawn': toon('lawn', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'road': toon('road', '#8a8a90'),
    'white': toon('white', '#f4f2ec', shadow_mul=(0.82, 0.84, 0.9), lift=0.2),
    'grey': toon('grey', '#8a8e96'),
    'glass': toon('glass', '#5a8aa8', shadow_mul=(0.8, 0.88, 0.94), lift=0.25),
    'frame': flat('frame', '#2a2e34'),
    'window': flat('window', '#3a4048'),
    'red': toon('red', '#c83a30'),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#6a4a36'),
})

G = tile(M['lawn'])
before = set(bpy.data.objects)

box('road', M['road'], 0.25, 0.0, G - 0.003, 0.2, 2.4, 0.008, outline=0, bevel=0)

# ---------- the workshop wing: the glass curtain wall ----------
WX, WY, WW, WD, WH = -0.35, -0.2, 0.62, 0.4, 0.42
box('workshopbase', M['grey'], WX, WY, G - 0.005, WW + 0.01, WD + 0.01, 0.05, outline=0.004, bevel=0)
box('workshop', M['glass'], WX, WY, G + 0.045, WW, WD, WH - 0.05, outline=0.008, bevel=0)
box('workshoproof', M['white'], WX, WY, G + WH - 0.01, WW + 0.02, WD + 0.02, 0.03, outline=0.004, bevel=0)
# the curtain wall's thin frames: a grid on the two faces the camera sees
for k in range(13):
    x = WX - WW / 2 + k * WW / 12
    bar(f'mullionfront{k}', M['frame'], (x, WY - WD / 2 - 0.003, G + 0.05), (x, WY - WD / 2 - 0.003, G + WH - 0.01), 0.004, outline=0)
for k in range(9):
    y = WY - WD / 2 + k * WD / 8
    bar(f'mullionside{k}', M['frame'], (WX - WW / 2 - 0.003, y, G + 0.05), (WX - WW / 2 - 0.003, y, G + WH - 0.01), 0.004, outline=0)
for k in range(1, 4):
    z = G + 0.05 + k * (WH - 0.06) / 4
    bar(f'transomfront{k}', M['frame'], (WX - WW / 2, WY - WD / 2 - 0.003, z), (WX + WW / 2, WY - WD / 2 - 0.003, z), 0.006, outline=0)
    bar(f'transomside{k}', M['frame'], (WX - WW / 2 - 0.003, WY - WD / 2, z), (WX - WW / 2 - 0.003, WY + WD / 2, z), 0.006, outline=0)
# the BAUHAUS letters running down the corner
for k in range(7):
    box(f'letter{k}', M['white'], WX + WW / 2 - 0.02, WY - WD / 2 - 0.006, G + WH - 0.06 - k * 0.05, 0.03, 0.006, 0.035, outline=0, bevel=0)

# ---------- the bridge wing over the road and the white blocks ----------
box('bridgewing', M['white'], 0.25, -0.05, G + 0.17, 0.5, 0.18, 0.14, outline=0.007, bevel=0)
box('bridgewindows', M['window'], 0.25, -0.143, G + 0.2, 0.46, 0.006, 0.08, outline=0, bevel=0)
for s in (-1, 1):
    rod(f'bridgepillar{s}', M['grey'], (0.25 + s * 0.09, -0.05, G), (0.25 + s * 0.09, -0.05, G + 0.17), 0.02, segs=8, outline=0.002)
box('school', M['white'], 0.6, 0.05, G - 0.005, 0.32, 0.5, 0.32, outline=0.008, bevel=0)
for row in range(3):
    box(f'schoolband{row}', M['window'], 0.6, 0.05 - 0.253, G + 0.05 + row * 0.09, 0.28, 0.006, 0.05, outline=0, bevel=0)
box('hall', M['white'], -0.1, 0.25, G - 0.005, 0.4, 0.3, 0.16, outline=0.007, bevel=0)
box('hallwindows', M['window'], -0.1, 0.098, G + 0.05, 0.36, 0.006, 0.07, outline=0, bevel=0)

# ---------- the studio wing with its balconies ----------
SX, SY = -0.1, 0.62
box('studio', M['white'], SX, SY, G - 0.005, 0.22, 0.2, 0.56, outline=0.008, bevel=0)
for row in range(5):
    z = G + 0.07 + row * 0.1
    for j in range(2):
        x = SX - 0.05 + j * 0.1
        box(f'studiowin{row}{j}', M['window'], x, SY - 0.103, z, 0.06, 0.006, 0.05, outline=0, bevel=0)
        box(f'balcony{row}{j}', M['white'], x, SY - 0.13, z - 0.01, 0.07, 0.05, 0.01, outline=0.002, bevel=0)
        bar(f'balconyrail{row}{j}', M['frame'], (x - 0.035, SY - 0.155, z + 0.025), (x + 0.035, SY - 0.155, z + 0.025), 0.004, outline=0)
box('studioroof', M['white'], SX, SY, G + 0.55, 0.24, 0.22, 0.02, outline=0.003, bevel=0)

# ---------- trees and the red door ----------
box('door', M['red'], WX + 0.15, WY - WD / 2 - 0.006, G + 0.045, 0.06, 0.006, 0.09, outline=0, bevel=0)
for k, (x, y) in enumerate(((-0.85, -0.7), (0.75, -0.7), (-0.9, 0.3), (0.85, 0.65), (-0.6, 0.85))):
    rod(f'trunk{k}', M['trunk'], (x, y, G), (x, y, G + 0.08), 0.014, segs=6, outline=0.002)
    ball(f'tree{k}', M['tree'], x, y, G + 0.17, 0.12, outline=0.012)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
