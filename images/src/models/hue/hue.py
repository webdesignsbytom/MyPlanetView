# A cartoon Huế for the country maps, built in the set's shared look (../toon.py): the Imperial
# City's Meridian Gate, its great stone base with three gateways and the Five Phoenix Pavilion on
# top, two tiers of yellow-tiled roofs on red columns, the moat with lotus in front, and the Flag
# Tower's stepped platform flying the flag. Turned a little towards the camera.
# Run: blender -b --factory-startup -P hue.py -- hue-1024.png 1024 hue.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'lawn': toon('lawn', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'stone': toon('stone', '#c8c0b0', shadow_mul=(0.84, 0.82, 0.88), lift=0.1),
    'stoneDark': toon('stoneDark', '#a8a090', shadow_mul=(0.84, 0.82, 0.88)),
    'red': toon('red', '#b8302a'),
    'roofYellow': toon('roofYellow', '#e8b830', lift=0.25),
    'roofGreen': toon('roofGreen', '#3f8a6a'),
    'door': flat('door', '#2e2a28'),
    'moat': toon('moat', '#4a8aa0', lift=0.3),
    'pad': toon('pad', '#4f9a4a'),
    'lotus': toon('lotus', '#f07ab0', lift=0.25),
    'flag': toon('flag', '#d8302a', lift=0.2),
    'gold': toon('gold', '#f0c030', lift=0.35),
})

G = tile(M['lawn'])
before = set(bpy.data.objects)
rng = random.Random(2087)

# ---------- the moat ----------
box('moat', M['moat'], 0.0, -0.55, G - 0.004, 2.7, 0.4, 0.01, outline=0.004, bevel=0)
for k in range(10):
    x, y = rng.uniform(-1.0, 1.0), -0.55 + rng.uniform(-0.14, 0.14)
    if math.hypot(x, y) > 1.15:
        continue
    lathe(f'pad{k}', M['pad'], ((0.04, 0), (0.04, 0.006)), G + 0.002, x, y, segs=12, outline=0.002)
    if k % 2:
        lathe(f'lotus{k}', M['lotus'], ((0.01, 0), (0.028, 0.022), (0.004, 0.045)), G + 0.008, x, y, segs=6, outline=0.003, smooth=False)
box('causeway', M['stone'], 0.0, -0.55, G - 0.005, 0.2, 0.44, 0.04, outline=0.005, bevel=0)

# ---------- the gate's stone base ----------
GX, GY = 0.0, 0.2
loft('gatebase', M['stone'], [[(GX - 0.85, GY - 0.2, G - 0.005), (GX + 0.85, GY - 0.2, G - 0.005), (GX + 0.85, GY + 0.25, G - 0.005), (GX - 0.85, GY + 0.25, G - 0.005)],
                              [(GX - 0.82, GY - 0.17, G + 0.25), (GX + 0.82, GY - 0.17, G + 0.25), (GX + 0.82, GY + 0.22, G + 0.25), (GX - 0.82, GY + 0.22, G + 0.25)]],
     outline=0.012)
for k, (x, w, h) in enumerate(((-0.3, 0.1, 0.14), (0.0, 0.14, 0.18), (0.3, 0.1, 0.14))):
    box(f'gateway{k}', M['door'], GX + x, GY - 0.19, G - 0.005, w, 0.006, h, outline=0, bevel=0)
    lathe(f'gatewayarch{k}', M['door'], ((w / 2, 0), (w / 2 * 0.7, w * 0.25), (0.004, w * 0.45)), G + h - 0.01, GX + x, GY - 0.19, segs=4, outline=0, smooth=False)
for k in range(17):
    box(f'parapet{k}', M['stoneDark'], GX - 0.8 + k * 0.1, GY - 0.165, G + 0.245, 0.05, 0.03, 0.035, outline=0.002, bevel=0)

# ---------- the Five Phoenix Pavilion ----------
T = G + 0.25
box('pavilionfloor', M['stoneDark'], GX, GY + 0.02, T - 0.005, 0.9, 0.3, 0.02, outline=0.004, bevel=0)
for i in range(7):
    for s in (-1, 1):
        x = GX - 0.39 + i * 0.13
        rod(f'pavcol{i}{s}', M['red'], (x, GY + 0.02 + s * 0.11, T + 0.015), (x, GY + 0.02 + s * 0.11, T + 0.14), 0.014, segs=8, outline=0.003)


def roof(name, x, y, z, w, d, h, mat):
    loft(name, M[mat], [[(x - w / 2, y - d / 2, z), (x + w / 2, y - d / 2, z), (x + w / 2, y + d / 2, z), (x - w / 2, y + d / 2, z)],
                        [(x - w / 2 + d * 0.35, y - 0.004, z + h), (x + w / 2 - d * 0.35, y - 0.004, z + h), (x + w / 2 - d * 0.35, y + 0.004, z + h), (x - w / 2 + d * 0.35, y + 0.004, z + h)]],
         outline=0.007)
    for s in (-1, 1):
        lathe(f'{name}tip{s}', M[mat], ((0.02, 0), (0.004, 0.05)), z - 0.01, x + s * (w / 2 - 0.01), y - d / 2 + 0.01, segs=4, outline=0.002, smooth=False)


roof('roofLower', GX, GY + 0.02, T + 0.135, 1.0, 0.4, 0.1, 'roofYellow')
box('upperwall', M['red'], GX, GY + 0.02, T + 0.2, 0.5, 0.2, 0.08, outline=0.005, bevel=0)
roof('roofUpper', GX, GY + 0.02, T + 0.275, 0.62, 0.3, 0.11, 'roofYellow')
for s in (-1, 1):
    box(f'wingpav{s}', M['red'], GX + s * 0.6, GY + 0.02, T - 0.005, 0.2, 0.2, 0.12, outline=0.005, bevel=0)
    roof(f'wingroof{s}', GX + s * 0.6, GY + 0.02, T + 0.11, 0.28, 0.28, 0.09, 'roofGreen')
ball('ridgepearl', M['gold'], GX, GY + 0.02, T + 0.39, 0.025, outline=0.003)

# ---------- the Flag Tower ----------
FX, FY = 0.85, -0.15
for j in range(3):
    box(f'flagstep{j}', M['stone'], FX, FY, G - 0.005 + j * 0.06, 0.32 - j * 0.07, 0.32 - j * 0.07, 0.065, outline=0.006, bevel=0)
rod('flagpole', M['stoneDark'], (FX, FY, G + 0.18), (FX, FY, G + 0.85), 0.012, r2=0.008, segs=8, outline=0.003)
box('flagcloth', M['flag'], FX + 0.09, FY, G + 0.72, 0.18, 0.008, 0.12, outline=0.003, bevel=0)
# Vietnam's flag: a yellow five-pointed star on red (a pentagon and five points, each convex)
SCX, SCZ, RO = FX + 0.09, G + 0.78, 0.042
RI = RO * 0.382
tips = [(SCX + RO * math.cos(math.pi / 2 + 2 * math.pi * j / 5), SCZ + RO * math.sin(math.pi / 2 + 2 * math.pi * j / 5)) for j in range(5)]
inner = [(SCX + RI * math.cos(math.pi / 2 + math.pi / 5 + 2 * math.pi * j / 5), SCZ + RI * math.sin(math.pi / 2 + math.pi / 5 + 2 * math.pi * j / 5)) for j in range(5)]
for yy in (FY - 0.0045, FY + 0.0045):
    side = 'f' if yy < FY else 'b'
    loft(f'starmid{side}', M['gold'], [[(x, yy, z) for x, z in inner], [(x, yy + (0.0015 if yy > FY else -0.0015), z) for x, z in inner]], outline=0)
    for j in range(5):
        tri = [inner[j - 1], tips[j], inner[j]]
        loft(f'starpoint{side}{j}', M['gold'], [[(x, yy, z) for x, z in tri], [(x, yy + (0.0015 if yy > FY else -0.0015), z) for x, z in tri]], outline=0)

turn(before, -20)
render(G)
