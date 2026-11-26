# A cartoon Tabriz Bazaar for the country maps, built in the set's shared look (../toon.py): the
# great covered bazaar of Tabriz in Iran, on the Silk Road, its long brick halls roofed with rows
# of little domes, each with its round skylight, the tall vaulted Timcheh-ye Amir Nezam with its
# big dome over the crossing, the arched shopfronts and the entrance portal. Turned a little
# towards the camera.
# Run: blender -b --factory-startup -P tabriz-bazaar.py -- tabriz-bazaar-1024.png 1024 tabriz-bazaar.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#d8c8a8', shadow_mul=(0.82, 0.8, 0.84), lift=0.18),
    'brick': toon('brick', '#c89a6a', shadow_mul=(0.8, 0.74, 0.78), lift=0.14),
    'brickLight': toon('brickLight', '#d8b080', lift=0.16),
    'tile': toon('tile', '#3a9ab0', lift=0.2),
    'dark': flat('dark', '#2e2420'),
    'tree': toon('tree', '#5a8a40', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#7a5a3e'),
})

G = tile(M['paving'])
before = set(bpy.data.objects)
def tree(name, x, y, r=0.09, h=0.12, mat="tree"):
    rod(name + "trunk", M["trunk"], (x, y, G), (x, y, G + h), 0.012, segs=6, outline=0.002)
    b = ball(name, M[mat], 0, 0, 0, r, outline=0.008)
    b.scale = (1.1, 1.1, 0.95)
    b.location = (x, y, G + h + r * 0.75)



def hall(name, x0, y0, x1, y1, w=0.18, h=0.14):
    """A covered street from (x0, y0) to (x1, y1): brick walls and a row of small domes."""
    L = math.hypot(x1 - x0, y1 - y0)
    n = max(2, int(L / w))
    horizontal = abs(x1 - x0) > abs(y1 - y0)
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    box(name, M['brick'], cx, cy, G - 0.005, L if horizontal else w, w if horizontal else L, h, outline=0.005, bevel=0)
    for k in range(n):
        t = (k + 0.5) / n
        x, y = x0 + (x1 - x0) * t, y0 + (y1 - y0) * t
        lathe(f'{name}dome{k}', M['brickLight'], [(w * 0.42 * math.cos(a), 0.06 * math.sin(a)) for a in [j * math.pi / 10 for j in range(6)]] + [(0.012, 0.06)], G + h - 0.005, x, y, segs=12, outline=0.003)
        lathe(f'{name}sky{k}', M['brick'], ((0.014, 0), (0.014, 0.02), (0.0, 0.028)), G + h + 0.05, x, y, segs=8, outline=0.001, smooth=False)
        if horizontal:
            arch(f'{name}shop{k}', M['dark'], x, cy - w / 2 - 0.003, G - 0.005, w * 0.45, h * 0.7)


# ---------- the covered streets ----------
hall('main', -0.9, -0.3, 0.9, -0.3)
hall('back', -0.8, 0.35, 0.6, 0.35)
hall('cross', -0.5, -0.21, -0.5, 0.26, w=0.16)
hall('cross2', 0.55, -0.21, 0.55, 0.26, w=0.16)

# ---------- the Timcheh with its big dome ----------
TX, TY = 0.05, 0.02
box('timcheh', M['brick'], TX, TY, G - 0.005, 0.4, 0.36, 0.22, outline=0.006, bevel=0)
lathe('timchehdrum', M['brick'], ((0.15, 0), (0.15, 0.05)), G + 0.215, TX, TY, segs=24, outline=0.004)
lathe('timchehdome', M['brickLight'], [(0.16 * math.cos(a), 0.14 * math.sin(a)) for a in [j * math.pi / 16 for j in range(9)]], G + 0.26, TX, TY, segs=24, outline=0.006)
lathe('timchehlantern', M['tile'], ((0.03, 0), (0.03, 0.03), (0.0, 0.05)), G + 0.395, TX, TY, segs=12, outline=0.002)
for k in range(4):
    a = k * math.pi / 2
    lathe(f'cornerdome{k}', M['brickLight'], [(0.05 * math.cos(b), 0.04 * math.sin(b)) for b in [j * math.pi / 10 for j in range(6)]], G + 0.215, TX + 0.14 * math.cos(a + math.pi / 4) * 1.2, TY + 0.13 * math.sin(a + math.pi / 4) * 1.2, segs=12, outline=0.002)

# ---------- the entrance portal ----------
PX, PY = -0.3, -0.42
box('portal', M['brickLight'], PX, PY, G - 0.005, 0.2, 0.06, 0.28, outline=0.005, bevel=0)
box('portalframe', M['tile'], PX, PY - 0.032, G + 0.02, 0.15, 0.004, 0.24, outline=0.001, bevel=0)
arch('portalarch', M['dark'], PX, PY - 0.035, G - 0.005, 0.09, 0.2)

for k, (x, y) in enumerate(((-0.75, -0.75), (0.7, -0.75), (0.85, 0.65), (-0.95, 0.6))):
    tree(f'tree{k}', x, y)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
