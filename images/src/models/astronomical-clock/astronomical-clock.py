# A cartoon Prague Astronomical Clock for the country maps, built in the set's shared look
# (../toon.py): the Old Town Hall's Gothic tower on the Old Town Square, the astronomical dial of blue
# and gold on its side with the calendar dial below and the Apostles' windows above, the tower's
# pointed roof with its four corner turrets, and the Týn Church's two black-spired towers across the
# square, with the square's painted houses. Turned a little towards the camera.
# Run: blender -b --factory-startup -P astronomical-clock.py -- astronomical-clock-1024.png 1024 astronomical-clock.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#c8c0b0', shadow_mul=(0.82, 0.8, 0.88), lift=0.2),
    'stone': toon('stone', '#d8ccb0', shadow_mul=(0.86, 0.82, 0.8), lift=0.12),
    'stoneDark': toon('stoneDark', '#b4a688'),
    'slate': toon('slate', '#4a4e58', shadow_mul=(0.84, 0.86, 0.92)),
    'blue': toon('blue', '#2a4a8a', lift=0.12),
    'sky': toon('sky', '#4a8ad0', lift=0.15),
    'gold': toon('gold', '#f0c040', lift=0.3),
    'dark': flat('dark', '#2a2622'),
    'red': toon('red', '#c4503e'),
    'pink': toon('pink', '#e8b0a0', lift=0.1),
    'yellow': toon('yellow', '#ecc878', lift=0.1),
    'cream': toon('cream', '#f0e2c4', lift=0.1),
    'green': toon('green', '#9ac0a0', lift=0.1),
    'roof': toon('roof', '#c4603e'),
})

G = tile(M['paving'])
before = set(bpy.data.objects)

TX, TY = -0.1, 0.15
TS, TH = 0.22, 0.86
# ---------- the town hall and its tower ----------
box('townhall', M['cream'], TX + 0.36, TY + 0.05, G - 0.005, 0.5, 0.3, 0.32, outline=0.008, bevel=0)
for row in range(2):
    for j in range(4):
        box(f'hallwin{row}{j}', M['dark'], TX + 0.18 + j * 0.12, TY + 0.05 - 0.153, G + 0.1 + row * 0.1, 0.04, 0.006, 0.06, outline=0, bevel=0)
loft('hallroof', M['roof'], [[(TX + 0.11, TY - 0.1, G + 0.315), (TX + 0.61, TY - 0.1, G + 0.315), (TX + 0.61, TY + 0.2, G + 0.315), (TX + 0.11, TY + 0.2, G + 0.315)],
                             [(TX + 0.11, TY + 0.045, G + 0.4), (TX + 0.61, TY + 0.045, G + 0.4), (TX + 0.61, TY + 0.055, G + 0.4), (TX + 0.11, TY + 0.055, G + 0.4)]], outline=0.004)
box('tower', M['stone'], TX, TY, G - 0.005, TS, TS, TH, outline=0.009, bevel=0)
box('gallery', M['stoneDark'], TX, TY, G + TH - 0.04, TS + 0.04, TS + 0.04, 0.03, outline=0.003, bevel=0)
for sx in (-1, 1):
    for sy in (-1, 1):
        x, y = TX + sx * (TS / 2 + 0.01), TY + sy * (TS / 2 + 0.01)
        lathe(f'cornerturret{sx}{sy}', M['stone'], ((0.025, 0), (0.025, 0.07)), G + TH - 0.015, x, y, segs=8, outline=0.002, smooth=False)
        lathe(f'cornerspire{sx}{sy}', M['slate'], ((0.03, 0), (0.003, 0.11)), G + TH + 0.05, x, y, segs=8, outline=0.002, smooth=False)
loft('towerroof', M['slate'], [[(TX - TS / 2, TY - TS / 2, G + TH - 0.01), (TX + TS / 2, TY - TS / 2, G + TH - 0.01), (TX + TS / 2, TY + TS / 2, G + TH - 0.01), (TX - TS / 2, TY + TS / 2, G + TH - 0.01)],
                               [(TX - 0.005, TY - 0.005, G + TH + 0.2), (TX + 0.005, TY - 0.005, G + TH + 0.2), (TX + 0.005, TY + 0.005, G + TH + 0.2), (TX - 0.005, TY + 0.005, G + TH + 0.2)]], outline=0.005)
rod('towerfinial', M['gold'], (TX, TY, G + TH + 0.2), (TX, TY, G + TH + 0.25), 0.005, segs=4, outline=0)
for k in range(3):
    box(f'towerwin{k}', M['dark'], TX, TY - TS / 2 - 0.003, G + 0.5 + k * 0.1, 0.04, 0.006, 0.06, outline=0, bevel=0)

# ---------- the clock on the tower's front ----------
FY = TY - TS / 2 - 0.006
facing = Matrix.Rotation(math.pi / 2, 4, 'X')
box('clockframe', M['stoneDark'], TX, FY + 0.002, G + 0.08, 0.17, 0.01, 0.34, outline=0.003, bevel=0)
loft('clockgable', M['stoneDark'], [[(TX - 0.09, FY - 0.003, G + 0.42), (TX + 0.09, FY - 0.003, G + 0.42), (TX + 0.09, FY + 0.007, G + 0.42), (TX - 0.09, FY + 0.007, G + 0.42)],
                                    [(TX - 0.005, FY - 0.003, G + 0.5), (TX + 0.005, FY - 0.003, G + 0.5), (TX + 0.005, FY + 0.007, G + 0.5), (TX - 0.005, FY + 0.007, G + 0.5)]], outline=0.002)
# the astronomical dial: blue sky, gold numerals ring, the zodiac ring and the sun hand
DZ = G + 0.3
cyl('dialgold', M['gold'], 0.072, 0.006, segs=28, outline=0.002, matrix=Matrix.Translation((TX, FY - 0.003, DZ)) @ facing)
cyl('dialsky', M['sky'], 0.06, 0.006, segs=28, outline=0, matrix=Matrix.Translation((TX, FY - 0.006, DZ)) @ facing)
cyl('dialnight', M['blue'], 0.045, 0.006, segs=24, outline=0, matrix=Matrix.Translation((TX, FY - 0.008, DZ - 0.012)) @ facing)
cyl('zodiac', M['gold'], 0.032, 0.004, segs=20, outline=0, matrix=Matrix.Translation((TX + 0.01, FY - 0.011, DZ + 0.012)) @ facing)
cyl('zodiacinner', M['sky'], 0.026, 0.004, segs=20, outline=0, matrix=Matrix.Translation((TX + 0.01, FY - 0.013, DZ + 0.012)) @ facing)
bar('sunhand', M['gold'], (TX, FY - 0.016, DZ), (TX + 0.05, FY - 0.016, DZ + 0.035), 0.006, outline=0)
ball('sun', M['gold'], TX + 0.035, FY - 0.018, DZ + 0.025, 0.01, outline=0.001)
# the calendar dial below
CZ = G + 0.15
cyl('calendargold', M['gold'], 0.06, 0.006, segs=28, outline=0.002, matrix=Matrix.Translation((TX, FY - 0.003, CZ)) @ facing)
cyl('calendar', M['cream'], 0.05, 0.006, segs=28, outline=0, matrix=Matrix.Translation((TX, FY - 0.006, CZ)) @ facing)
cyl('calendarcentre', M['red'], 0.018, 0.004, segs=16, outline=0, matrix=Matrix.Translation((TX, FY - 0.009, CZ)) @ facing)
# the Apostles' two windows above and the statues either side
for s in (-1, 1):
    box(f'apostlewin{s}', M['dark'], TX + s * 0.03, FY - 0.004, G + 0.39, 0.03, 0.006, 0.04, outline=0, bevel=0)
    for z in (DZ, CZ):
        rod(f'figure{s}{z:.2f}', M['stoneDark'], (TX + s * 0.075, FY - 0.01, z - 0.03), (TX + s * 0.075, FY - 0.01, z + 0.03), 0.008, segs=6, outline=0.001)

# ---------- the Týn Church and the square's houses ----------
CX, CY = 0.3, 0.85
for s in (-1, 1):
    x = CX + s * 0.11
    box(f'tyntower{s}', M['stoneDark'], x, CY, G - 0.005, 0.1, 0.1, 0.5, outline=0.006, bevel=0)
    lathe(f'tynspire{s}', M['slate'], ((0.07, 0), (0.05, 0.1), (0.003, 0.32)), G + 0.495, x, CY, segs=4, outline=0.004, smooth=False)
    for sx in (-1, 1):
        for sy in (-1, 1):
            lathe(f'tynspirelet{s}{sx}{sy}', M['slate'], ((0.016, 0), (0.002, 0.08)), G + 0.5, x + sx * 0.05, CY + sy * 0.05, segs=6, outline=0.001, smooth=False)
box('tynnave', M['stoneDark'], CX, CY + 0.1, G - 0.005, 0.12, 0.2, 0.36, outline=0.005, bevel=0)
colours = ('pink', 'yellow', 'cream', 'green')
for k, (x, y) in enumerate(((-0.75, 0.55), (-0.5, 0.75), (-0.2, 0.85), (0.75, 0.6), (0.9, 0.2), (-0.9, 0.1))):
    h = 0.24 + 0.04 * (k % 3)
    box(f'house{k}', M[colours[k % 4]], x, y, G - 0.005, 0.22, 0.2, h, outline=0.006, bevel=0)
    for j in range(2):
        box(f'housewin{k}{j}', M['dark'], x - 0.05 + j * 0.1, y - 0.103, G + h - 0.09, 0.03, 0.006, 0.04, outline=0, bevel=0)
    loft(f'houseroof{k}', M['roof'], [[(x - 0.11, y - 0.1, G + h - 0.005), (x + 0.11, y - 0.1, G + h - 0.005), (x + 0.11, y + 0.1, G + h - 0.005), (x - 0.11, y + 0.1, G + h - 0.005)],
                                      [(x - 0.004, y - 0.1, G + h + 0.09), (x + 0.004, y - 0.1, G + h + 0.09), (x + 0.004, y + 0.1, G + h + 0.09), (x - 0.004, y + 0.1, G + h + 0.09)]], outline=0.003)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
