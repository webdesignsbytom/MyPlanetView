# A cartoon Brihadeeswarar Temple for the country maps, built in the set's shared look (../toon.py):
# the great Chola temple at Thanjavur, its towering pyramidal vimana of granite rising in thirteen
# tiers to the dome-shaped cupola and its golden finial, the hall in front, the Nandi pavilion with
# the giant stone bull facing the shrine, and the courtyard's walls with the gate tower (gopuram).
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P brihadeeswarar.py -- brihadeeswarar-1024.png 1024 brihadeeswarar.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'court': toon('court', '#e0d4b8', shadow_mul=(0.86, 0.82, 0.78), lift=0.2),
    'granite': toon('granite', '#d8b888', shadow_mul=(0.86, 0.8, 0.74), lift=0.1),
    'graniteDark': toon('graniteDark', '#b89868'),
    'bull': toon('bull', '#5a5048', lift=0.08),
    'gold': toon('gold', '#f0c040', lift=0.3),
    'dark': flat('dark', '#3a2e24'),
    'palm': toon('palm', '#5a9a40'),
    'trunk': toon('trunk', '#7a5a3a'),
})

G = tile(M['court'])
before = set(bpy.data.objects)

# ---------- the vimana ----------
VX, VY = 0.0, 0.35
box('vimanabase', M['granite'], VX, VY, G - 0.005, 0.46, 0.46, 0.2, outline=0.008, bevel=0)
for j in range(5):
    box(f'niche{j}', M['graniteDark'], VX - 0.16 + j * 0.08, VY - 0.233, G + 0.04, 0.04, 0.006, 0.12, outline=0, bevel=0)
Z = G + 0.195
w = 0.42
TIERS = 13
for k in range(TIERS):
    h = 0.045
    box(f'tier{k}', M['granite'] if k % 2 == 0 else M['graniteDark'], VX, VY, Z, w, w, h, outline=0.004, bevel=0)
    # the little pavilion shapes along each tier's edge
    if k % 2 == 0:
        n = max(1, int(w / 0.07))
        for j in range(n):
            x = VX - w / 2 + (j + 0.5) * w / n
            box(f'tierkuta{k}{j}', M['granite'], x, VY - w / 2 - 0.004, Z + h - 0.01, 0.03, 0.012, 0.025, outline=0.001, bevel=0)
    Z += h
    w -= 0.025
# the octagonal cupola (shikhara) and its golden finial
box('neck', M['graniteDark'], VX, VY, Z - 0.005, 0.14, 0.14, 0.03, outline=0.003, bevel=0)
lathe('cupola', M['granite'], ((0.11, 0), (0.115, 0.03), (0.1, 0.07), (0.06, 0.1), (0.02, 0.11)), Z + 0.02, VX, VY, segs=8, outline=0.005, smooth=False)
lathe('finial', M['gold'], ((0.02, 0), (0.025, 0.02), (0.008, 0.07), (0.003, 0.1)), Z + 0.125, VX, VY, segs=8, outline=0.002, smooth=False)

# ---------- the hall in front ----------
box('mandapa', M['granite'], VX, VY - 0.38, G - 0.005, 0.3, 0.3, 0.16, outline=0.007, bevel=0)
box('mandaparoof', M['graniteDark'], VX, VY - 0.38, G + 0.155, 0.32, 0.32, 0.03, outline=0.003, bevel=0)
for j in range(4):
    rod(f'mandapacol{j}', M['granite'], (VX - 0.11 + j * 0.073, VY - 0.54, G), (VX - 0.11 + j * 0.073, VY - 0.54, G + 0.16), 0.012, segs=6, outline=0.002)

# ---------- the Nandi pavilion and the bull ----------
NX, NY = 0.0, -0.55
box('nandiplatform', M['granite'], NX, NY, G - 0.005, 0.26, 0.26, 0.04, outline=0.003, bevel=0)
for sx in (-1, 1):
    for sy in (-1, 1):
        rod(f'nandicol{sx}{sy}', M['granite'], (NX + sx * 0.1, NY + sy * 0.1, G + 0.035), (NX + sx * 0.1, NY + sy * 0.1, G + 0.2), 0.014, segs=6, outline=0.002)
box('nandiroof', M['graniteDark'], NX, NY, G + 0.2, 0.28, 0.28, 0.035, outline=0.003, bevel=0)
body = ball('nandi', M['bull'], 0, 0, 0, 0.06, outline=0.005)
body.scale = (0.9, 1.4, 0.75)
body.location = (NX, NY + 0.01, G + 0.08)
ball('nandihump', M['bull'], NX, NY - 0.03, G + 0.12, 0.03, outline=0.003)
head = ball('nandihead', M['bull'], 0, 0, 0, 0.03, outline=0.003)
head.scale = (0.8, 1.2, 1.0)
head.location = (NX, NY + 0.09, G + 0.11)
for s in (-1, 1):
    bar(f'nandihorn{s}', M['bull'], (NX + s * 0.015, NY + 0.1, G + 0.13), (NX + s * 0.03, NY + 0.1, G + 0.155), 0.008, outline=0)

# ---------- the enclosure walls and the gopuram ----------
for s in (-1, 1):
    box(f'sidewall{s}', M['graniteDark'], s * 0.75, -0.01, G - 0.005, 0.05, 1.42, 0.1, outline=0.003, bevel=0)
box('frontwallL', M['graniteDark'], -0.47, -0.72, G - 0.005, 0.55, 0.05, 0.1, outline=0.003, bevel=0)
box('frontwallR', M['graniteDark'], 0.47, -0.72, G - 0.005, 0.55, 0.05, 0.1, outline=0.003, bevel=0)
GX, GY = 0.0, -0.9
w = 0.36
Z = G - 0.005
box('gopurambase', M['granite'], GX, GY, Z, w, 0.18, 0.12, outline=0.006, bevel=0)
box('gopuramgate', M['dark'], GX, GY - 0.093, Z, 0.08, 0.006, 0.1, outline=0, bevel=0)
Z += 0.12
for k in range(4):
    box(f'gopuramtier{k}', M['granite'] if k % 2 else M['graniteDark'], GX, GY, Z, w - k * 0.05, 0.16 - k * 0.02, 0.05, outline=0.003, bevel=0)
    Z += 0.05
loft('gopuramtop', M['granite'], [[(GX - 0.08, GY - 0.05, Z), (GX + 0.08, GY - 0.05, Z), (GX + 0.08, GY + 0.05, Z), (GX - 0.08, GY + 0.05, Z)],
                                  [(GX - 0.06, GY - 0.01, Z + 0.06), (GX + 0.06, GY - 0.01, Z + 0.06), (GX + 0.06, GY + 0.01, Z + 0.06), (GX - 0.06, GY + 0.01, Z + 0.06)]], outline=0.003)
for k, (x, y) in enumerate(((-0.95, -0.45), (0.95, -0.45), (-0.95, 0.5), (0.95, 0.5))):
    rod(f'palmtrunk{k}', M['trunk'], (x, y, G), (x + 0.02, y, G + 0.3), 0.014, segs=6, outline=0.002)
    for j in range(7):
        a = 2 * math.pi * j / 7
        bar(f'palmleaf{k}{j}', M['palm'], (x + 0.02, y, G + 0.3), (x + 0.02 + 0.1 * math.cos(a), y + 0.1 * math.sin(a), G + 0.25), 0.022, outline=0.002)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
