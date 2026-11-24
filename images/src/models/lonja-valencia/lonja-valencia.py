# A cartoon Lonja de la Seda for the country maps, built in the set's shared look (../toon.py):
# Valencia's Gothic silk exchange, its long front of golden stone with the pointed doorway and the
# crown of battlements along the top, the square tower in the middle, the Consulate of the Sea wing
# beside it, and, seen through the open side, the hall's slender spiralling columns; the orange trees
# of its courtyard and the market square in front. Turned a little towards the camera.
# Run: blender -b --factory-startup -P lonja-valencia.py -- lonja-valencia-1024.png 1024 lonja-valencia.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#d8d0c0', shadow_mul=(0.82, 0.8, 0.88), lift=0.2),
    'stone': toon('stone', '#e8d4a8', shadow_mul=(0.86, 0.82, 0.76), lift=0.12),
    'stoneDark': toon('stoneDark', '#c8b084'),
    'dark': flat('dark', '#2e2622'),
    'orange': toon('orange', '#f08a30', lift=0.15),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#6a4a36'),
})

G = tile(M['paving'])
before = set(bpy.data.objects)

FY = -0.05
# ---------- the hall of columns (left), its front and battlements ----------
HX, HW, HD, HH = -0.3, 0.6, 0.5, 0.36
box('hall', M['stone'], HX, FY + HD / 2, G - 0.005, HW, HD, HH, outline=0.009, bevel=0)
box('halldoor', M['dark'], HX, FY - 0.003, G - 0.005, 0.1, 0.006, 0.16, outline=0, bevel=0)
pyramid('halldoortop', M['dark'], HX, FY - 0.003, G + 0.155, 0.1, 0.07, outline=0)
box('halldoorframe', M['stoneDark'], HX, FY - 0.002, G - 0.005, 0.16, 0.004, 0.26, outline=0, bevel=0)
for s in (-1, 1):
    box(f'hallwin{s}', M['dark'], HX + s * 0.18, FY - 0.003, G + 0.18, 0.06, 0.006, 0.1, outline=0, bevel=0)
    pyramid(f'hallwintop{s}', M['dark'], HX + s * 0.18, FY - 0.003, G + 0.28, 0.06, 0.04, outline=0)
for j in range(4):
    box(f'buttress{j}', M['stone'], HX - HW / 2 + j * HW / 3, FY - 0.015, G - 0.005, 0.03, 0.03, HH, outline=0.002, bevel=0)
for j in range(16):
    box(f'crenel{j}', M['stoneDark'], HX - HW / 2 + 0.02 + j * (HW - 0.04) / 15, FY + 0.003, G + HH - 0.005, 0.022, 0.02, 0.04, outline=0.001, bevel=0)
# the hall's open side shows its twisted columns
for j in range(3):
    box(f'sideopen{j}', M['dark'], HX - HW / 2 - 0.003, FY + 0.12 + j * 0.13, G + 0.05, 0.006, 0.08, 0.22, outline=0, bevel=0)
for j in range(3):
    y = FY + 0.12 + j * 0.13
    x = HX - HW / 2 - 0.02
    pts = [(x + 0.012 * math.cos(t * 1.3), y + 0.012 * math.sin(t * 1.3), G + 0.05 + t * 0.022) for t in range(11)]
    for k, (p, q) in enumerate(zip(pts, pts[1:])):
        bar(f'twist{j}{k}', M['stone'], p, q, 0.016, outline=0)

# ---------- the tower ----------
TX = HX + HW / 2 + 0.1
box('tower', M['stone'], TX, FY + 0.15, G - 0.005, 0.2, 0.2, 0.56, outline=0.008, bevel=0)
for k in range(2):
    box(f'towerwin{k}', M['dark'], TX, FY + 0.047, G + 0.2 + k * 0.15, 0.04, 0.006, 0.08, outline=0, bevel=0)
for j in range(5):
    box(f'towercrenel{j}', M['stoneDark'], TX - 0.08 + j * 0.04, FY + 0.05, G + 0.555, 0.022, 0.02, 0.04, outline=0.001, bevel=0)

# ---------- the Consulate of the Sea wing (right) ----------
CX = TX + 0.33
box('consulate', M['stone'], CX, FY + 0.2, G - 0.005, 0.46, 0.4, 0.3, outline=0.008, bevel=0)
for row in range(2):
    for j in range(3):
        box(f'conswin{row}{j}', M['dark'], CX - 0.13 + j * 0.13, FY - 0.003, G + 0.07 + row * 0.12, 0.05, 0.006, 0.07, outline=0, bevel=0)
for j in range(12):
    box(f'conscrenel{j}', M['stoneDark'], CX - 0.21 + j * 0.038, FY + 0.003, G + 0.295, 0.022, 0.02, 0.04, outline=0.001, bevel=0)

# ---------- the orange trees of the courtyard and the square ----------
for k, (x, y) in enumerate(((-0.75, 0.75), (-0.45, 0.85), (0.15, 0.75), (0.55, 0.75), (-0.8, -0.5), (0.75, -0.55))):
    rod(f'trunk{k}', M['trunk'], (x, y, G), (x, y, G + 0.07), 0.012, segs=6, outline=0.002)
    ball(f'tree{k}', M['tree'], x, y, G + 0.14, 0.09, outline=0.01)
    for j in range(3):
        ball(f'fruit{k}{j}', M['orange'], x + 0.06 * math.cos(j * 2.1), y - 0.05, G + 0.12 + 0.03 * j, 0.014, outline=0)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
