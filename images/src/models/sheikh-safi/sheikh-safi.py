# A cartoon Sheikh Safi al-Din Shrine for the country maps, built in the set's shared look
# (../toon.py): the Safavid dynasty's family shrine in Ardabil, Iran, its tall round tomb tower
# of brick spelling out "Allah" in blue glazed tiles all round, under a low conical cap, the
# tiled portals and the domes of the halls round the courtyard with its pool, and the garden
# before the gate. Turned a little towards the camera.
# Run: blender -b --factory-startup -P sheikh-safi.py -- sheikh-safi-1024.png 1024 sheikh-safi.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#8cc05a', shadow_mul=(0.7, 0.78, 0.8), lift=0.22),
    'paving': toon('paving', '#ddd0b4', lift=0.18),
    'brick': toon('brick', '#c89a6a', shadow_mul=(0.8, 0.74, 0.78), lift=0.14),
    'tile': toon('tile', '#2a7ab8', lift=0.22),
    'turq': toon('turq', '#3ab0c0', lift=0.25),
    'water': toon('water', '#4a9ac8', lift=0.3),
    'dark': flat('dark', '#2e2420'),
    'tree': toon('tree', '#3e7a3a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#7a5a3e'),
})

G = tile()
before = set(bpy.data.objects)
def tree(name, x, y, r=0.09, h=0.12, mat="tree"):
    rod(name + "trunk", M["trunk"], (x, y, G), (x, y, G + h), 0.012, segs=6, outline=0.002)
    b = ball(name, M[mat], 0, 0, 0, r, outline=0.008)
    b.scale = (1.1, 1.1, 0.95)
    b.location = (x, y, G + h + r * 0.75)


box('courtyard', M['paving'], 0.0, 0.1, G - 0.004, 1.1, 0.8, 0.008, outline=0.001, bevel=0)
box('pool', M['water'], -0.05, -0.05, G - 0.004, 0.26, 0.14, 0.012, outline=0.002, bevel=0)

# ---------- the Allah-Allah tower ----------
TX, TY = 0.25, 0.3
lathe('tower', M['brick'], ((0.1, 0), (0.1, 0.4), (0.105, 0.42)), G - 0.005, TX, TY, segs=24, outline=0.006)
for r in range(4):
    for k in range(10):
        a = 2 * math.pi * k / 10 + r * 0.3
        x, y = TX + 0.102 * math.cos(a), TY + 0.102 * math.sin(a)
        b = box(f'allah{r}{k}', M['tile'], 0, 0, 0, 0.03, 0.006, 0.05, outline=0, bevel=0)
        b.matrix_world = Matrix.Translation((x, y, G + 0.06 + r * 0.085)) @ Matrix.Rotation(a + math.pi / 2, 4, 'Z') @ b.matrix_world
lathe('towercap', M['turq'], ((0.11, 0), (0.06, 0.08), (0.0, 0.1)), G + 0.415, TX, TY, segs=24, outline=0.004)

# ---------- the halls and their domes ----------
box('hall', M['brick'], -0.15, 0.4, G - 0.005, 0.4, 0.24, 0.18, outline=0.006, bevel=0)
for k, (x, r) in enumerate(((-0.25, 0.08), (-0.05, 0.06))):
    lathe(f'halldome{k}', M['turq'] if k == 0 else M['brick'], [(r * math.cos(a), r * 1.1 * math.sin(a)) for a in [j * math.pi / 12 for j in range(7)]], G + 0.175, x, 0.42, segs=16, outline=0.004)
box('hallportal', M['brick'], -0.15, 0.27, G - 0.005, 0.18, 0.04, 0.24, outline=0.004, bevel=0)
box('hallportaltile', M['tile'], -0.15, 0.248, G + 0.02, 0.14, 0.004, 0.2, outline=0, bevel=0)
arch('hallportalarch', M['dark'], -0.15, 0.246, G - 0.005, 0.07, 0.15)
box('sidehall', M['brick'], 0.55, 0.0, G - 0.005, 0.2, 0.4, 0.14, outline=0.005, bevel=0)
for j in range(4):
    arch(f'sidehallarch{j}', M['dark'], 0.447, -0.15 + j * 0.1, G - 0.005, 0.05, 0.1, face='x')

# ---------- the gate and the garden ----------
box('gate', M['brick'], -0.05, -0.32, G - 0.005, 0.24, 0.06, 0.26, outline=0.005, bevel=0)
box('gatetile', M['tile'], -0.05, -0.352, G + 0.02, 0.18, 0.004, 0.22, outline=0, bevel=0)
arch('gatearch', M['dark'], -0.05, -0.355, G - 0.005, 0.09, 0.17)
for k, (x, y) in enumerate(((-0.7, -0.55), (-0.4, -0.75), (0.35, -0.7), (0.7, -0.5), (-0.85, 0.2), (0.9, 0.45))):
    tree(f'tree{k}', x, y)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
