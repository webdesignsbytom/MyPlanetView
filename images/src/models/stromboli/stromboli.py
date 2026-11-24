# A cartoon Stromboli for the country maps, built in the set's shared look (../toon.py): the Aeolian
# Islands' lighthouse of the Mediterranean, its dark cone rising straight out of the sea, glowing
# red at the summit and puffing smoke, the black scar of the Sciara del Fuoco down one side, green
# slopes below, the white village at its foot, and a ferry. Turned a little towards the camera.
# Run: blender -b --factory-startup -P stromboli.py -- stromboli-1024.png 1024 stromboli.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sea': toon('sea', '#2f7ab8', shadow_mul=(0.76, 0.84, 0.92), lift=0.3),
    'green': toon('green', '#6a9a48', shadow_mul=(0.72, 0.8, 0.76)),
    'ash': toon('ash', '#5a5254', shadow_mul=(0.84, 0.84, 0.9)),
    'scar': toon('scar', '#2e2a2c'),
    'lava': toon('lava', '#f0602c', lift=0.4),
    'glow': toon('glow', '#f8c040', lift=0.45),
    'smoke': toon('smoke', '#c8c4c0', shadow_mul=(0.86, 0.88, 0.94), lift=0.1),
    'white': toon('white', '#f8f6f0', lift=0.2),
    'blue': toon('blue', '#2f6ac0'),
    'ferry': toon('ferry', '#f6f4ee', lift=0.2),
    'ferryBlue': toon('ferryBlue', '#2f5ab0'),
})

G = tile(M['sea'])
before = set(bpy.data.objects)
rng = random.Random(2263)

VX, VY = 0.0, 0.25
lathe('island', M['green'], ((0.95, 0), (0.8, 0.12), (0.62, 0.25)), G - 0.01, VX, VY, segs=28, outline=0.012)
lathe('cone', M['ash'], ((0.64, 0), (0.42, 0.35), (0.2, 0.62), (0.1, 0.7)), G + 0.22, VX, VY, segs=24, outline=0.014)
loft('sciara', M['scar'], [[(VX + 0.12, VY - 0.08, G + 0.9), (VX + 0.2, VY - 0.02, G + 0.9), (VX + 0.66, VY - 0.25, G + 0.24), (VX + 0.48, VY - 0.48, G + 0.24)],
                           [(VX + 0.12, VY - 0.085, G + 0.91), (VX + 0.2, VY - 0.025, G + 0.91), (VX + 0.67, VY - 0.255, G + 0.25), (VX + 0.49, VY - 0.485, G + 0.25)]], outline=0.004)
lathe('crater', M['lava'], ((0.1, 0), (0.1, 0.02)), G + 0.91, VX, VY, segs=16, outline=0.004)
lathe('glowcore', M['glow'], ((0.05, 0), (0.05, 0.03)), G + 0.91, VX, VY, segs=12, outline=0)
for k, (dx, dz, r) in enumerate(((0.0, 0.02, 0.07), (0.07, 0.1, 0.08), (0.15, 0.2, 0.09), (0.26, 0.3, 0.08))):
    b = ball(f'smoke{k}', M['smoke'], 0, 0, 0, r, outline=0.007)
    b.scale = (1.3, 1.0, 0.85)
    b.location = (VX + dx, VY + 0.02, G + 0.98 + dz)
for k in range(5):
    bar(f'lavaspark{k}', M['lava'], (VX, VY, G + 0.93), (VX + rng.uniform(-0.08, 0.08), VY + rng.uniform(-0.06, 0.06), G + 0.98 + rng.uniform(0, 0.05)), 0.012, outline=0)

# ---------- the village at its foot ----------
for k in range(10):
    a = math.radians(230 + k * 10)
    r = rng.uniform(0.7, 0.86)
    x, y = VX + r * math.cos(a), VY + r * math.sin(a)
    h = rng.uniform(0.05, 0.08)
    z = G + 0.12 * (0.95 - r) / 0.15
    box(f'house{k}', M['white'], x, y, z - 0.005, 0.08, 0.07, h, rot_z=a + math.pi / 2, outline=0.004, bevel=0)
    box(f'houseshutter{k}', M['blue'], x - 0.036 * math.cos(a), y - 0.036 * math.sin(a), z + h * 0.4, 0.025, 0.006, 0.025, rot_z=a + math.pi / 2, outline=0, bevel=0)
CHX, CHY = VX + 0.78 * math.cos(math.radians(290)), VY + 0.78 * math.sin(math.radians(290))
box('church', M['white'], CHX, CHY, G + 0.03, 0.1, 0.12, 0.1, outline=0.004, bevel=0)
box('churchtower', M['white'], CHX + 0.06, CHY, G + 0.03, 0.04, 0.04, 0.17, outline=0.003, bevel=0)

# ---------- the ferry ----------
FX, FY = -0.55, -0.75
box('ferryhull', M['ferryBlue'], FX, FY, G - 0.002, 0.3, 0.1, 0.04, outline=0.004, bevel=0)
box('ferrycabin', M['ferry'], FX - 0.02, FY, G + 0.035, 0.2, 0.08, 0.05, outline=0.003, bevel=0)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
