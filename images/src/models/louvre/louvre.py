# A cartoon Louvre for the country maps, built in the set's shared look (../toon.py): I. M. Pei's
# glass pyramid in the Cour Napoléon with its three little pyramids and the triangular pools, and the
# palace's pale stone wings round the court, their tall pavilions under steep slate roofs and their
# rows of windows. Turned a little towards the camera.
# Run: blender -b --factory-startup -P louvre.py -- louvre-1024.png 1024 louvre.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#d4ccba', shadow_mul=(0.82, 0.8, 0.88), lift=0.2),
    'stone': toon('stone', '#ece0c4', shadow_mul=(0.86, 0.8, 0.78), lift=0.15),
    'stoneDark': toon('stoneDark', '#cdbd98', shadow_mul=(0.86, 0.8, 0.78)),
    'slate': toon('slate', '#5e6a7a', shadow_mul=(0.8, 0.84, 0.9)),
    'window': flat('window', '#3a3a46'),
    'glass': toon('glass', '#9cc8de', shadow_mul=(0.8, 0.88, 0.94), lift=0.35),
    'frame': toon('frame', '#5a6a76'),
    'water': toon('water', '#4a9ac8', lift=0.3),
})

G = tile(M['paving'])
before = set(bpy.data.objects)


def wing(name, x, y, sx, sy, h, along_x):
    """A palace wing with a mansard roof and windows on its court side."""
    box(name, M['stone'], x, y, G - 0.005, sx, sy, h, outline=0.008, bevel=0)
    box(name + 'cornice', M['stoneDark'], x, y, G + h - 0.02, sx + 0.01, sy + 0.01, 0.015, outline=0.002, bevel=0)
    if along_x:
        loft(name + 'roof', M['slate'], [[(x - sx / 2, y - sy / 2, G + h - 0.006), (x + sx / 2, y - sy / 2, G + h - 0.006), (x + sx / 2, y + sy / 2, G + h - 0.006), (x - sx / 2, y + sy / 2, G + h - 0.006)],
                                          [(x - sx / 2, y - sy / 2 + 0.035, G + h + 0.05), (x + sx / 2, y - sy / 2 + 0.035, G + h + 0.05), (x + sx / 2, y + sy / 2 - 0.035, G + h + 0.05), (x - sx / 2, y + sy / 2 - 0.035, G + h + 0.05)]], outline=0.004)
    else:
        loft(name + 'roof', M['slate'], [[(x - sx / 2, y - sy / 2, G + h - 0.006), (x + sx / 2, y - sy / 2, G + h - 0.006), (x + sx / 2, y + sy / 2, G + h - 0.006), (x - sx / 2, y + sy / 2, G + h - 0.006)],
                                          [(x - sx / 2 + 0.035, y - sy / 2, G + h + 0.05), (x + sx / 2 - 0.035, y - sy / 2, G + h + 0.05), (x + sx / 2 - 0.035, y + sy / 2, G + h + 0.05), (x - sx / 2 + 0.035, y + sy / 2, G + h + 0.05)]], outline=0.004)


def pavilion(name, x, y, s, h):
    box(name, M['stone'], x, y, G - 0.005, s, s, h, outline=0.008, bevel=0)
    box(name + 'cornice', M['stoneDark'], x, y, G + h - 0.02, s + 0.012, s + 0.012, 0.015, outline=0.002, bevel=0)
    loft(name + 'roof', M['slate'], [[(x - s / 2, y - s / 2, G + h - 0.006), (x + s / 2, y - s / 2, G + h - 0.006), (x + s / 2, y + s / 2, G + h - 0.006), (x - s / 2, y + s / 2, G + h - 0.006)],
                                      [(x - s / 2 + 0.04, y - s / 2 + 0.04, G + h + 0.12), (x + s / 2 - 0.04, y - s / 2 + 0.04, G + h + 0.12), (x + s / 2 - 0.04, y + s / 2 - 0.04, G + h + 0.12), (x - s / 2 + 0.04, y + s / 2 - 0.04, G + h + 0.12)]], outline=0.004)
    box(name + 'crest', M['stoneDark'], x, y, G + h + 0.115, s - 0.08, s - 0.08, 0.012, outline=0.001, bevel=0)


# ---------- the palace round the court ----------
H = 0.17
wing('backwing', 0, 0.62, 1.3, 0.16, H, True)
for s in (-1, 1):
    wing(f'sidewing{s}', s * 0.72, 0.0, 0.16, 1.0, H, False)
pavilion('sully', 0, 0.62, 0.24, H + 0.05)
for s in (-1, 1):
    pavilion(f'cornerpav{s}', s * 0.72, 0.62, 0.2, H + 0.03)
    pavilion(f'sidepav{s}', s * 0.72, -0.15, 0.2, H + 0.03)
    pavilion(f'endpav{s}', s * 0.72, -0.5, 0.18, H + 0.02)
# the windows: two rows along the court's faces
for row in range(2):
    z = G + 0.03 + row * 0.07
    for j in range(16):
        x = -0.58 + j * 0.078
        if abs(x) < 0.15:
            continue
        box(f'backwin{row}{j}', M['window'], x, 0.62 - 0.083, z, 0.026, 0.006, 0.045, outline=0, bevel=0)
    for s in (-1, 1):
        for j in range(12):
            y = -0.4 + j * 0.085
            if abs(y + 0.15) < 0.12 or y > 0.5:
                continue
            box(f'sidewin{s}{row}{j}', M['window'], s * (0.72 - 0.083), y, z, 0.006, 0.026, 0.045, outline=0, bevel=0)

# ---------- the pyramids and the pools ----------
PY = -0.08
pyramid('pyramid', M['glass'], 0, PY, G, 0.5, 0.36, outline=0.006)
half = 0.25
apex = (0, PY, G + 0.36)
for k in range(4):
    a = k * math.pi / 2 + math.pi / 4
    c = (half * math.sqrt(2) * math.cos(a), PY + half * math.sqrt(2) * math.sin(a), G)
    bar(f'edge{k}', M['frame'], c, apex, 0.008, outline=0)
# the glazing bars on the faces turned to the camera
for face, (dx, dy) in enumerate(((0, -1), (-1, 0), (1, 0))):
    for j in range(1, 5):
        t = j / 5
        z = G + 0.36 * t
        w = half * (1 - t)
        cx, cy = dx * (half * (1 - t)) * 1.002, PY + dy * (half * (1 - t)) * 1.002
        p0 = (cx - abs(dy) * w, cy - abs(dx) * w, z)
        p1 = (cx + abs(dy) * w, cy + abs(dx) * w, z)
        bar(f'glazing{face}{j}', M['frame'], p0, p1, 0.004, outline=0)
for k, (x, y) in enumerate(((-0.45, -0.1), (0.45, -0.1), (0.0, -0.62))):
    pyramid(f'littlepyramid{k}', M['glass'], x, y, G, 0.1, 0.075, outline=0.003)
# the triangular pools: pointing at the pyramid in front, away from it behind
for k, (x, y) in enumerate(((-0.3, -0.42), (0.3, -0.42), (-0.32, 0.26), (0.32, 0.26))):
    if y < 0:
        tri = [(x - 0.15, y - 0.11), (x + 0.15, y - 0.11), (x, y + 0.11)]
    else:
        tri = [(x - 0.15, y + 0.11), (x, y - 0.11), (x + 0.15, y + 0.11)]
    loft(f'poolrim{k}', M['stoneDark'], [[(px, py, G - 0.004) for px, py in tri], [(px, py, G + 0.012) for px, py in tri]], outline=0.002)
    inner = [(x + (px - x) * 0.86, y + (py - y) * 0.86) for px, py in tri]
    loft(f'pool{k}', M['water'], [[(px, py, G + 0.006) for px, py in inner], [(px, py, G + 0.014) for px, py in inner]], outline=0)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
