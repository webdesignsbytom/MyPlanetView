# A cartoon Shuri Castle for the country maps, built in the set's shared look (../toon.py): the Ryukyu
# kings' vermilion Seiden hall in Okinawa, its two storeys under red-tiled hip roofs, the great
# carved gable (karahafu) over its entrance with the golden dragon pillars either side of the stair,
# the striped courtyard paving in front, the curving limestone walls of the castle round it, and the
# Shureimon gate with its red tiled roofs. Turned a little towards the camera.
# Run: blender -b --factory-startup -P shuri-castle.py -- shuri-castle-1024.png 1024 shuri-castle.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass2', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'brick': toon('brick', '#c86a50', lift=0.1),
    'white': toon('white', '#f0ece2', lift=0.2),
    'vermilion': toon('vermilion', '#d0402e', shadow_mul=(0.86, 0.76, 0.76), lift=0.1),
    'tile': toon('tile', '#c4503e', shadow_mul=(0.86, 0.8, 0.8)),
    'gold': toon('gold', '#f0c040', lift=0.3),
    'limestone': toon('limestone', '#e2d8bc', shadow_mul=(0.86, 0.84, 0.86), lift=0.15),
    'dark': flat('dark', '#2e2a26'),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['grass'])
before = set(bpy.data.objects)

# ---------- the castle walls, curving round the courtyard ----------
WALL = [(0.95 * math.cos(a), 0.15 + 0.85 * math.sin(a)) for a in [math.radians(d) for d in range(-160, 180, 20)]]
for k in range(len(WALL) - 1):
    (x0, y0), (x1, y1) = WALL[k], WALL[k + 1]
    mx, my = (x0 + x1) / 2, (y0 + y1) / 2
    if my < -0.4 and abs(mx) < 0.3:
        continue   # the gateway in front
    bar(f'wall{k}', M['limestone'], (x0, y0, G + 0.06), (x1, y1, G + 0.06), 0.12, outline=0.005)
    bar(f'wallcap{k}', M['limestone'], (x0, y0, G + 0.13), (x1, y1, G + 0.13), 0.08, outline=0.002)

# ---------- the courtyard (Una) with its striped paving ----------
for k in range(7):
    box(f'una{k}', M['brick'] if k % 2 == 0 else M['white'], -0.27 + k * 0.09, -0.15, G - 0.004, 0.09, 0.5, 0.01, outline=0, bevel=0)


def hiproof(name, x, y, z, w, d, h, over):
    x0, y0 = w / 2 + over, d / 2 + over
    loft(name, M['tile'], [[(x - x0, y - y0, z), (x + x0, y - y0, z), (x + x0, y + y0, z), (x - x0, y + y0, z)],
                           [(x - w * 0.3, y - 0.008, z + h), (x + w * 0.3, y - 0.008, z + h), (x + w * 0.3, y + 0.008, z + h), (x - w * 0.3, y + 0.008, z + h)]], outline=0.005)
    box(f'{name}ridge', M['white'], x, y, z + h - 0.006, w * 0.6 + 0.02, 0.02, 0.016, outline=0.001, bevel=0)
    for s in (-1, 1):
        ball(f'{name}dragon{s}', M['gold'], x + s * (w * 0.3 + 0.01), y, z + h + 0.012, 0.014, outline=0.001)


# ---------- the Seiden ----------
SX, SY = 0.0, 0.35
SW, SD = 0.66, 0.36
box('seidenbase', M['limestone'], SX, SY, G - 0.005, SW + 0.06, SD + 0.06, 0.04, outline=0.004, bevel=0)
box('seiden1', M['vermilion'], SX, SY, G + 0.035, SW, SD, 0.17, outline=0.008, bevel=0)
for j in range(9):
    box(f'door{j}', M['vermilion'], SX - SW / 2 + 0.04 + j * (SW - 0.08) / 8, SY - SD / 2 - 0.004, G + 0.05, 0.05, 0.006, 0.12, outline=0, bevel=0)
    box(f'doorlattice{j}', M['gold'], SX - SW / 2 + 0.04 + j * (SW - 0.08) / 8, SY - SD / 2 - 0.006, G + 0.13, 0.04, 0.004, 0.02, outline=0, bevel=0)
hiproof('roof1', SX, SY, G + 0.2, SW, SD, 0.09, 0.07)
box('seiden2', M['vermilion'], SX, SY + 0.02, G + 0.255, SW - 0.12, SD - 0.1, 0.1, outline=0.006, bevel=0)
hiproof('roof2', SX, SY + 0.02, G + 0.35, SW - 0.12, SD - 0.1, 0.13, 0.07)
# the great karahafu gable over the entrance, with its gold carving
GY = SY - SD / 2 - 0.05
loft('karahafu', M['tile'], [[(SX - 0.14, GY - 0.05, G + 0.2), (SX + 0.14, GY - 0.05, G + 0.2), (SX + 0.14, GY + 0.08, G + 0.2), (SX - 0.14, GY + 0.08, G + 0.2)],
                             [(SX - 0.11, GY - 0.03, G + 0.29), (SX + 0.11, GY - 0.03, G + 0.29), (SX + 0.11, GY + 0.08, G + 0.29), (SX - 0.11, GY + 0.08, G + 0.29)],
                             [(SX - 0.05, GY - 0.01, G + 0.33), (SX + 0.05, GY - 0.01, G + 0.33), (SX + 0.05, GY + 0.08, G + 0.33), (SX - 0.05, GY + 0.08, G + 0.33)]], outline=0.005)
box('karahafugold', M['gold'], SX, GY - 0.045, G + 0.22, 0.14, 0.006, 0.05, outline=0, bevel=0)
# the stair with the two dragon pillars
for i in range(4):
    box(f'stair{i}', M['limestone'], SX, GY - 0.06 - i * 0.03, G - 0.005, 0.18, 0.03, 0.04 - i * 0.01, outline=0.001, bevel=0)
for s in (-1, 1):
    px = SX + s * 0.12
    rod(f'dragonpillar{s}', M['gold'], (px, GY - 0.08, G), (px, GY - 0.08, G + 0.16), 0.016, segs=8, outline=0.002)
    for k in range(4):
        a = k * math.pi / 2
        ball(f'dragoncoil{s}{k}', M['gold'], px + 0.018 * math.cos(a), GY - 0.08 + 0.018 * math.sin(a), G + 0.03 + k * 0.035, 0.012, outline=0)
    ball(f'dragonhead{s}', M['gold'], px, GY - 0.09, G + 0.175, 0.02, outline=0.002)

# ---------- the Shureimon gate in front ----------
MY = -0.82
for k, x in enumerate((-0.12, -0.04, 0.04, 0.12)):
    rod(f'shureicol{k}', M['vermilion'], (x, MY, G), (x, MY, G + 0.12), 0.012, segs=8, outline=0.002)
hiproof('shureiroof1', 0, MY, G + 0.12, 0.28, 0.1, 0.05, 0.05)
box('shureiplaque', M['gold'], 0, MY - 0.06, G + 0.15, 0.06, 0.006, 0.03, outline=0, bevel=0)
box('shureiupper', M['vermilion'], 0, MY, G + 0.16, 0.18, 0.06, 0.04, outline=0.002, bevel=0)
hiproof('shureiroof2', 0, MY, G + 0.2, 0.18, 0.06, 0.06, 0.05)
for k, (x, y) in enumerate(((-0.55, -0.6), (0.55, -0.6), (-0.95, 0.75), (0.95, 0.7))):
    if math.hypot(x, y) > 1.15:
        x, y = x * 0.88, y * 0.88
    ball(f'tree{k}', M['tree'], x, y, G + 0.15, 0.12, outline=0.012)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
