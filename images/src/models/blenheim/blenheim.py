# A cartoon Blenheim Palace for the country maps, built in the set's shared look (../toon.py): the
# English baroque palace in honey-coloured stone, its great columned portico and pediment in the
# middle, the corner towers with their stone finials, the wings round the Great Court, and the
# lawns of Capability Brown's park. Turned a little towards the camera.
# Run: blender -b --factory-startup -P blenheim.py -- blenheim-1024.png 1024 blenheim.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'lawn': toon('lawn', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'court': toon('court', '#d8ccb0', lift=0.15),
    'stone': toon('stone', '#e8cc90', shadow_mul=(0.86, 0.82, 0.76), lift=0.12),
    'stoneDark': toon('stoneDark', '#c8a868', shadow_mul=(0.86, 0.82, 0.76)),
    'roof': toon('roof', '#6a6a70'),
    'window': flat('window', '#3a3a44'),
    'gold': toon('gold', '#f0c030', lift=0.3),
    'tree': toon('tree', '#3f7a3a', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['lawn'])
before = set(bpy.data.objects)

box('greatcourt', M['court'], 0.0, -0.15, G - 0.004, 0.9, 0.5, 0.01, outline=0.003, bevel=0)

# ---------- the main block and its portico ----------
PX, PY = 0.0, 0.3
box('main', M['stone'], PX, PY, G - 0.005, 0.7, 0.3, 0.32, outline=0.011, bevel=0)
for r in range(2):
    for j in range(8):
        x = PX - 0.31 + j * 0.088
        if abs(x) < 0.13:
            continue
        box(f'win{r}{j}', M['window'], x, PY - 0.152, G + 0.06 + r * 0.13, 0.04, 0.006, 0.09, outline=0, bevel=0)
box('portico', M['stone'], PX, PY - 0.19, G - 0.005, 0.26, 0.1, 0.04, outline=0.004, bevel=0)
for j in range(6):
    rod(f'column{j}', M['stone'], (PX - 0.11 + j * 0.044, PY - 0.22, G + 0.035), (PX - 0.11 + j * 0.044, PY - 0.22, G + 0.32), 0.014, segs=10, outline=0.003)
box('entablature', M['stoneDark'], PX, PY - 0.19, G + 0.32, 0.28, 0.1, 0.035, outline=0.004, bevel=0)
loft('pediment', M['stone'], [[(PX - 0.14, PY - 0.24, G + 0.355), (PX + 0.14, PY - 0.24, G + 0.355), (PX + 0.14, PY - 0.14, G + 0.355), (PX - 0.14, PY - 0.14, G + 0.355)],
                              [(PX - 0.004, PY - 0.24, G + 0.44), (PX + 0.004, PY - 0.24, G + 0.44), (PX + 0.004, PY - 0.14, G + 0.44), (PX - 0.004, PY - 0.14, G + 0.44)]], outline=0.005)
box('attic', M['stone'], PX, PY + 0.02, G + 0.315, 0.3, 0.2, 0.12, outline=0.006, bevel=0)
loft('mainroof', M['roof'], [[(PX - 0.36, PY - 0.15, G + 0.315), (PX + 0.36, PY - 0.15, G + 0.315), (PX + 0.36, PY + 0.15, G + 0.315), (PX - 0.36, PY + 0.15, G + 0.315)],
                             [(PX - 0.3, PY - 0.08, G + 0.38), (PX + 0.3, PY - 0.08, G + 0.38), (PX + 0.3, PY + 0.08, G + 0.38), (PX - 0.3, PY + 0.08, G + 0.38)]], outline=0.006)
# the corner towers and their finials
for s in (-1, 1):
    TX = PX + s * 0.38
    box(f'tower{s}', M['stone'], TX, PY, G - 0.005, 0.14, 0.14, 0.44, outline=0.008, bevel=0)
    box(f'towertop{s}', M['stoneDark'], TX, PY, G + 0.435, 0.16, 0.16, 0.03, outline=0.004, bevel=0)
    for sx in (-1, 1):
        for sy in (-1, 1):
            lathe(f'finial{s}{sx}{sy}', M['stone'], ((0.018, 0), (0.025, 0.04), (0.01, 0.08), (0.004, 0.1)), G + 0.465, TX + sx * 0.06, PY + sy * 0.06, segs=8, outline=0.002)
    lathe(f'towercrown{s}', M['stone'], ((0.035, 0), (0.025, 0.06), (0.004, 0.12)), G + 0.465, TX, PY, segs=8, outline=0.003)
    ball(f'towerball{s}', M['gold'], TX, PY, G + 0.6, 0.016, outline=0.002)

# ---------- the wings round the Great Court ----------
for s in (-1, 1):
    WX = PX + s * 0.52
    box(f'wing{s}', M['stone'], WX, PY - 0.3, G - 0.005, 0.18, 0.5, 0.2, outline=0.008, bevel=0)
    for j in range(4):
        box(f'wingwin{s}{j}', M['window'], WX - s * 0.092, PY - 0.5 + j * 0.12, G + 0.07, 0.006, 0.04, 0.08, outline=0, bevel=0)
    loft(f'wingroof{s}', M['roof'], [[(WX - 0.09, PY - 0.55, G + 0.195), (WX + 0.09, PY - 0.55, G + 0.195), (WX + 0.09, PY - 0.05, G + 0.195), (WX - 0.09, PY - 0.05, G + 0.195)],
                                     [(WX - 0.004, PY - 0.55, G + 0.25), (WX + 0.004, PY - 0.55, G + 0.25), (WX + 0.004, PY - 0.05, G + 0.25), (WX - 0.004, PY - 0.05, G + 0.25)]], outline=0.005)
    box(f'gatepier{s}', M['stoneDark'], WX - s * 0.2, PY - 0.62, G - 0.005, 0.06, 0.06, 0.2, outline=0.004, bevel=0)

for k, (x, y) in enumerate(((-0.95, -0.35), (0.95, -0.35), (-0.7, -0.75), (0.7, -0.75), (-0.95, 0.4), (0.95, 0.45))):
    ball(f'tree{k}', M['tree'], x, y, G + 0.12, 0.1, outline=0.009)

turn(before, -20)
render(G)
