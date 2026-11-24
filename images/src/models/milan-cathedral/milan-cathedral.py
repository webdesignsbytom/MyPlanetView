# A cartoon Milan Cathedral for the country maps, built in the set's shared look (../toon.py): the
# Duomo's broad white-and-pink marble front with its stepped gable, five doors and tall Gothic windows,
# the forest of slender spires along its front, its buttresses and its roof, the great spire over the
# crossing with the golden Madonnina on top, and the Piazza del Duomo's paving and lamps. Turned a little
# towards the camera.
# Run: blender -b --factory-startup -P milan-cathedral.py -- milan-cathedral-1024.png 1024 milan-cathedral.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#d0c8b8', shadow_mul=(0.82, 0.8, 0.88), lift=0.2),
    'marble': toon('marble', '#f6efe6', shadow_mul=(0.84, 0.82, 0.88), lift=0.2),
    'marblePink': toon('marblePink', '#ecd8cc', shadow_mul=(0.86, 0.82, 0.86)),
    'roof': toon('roof', '#dcd2c4', shadow_mul=(0.84, 0.84, 0.9)),
    'window': flat('window', '#3a3a50'),
    'gold': toon('gold', '#e8b830', lift=0.25),
    'bronze': toon('bronze', '#5a4a3a'),
})

G = tile(M['paving'])
before = set(bpy.data.objects)


def spire(name, x, y, z, h, r=0.016):
    """A slender pinnacle with a little statue's knob on top."""
    lathe(name, M['marble'], ((r, 0), (r, h * 0.45), (r * 0.6, h * 0.6), (0.003, h)), z, x, y, segs=8, outline=0.002, smooth=False)
    ball(name + 'statue', M['marble'], x, y, z + h + 0.008, 0.007, outline=0.001)


FW = 0.86          # the front's width
Y0, Y1 = -0.2, 0.85
NH = 0.3           # the nave's wall height
# ---------- the nave, aisles and roof ----------
box('nave', M['marble'], 0, (Y0 + Y1) / 2, G - 0.005, 0.36, Y1 - Y0, NH, outline=0.009, bevel=0)
loft('naveroof', M['roof'], [[(-0.18, Y0, G + NH - 0.005), (0.18, Y0, G + NH - 0.005), (0.18, Y1, G + NH - 0.005), (-0.18, Y1, G + NH - 0.005)],
                             [(-0.004, Y0, G + NH + 0.07), (0.004, Y0, G + NH + 0.07), (0.004, Y1, G + NH + 0.07), (-0.004, Y1, G + NH + 0.07)]], outline=0.005)
for s in (-1, 1):
    box(f'aisle{s}', M['marble'], s * 0.3, (Y0 + Y1) / 2, G - 0.005, 0.24, Y1 - Y0, NH - 0.1, outline=0.007, bevel=0)
    box(f'aisleroof{s}', M['roof'], s * 0.3, (Y0 + Y1) / 2, G + NH - 0.11, 0.24, Y1 - Y0, 0.012, outline=0.002, bevel=0)
    for j in range(9):
        y = Y0 + 0.08 + j * 0.105
        # buttresses carrying spires, and the flying arches to the nave
        spire(f'aislespire{s}{j}', s * 0.42, y, G + NH - 0.1, 0.16)
        bar(f'flyer{s}{j}', M['marble'], (s * 0.42, y, G + NH - 0.06), (s * 0.18, y, G + NH - 0.01), 0.014, outline=0.001)
        spire(f'navespire{s}{j}', s * 0.18, y, G + NH, 0.12, r=0.012)
        box(f'aislewin{s}{j}', M['window'], s * 0.423, y + 0.05, G + 0.04, 0.006, 0.035, 0.12, outline=0, bevel=0)
# the transept
TY = 0.55
box('transept', M['marble'], 0, TY, G - 0.005, 1.04, 0.24, NH - 0.03, outline=0.008, bevel=0)
for s in (-1, 1):
    spire(f'transeptspire{s}', s * 0.5, TY - 0.11, G + NH - 0.03, 0.16)
    spire(f'transeptspireb{s}', s * 0.5, TY + 0.11, G + NH - 0.03, 0.16)

# ---------- the great spire and the Madonnina ----------
lathe('tiburio', M['marble'], ((0.13, 0), (0.13, 0.12), (0.09, 0.18)), G + NH + 0.04, 0, TY, segs=8, outline=0.005, smooth=False)
for k in range(8):
    a = 2 * math.pi * k / 8
    spire(f'tiburiospire{k}', 0.13 * math.cos(a), TY + 0.13 * math.sin(a), G + NH + 0.12, 0.12, r=0.012)
lathe('greatspire', M['marble'], ((0.06, 0), (0.05, 0.2), (0.03, 0.32), (0.004, 0.42)), G + NH + 0.22, 0, TY, segs=8, outline=0.004, smooth=False)
MZ = G + NH + 0.64
rod('madonnina', M['gold'], (0, TY, MZ), (0, TY, MZ + 0.07), 0.016, r2=0.008, segs=8, outline=0.002)
ball('madonninahead', M['gold'], 0, TY, MZ + 0.08, 0.01, outline=0.001)
rod('madonninaspear', M['gold'], (0.012, TY, MZ + 0.04), (0.02, TY, MZ + 0.12), 0.003, segs=4, outline=0)

# ---------- the front ----------
FZ = 0.42          # the gable's height at its peak
# the stepped gable as boxes: the lower front, the shoulders and the triangle
box('front', M['marble'], 0, Y0 - 0.02, G - 0.005, FW, 0.05, 0.265, outline=0.008, bevel=0)
box('frontshoulders', M['marble'], 0, Y0 - 0.02, G + 0.255, 0.6, 0.05, 0.065, outline=0.006, bevel=0)
loft('frontgable', M['marble'], [[(-0.17, Y0 - 0.045, G + 0.315), (0.17, Y0 - 0.045, G + 0.315), (0.17, Y0 + 0.005, G + 0.315), (-0.17, Y0 + 0.005, G + 0.315)],
                                 [(-0.004, Y0 - 0.045, G + FZ), (0.004, Y0 - 0.045, G + FZ), (0.004, Y0 + 0.005, G + FZ), (-0.004, Y0 + 0.005, G + FZ)]], outline=0.005)
box('frontbase', M['marblePink'], 0, Y0 - 0.048, G - 0.005, FW, 0.006, 0.05, outline=0, bevel=0)
# the six buttress piers carrying the front's spires
for j in range(6):
    x = -FW / 2 + 0.01 + j * (FW - 0.02) / 5
    box(f'frontpier{j}', M['marble'], x, Y0 - 0.05, G - 0.005, 0.04, 0.04, 0.28 + (0.06 if abs(x) < 0.3 else 0), outline=0.003, bevel=0)
    spire(f'frontspire{j}', x, Y0 - 0.05, G + 0.275 + (0.06 if abs(x) < 0.3 else 0), 0.2 + (0.04 if abs(x) < 0.3 else 0), r=0.018)
# the doors and the tall windows
for j in range(5):
    x = -0.34 + j * 0.17
    w = 0.06 if j != 2 else 0.08
    box(f'door{j}', M['window'], x, Y0 - 0.048, G - 0.005, w, 0.006, 0.09 + 0.02 * (j == 2), outline=0, bevel=0)
    box(f'doorframe{j}', M['marblePink'], x, Y0 - 0.047, G - 0.005, w + 0.03, 0.004, 0.12 + 0.02 * (j == 2), outline=0, bevel=0)
    box(f'window{j}', M['window'], x, Y0 - 0.048, G + 0.15, 0.03, 0.006, 0.08, outline=0, bevel=0)
cyl('rose', M['window'], 0.04, 0.006, segs=16, outline=0, matrix=Matrix.Translation((0, Y0 - 0.048, G + 0.31)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
for k in range(5):
    t = (k + 1) / 6
    spire(f'gablespire{k}', -0.17 + 0.34 * t, Y0 - 0.045, G + 0.315 + (FZ - 0.315) * (1 - abs(2 * t - 1)), 0.06, r=0.008)

# ---------- lamps in the piazza ----------
for k, (x, y) in enumerate(((-0.6, -0.7), (0.6, -0.7), (-0.3, -1.0), (0.3, -1.0))):
    rod(f'lamp{k}', M['bronze'], (x, y, G), (x, y, G + 0.18), 0.006, segs=6, outline=0.001)
    ball(f'lamptop{k}', M['marble'], x, y, G + 0.19, 0.014, outline=0.002)

bpy.context.view_layer.update()
# grown to fill its tile
grow = Matrix.Translation((0, 0.3, G)) @ Matrix.Scale(1.2, 4) @ Matrix.Translation((0, -0.3, -G))
for o in set(bpy.data.objects) - before:
    o.matrix_world = grow @ o.matrix_world
bpy.context.view_layer.update()
turn(before, -20)
render(G)
