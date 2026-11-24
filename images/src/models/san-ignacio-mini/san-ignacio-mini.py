# A cartoon San Ignacio Miní for the country maps, built in the set's shared look (../toon.py): the
# ruins of the Jesuit mission among the Guaraní in Misiones, the great front of the church still
# standing in red sandstone with its tall arched portal, its carved pilasters and niches and broken
# top, the stumps of the nave's walls and columns behind it, the low ruined walls of the Guaraní
# houses round the square, and the palms and trees on the red earth and grass. Turned a little
# towards the camera.
# Run: blender -b --factory-startup -P san-ignacio-mini.py -- san-ignacio-mini-1024.png 1024 san-ignacio-mini.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'earth': toon('earth', '#b86a4a', shadow_mul=(0.8, 0.74, 0.78), lift=0.12),
    'sandstone': toon('sandstone', '#b4604a', shadow_mul=(0.8, 0.74, 0.78), lift=0.12),
    'carved': toon('carved', '#cc7c60', lift=0.15),
    'dark': flat('dark', '#3a2a26'),
    'moss': toon('moss', '#6a8a4a'),
    'palm': toon('palm', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#8a6a4a'),
})

G = tile(M['grass'])
before = set(bpy.data.objects)
rng = random.Random(1696)

# ---------- the red earth path to the church ----------
box('path', M['earth'], 0.0, -0.55, G - 0.004, 0.16, 0.8, 0.008, outline=0.001, bevel=0)

# ---------- the church front, still standing ----------
FY = -0.08
W, H = 0.56, 0.44
for s in (-1, 1):
    box(f'frontpart{s}', M['sandstone'], s * (W / 4 + 0.04), FY, G - 0.005, W / 2 - 0.08, 0.06, H, outline=0.007, bevel=0)
box('portaltop', M['sandstone'], 0.0, FY, G + 0.24, 0.16, 0.06, H - 0.245, outline=0.005, bevel=0)
for j in range(6):
    um = (j + 0.5) / 6
    z = G + 0.18 + 0.065 * math.sqrt(max(0.0, 1 - (2 * um - 1) ** 2))
    box(f'portalarch{j}', M['sandstone'], -0.08 + 0.16 * um, FY, z, 0.16 / 6 + 0.002, 0.058, G + 0.245 - z, outline=0.002, bevel=0)
# its broken top: blocks missing along the skyline
for j in range(11):
    x = -W / 2 + 0.025 + j * (W - 0.05) / 10
    h = rng.choice((0.0, 0.02, 0.04, 0.06))
    if h:
        box(f'topstone{j}', M['sandstone'], x, FY, G + H - 0.005, 0.045, 0.06, h, outline=0.002, bevel=0)
loft('pediment', M['sandstone'], [[(-0.12, FY - 0.03, G + H - 0.005), (0.12, FY - 0.03, G + H - 0.005), (0.12, FY + 0.03, G + H - 0.005), (-0.12, FY + 0.03, G + H - 0.005)],
                                  [(-0.02, FY - 0.03, G + H + 0.09), (0.02, FY - 0.03, G + H + 0.09), (0.02, FY + 0.03, G + H + 0.09), (-0.02, FY + 0.03, G + H + 0.09)]], outline=0.004)
# the carving: pilasters, the frame of the portal, niches and the Guaraní angels
for x in (-0.24, -0.13, 0.13, 0.24):
    box(f'pilaster{x}', M['carved'], x, FY - 0.033, G - 0.005, 0.025, 0.008, H - 0.04, outline=0.001, bevel=0)
    for k in range(4):
        box(f'pilasterband{x}{k}', M['dark'], x, FY - 0.038, G + 0.06 + k * 0.09, 0.027, 0.004, 0.008, outline=0, bevel=0)
for s in (-1, 1):
    box(f'niche{s}', M['dark'], s * 0.185, FY - 0.033, G + 0.25, 0.035, 0.006, 0.07, outline=0, bevel=0)
    cyl(f'nichetop{s}', M['dark'], 0.0175, 0.006, segs=10, outline=0, matrix=Matrix.Translation((s * 0.185, FY - 0.033, G + 0.32)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
    box(f'angel{s}', M['carved'], s * 0.06, FY - 0.034, G + 0.29, 0.03, 0.006, 0.05, outline=0, bevel=0)
box('frieze', M['carved'], 0.0, FY - 0.033, G + 0.36, W - 0.06, 0.008, 0.02, outline=0.001, bevel=0)
for k in range(6):
    m = ball(f'moss{k}', M['moss'], 0, 0, 0, 1.0, outline=0.002)
    m.scale = (0.025, 0.012, 0.012)
    m.location = (-W / 2 + 0.05 + rng.random() * (W - 0.1), FY - 0.03, G + 0.05 + rng.random() * 0.3)

# ---------- the ruined nave behind ----------
for s in (-1, 1):
    for k in range(5):
        y = FY + 0.08 + k * 0.12
        h = 0.08 + 0.12 * rng.random()
        box(f'navewall{s}{k}', M['sandstone'], s * 0.27, y, G - 0.005, 0.05, 0.12, h, outline=0.003, bevel=0)
        rod(f'navecolumn{s}{k}', M['sandstone'], (s * 0.12, y, G), (s * 0.12, y, G + 0.04 + 0.1 * rng.random()), 0.022, segs=10, outline=0.002)

# ---------- the Guaraní houses' low walls round the square ----------
for side, x in ((-1, -0.72), (1, 0.72)):
    for k in range(4):
        y = -0.6 + k * 0.3
        if math.hypot(abs(x) + 0.12, abs(y) + 0.1) > 1.22:
            continue
        for dx, dy, sx, sy in ((0, -0.1, 0.24, 0.03), (0, 0.1, 0.24, 0.03), (-0.12, 0, 0.03, 0.2), (0.12, 0, 0.03, 0.2)):
            box(f'house{side}{k}{dx}{dy}', M['sandstone'], x + dx, y + dy, G - 0.005, sx, sy, 0.04 + 0.05 * rng.random(), outline=0.002, bevel=0)

# ---------- palms and trees ----------
for k, (x, y) in enumerate(((-0.45, -0.75), (0.45, -0.7), (-0.4, 0.75), (0.5, 0.7))):
    rod(f'palmtrunk{k}', M['trunk'], (x, y, G), (x, y, G + 0.32), 0.012, segs=6, outline=0.002)
    for j in range(6):
        a = 2 * math.pi * j / 6
        b = ball(f'frond{k}{j}', M['palm'], 0, 0, 0, 1.0, outline=0.003)
        b.scale = (0.08, 0.02, 0.012)
        b.rotation_euler = (0, 0.35, a)
        b.location = (x + 0.06 * math.cos(a), y + 0.06 * math.sin(a), G + 0.31)
for k, (x, y) in enumerate(((0.0, 0.95), (-0.95, 0.35), (0.95, 0.4))):
    ball(f'tree{k}', M['tree'], x, y, G + 0.14, 0.12, outline=0.012)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
