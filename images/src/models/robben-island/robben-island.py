# A cartoon Robben Island for the country maps, built in the set's shared look (../toon.py): the
# low island in Table Bay, the maximum security prison's long grey blocks behind their fences and
# watchtower, the lighthouse, the ferry coming in, and Table Mountain's flat top across the water.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P robben-island.py -- robben-island-1024.png 1024 robben-island.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sea': toon('sea', '#2f7ab8', shadow_mul=(0.76, 0.84, 0.92), lift=0.3),
    'grass': toon('grass2', '#a8b870', shadow_mul=(0.74, 0.8, 0.74)),
    'sand': toon('sand', '#e8d8b0'),
    'prison': toon('prison', '#b8b8b8', shadow_mul=(0.84, 0.84, 0.9), lift=0.1),
    'roof': toon('roof', '#7a7a80'),
    'window': flat('window', '#2e2e34'),
    'fence': toon('fence', '#6a6a70'),
    'white': toon('white', '#f8f6f0', lift=0.2),
    'red': toon('red', '#d8302a'),
    'mountain': toon('mountain', '#8a9aa0', shadow_mul=(0.84, 0.86, 0.92)),
    'mountainTop': toon('mountainTop', '#a8b4b8'),
    'ferry': toon('ferry', '#f6f4ee', lift=0.2),
    'ferryBlue': toon('ferryBlue', '#2f5ab0'),
})

G = tile(M['sea'])
before = set(bpy.data.objects)


def ring(cx, cy, rx, ry, z, k, sides=24):
    return [(cx + rx * math.cos(t) * (1 + 0.05 * math.sin(3 * t + k)), cy + ry * math.sin(t) * (1 + 0.05 * math.cos(2 * t + k)), G + z) for t in (2 * math.pi * j / sides for j in range(sides))]


def segment(c, r, z, n=26):
    a0 = math.asin(c / r)
    return [(r * math.cos(a), r * math.sin(a), G + z) for a in (a0 + (math.pi - 2 * a0) * j / (n - 1) for j in range(n))]


# ---------- Table Mountain across the bay ----------
mt = loft('tablemountain', M['mountain'], [segment(0.85, 1.36, -0.01), segment(0.9, 1.3, 0.3), segment(0.95, 1.22, 0.36)], outline=0.012)
mt.visible_shadow = False

# ---------- the island ----------
loft('beach', M['sand'], [ring(0.0, -0.05, 0.98, 0.62, -0.01, 1), ring(0.0, -0.05, 0.96, 0.6, 0.03, 1)], outline=0.008, smooth=True)
isle = loft('island', M['grass'], [ring(0.0, -0.05, 0.9, 0.55, 0.0, 1), ring(0.0, -0.05, 0.88, 0.53, 0.05, 1)], outline=0.008, smooth=True)
isle.visible_shadow = False
T = G + 0.05

# ---------- the prison ----------
for k in range(3):
    y = 0.15 - k * 0.2
    box(f'block{k}', M['prison'], -0.2, y, T - 0.005, 0.7, 0.12, 0.12, outline=0.008, bevel=0)
    loft(f'blockroof{k}', M['roof'], [[(-0.55, y - 0.065, T + 0.115), (0.15, y - 0.065, T + 0.115), (0.15, y + 0.065, T + 0.115), (-0.55, y + 0.065, T + 0.115)],
                                      [(-0.55, y - 0.004, T + 0.16), (0.15, y - 0.004, T + 0.16), (0.15, y + 0.004, T + 0.16), (-0.55, y + 0.004, T + 0.16)]], outline=0.005)
    for j in range(8):
        box(f'blockwin{k}{j}', M['window'], -0.5 + j * 0.085, y - 0.062, T + 0.05, 0.025, 0.006, 0.03, outline=0, bevel=0)
for j in range(14):
    x = -0.62 + j * 0.065
    rod(f'fencepost{j}', M['fence'], (x, -0.4, T), (x, -0.4, T + 0.1), 0.005, segs=4, outline=0)
for z in (0.04, 0.09):
    bar(f'fencewire{z}', M['fence'], (-0.62, -0.4, T + z), (0.23, -0.4, T + z), 0.004, outline=0)
box('watchtowerlegs', M['fence'], 0.3, -0.38, T - 0.005, 0.06, 0.06, 0.2, outline=0.004, bevel=0)
box('watchtowerhut', M['prison'], 0.3, -0.38, T + 0.19, 0.1, 0.1, 0.07, outline=0.004, bevel=0)
pyramid('watchtowerroof', M['roof'], 0.3, -0.38, T + 0.255, 0.12, 0.05, outline=0.003)

# ---------- the lighthouse ----------
LX, LY = 0.6, 0.15
lathe('lighthouse', M['white'], ((0.06, 0), (0.045, 0.4)), T - 0.005, LX, LY, segs=14, outline=0.006)
lathe('lighthouseband', M['red'], ((0.055, 0), (0.051, 0.06)), T + 0.15, LX, LY, segs=14, outline=0)
lathe('lantern', M['red'], ((0.04, 0), (0.04, 0.05)), T + 0.39, LX, LY, segs=10, outline=0.004)
lathe('lanterncap', M['red'], ((0.05, 0), (0.004, 0.05)), T + 0.44, LX, LY, segs=10, outline=0.004)
box('keeperhouse', M['white'], LX + 0.15, LY - 0.05, T - 0.005, 0.14, 0.12, 0.08, outline=0.005, bevel=0)
pyramid('keeperroof', M['red'], LX + 0.15, LY - 0.05, T + 0.075, 0.16, 0.05, outline=0.004)

# ---------- the ferry ----------
FX, FY = 0.5, -0.95
box('ferryhull', M['ferryBlue'], FX, FY, G - 0.002, 0.36, 0.11, 0.04, outline=0.005, bevel=0)
box('ferrycabin', M['ferry'], FX - 0.02, FY, G + 0.035, 0.24, 0.09, 0.06, outline=0.004, bevel=0)
box('ferrywindows', M['window'], FX - 0.02, FY - 0.046, G + 0.06, 0.2, 0.006, 0.02, outline=0, bevel=0)

turn(before, -20)
render(G)
