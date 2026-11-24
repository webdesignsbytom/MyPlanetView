# A cartoon Pantheon for the country maps, built in the set's shared look (../toon.py): Rome's
# ancient temple on the Piazza della Rotonda, the deep portico of sixteen granite columns under its
# pediment, the brick rotunda behind and the great shallow dome with its open oculus, the obelisk
# fountain in the square and the ochre houses round it. Turned a little towards the camera.
# Run: blender -b --factory-startup -P pantheon.py -- pantheon-1024.png 1024 pantheon.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#c8bca8', shadow_mul=(0.84, 0.82, 0.88), lift=0.2),
    'marble': toon('marble', '#e8e0cc', shadow_mul=(0.84, 0.84, 0.88), lift=0.12),
    'granite': toon('granite', '#a8a098', shadow_mul=(0.84, 0.84, 0.88), lift=0.06),
    'brick': toon('brick', '#c89870', shadow_mul=(0.86, 0.82, 0.78)),
    'lead': toon('lead', '#9aa0a6', shadow_mul=(0.84, 0.86, 0.92), lift=0.08),
    'dark': flat('dark', '#2e2a28'),
    'ochre': toon('ochre', '#e8b870', lift=0.1),
    'rose': toon('rose', '#e0a080', lift=0.1),
    'roof': toon('roof', '#c4603e'),
    'water': toon('water', '#5aa8d0', lift=0.3),
    'window': flat('window', '#3a3430'),
})

G = tile(M['paving'])
before = set(bpy.data.objects)

RX, RY = 0.0, 0.32
lathe('rotunda', M['brick'], ((0.34, 0), (0.34, 0.26)), G - 0.005, RX, RY, segs=32, outline=0.009)
for z in (0.12, 0.2):
    lathe(f'cornice{z}', M['marble'], ((0.345, 0), (0.345, 0.012)), G + z, RX, RY, segs=32, outline=0.002)
lathe('step1', M['lead'], ((0.33, 0), (0.3, 0.03)), G + 0.255, RX, RY, segs=32, outline=0.004)
lathe('dome', M['lead'], ((0.3, 0), (0.27, 0.06), (0.19, 0.12), (0.08, 0.155), (0.05, 0.16)), G + 0.28, RX, RY, segs=32, outline=0.007)
lathe('oculusrim', M['marble'], ((0.052, 0), (0.052, 0.012)), G + 0.44, RX, RY, segs=16, outline=0.001)
lathe('oculus', M['dark'], ((0.044, 0), (0.044, 0.014)), G + 0.441, RX, RY, segs=16, outline=0)

# the block joining portico and rotunda
box('intermediate', M['brick'], 0.0, 0.02, G - 0.005, 0.44, 0.16, 0.3, outline=0.008, bevel=0)
loft('intermediatepediment', M['lead'], [[(-0.2, -0.06, G + 0.295), (0.2, -0.06, G + 0.295), (0.2, 0.1, G + 0.295), (-0.2, 0.1, G + 0.295)],
                                         [(-0.004, -0.06, G + 0.38), (0.004, -0.06, G + 0.38), (0.004, 0.1, G + 0.38), (-0.004, 0.1, G + 0.38)]], outline=0.004)

# ---------- the portico ----------
PY0, PY1 = -0.36, -0.06
box('podium', M['marble'], 0.0, (PY0 + PY1) / 2, G - 0.005, 0.46, PY1 - PY0 + 0.02, 0.035, outline=0.004, bevel=0)
for k in range(3):
    box(f'step{k}', M['marble'], 0.0, PY0 - 0.02 - k * 0.025, G - 0.005, 0.3, 0.03, 0.03 - k * 0.01, outline=0.002, bevel=0)
for row, y in enumerate((PY0 + 0.03, PY0 + 0.13, PY0 + 0.23)):
    xs = [-0.19 + j * 0.0543 for j in range(8)] if row == 0 else [-0.19 + 0.0543, -0.19 + 0.0543 * 3, 0.19 - 0.0543 * 3, 0.19 - 0.0543]
    for j, x in enumerate(xs):
        rod(f'col{row}{j}', M['granite'], (x, y, G + 0.03), (x, y, G + 0.24), 0.018, segs=12, outline=0.002)
        box(f'capital{row}{j}', M['marble'], x, y, G + 0.235, 0.045, 0.045, 0.02, outline=0.001, bevel=0)
box('door', M['dark'], 0.0, PY1 + 0.0, G + 0.03, 0.09, 0.006, 0.16, outline=0, bevel=0)
box('entablature', M['marble'], 0.0, (PY0 + PY1) / 2, G + 0.255, 0.46, PY1 - PY0 + 0.02, 0.05, outline=0.005, bevel=0)
loft('pediment', M['marble'], [[(-0.23, PY0 - 0.01, G + 0.3), (0.23, PY0 - 0.01, G + 0.3), (0.23, PY1 + 0.01, G + 0.3), (-0.23, PY1 + 0.01, G + 0.3)],
                               [(-0.004, PY0 - 0.01, G + 0.39), (0.004, PY0 - 0.01, G + 0.39), (0.004, PY1 + 0.01, G + 0.39), (-0.004, PY1 + 0.01, G + 0.39)]], outline=0.005)
box('inscription', M['dark'], 0.0, PY0 - 0.012, G + 0.27, 0.22, 0.004, 0.012, outline=0, bevel=0)

# ---------- the fountain and obelisk ----------
FX, FY = 0.0, -0.7
lathe('basin', M['marble'], ((0.12, 0), (0.12, 0.04)), G - 0.005, FX, FY, segs=16, outline=0.003)
lathe('basinwater', M['water'], ((0.11, 0), (0.11, 0.043)), G - 0.005, FX, FY, segs=16, outline=0)
lathe('fountainbase', M['marble'], ((0.04, 0), (0.035, 0.07)), G + 0.035, FX, FY, segs=8, outline=0.002, smooth=False)
lathe('obelisk', M['rose'], ((0.018, 0), (0.012, 0.2), (0.004, 0.23)), G + 0.1, FX, FY, segs=4, outline=0.002, smooth=False)

# ---------- the square's houses ----------
for s in (-1, 1):
    for j, (y, mat, h) in enumerate(((-0.75, 'ochre', 0.2), (-0.45, 'rose', 0.24), (-0.15, 'ochre', 0.22))):
        x = s * 0.66
        box(f'house{s}{j}', M[mat], x, y, G - 0.005, 0.22, 0.28, h, outline=0.006, bevel=0)
        for r in range(3):
            box(f'housewin{s}{j}{r}', M['window'], x - s * 0.112, y, G + 0.04 + r * 0.06, 0.006, 0.18, 0.025, outline=0, bevel=0)
        pyramid(f'houseroof{s}{j}', M['roof'], x, y, G + h - 0.01, 0.24, 0.06, outline=0.003)

turn(before, -20)
render(G)
