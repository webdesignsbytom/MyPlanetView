# A cartoon Sacré-Cœur for the country maps, built in the set's shared look (../toon.py): the white
# travertine basilica on top of Montmartre, its tall egg-shaped dome on its colonnaded drum, the four
# small domes round it and the square campanile behind, the triple-arched porch with the two bronze
# riders, the long flights of steps down the green hill and the funicular beside them. Turned a little
# towards the camera.
# Run: blender -b --factory-startup -P sacre-coeur.py -- sacre-coeur-1024.png 1024 sacre-coeur.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'white': toon('white', '#f4f0e6', shadow_mul=(0.82, 0.84, 0.9), lift=0.2),
    'whiteDark': toon('whiteDark', '#dcd6c8', shadow_mul=(0.84, 0.84, 0.9)),
    'hill': toon('hill', '#6aa54a', shadow_mul=(0.7, 0.78, 0.8)),
    'steps': toon('steps', '#cfc6b4', shadow_mul=(0.84, 0.82, 0.86)),
    'dark': flat('dark', '#2e2a2a'),
    'bronze': toon('bronze', '#4a7a6a', lift=0.1),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#6a4a36'),
    'red': toon('red', '#c8443a', lift=0.1),
    'steel': toon('steel', '#5a5e66'),
    'glass': toon('glass', '#a8d0e0', lift=0.3),
})

G = tile()
before = set(bpy.data.objects)

# ---------- the butte ----------
HZ = 0.32
hl = lathe('butte', M['hill'], ((1.3, 0), (1.2, 0.06), (1.02, 0.18), (0.85, 0.28), (0.75, HZ), (0.0, HZ)), G - 0.01, 0, 0.12, segs=40, outline=0.01)
hl.visible_shadow = False
T = G + HZ - 0.01
for k, (x, y) in enumerate(((-0.75, -0.25), (-0.95, 0.25), (0.8, -0.2), (0.95, 0.3), (-0.55, -0.62), (0.6, -0.62), (-0.35, 0.95), (0.4, 0.95))):
    r = math.hypot(x, y - 0.12)
    z = G + (HZ * (1 - min(1, max(0, (r - 0.75) / 0.55))) if r > 0.75 else HZ) - 0.02
    rod(f'trunk{k}', M['trunk'], (x, y, z), (x, y, z + 0.06), 0.012, segs=6, outline=0.002)
    ball(f'tree{k}', M['tree'], x, y, z + 0.11, 0.08, outline=0.01)

# the steps down the front of the hill, in flights with landings
for i in range(9):
    y0 = -0.3 - i * 0.1
    r = math.hypot(0, y0 - 0.12)
    z = G + HZ * max(0, min(1, 1 - (r - 0.75) / 0.55)) - 0.012
    box(f'flight{i}', M['steps'], 0, y0 - 0.05, G - 0.005, 0.26, 0.1, z - G + 0.01, outline=0.003, bevel=0)
    for j in range(3):
        box(f'tread{i}{j}', M['whiteDark'], 0, y0 - 0.1 + j * 0.033, z - 0.005 + j * 0.003, 0.24, 0.006, 0.006, outline=0, bevel=0)
# the funicular
FX = -0.3
for s in (-1, 1):
    bar(f'rail{s}', M['steel'], (FX + s * 0.02, -1.15, G + 0.025), (FX + s * 0.02, -0.42, T + 0.015), 0.008, outline=0.001)
slope = math.atan2(T - 0.01 - G, 0.73)
car = box('car', M['glass'], 0, 0, 0, 0.07, 0.1, 0.06, outline=0.003, bevel=0)
cart = box('carframe', M['red'], 0, 0, -0.012, 0.075, 0.105, 0.015, outline=0.002, bevel=0)
bpy.context.view_layer.update()
m = Matrix.Translation((FX, -0.8, G + (T - G) * (0.35 / 0.73) + 0.06)) @ Matrix.Rotation(slope, 4, 'X')
for o in (car, cart):
    o.matrix_world = m @ o.matrix_world
bpy.context.view_layer.update()
box('topstation', M['whiteDark'], FX, -0.38, T - 0.02, 0.12, 0.1, 0.08, outline=0.004, bevel=0)

# ---------- the basilica (built at 1, then grown about its porch) ----------
basilica = set(bpy.data.objects)
BX, BY = 0.0, 0.12
box('nave', M['white'], BX, BY + 0.06, T, 0.42, 0.5, 0.2, outline=0.009, bevel=0)
box('porch', M['white'], BX, BY - 0.24, T, 0.32, 0.12, 0.17, outline=0.008, bevel=0)
for j in range(3):
    x = BX - 0.09 + j * 0.09
    box(f'porcharch{j}', M['dark'], x, BY - 0.302, T + 0.005, 0.05, 0.006, 0.08, outline=0, bevel=0)
    cyl(f'porcharchtop{j}', M['dark'], 0.025, 0.006, segs=12, outline=0, matrix=Matrix.Translation((x, BY - 0.302, T + 0.085)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
box('porchgable', M['whiteDark'], BX, BY - 0.24, T + 0.165, 0.3, 0.1, 0.02, outline=0.003, bevel=0)
for s in (-1, 1):
    # the porch's little domes and the two riders above it
    lathe(f'porchdome{s}', M['white'], ((0.04, 0), (0.038, 0.03), (0.022, 0.06), (0.004, 0.075)), T + 0.17, BX + s * 0.12, BY - 0.24, segs=16, outline=0.003)
    rx = BX + s * 0.06
    box(f'riderplinth{s}', M['whiteDark'], rx, BY - 0.29, T + 0.17, 0.04, 0.03, 0.03, outline=0.002, bevel=0)
    hb = ball(f'horse{s}', M['bronze'], 0, 0, 0, 0.02, outline=0.003)
    hb.scale = (0.7, 1.6, 0.9)
    hb.location = (rx, BY - 0.29, T + 0.225)
    for fy in (-0.02, 0.02):
        rod(f'horseleg{s}{fy}', M['bronze'], (rx, BY - 0.29 + fy, T + 0.2), (rx, BY - 0.29 + fy, T + 0.225), 0.005, segs=5, outline=0.001)
    rod(f'rider{s}', M['bronze'], (rx, BY - 0.29, T + 0.235), (rx, BY - 0.29, T + 0.27), 0.01, segs=6, outline=0.002)
    ball(f'riderhead{s}', M['bronze'], rx, BY - 0.29, T + 0.278, 0.008, outline=0.001)
# the four small domes on the corners of the central square
for sx in (-1, 1):
    for sy in (-1, 1):
        x, y = BX + sx * 0.15, BY + 0.06 + sy * 0.15
        lathe(f'turret{sx}{sy}', M['white'], ((0.05, 0), (0.05, 0.08)), T + 0.195, x, y, segs=16, outline=0.003)
        lathe(f'smalldome{sx}{sy}', M['white'], ((0.055, 0), (0.05, 0.035), (0.03, 0.07), (0.01, 0.09), (0.004, 0.12)), T + 0.27, x, y, segs=16, outline=0.003)
# the great dome: a drum ringed with columns, then the tall egg and its lantern
DX, DY, DZ = BX, BY + 0.06, T + 0.195
lathe('drum', M['white'], ((0.12, 0), (0.12, 0.17)), DZ, DX, DY, segs=28, outline=0.006)
for k in range(16):
    a = 2 * math.pi * k / 16
    rod(f'drumcol{k}', M['whiteDark'], (DX + 0.128 * math.cos(a), DY + 0.128 * math.sin(a), DZ + 0.03), (DX + 0.128 * math.cos(a), DY + 0.128 * math.sin(a), DZ + 0.15), 0.007, segs=6, outline=0.001)
lathe('drumcap', M['whiteDark'], ((0.135, 0), (0.135, 0.015)), DZ + 0.165, DX, DY, segs=28, outline=0.003)
lathe('dome', M['white'], ((0.125, 0), (0.125, 0.05), (0.115, 0.12), (0.085, 0.2), (0.045, 0.26), (0.012, 0.29)), DZ + 0.175, DX, DY, segs=32, outline=0.008)
lathe('lantern', M['white'], ((0.03, 0), (0.03, 0.06), (0.024, 0.07), (0.015, 0.1), (0.003, 0.13)), DZ + 0.455, DX, DY, segs=12, outline=0.003)
# the campanile behind
CX, CY = BX, BY + 0.4
box('campanile', M['white'], CX, CY, T, 0.13, 0.13, 0.5, outline=0.008, bevel=0)
for fy in (-1, 1):
    box(f'belfry{fy}', M['dark'], CX, CY + fy * 0.066, T + 0.38, 0.06, 0.006, 0.08, outline=0, bevel=0)
lathe('campanilecap', M['white'], ((0.075, 0), (0.07, 0.04), (0.04, 0.09), (0.01, 0.12), (0.003, 0.16)), T + 0.495, CX, CY, segs=16, outline=0.004)

bpy.context.view_layer.update()
grow = Matrix.Translation((0, -0.05, T)) @ Matrix.Scale(1.4, 4) @ Matrix.Translation((0, 0.05, -T))
for o in set(bpy.data.objects) - basilica:
    o.matrix_world = grow @ o.matrix_world
bpy.context.view_layer.update()
turn(before, -20)
render(G)
