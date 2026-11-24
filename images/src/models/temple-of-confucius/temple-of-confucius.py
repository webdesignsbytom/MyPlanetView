# A cartoon Temple of Confucius, Qufu, for the country maps, built in the set's shared look
# (../toon.py): the Dacheng Hall on its double white marble terrace, its yellow-tiled double eaved
# roof, the ten carved stone columns along its front coiled with dragons, the red walls and lattice
# doors, the Apricot Altar pavilion in the courtyard before it, the old cypresses, and the stele
# pavilions at the sides. Turned a little towards the camera.
# Run: blender -b --factory-startup -P temple-of-confucius.py -- temple-of-confucius-1024.png 1024 temple-of-confucius.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#cfc8b8', shadow_mul=(0.82, 0.8, 0.88), lift=0.2),
    'marble': toon('marble', '#f2f0ea', lift=0.2),
    'stone': toon('stone', '#d0c8b8', lift=0.12),
    'red': toon('red', '#b8372e', shadow_mul=(0.86, 0.76, 0.76), lift=0.08),
    'yellow': toon('yellow', '#e8b030', shadow_mul=(0.86, 0.78, 0.66), lift=0.15),
    'green': toon('green', '#3a8a7a', lift=0.1),
    'gold': toon('gold', '#f0c040', lift=0.25),
    'cypress': toon('cypress', '#3f6a40', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#6a4a36'),
})

G = tile(M['paving'])
before = set(bpy.data.objects)


def hiproof(name, x, y, z, w, d, h, over, ridge=0.5):
    x0, y0 = w / 2 + over, d / 2 + over
    loft(name, M['yellow'], [[(x - x0, y - y0, z), (x + x0, y - y0, z), (x + x0, y + y0, z), (x - x0, y + y0, z)],
                             [(x - x0 + over * 0.7, y - y0 + over * 0.7, z + h * 0.3), (x + x0 - over * 0.7, y - y0 + over * 0.7, z + h * 0.3), (x + x0 - over * 0.7, y + y0 - over * 0.7, z + h * 0.3), (x - x0 + over * 0.7, y + y0 - over * 0.7, z + h * 0.3)],
                             [(x - w * ridge / 2, y - 0.008, z + h), (x + w * ridge / 2, y - 0.008, z + h), (x + w * ridge / 2, y + 0.008, z + h), (x - w * ridge / 2, y + 0.008, z + h)]], outline=0.005)
    box(name + 'ridge', M['yellow'], x, y, z + h - 0.006, w * ridge + 0.03, 0.022, 0.018, outline=0.001, bevel=0)
    for s in (-1, 1):
        ball(name + f'beast{s}', M['green'], x + s * (w * ridge / 2 + 0.015), y, z + h + 0.012, 0.014, outline=0.001)
    for sx in (-1, 1):
        for sy in (-1, 1):
            bar(f'{name}curl{sx}{sy}', M['yellow'], (x + sx * (x0 - over * 0.5), y + sy * (y0 - over * 0.5), z + 0.004), (x + sx * (x0 + 0.015), y + sy * (y0 + 0.015), z + 0.03), 0.02, outline=0.001)


# ---------- the Dacheng Hall ----------
HX, HY = 0.0, 0.35
for k, (w, d, h) in enumerate(((1.0, 0.62, 0.05), (0.88, 0.52, 0.05))):
    box(f'terrace{k}', M['marble'], HX, HY, G - 0.005 + k * 0.05, w, d, h, outline=0.004, bevel=0)
    for j in range(int(w / 0.04)):
        rod(f'balustrade{k}{j}', M['marble'], (HX - w / 2 + 0.02 + j * 0.04, HY - d / 2 + 0.005, G + 0.045 + k * 0.05), (HX - w / 2 + 0.02 + j * 0.04, HY - d / 2 + 0.005, G + 0.07 + k * 0.05), 0.005, segs=4, outline=0)
box('stairs', M['marble'], HX, HY - 0.34, G - 0.005, 0.2, 0.1, 0.07, outline=0.002, bevel=0)
box('dragonramp', M['stone'], HX, HY - 0.34, G + 0.065, 0.06, 0.1, 0.008, outline=0, bevel=0)
Z = G + 0.095
W, D = 0.7, 0.36
box('hallwalls', M['red'], HX, HY + 0.02, Z, W - 0.06, D - 0.06, 0.18, outline=0.006, bevel=0)
for j in range(7):
    box(f'door{j}', M['gold'], HX - 0.27 + j * 0.09, HY + 0.02 - (D - 0.06) / 2 - 0.004, Z + 0.02, 0.06, 0.006, 0.13, outline=0, bevel=0)
# the ten dragon columns along the front
for j in range(10):
    x = HX - W / 2 + 0.02 + j * (W - 0.04) / 9
    rod(f'column{j}', M['marble'], (x, HY - D / 2 + 0.01, Z), (x, HY - D / 2 + 0.01, Z + 0.18), 0.014, segs=8, outline=0.002)
    for k in range(3):
        a = k * 2.1 + j
        ball(f'coil{j}{k}', M['stone'], x + 0.012 * math.cos(a), HY - D / 2 + 0.01 + 0.012 * math.sin(a), Z + 0.04 + k * 0.05, 0.01, outline=0)
box('brackets', M['green'], HX, HY, Z + 0.18, W + 0.02, D + 0.02, 0.03, outline=0.003, bevel=0)
hiproof('roof1', HX, HY, Z + 0.21, W, D, 0.07, 0.1)
box('upperwall', M['red'], HX, HY, Z + 0.26, W - 0.16, D - 0.12, 0.06, outline=0.003, bevel=0)
box('upperbrackets', M['green'], HX, HY, Z + 0.315, W - 0.12, D - 0.08, 0.02, outline=0.002, bevel=0)
hiproof('roof2', HX, HY, Z + 0.335, W - 0.1, D - 0.06, 0.15, 0.09)
box('plaque', M['gold'], HX, HY - D / 2 + 0.03, Z + 0.27, 0.08, 0.006, 0.05, outline=0, bevel=0)

# ---------- the Apricot Altar pavilion in the courtyard ----------
AX, AY = 0.0, -0.5
box('altarbase', M['marble'], AX, AY, G - 0.005, 0.26, 0.26, 0.04, outline=0.003, bevel=0)
for sx in (-1, 1):
    for sy in (-1, 1):
        rod(f'altarcol{sx}{sy}', M['red'], (AX + sx * 0.09, AY + sy * 0.09, G + 0.035), (AX + sx * 0.09, AY + sy * 0.09, G + 0.17), 0.012, segs=6, outline=0.001)
box('altarbrackets', M['green'], AX, AY, G + 0.17, 0.22, 0.22, 0.02, outline=0.002, bevel=0)
hiproof('altarroof', AX, AY, G + 0.19, 0.2, 0.2, 0.12, 0.06, ridge=0.1)

# ---------- the stele pavilions at the sides and the old cypresses ----------
for s in (-1, 1):
    x, y = s * 0.75, -0.2
    box(f'stelehall{s}', M['red'], x, y, G - 0.005, 0.2, 0.2, 0.12, outline=0.004, bevel=0)
    hiproof(f'steleroof{s}', x, y, G + 0.115, 0.2, 0.2, 0.08, 0.05, ridge=0.2)
for k, (x, y) in enumerate(((-0.4, -0.35), (0.4, -0.35), (-0.35, -0.8), (0.35, -0.8), (-0.85, 0.35), (0.85, 0.35))):
    rod(f'cypresstrunk{k}', M['trunk'], (x, y, G), (x + 0.02, y, G + 0.1), 0.016, segs=6, outline=0.002)
    cp = ball(f'cypress{k}', M['cypress'], 0, 0, 0, 0.08, outline=0.01)
    cp.scale = (1.1, 1.1, 1.5)
    cp.location = (x + 0.02, y, G + 0.2)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
