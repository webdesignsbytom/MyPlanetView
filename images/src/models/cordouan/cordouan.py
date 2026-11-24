# A cartoon Cordouan Lighthouse for the country maps, built in the set's shared look (../toon.py):
# "the king of lighthouses" on its reef in the Gironde estuary, its round stone tower rising in
# Renaissance storeys of columns and windows above the big round courtyard wall (the "circle") on its
# rocky base, the balconies, the domed royal chapel storey, and the lantern on top, with the waves
# breaking round the reef. Turned a little towards the camera.
# Run: blender -b --factory-startup -P cordouan.py -- cordouan-1024.png 1024 cordouan.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sea': toon('sea', '#2a7ab0', shadow_mul=(0.76, 0.84, 0.92), lift=0.3),
    'reef': toon('reef', '#8a8070'),
    'sand': toon('sand', '#d8c8a0'),
    'stone': toon('stone', '#e8e0cc', shadow_mul=(0.84, 0.84, 0.88), lift=0.2),
    'stoneDark': toon('stoneDark', '#c8bca0'),
    'dark': flat('dark', '#2e2e36'),
    'lantern': toon('lantern', '#2a3a4a'),
    'light': flat('light', '#ffe080'),
    'foam': toon('foam', '#f0f8ff', lift=0.4),
})

G = tile(M['sea'])
before = set(bpy.data.objects)
rng = random.Random(1611)

# ---------- the reef and the surf ----------
reef = [(0.7 * math.cos(2 * math.pi * k / 18) * (1 + 0.12 * math.sin(3 * 2 * math.pi * k / 18)), 0.05 + 0.6 * math.sin(2 * math.pi * k / 18)) for k in range(18)]
loft('reef', M['reef'], [[(x, y, G - 0.01) for x, y in reef], [(x * 0.96, 0.05 + (y - 0.05) * 0.96, G + 0.025) for x, y in reef]], outline=0.005)
loft('sandbar', M['sand'], [[(x * 0.8, 0.05 + (y - 0.05) * 0.8, G + 0.02) for x, y in reef], [(x * 0.78, 0.05 + (y - 0.05) * 0.78, G + 0.032) for x, y in reef]], outline=0.002)
for k in range(14):
    a = 2 * math.pi * k / 14 + rng.uniform(-0.1, 0.1)
    r = 0.78
    f = ball(f'foam{k}', M['foam'], 0, 0, 0, rng.uniform(0.04, 0.07), outline=0.003)
    f.scale = (1.6, 0.8, 0.4)
    f.rotation_euler = (0, 0, a + math.pi / 2)
    f.location = (r * math.cos(a) * 1.05, 0.05 + 0.68 * math.sin(a), G + 0.01)

# ---------- the circle: the round wall round the tower's base ----------
CX, CY = 0.0, 0.05
B = G + 0.03
lathe('circle', M['stoneDark'], ((0.32, 0), (0.32, 0.12), (0.34, 0.12), (0.34, 0.14), (0.28, 0.14), (0.28, 0.0)), B, CX, CY, segs=40, outline=0.006, smooth=False)
for k in range(12):
    a = 2 * math.pi * k / 12
    if math.sin(a) > 0.3:
        continue
    box(f'circlewin{k}', M['dark'], CX + 0.322 * math.cos(a), CY + 0.322 * math.sin(a), B + 0.05, 0.03, 0.03, 0.045, rot_z=a + math.pi / 2, outline=0, bevel=0)
lathe('court', M['stone'], ((0.28, 0), (0.28, 0.1)), B, CX, CY, segs=40, outline=0)

# ---------- the tower, storey by storey ----------
Z = B + 0.1
for k, (r, h, cols) in enumerate(((0.2, 0.16, 16), (0.16, 0.14, 12), (0.13, 0.13, 10), (0.105, 0.12, 8))):
    lathe(f'storey{k}', M['stone'], ((r, 0), (r, h)), Z, CX, CY, segs=24, outline=0.006)
    for j in range(cols):
        a = 2 * math.pi * j / cols
        rod(f'pilaster{k}{j}', M['stoneDark'], (CX + (r + 0.004) * math.cos(a), CY + (r + 0.004) * math.sin(a), Z), (CX + (r + 0.004) * math.cos(a), CY + (r + 0.004) * math.sin(a), Z + h), 0.008, segs=5, outline=0)
        if j % 2 == 0 and math.sin(a + math.pi / cols) < 0.3:
            b = a + math.pi / cols
            box(f'storeywin{k}{j}', M['dark'], CX + (r + 0.002) * math.cos(b), CY + (r + 0.002) * math.sin(b), Z + h * 0.3, 0.03, 0.03, h * 0.45, rot_z=b + math.pi / 2, outline=0, bevel=0)
    lathe(f'balcony{k}', M['stoneDark'], ((r + 0.03, 0), (r + 0.03, 0.02)), Z + h, CX, CY, segs=24, outline=0.002)
    Z += h + 0.02
# the domed royal chapel storey and the lantern
lathe('chapeldome', M['stone'], ((0.105, 0), (0.09, 0.05), (0.05, 0.09), (0.04, 0.1)), Z, CX, CY, segs=20, outline=0.004)
lathe('lanternbase', M['stoneDark'], ((0.06, 0), (0.06, 0.02)), Z + 0.095, CX, CY, segs=16, outline=0.002)
lathe('lanternglass', M['light'], ((0.045, 0), (0.045, 0.07)), Z + 0.115, CX, CY, segs=16, outline=0.003)
lathe('lanterncap', M['lantern'], ((0.055, 0), (0.04, 0.03), (0.004, 0.07)), Z + 0.185, CX, CY, segs=16, outline=0.003)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
