# A cartoon Ciudad Universitaria de Caracas for the country maps, built in the set's shared look
# (../toon.py): Carlos Raúl Villanueva's modernist university campus in Venezuela, a synthesis of
# architecture and art: the slender concrete clock tower with its open frame, the Aula Magna's
# great hall, the covered walkways winding between the buildings on thin columns, the
# colourful murals, the library block, and the palms. Turned a little towards the camera.
# Run: blender -b --factory-startup -P caracas-university.py -- caracas-university-1024.png 1024 caracas-university.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#8cc05a', shadow_mul=(0.7, 0.78, 0.8), lift=0.22),
    'concrete': toon('concrete', '#e0dcd2', shadow_mul=(0.82, 0.82, 0.88), lift=0.22),
    'concreteDark': toon('concreteDark', '#b8b4aa'),
    'red': toon('red', '#d84a3a', lift=0.2),
    'blue': toon('blue', '#3a6ab8', lift=0.2),
    'yellow': toon('yellow', '#f0c040', lift=0.2),
    'glass': flat('glass', '#4a6a7a'),
    'paving': toon('paving', '#ddd4c2', lift=0.18),
    'dark': flat('dark', '#2e2622'),
    'palm': toon('palm', '#5aa048', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#7a5a3e'),
})

G = tile()
before = set(bpy.data.objects)
def palm(name, x, y, h=0.3):
    rod(name + "trunk", M["trunk"], (x, y, G), (x + 0.03, y, G + h), 0.012, segs=6, outline=0.002)
    for j in range(6):
        a = 2 * math.pi * j / 6
        bar(f"{name}frond{j}", M["palm"], (x + 0.03, y, G + h), (x + 0.03 + 0.13 * math.cos(a), y + 0.13 * math.sin(a), G + h - 0.05), 0.03, outline=0.002)


box('plaza', M['paving'], 0.0, -0.1, G - 0.004, 1.3, 0.6, 0.008, outline=0.001, bevel=0)

# ---------- the clock tower ----------
TX, TY = -0.35, -0.2
for (ex, ey) in ((-1, -1), (1, -1), (1, 1), (-1, 1)):
    bar(f'towerleg{ex}{ey}', M['concrete'], (TX + ex * 0.05, TY + ey * 0.03, G - 0.005), (TX + ex * 0.035, TY + ey * 0.025, G + 0.62), 0.022, outline=0.002)
for k in range(5):
    box(f'towerband{k}', M['concrete'], TX, TY, G + 0.08 + k * 0.12, 0.1, 0.07, 0.012, outline=0.001, bevel=0)
box('towerclock', M['concrete'], TX, TY, G + 0.56, 0.09, 0.07, 0.08, outline=0.003, bevel=0)
cyl('clockface', M['dark'], 0.025, 0.006, segs=16, outline=0, matrix=Matrix.Translation((TX, TY - 0.038, G + 0.6)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))

# ---------- the Aula Magna ----------
AX, AY = 0.25, 0.4
loft('aula', M['concrete'], [[(AX - 0.3, AY - 0.2, G - 0.005), (AX + 0.3, AY - 0.2, G - 0.005), (AX + 0.3, AY + 0.2, G - 0.005), (AX - 0.3, AY + 0.2, G - 0.005)],
                             [(AX - 0.3, AY - 0.2, G + 0.14), (AX + 0.3, AY - 0.2, G + 0.14), (AX + 0.3, AY + 0.2, G + 0.28), (AX - 0.3, AY + 0.2, G + 0.28)]], outline=0.007)
for j, mat in enumerate((M['red'], M['yellow'], M['blue'])):
    box(f'mural{j}', mat, AX - 0.18 + j * 0.18, AY - 0.203, G + 0.02, 0.14, 0.006, 0.09, outline=0, bevel=0)
box('aulaentrance', M['glass'], AX, AY - 0.205, G - 0.005, 0.12, 0.006, 0.07, outline=0, bevel=0)

# ---------- the library block ----------
LX, LY = -0.55, 0.45
box('library', M['concrete'], LX, LY, G - 0.005, 0.3, 0.2, 0.3, outline=0.006, bevel=0)
for r in range(4):
    box(f'librarystrip{r}', M['glass'], LX, LY - 0.103, G + 0.04 + r * 0.065, 0.26, 0.006, 0.03, outline=0, bevel=0)
box('librarybrise', M['concreteDark'], LX + 0.153, LY, G - 0.005, 0.006, 0.2, 0.3, outline=0, bevel=0)

# ---------- the covered walkways ----------
WALK = [(-0.25, -0.2), (0.0, -0.05), (0.1, 0.18), (0.25, 0.2)]
for k in range(len(WALK) - 1):
    (x0, y0), (x1, y1) = WALK[k], WALK[k + 1]
    bar(f'walkroof{k}', M['concrete'], (x0, y0, G + 0.1), (x1, y1, G + 0.1), 0.06, outline=0.002)
    for j in range(3):
        t = j / 3
        rod(f'walkcol{k}{j}', M['concreteDark'], (x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, G), (x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, G + 0.07), 0.006, segs=6, outline=0)
bar('walkroof2', M['concrete'], (-0.35, -0.2, G + 0.1), (-0.55, 0.32, G + 0.1), 0.06, outline=0.002)
for j in range(4):
    t = j / 3
    rod(f'walkcol2{j}', M['concreteDark'], (-0.35 - 0.2 * t, -0.2 + 0.52 * t, G), (-0.35 - 0.2 * t, -0.2 + 0.52 * t, G + 0.07), 0.006, segs=6, outline=0)

for k, (x, y) in enumerate(((0.75, -0.3), (0.85, 0.15), (-0.9, 0.0), (0.2, -0.65), (-0.5, -0.65))):
    palm(f'palm{k}', x, y)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
