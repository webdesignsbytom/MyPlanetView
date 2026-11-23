# A cartoon Hassan Tower for the country maps, built in the set's shared look (../toon.py): Rabat's
# great unfinished minaret of red sandstone with its carved arch and lattice panels, the rows of
# broken white column stumps of the mosque that was never finished standing on the esplanade, and
# the Mausoleum of Mohammed V in white marble under its green tiled pyramid roof. Turned a little
# towards the camera.
# Run: blender -b --factory-startup -P hassan-tower.py -- hassan-tower-1024.png 1024 hassan-tower.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#e0d4b8', shadow_mul=(0.84, 0.82, 0.86), lift=0.2),
    'sandstone': toon('sandstone', '#c48a5a', shadow_mul=(0.86, 0.8, 0.76), lift=0.06),
    'sandDark': toon('sandDark', '#9a643e'),
    'column': toon('column', '#ece6da', shadow_mul=(0.82, 0.84, 0.9), lift=0.12),
    'white': toon('white', '#f6f4ee', lift=0.15),
    'green': toon('green', '#2a8a5a', lift=0.12),
    'gold': toon('gold', '#e0b040', lift=0.3),
    'dark': flat('dark', '#3a2e24'),
    'palm': toon('palm', '#5a9a40'),
    'trunk': toon('trunk', '#7a5a3a'),
})

G = tile(M['paving'])
before = set(bpy.data.objects)
rng = random.Random(2441)

# ---------- the tower ----------
TX, TY, W, H = -0.4, 0.32, 0.2, 0.64
box('tower', M['sandstone'], TX, TY, G - 0.005, W, W, H, outline=0.009, bevel=0)
for side in range(2):
    a = -math.pi / 2 if side == 0 else 0.0
    nx, ny = math.cos(a), math.sin(a)
    fx, fy = TX + nx * (W / 2 + 0.003), TY + ny * (W / 2 + 0.003)
    rz = a + math.pi / 2
    for k, (z, h) in enumerate(((0.12, 0.14), (0.32, 0.14), (0.5, 0.1))):
        box(f'panel{side}{k}', M['sandDark'], fx, fy, G + z, W * 0.7, 0.006, h, rot_z=rz, outline=0, bevel=0)
        box(f'arch{side}{k}', M['dark'], fx + nx * 0.002, fy + ny * 0.002, G + z + 0.015, W * 0.2, 0.006, h * 0.6, rot_z=rz, outline=0, bevel=0)
        for j in range(4):
            u = -W * 0.28 + j * W * 0.187
            cyl(f'lattice{side}{k}{j}', M['sandstone'], 0.012, 0.006, segs=4, outline=0, matrix=Matrix.Translation((fx + nx * 0.003 - ny * u, fy + ny * 0.003 + nx * u, G + z + h - 0.025)) @ Matrix.Rotation(rz, 4, 'Z') @ Matrix.Rotation(math.pi / 2, 4, 'X'))
box('towerbase', M['sandDark'], TX, TY, G - 0.005, W + 0.04, W + 0.04, 0.04, outline=0.003, bevel=0)

# ---------- the column stumps ----------
for i in range(7):
    for j in range(5):
        x = -0.15 + i * 0.13
        y = -0.6 + j * 0.15
        if math.hypot(x, y) > 1.0:
            continue
        h = rng.choice((0.05, 0.07, 0.09, 0.12))
        rod(f'stump{i}{j}', M['column'], (x, y, G - 0.005), (x, y, G + h), 0.022, segs=10, outline=0.003)

# ---------- the Mausoleum of Mohammed V ----------
MX, MY = 0.52, 0.45
box('mausoleumbase', M['white'], MX, MY, G - 0.005, 0.3, 0.3, 0.05, outline=0.004, bevel=0)
box('mausoleum', M['white'], MX, MY, G + 0.045, 0.22, 0.22, 0.17, outline=0.007, bevel=0)
for side in range(2):
    a = -math.pi / 2 if side == 0 else math.pi
    nx, ny = math.cos(a), math.sin(a)
    box(f'mausarch{side}', M['dark'], MX + nx * 0.113, MY + ny * 0.113, G + 0.06, 0.05, 0.006, 0.09, rot_z=a + math.pi / 2, outline=0, bevel=0)
box('mausband', M['green'], MX, MY, G + 0.2, 0.235, 0.235, 0.018, outline=0.001, bevel=0)
pyramid('mausroof', M['green'], MX, MY, G + 0.215, 0.24, 0.13, outline=0.005)
rod('mausfinial', M['gold'], (MX, MY, G + 0.34), (MX, MY, G + 0.4), 0.006, segs=6, outline=0)
for k in range(3):
    ball(f'mausball{k}', M['gold'], MX, MY, G + 0.35 + k * 0.018, 0.012 - k * 0.002, outline=0)

for k, (x, y) in enumerate(((-0.8, -0.1), (-0.75, -0.45), (0.85, -0.2))):
    rod(f'palmtrunk{k}', M['trunk'], (x, y, G), (x + 0.03, y, G + 0.3), 0.016, segs=6, outline=0.002)
    for j in range(7):
        a = 2 * math.pi * j / 7
        bar(f'palmleaf{k}{j}', M['palm'], (x + 0.03, y, G + 0.3), (x + 0.03 + 0.11 * math.cos(a), y + 0.11 * math.sin(a), G + 0.24), 0.025, outline=0.002)

turn(before, -20)
render(G)
