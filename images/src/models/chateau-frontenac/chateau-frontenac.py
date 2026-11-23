# A cartoon Château Frontenac for the country maps, built in the set's shared look (../toon.py):
# Québec City's château-style hotel on Cap Diamant, its brick wings and central tower under steep
# green copper roofs and turrets, Dufferin Terrace's boardwalk and kiosks at the cliff's edge, and
# the St Lawrence below with a ferry. Turned a little towards the camera.
# Run: blender -b --factory-startup -P chateau-frontenac.py -- chateau-frontenac-1024.png 1024 chateau-frontenac.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'river': toon('river', '#3a7aa0', shadow_mul=(0.74, 0.82, 0.9), lift=0.3),
    'cliff': toon('cliff', '#8a8278', shadow_mul=(0.84, 0.84, 0.9)),
    'grass': toon('grass2', '#6aa54a', shadow_mul=(0.7, 0.78, 0.8)),
    'brick': toon('brick', '#a85a42', shadow_mul=(0.86, 0.76, 0.72)),
    'stone': toon('stone', '#d8ccb4', shadow_mul=(0.82, 0.8, 0.86), lift=0.15),
    'copper': toon('copper', '#4f9a80', shadow_mul=(0.78, 0.86, 0.84), lift=0.15),
    'window': flat('window', '#3a3640'),
    'boardwalk': toon('boardwalk', '#b8946a'),
    'kiosk': toon('kiosk', '#f8f6f0', lift=0.2),
    'ferry': toon('ferry', '#f6f3ec', shadow_mul=(0.8, 0.8, 0.9), lift=0.2),
    'ferryBlue': toon('ferryBlue', '#2f5a9a'),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['river'])
before = set(bpy.data.objects)
rng = random.Random(1327)


def segment(c, r, z, n=26):
    a0 = math.asin(c / r)
    return [(r * math.cos(a), r * math.sin(a), G + z) for a in (a0 + (math.pi - 2 * a0) * j / (n - 1) for j in range(n))]


# ---------- Cap Diamant: a cliff, grass on top ----------
cl = loft('cliff', M['cliff'], [segment(-0.28, 1.41, -0.01), segment(-0.25, 1.4, 0.22)], outline=0.018)
cl.visible_shadow = False
top = loft('capgrass', M['grass'], [segment(-0.25, 1.4, 0.215), segment(-0.23, 1.39, 0.24)], outline=0.008)
top.visible_shadow = False
T = G + 0.24
box('boardwalk', M['boardwalk'], 0.0, -0.13, T - 0.005, 2.2, 0.16, 0.015, outline=0.005, bevel=0)
for k, x in enumerate((-0.85, -0.3, 0.55)):
    for j in range(4):
        a = math.pi / 4 + j * math.pi / 2
        rod(f'kioskpost{k}{j}', M['kiosk'], (x + 0.04 * math.cos(a), -0.14 + 0.04 * math.sin(a), T), (x + 0.04 * math.cos(a), -0.14 + 0.04 * math.sin(a), T + 0.07), 0.004,
            segs=5, outline=0)
    lathe(f'kioskroof{k}', M['copper'], ((0.065, 0), (0.035, 0.035), (0.004, 0.06)), T + 0.07, x, -0.14, segs=8, outline=0.005)


# ---------- the château: brick wings under steep copper roofs ----------
def wing(name, x, y, w, d, h, a=0.0):
    c, s = math.cos(a), math.sin(a)

    def p(u, v, z):
        return (x + u * c - v * s, y + u * s + v * c, z)

    box(name, M['brick'], x, y, T - 0.005, w, d, h, rot_z=a, outline=0.012, bevel=0)
    box(f'{name}base', M['stone'], x, y, T - 0.005, w + 0.006, d + 0.006, 0.04, rot_z=a, outline=0.004, bevel=0)
    loft(f'{name}roof', M['copper'], [[p(-w / 2 - 0.01, -d / 2 - 0.01, T + h), p(w / 2 + 0.01, -d / 2 - 0.01, T + h), p(w / 2 + 0.01, d / 2 + 0.01, T + h),
                                       p(-w / 2 - 0.01, d / 2 + 0.01, T + h)],
                                      [p(-w / 2 + 0.04, -0.008, T + h + 0.13), p(w / 2 - 0.04, -0.008, T + h + 0.13), p(w / 2 - 0.04, 0.008, T + h + 0.13),
                                       p(-w / 2 + 0.04, 0.008, T + h + 0.13)]], outline=0.009)
    n = max(2, int(w / 0.06))
    for row in range(2):
        for j in range(n):
            u = -w / 2 + (j + 0.5) * w / n
            box(f'{name}win{row}{j}', M['window'], *p(u, -d / 2 - 0.004, T + 0.06 + row * 0.07)[:2], T + 0.06 + row * 0.07, 0.018, 0.006, 0.03, rot_z=a, outline=0,
                bevel=0)


CX, CY = 0.0, 0.4
wing('wingleft', CX - 0.4, CY - 0.02, 0.4, 0.16, 0.2, a=0.35)
wing('wingright', CX + 0.4, CY - 0.02, 0.4, 0.16, 0.2, a=-0.35)
wing('wingback', CX, CY + 0.25, 0.4, 0.15, 0.22)
# the central tower
box('tower', M['brick'], CX, CY + 0.02, T - 0.005, 0.22, 0.2, 0.42, outline=0.014, bevel=0)
for row in range(5):
    for j in range(3):
        box(f'towerwin{row}{j}', M['window'], CX - 0.07 + j * 0.07, CY - 0.084, T + 0.06 + row * 0.07, 0.02, 0.006, 0.035, outline=0, bevel=0)
pyramid('towerroof', M['copper'], CX, CY + 0.02, T + 0.415, 0.25, 0.22, outline=0.01)
rod('towerfinial', M['copper'], (CX, CY + 0.02, T + 0.63), (CX, CY + 0.02, T + 0.69), 0.006, segs=6, outline=0)
for k, (x, y) in enumerate(((CX - 0.12, CY - 0.08), (CX + 0.12, CY - 0.08), (CX - 0.6, CY - 0.1), (CX + 0.6, CY - 0.1))):
    h = 0.48 if k < 2 else 0.3
    lathe(f'turret{k}', M['stone'], ((0.035, 0), (0.035, h)), T - 0.005, x, y, segs=12, outline=0.008)
    lathe(f'turretroof{k}', M['copper'], ((0.045, 0), (0.004, 0.14)), T - 0.005 + h, x, y, segs=12, outline=0.006)
for k, (x, y) in enumerate(((-0.95, 0.5), (0.95, 0.55), (-1.0, 0.15), (1.05, 0.2))):
    ball(f'tree{k}', M['tree'], x, y, T + 0.07, rng.uniform(0.07, 0.09), outline=0.012)

# ---------- the ferry on the St Lawrence ----------
FX, FY = -0.3, -0.85
loft('ferry', M['ferry'], [[(FX - 0.22, FY, G), (FX + 0.18, FY - 0.07, G), (FX + 0.24, FY, G), (FX + 0.18, FY + 0.07, G)],
                           [(FX - 0.24, FY, G + 0.06), (FX + 0.18, FY - 0.08, G + 0.06), (FX + 0.3, FY, G + 0.06), (FX + 0.18, FY + 0.08, G + 0.06)]], outline=0.008)
box('ferrydeck', M['ferry'], FX, FY, G + 0.06, 0.28, 0.1, 0.05, outline=0.006, bevel=0)
box('ferrystripe', M['ferryBlue'], FX + 0.03, FY - 0.072, G + 0.025, 0.36, 0.006, 0.018, outline=0, bevel=0)

turn(before, -20)
render(G)
