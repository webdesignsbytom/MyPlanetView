# A cartoon Chhatrapati Shivaji Terminus for the country maps, built in the set's shared look
# (../toon.py): Mumbai's Victorian Gothic railway station, its great ribbed stone dome topped with
# the statue of Progress, the pointed arches and turrets of its long front and wings round the
# forecourt, and a red double-decker bus and black-and-yellow taxis in front. Turned a little
# towards the camera.
# Run: blender -b --factory-startup -P cst-mumbai.py -- cst-mumbai-1024.png 1024 cst-mumbai.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'road': toon('road', '#8a8a8e', shadow_mul=(0.84, 0.84, 0.9), lift=0.15),
    'stone': toon('stone', '#e8cc98', shadow_mul=(0.86, 0.82, 0.76), lift=0.12),
    'stoneRed': toon('stoneRed', '#c4704a', shadow_mul=(0.86, 0.78, 0.74)),
    'dome': toon('dome', '#7a8a8a', shadow_mul=(0.84, 0.86, 0.9)),
    'window': flat('window', '#3a3a44'),
    'roof': toon('roof', '#6a5a50'),
    'statue': toon('statue', '#c8c0b0'),
    'bus': toon('bus', '#d83a2c'),
    'busWin': toon('busWin', '#8ab0c8', lift=0.3),
    'taxi': toon('taxi', '#2e2a30'),
    'taxiTop': toon('taxiTop', '#f0c030', lift=0.25),
    'tyre': toon('tyre', '#2e2a30'),
    'palm': toon('palm', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#8a6448'),
})

G = tile(M['road'])
before = set(bpy.data.objects)

FX, FY = 0.0, 0.35


def gothic_front(name, x, y, w, h, n):
    box(name, M['stone'], x, y, G - 0.005, w, 0.22, h, outline=0.009, bevel=0)
    for r in range(2):
        for j in range(n):
            px = x - w / 2 + (j + 0.5) * w / n
            box(f'{name}win{r}{j}', M['window'], px, y - 0.112, G + 0.04 + r * (h * 0.45), w / n * 0.45, 0.006, h * 0.28, outline=0, bevel=0)
            lathe(f'{name}point{r}{j}', M['stoneRed'], ((w / n * 0.25, 0), (0.004, w / n * 0.3)), G + 0.04 + r * (h * 0.45) + h * 0.28, px, y - 0.112, segs=4, outline=0, smooth=False)
    box(f'{name}band', M['stoneRed'], x, y - 0.112, G + h * 0.42, w, 0.006, 0.012, outline=0, bevel=0)


# ---------- the main block and its dome ----------
gothic_front('main', FX, FY, 0.44, 0.38, 5)
loft('mainroof', M['roof'], [[(FX - 0.22, FY - 0.11, G + 0.375), (FX + 0.22, FY - 0.11, G + 0.375), (FX + 0.22, FY + 0.11, G + 0.375), (FX - 0.22, FY + 0.11, G + 0.375)],
                             [(FX - 0.12, FY - 0.004, G + 0.43), (FX + 0.12, FY - 0.004, G + 0.43), (FX + 0.12, FY + 0.004, G + 0.43), (FX - 0.12, FY + 0.004, G + 0.43)]], outline=0.006)
lathe('drum', M['stone'], ((0.12, 0), (0.12, 0.1)), G + 0.4, FX, FY, segs=8, outline=0.007, smooth=False)
lathe('dome', M['dome'], ((0.13, 0), (0.125, 0.08), (0.08, 0.16), (0.03, 0.2)), G + 0.495, FX, FY, segs=8, outline=0.008, smooth=False)
for j in range(8):
    a = 2 * math.pi * j / 8
    bar(f'domerib{j}', M['stone'], (FX + 0.13 * math.cos(a), FY + 0.13 * math.sin(a), G + 0.5), (FX + 0.035 * math.cos(a), FY + 0.035 * math.sin(a), G + 0.69), 0.012, outline=0)
lathe('statuebase', M['stone'], ((0.03, 0), (0.025, 0.04)), G + 0.69, FX, FY, segs=8, outline=0.003)
lathe('progress', M['statue'], ((0.02, 0), (0.014, 0.08)), G + 0.73, FX, FY, segs=8, outline=0.003)
rod('torch', M['statue'], (FX, FY, G + 0.8), (FX + 0.02, FY, G + 0.86), 0.005, segs=4, outline=0)
for sx in (-1, 1):
    for sy in (-1, 1):
        lathe(f'turret{sx}{sy}', M['stone'], ((0.035, 0), (0.035, 0.1)), G + 0.37, FX + sx * 0.2, FY + sy * 0.09, segs=8, outline=0.003, smooth=False)
        lathe(f'turretcap{sx}{sy}', M['dome'], ((0.04, 0), (0.004, 0.08)), G + 0.47, FX + sx * 0.2, FY + sy * 0.09, segs=8, outline=0.003, smooth=False)

# ---------- the wings round the forecourt ----------
for s in (-1, 1):
    gothic_front(f'wing{s}', FX + s * 0.42, FY - 0.1, 0.4, 0.3, 4)
    loft(f'wingroof{s}', M['roof'], [[(FX + s * 0.42 - 0.2, FY - 0.21, G + 0.295), (FX + s * 0.42 + 0.2, FY - 0.21, G + 0.295), (FX + s * 0.42 + 0.2, FY + 0.01, G + 0.295), (FX + s * 0.42 - 0.2, FY + 0.01, G + 0.295)],
                                     [(FX + s * 0.42 - 0.15, FY - 0.104, G + 0.36), (FX + s * 0.42 + 0.15, FY - 0.104, G + 0.36), (FX + s * 0.42 + 0.15, FY - 0.096, G + 0.36), (FX + s * 0.42 - 0.15, FY - 0.096, G + 0.36)]], outline=0.005)
    lathe(f'wingtower{s}', M['stone'], ((0.05, 0), (0.05, 0.4)), G - 0.005, FX + s * 0.64, FY - 0.2, segs=8, outline=0.005, smooth=False)
    lathe(f'wingtowercap{s}', M['dome'], ((0.06, 0), (0.004, 0.12)), G + 0.395, FX + s * 0.64, FY - 0.2, segs=8, outline=0.004, smooth=False)

# ---------- traffic in front ----------
BX, BY = -0.25, -0.5
box('bus', M['bus'], BX, BY, G + 0.03, 0.34, 0.11, 0.18, outline=0.006, bevel=0)
for r in range(2):
    box(f'buswin{r}', M['busWin'], BX, BY - 0.057, G + 0.07 + r * 0.08, 0.3, 0.006, 0.04, outline=0, bevel=0)
for s in (-1, 1):
    cyl(f'bustyre{s}', M['tyre'], 0.035, 0.12, segs=12, outline=0.003, matrix=Matrix.Translation((BX + s * 0.11, BY + 0.06, G + 0.035)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
for k, (x, y) in enumerate(((0.3, -0.55), (0.55, -0.4))):
    box(f'taxi{k}', M['taxi'], x, y, G + 0.025, 0.16, 0.08, 0.05, outline=0.004, bevel=0)
    box(f'taxitop{k}', M['taxiTop'], x, y, G + 0.07, 0.1, 0.075, 0.04, outline=0.003, bevel=0)
for k, (x, y) in enumerate(((-0.85, -0.25), (0.85, -0.2))):
    rod(f'palmtrunk{k}', M['trunk'], (x, y, G), (x + 0.02, y, G + 0.3), 0.013, r2=0.01, segs=8, outline=0.004)
    for f in range(7):
        b = 2 * math.pi * f / 7 + k
        bar(f'frond{k}{f}', M['palm'], (x + 0.02, y, G + 0.3), (x + 0.02 + 0.1 * math.cos(b), y + 0.1 * math.sin(b), G + 0.25), 0.019, outline=0.005)

turn(before, -20)
render(G)
