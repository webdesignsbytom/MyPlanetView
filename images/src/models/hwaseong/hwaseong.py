# A cartoon Hwaseong Fortress for the country maps, built in the set's shared look (../toon.py):
# Suwon's fortress walls of stone with their grey brick crenellated parapet running away on either
# side, the great gate's stone base with its arched passage, the two-storey wooden gate pavilion in
# red and green under its sweeping grey tiled roofs, the half-round outer wall guarding it, and a
# little watchtower pavilion along the wall. Turned a little towards the camera.
# Run: blender -b --factory-startup -P hwaseong.py -- hwaseong-1024.png 1024 hwaseong.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass2', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'stone': toon('stone', '#c8bca4', shadow_mul=(0.84, 0.84, 0.88), lift=0.08),
    'brick': toon('brick', '#6a6a6a'),
    'tile': toon('tile', '#4a4e56'),
    'red': toon('red', '#b83a2a'),
    'green': toon('green', '#3a8a6a'),
    'dark': flat('dark', '#2e2a28'),
    'tree': toon('tree', '#3f7a3a', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['grass'])
before = set(bpy.data.objects)


def roof(name, x, y, z, w, d, rise, flare=0.05):
    loft(name, M['tile'], [[(x - w / 2, y - d / 2, z), (x + w / 2, y - d / 2, z), (x + w / 2, y + d / 2, z), (x - w / 2, y + d / 2, z)],
                           [(x - w * 0.3, y - d * 0.15, z + rise), (x + w * 0.3, y - d * 0.15, z + rise), (x + w * 0.3, y + d * 0.15, z + rise), (x - w * 0.3, y + d * 0.15, z + rise)]], outline=0.006)
    for sx in (-1, 1):
        for sy in (-1, 1):
            bar(f'{name}tip{sx}{sy}', M['tile'], (x + sx * w * 0.46, y + sy * d * 0.44, z + 0.005), (x + sx * (w / 2 + flare), y + sy * (d / 2 + flare), z + flare * 0.9), 0.016, outline=0.002)


def pavilion(name, x, y, z, w, d, h, storeys):
    for st in range(storeys):
        sw, sd = w * (1 - 0.25 * st), d * (1 - 0.25 * st)
        for sx in (-1, 1):
            for j in range(4):
                px = x - sw / 2 + 0.02 + j * (sw - 0.04) / 3
                rod(f'{name}post{st}{sx}{j}', M['red'], (px, y + sx * (sd / 2 - 0.02), z), (px, y + sx * (sd / 2 - 0.02), z + h), 0.01, segs=6, outline=0.001)
        box(f'{name}beam{st}', M['green'], x, y, z + h - 0.02, sw, sd, 0.025, outline=0.002, bevel=0)
        box(f'{name}wall{st}', M['red'], x, y, z, sw * 0.8, sd * 0.6, h * 0.8, outline=0.002, bevel=0)
        roof(f'{name}roof{st}', x, y, z + h, sw + 0.08, sd + 0.08, 0.08)
        z += h + 0.06


# ---------- the walls ----------
def wallrun(name, pts):
    for j in range(len(pts) - 1):
        (x0, y0), (x1, y1) = pts[j], pts[j + 1]
        a = math.atan2(y1 - y0, x1 - x0)
        L = math.hypot(x1 - x0, y1 - y0)
        mx, my = (x0 + x1) / 2, (y0 + y1) / 2
        box(f'{name}{j}', M['stone'], mx, my, G - 0.005, L + 0.02, 0.1, 0.14, rot_z=a, outline=0.006, bevel=0)
        box(f'{name}parapet{j}', M['brick'], mx, my, G + 0.135, L + 0.02, 0.06, 0.03, rot_z=a, outline=0.002, bevel=0)
        n = int(L / 0.06)
        for i in range(n):
            t = (i + 0.5) / n
            box(f'{name}merlon{j}{i}', M['brick'], x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, G + 0.16, 0.035, 0.06, 0.035, rot_z=a, outline=0.001, bevel=0)


wallrun('wallL', [(-0.22, 0.25), (-0.55, 0.3), (-0.85, 0.42), (-1.0, 0.6)])
wallrun('wallR', [(0.22, 0.25), (0.55, 0.32), (0.85, 0.48)])

# ---------- the gate ----------
GX, GY = 0.0, 0.25
box('gatebase', M['stone'], GX, GY, G - 0.005, 0.46, 0.24, 0.18, outline=0.008, bevel=0)
box('gatepassage', M['dark'], GX, GY - 0.122, G - 0.005, 0.1, 0.006, 0.08, outline=0, bevel=0)
cyl('gatepassagetop', M['dark'], 0.05, 0.006, segs=16, outline=0, matrix=Matrix.Translation((GX, GY - 0.122, G + 0.075)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
pavilion('gatepavilion', GX, GY, G + 0.175, 0.38, 0.2, 0.1, 2)

# the half-round outer wall in front of the gate
for k in range(12):
    a0, a1 = math.pi + math.pi * k / 12, math.pi + math.pi * (k + 1) / 12
    R = 0.34
    x0, y0 = GX + R * math.cos(a0), GY - 0.02 + R * math.sin(a0) * 1.1
    x1, y1 = GX + R * math.cos(a1), GY - 0.02 + R * math.sin(a1) * 1.1
    a = math.atan2(y1 - y0, x1 - x0)
    box(f'ongseong{k}', M['stone'], (x0 + x1) / 2, (y0 + y1) / 2, G - 0.005, math.hypot(x1 - x0, y1 - y0) + 0.02, 0.07, 0.11, rot_z=a, outline=0.004, bevel=0)
    box(f'ongseongmerlon{k}', M['brick'], (x0 + x1) / 2, (y0 + y1) / 2, G + 0.105, 0.04, 0.05, 0.035, rot_z=a, outline=0.001, bevel=0)
box('ongseonggate', M['dark'], GX - 0.33, GY - 0.05, G - 0.005, 0.006, 0.06, 0.06, outline=0, bevel=0)

# ---------- a watchtower pavilion on the wall ----------
pavilion('watch', 0.62, 0.34, G + 0.16, 0.16, 0.12, 0.07, 1)

for k, (x, y, r) in enumerate(((-0.8, -0.35, 0.11), (0.85, -0.2, 0.1), (-0.5, -0.7, 0.1), (0.55, -0.68, 0.11), (0.2, 0.85, 0.12), (-0.35, 0.8, 0.11))):
    ball(f'tree{k}', M['tree'], x, y, G + r * 1.1, r, outline=0.008)

turn(before, -20)
render(G)
