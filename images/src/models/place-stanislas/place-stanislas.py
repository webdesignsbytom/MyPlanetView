# A cartoon Place Stanislas for the country maps, built in the set's shared look (../toon.py):
# Nancy's royal square, the long classical front of the town hall with its balustrade of urns, the
# statue of Stanislas on his pedestal in the middle, and in the corners Jean Lamour's gilded
# wrought-iron grilles curving round the fountains of Neptune and Amphitrite. Turned a little
# towards the camera.
# Run: blender -b --factory-startup -P place-stanislas.py -- place-stanislas-1024.png 1024 place-stanislas.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#e0d8c8', shadow_mul=(0.84, 0.82, 0.88), lift=0.2),
    'band': toon('band', '#c8c0b0'),
    'cream': toon('cream', '#f0e4c8', shadow_mul=(0.86, 0.84, 0.8), lift=0.12),
    'creamDark': toon('creamDark', '#d0c0a0'),
    'slate': toon('slate', '#5a5e66'),
    'gold': toon('gold', '#e8b830', lift=0.3),
    'iron': toon('iron', '#2a2a2e'),
    'bronze': toon('bronze', '#4a5a50'),
    'water': toon('water', '#5aa8d0', lift=0.3),
    'window': flat('window', '#3a3a48'),
})

G = tile(M['paving'])
before = set(bpy.data.objects)
for k in range(3):
    box(f'band{k}', M['band'], 0.0, -0.45 + k * 0.3, G - 0.003, 1.1, 0.02, 0.008, outline=0, bevel=0)

# ---------- the town hall ----------
HY = 0.55
box('townhall', M['cream'], 0.0, HY, G - 0.005, 1.0, 0.22, 0.24, outline=0.009, bevel=0)
for r in range(3):
    for j in range(13):
        x = -0.45 + j * 0.075
        box(f'win{r}{j}', M['window'], x, HY - 0.112, G + 0.03 + r * 0.07, 0.03, 0.006, 0.045, outline=0, bevel=0)
box('centre', M['cream'], 0.0, HY - 0.02, G - 0.005, 0.24, 0.22, 0.27, outline=0.007, bevel=0)
loft('pediment', M['creamDark'], [[(-0.12, HY - 0.13, G + 0.265), (0.12, HY - 0.13, G + 0.265), (0.12, HY - 0.08, G + 0.265), (-0.12, HY - 0.08, G + 0.265)],
                                  [(-0.004, HY - 0.13, G + 0.33), (0.004, HY - 0.13, G + 0.33), (0.004, HY - 0.08, G + 0.33), (-0.004, HY - 0.08, G + 0.33)]], outline=0.003)
cyl('clock', M['gold'], 0.022, 0.006, segs=14, outline=0.001, matrix=Matrix.Translation((0.0, HY - 0.133, G + 0.29)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
box('balustrade', M['creamDark'], 0.0, HY - 0.09, G + 0.235, 1.0, 0.03, 0.03, outline=0.001, bevel=0)
for j in range(11):
    x = -0.45 + j * 0.09
    if abs(x) < 0.1:
        continue
    lathe(f'urn{j}', M['creamDark'], ((0.01, 0), (0.016, 0.02), (0.006, 0.035)), G + 0.265, x, HY - 0.09, segs=8, outline=0.001)
loft('townhallroof', M['slate'], [[(-0.5, HY - 0.08, G + 0.235), (0.5, HY - 0.08, G + 0.235), (0.5, HY + 0.11, G + 0.235), (-0.5, HY + 0.11, G + 0.235)],
                                  [(-0.46, HY + 0.0, G + 0.29), (0.46, HY + 0.0, G + 0.29), (0.46, HY + 0.04, G + 0.29), (-0.46, HY + 0.04, G + 0.29)]], outline=0.004)
box('balcony', M['iron'], 0.0, HY - 0.135, G + 0.1, 0.12, 0.02, 0.025, outline=0, bevel=0)

# ---------- the statue ----------
box('pedestal', M['creamDark'], 0.0, -0.05, G - 0.005, 0.1, 0.1, 0.14, outline=0.004, bevel=0)
lathe('stanislas', M['bronze'], ((0.03, 0), (0.025, 0.06), (0.02, 0.1)), G + 0.135, 0.0, -0.05, segs=10, outline=0.002)
ball('stanislashead', M['bronze'], 0.0, -0.05, G + 0.25, 0.016, outline=0.001)
rod('stanislasarm', M['bronze'], (0.015, -0.05, G + 0.21), (0.05, -0.08, G + 0.24), 0.007, segs=6, outline=0)

# ---------- the gilded grilles and fountains ----------
for s in (-1, 1):
    FX, FY = s * 0.68, -0.45
    lathe(f'fountainbasin{s}', M['creamDark'], ((0.1, 0), (0.1, 0.04)), G - 0.005, FX, FY, segs=18, outline=0.003)
    lathe(f'fountainwater{s}', M['water'], ((0.09, 0), (0.09, 0.043)), G - 0.005, FX, FY, segs=18, outline=0)
    lathe(f'fountainrock{s}', M['creamDark'], ((0.04, 0), (0.03, 0.06)), G + 0.035, FX, FY, segs=8, outline=0.002, smooth=False)
    lathe(f'fountaingod{s}', M['bronze'], ((0.018, 0), (0.014, 0.07)), G + 0.09, FX, FY, segs=8, outline=0.001)
    ball(f'fountaingodhead{s}', M['bronze'], FX, FY, G + 0.17, 0.012, outline=0)
    n = 9
    for k in range(n):
        a0 = math.radians(-30 + 160 * k / n) if s < 0 else math.radians(50 + 160 * k / n)
        a1 = math.radians(-30 + 160 * (k + 1) / n) if s < 0 else math.radians(50 + 160 * (k + 1) / n)
        R = 0.2
        p0 = (FX + R * math.cos(a0), FY + R * math.sin(a0))
        p1 = (FX + R * math.cos(a1), FY + R * math.sin(a1))
        for z in (0.02, 0.12, 0.2):
            bar(f'grillerail{s}{k}{z}', M['iron'], (p0[0], p0[1], G + z), (p1[0], p1[1], G + z), 0.008, outline=0)
        rod(f'grillepost{s}{k}', M['iron'], (p0[0], p0[1], G), (p0[0], p0[1], G + 0.26), 0.007, segs=6, outline=0)
        ball(f'grillegold{s}{k}', M['gold'], p0[0], p0[1], G + 0.27, 0.014, outline=0.001)
        bar(f'grilleswirl{s}{k}', M['gold'], (p0[0], p0[1], G + 0.15), ((p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2, G + 0.18), 0.01, outline=0)
    a = math.radians(50) if s < 0 else math.radians(130)
    gx, gy = FX + 0.2 * math.cos(a), FY + 0.2 * math.sin(a)
    rod(f'grillecrown{s}', M['gold'], (gx, gy, G + 0.26), (gx, gy, G + 0.34), 0.012, segs=8, outline=0.001)
    ball(f'grillecrownball{s}', M['gold'], gx, gy, G + 0.35, 0.02, outline=0.001)

turn(before, -20)
render(G)
