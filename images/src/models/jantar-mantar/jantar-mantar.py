# A cartoon Jantar Mantar for the country maps, built in the set's shared look (../toon.py):
# Jaipur's astronomical observatory, the Samrat Yantra, the giant sundial's triangular gnomon with
# its staircase climbing to the little domed kiosk on top and the two great curved quadrant scales
# on either side, the sunken bowls of the Jai Prakash and the round pillared Ram Yantra, all in ochre
# stone with white markings. Turned a little towards the camera.
# Run: blender -b --factory-startup -P jantar-mantar.py -- jantar-mantar-1024.png 1024 jantar-mantar.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'ground': toon('ground', '#e0c898', shadow_mul=(0.86, 0.82, 0.76), lift=0.2),
    'ochre': toon('ochre', '#e0b870', shadow_mul=(0.88, 0.84, 0.76), lift=0.08),
    'ochreDark': toon('ochreDark', '#c09050'),
    'white': toon('white', '#f6f4ee', lift=0.15),
    'dark': flat('dark', '#3a3028'),
    'tree': toon('tree', '#5a9a44', shadow_mul=(0.72, 0.8, 0.74)),
})

G = tile(M['ground'])
before = set(bpy.data.objects)

# ---------- the Samrat Yantra ----------
GX, Y0, Y1, TOP, TH = 0.0, -0.42, 0.42, 0.62, 0.07
loft('gnomon', M['ochre'], [[(GX - TH / 2, Y0, G - 0.005), (GX - TH / 2, Y1, G - 0.005), (GX - TH / 2, Y1, G + TOP)],
                            [(GX + TH / 2, Y0, G - 0.005), (GX + TH / 2, Y1, G - 0.005), (GX + TH / 2, Y1, G + TOP)]], outline=0.008)
n = 16
for i in range(n):
    t = (i + 0.5) / n
    box(f'step{i}', M['ochreDark'], GX, Y0 + t * (Y1 - Y0), G - 0.005, TH + 0.012, 0.03, t * TOP + 0.012, outline=0, bevel=0)
bar('edgeline', M['white'], (GX + TH / 2 + 0.002, Y0, G + 0.004), (GX + TH / 2 + 0.002, Y1, G + TOP), 0.008, outline=0)
for sx in (-1, 1):
    for sy in (-1, 1):
        rod(f'kioskpost{sx}{sy}', M['ochre'], (GX + sx * 0.035, Y1 - 0.04 + sy * 0.035, G + TOP), (GX + sx * 0.035, Y1 - 0.04 + sy * 0.035, G + TOP + 0.07), 0.007, segs=6, outline=0.001)
box('kioskroof', M['ochre'], GX, Y1 - 0.04, G + TOP + 0.07, 0.1, 0.1, 0.012, outline=0.002, bevel=0)
lathe('kioskdome', M['white'], ((0.045, 0), (0.035, 0.03), (0.004, 0.06)), G + TOP + 0.08, GX, Y1 - 0.04, segs=14, outline=0.003)

# the two quadrant scales
CY, CZ, R = 0.05, 0.38, 0.36
for s in (-1, 1):
    m = 14
    for i in range(m):
        a0 = math.radians(-160 + 140 * i / m)
        a1 = math.radians(-160 + 140 * (i + 1) / m)
        p = lambda x, a, dz: (x, CY + R * math.cos(a), G + CZ + R * math.sin(a) + dz)
        x0, x1 = GX + s * 0.05, GX + s * 0.24
        if CZ + R * math.sin(a0) < 0.0 or CZ + R * math.sin(a1) < 0.0:
            continue
        loft(f'quadrant{s}{i}', M['ochre'], [[p(x0, a0, -0.03), p(x1, a0, -0.03), p(x1, a1, -0.03), p(x0, a1, -0.03)],
                                              [p(x0, a0, 0.0), p(x1, a0, 0.0), p(x1, a1, 0.0), p(x0, a1, 0.0)]], outline=0.002)
        bar(f'mark{s}{i}', M['white'], p(x0 + s * 0.01, a0, 0.002), p(x1 - s * 0.01, a0, 0.002), 0.005, outline=0)
    for k, y in enumerate((-0.22, 0.05, 0.32)):
        box(f'quadrantpier{s}{k}', M['ochreDark'], GX + s * 0.145, y, G - 0.005, 0.18, 0.04, max(0.02, CZ - math.sqrt(max(0.0, R * R - (y - CY) ** 2)) + 0.0), outline=0.002, bevel=0)

# ---------- the Jai Prakash bowls ----------
for k, x in enumerate((0.48, 0.78)):
    lathe(f'bowlrim{k}', M['ochre'], ((0.13, 0), (0.13, 0.05)), G - 0.005, x, -0.45, segs=20, outline=0.004)
    lathe(f'bowl{k}', M['dark'], ((0.11, 0), (0.11, 0.052)), G - 0.005, x, -0.45, segs=20, outline=0)
    for j in range(4):
        a = math.pi * j / 4
        bar(f'bowlwire{k}{j}', M['white'], (x + 0.11 * math.cos(a), -0.45 + 0.11 * math.sin(a), G + 0.05), (x - 0.11 * math.cos(a), -0.45 - 0.11 * math.sin(a), G + 0.05), 0.004, outline=0)

# ---------- the Ram Yantra ----------
RX, RY = -0.55, -0.35
lathe('ramwall', M['ochre'], ((0.18, 0), (0.18, 0.04)), G - 0.005, RX, RY, segs=24, outline=0.004)
for j in range(12):
    a = 2 * math.pi * j / 12
    box(f'rampillar{j}', M['ochre'], RX + 0.17 * math.cos(a), RY + 0.17 * math.sin(a), G + 0.035, 0.035, 0.035, 0.14, rot_z=a, outline=0.002, bevel=0)
rod('ramcentre', M['white'], (RX, RY, G), (RX, RY, G + 0.2), 0.016, segs=8, outline=0.002)

for k, (x, y) in enumerate(((-0.8, 0.35), (0.8, 0.3), (-0.4, 0.75), (0.45, 0.72))):
    ball(f'tree{k}', M['tree'], x, y, G + 0.1, 0.1, outline=0.007)

turn(before, -20)
render(G)
