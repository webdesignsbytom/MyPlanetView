# A cartoon Buckingham Palace for the country maps, built in the set's shared look (../toon.py): the
# palace's long pale east front with its columned centre and the famous balcony, the Royal Standard
# flying on the roof, the black and gold railings and gates, a guard in his red tunic and bearskin at
# his sentry box, and the Victoria Memorial before it: the white marble queen on her plinth under the
# gilded Victory, ringed by red flower beds. Turned a little towards the camera.
# Run: blender -b --factory-startup -P buckingham-palace.py -- buckingham-palace-1024.png 1024 buckingham-palace.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#d0c8b6', shadow_mul=(0.82, 0.8, 0.88), lift=0.2),
    'stone': toon('stone', '#e8e0cc', shadow_mul=(0.86, 0.82, 0.82), lift=0.15),
    'stoneDark': toon('stoneDark', '#c8bc9e', shadow_mul=(0.86, 0.82, 0.82)),
    'marble': toon('marble', '#f6f4ee', shadow_mul=(0.82, 0.84, 0.9), lift=0.2),
    'gold': toon('gold', '#e8b830', lift=0.2),
    'black': toon('black', '#2a2a30'),
    'window': flat('window', '#3a3a46'),
    'red': toon('red', '#d03a30', lift=0.1),
    'flowers': toon('flowers', '#d8443a', lift=0.1),
    'lawn': toon('lawn', '#6aa54a', shadow_mul=(0.7, 0.78, 0.8)),
    'royal': toon('royal', '#c8a040', lift=0.15),
    'blue': toon('blue', '#2a4aa0'),
    'skin': toon('skin', '#e8b090'),
})

G = tile(M['paving'])
before = set(bpy.data.objects)

# ---------- the palace front ----------
PY, PW, PD, PH = 0.55, 1.5, 0.3, 0.3
box('palace', M['stone'], 0, PY, G - 0.005, PW, PD, PH, outline=0.01, bevel=0)
box('rustication', M['stoneDark'], 0, PY - PD / 2 - 0.003, G - 0.005, PW, 0.006, 0.1, outline=0, bevel=0)
box('cornice', M['stoneDark'], 0, PY, G + PH - 0.02, PW + 0.02, PD + 0.02, 0.02, outline=0.003, bevel=0)
box('balustrade', M['stone'], 0, PY - PD / 2 + 0.01, G + PH, PW, 0.02, 0.025, outline=0.002, bevel=0)
for row in range(3):
    for j in range(19):
        x = -PW / 2 + 0.06 + j * (PW - 0.12) / 18
        if abs(x) < 0.17:
            continue
        box(f'win{row}{j}', M['window'], x, PY - PD / 2 - 0.004, G + 0.04 + row * 0.085, 0.03, 0.006, 0.05 - 0.01 * (row == 2), outline=0, bevel=0)
# the projecting wings at the ends
for s in (-1, 1):
    box(f'endwing{s}', M['stone'], s * (PW / 2 - 0.1), PY - PD / 2 - 0.02, G - 0.005, 0.2, 0.06, PH + 0.02, outline=0.006, bevel=0)
    loft(f'endpediment{s}', M['stoneDark'], [[(s * (PW / 2 - 0.1) - 0.1, PY - PD / 2 - 0.05, G + PH + 0.015), (s * (PW / 2 - 0.1) + 0.1, PY - PD / 2 - 0.05, G + PH + 0.015), (s * (PW / 2 - 0.1) + 0.1, PY - PD / 2 + 0.01, G + PH + 0.015), (s * (PW / 2 - 0.1) - 0.1, PY - PD / 2 + 0.01, G + PH + 0.015)],
                                              [(s * (PW / 2 - 0.1) - 0.004, PY - PD / 2 - 0.05, G + PH + 0.06), (s * (PW / 2 - 0.1) + 0.004, PY - PD / 2 - 0.05, G + PH + 0.06), (s * (PW / 2 - 0.1) + 0.004, PY - PD / 2 + 0.01, G + PH + 0.06), (s * (PW / 2 - 0.1) - 0.004, PY - PD / 2 + 0.01, G + PH + 0.06)]], outline=0.003)
# the columned centre with the balcony and its pediment
box('centre', M['stone'], 0, PY - PD / 2 - 0.025, G - 0.005, 0.34, 0.06, PH + 0.04, outline=0.006, bevel=0)
for j in range(6):
    x = -0.14 + j * 0.056
    rod(f'column{j}', M['marble'], (x, PY - PD / 2 - 0.062, G + 0.13), (x, PY - PD / 2 - 0.062, G + PH + 0.02), 0.011, segs=8, outline=0.002)
loft('pediment', M['stoneDark'], [[(-0.17, PY - PD / 2 - 0.07, G + PH + 0.035), (0.17, PY - PD / 2 - 0.07, G + PH + 0.035), (0.17, PY - PD / 2, G + PH + 0.035), (-0.17, PY - PD / 2, G + PH + 0.035)],
                                  [(-0.004, PY - PD / 2 - 0.07, G + PH + 0.1), (0.004, PY - PD / 2 - 0.07, G + PH + 0.1), (0.004, PY - PD / 2, G + PH + 0.1), (-0.004, PY - PD / 2, G + PH + 0.1)]], outline=0.004)
box('balcony', M['stone'], 0, PY - PD / 2 - 0.085, G + 0.12, 0.22, 0.06, 0.015, outline=0.003, bevel=0)
box('balconyrail', M['stoneDark'], 0, PY - PD / 2 - 0.112, G + 0.135, 0.22, 0.008, 0.025, outline=0.001, bevel=0)
box('balconydrape', M['red'], 0, PY - PD / 2 - 0.117, G + 0.137, 0.16, 0.004, 0.02, outline=0, bevel=0)
# the Royal Standard on its pole
rod('flagpole', M['stone'], (0, PY, G + PH), (0, PY, G + PH + 0.3), 0.005, segs=6, outline=0.001)
# the standard's four quarters: gold, red, blue and gold
for k, (m, dx, dz) in enumerate((('royal', 0, 1), ('red', 1, 1), ('blue', 0, 0), ('royal', 1, 0))):
    box(f'standard{k}', M[m], 0.03 + dx * 0.05, PY, G + PH + 0.2 + dz * 0.04, 0.05, 0.004, 0.04, outline=0.001, bevel=0)

# ---------- the railings, gates and the guard ----------
RY = 0.18
for j in range(57):
    x = -1.12 + j * 0.04
    if abs(x) > 1.12 or math.hypot(x, RY) > 1.3:
        continue
    rod(f'railing{j}', M['black'], (x, RY, G), (x, RY, G + 0.07), 0.003, segs=4, outline=0)
    ball(f'railingtip{j}', M['gold'], x, RY, G + 0.072, 0.005, outline=0)
bar('railingtop', M['black'], (-1.12, RY, G + 0.06), (1.12, RY, G + 0.06), 0.006, outline=0)
for s in (-1, 1):
    box(f'gatepier{s}', M['stone'], s * 0.12, RY, G - 0.005, 0.05, 0.05, 0.12, outline=0.003, bevel=0)
    lathe(f'gatepiercap{s}', M['gold'], ((0.02, 0), (0.014, 0.02), (0.003, 0.04)), G + 0.115, s * 0.12, RY, segs=8, outline=0.001)
box('gatecrest', M['gold'], 0, RY, G + 0.095, 0.08, 0.008, 0.035, outline=0.001, bevel=0)
box('sentrybox', M['black'], 0.4, RY + 0.05, G - 0.005, 0.07, 0.07, 0.14, outline=0.003, bevel=0)
box('sentryboxroof', M['black'], 0.4, RY + 0.05, G + 0.13, 0.09, 0.09, 0.02, outline=0.002, bevel=0)
rod('guardlegs', M['black'], (0.4, RY - 0.03, G), (0.4, RY - 0.03, G + 0.05), 0.009, segs=6, outline=0.001)
rod('guardtunic', M['red'], (0.4, RY - 0.03, G + 0.05), (0.4, RY - 0.03, G + 0.09), 0.012, segs=8, outline=0.002)
ball('guardface', M['skin'], 0.4, RY - 0.03, G + 0.098, 0.008, outline=0.001)
lathe('bearskin', M['black'], ((0.012, 0), (0.014, 0.02), (0.01, 0.04), (0.003, 0.045)), G + 0.1, 0.4, RY - 0.03, segs=10, outline=0.002)

# ---------- the Victoria Memorial ----------
VX, VY = 0.0, -0.55
lathe('memorialbase', M['marble'], ((0.42, 0), (0.42, 0.03), (0.36, 0.03), (0.36, 0.05)), G - 0.005, VX, VY, segs=40, outline=0.006)
for k in range(8):
    a = 2 * math.pi * k / 8 + math.pi / 8
    x, y = VX + 0.6 * math.cos(a), VY + 0.6 * math.sin(a) * 0.75
    if y > 0.1:
        continue
    b = ball(f'flowerbed{k}', M['flowers'], 0, 0, 0, 0.1, outline=0.006)
    b.scale = (1.0, 0.7, 0.15)
    b.location = (x, y, G + 0.005)
lathe('plinth', M['marble'], ((0.2, 0), (0.16, 0.06), (0.12, 0.12), (0.1, 0.3), (0.06, 0.34)), G + 0.045, VX, VY, segs=4, outline=0.006, smooth=False)
for k in range(4):
    a = k * math.pi / 2 - math.pi / 2
    sx, sy = VX + 0.15 * math.cos(a), VY + 0.15 * math.sin(a)
    rod(f'groupfigure{k}', M['marble'], (sx, sy, G + 0.08), (sx, sy, G + 0.16), 0.022, r2=0.016, segs=8, outline=0.003)
    ball(f'grouphead{k}', M['marble'], sx, sy, G + 0.17, 0.014, outline=0.002)
# the queen, seated on the front face
box('queenthrone', M['marble'], VX, VY - 0.12, G + 0.16, 0.06, 0.05, 0.08, outline=0.002, bevel=0)
rod('queen', M['marble'], (VX, VY - 0.135, G + 0.16), (VX, VY - 0.135, G + 0.24), 0.025, r2=0.014, segs=10, outline=0.003)
ball('queenhead', M['marble'], VX, VY - 0.135, G + 0.255, 0.015, outline=0.002)
# the gilded Victory on top
VZ = G + 0.045 + 0.34
lathe('victorybase', M['gold'], ((0.03, 0), (0.025, 0.03)), VZ, VX, VY, segs=10, outline=0.002)
rod('victory', M['gold'], (VX, VY, VZ + 0.03), (VX, VY, VZ + 0.12), 0.018, r2=0.01, segs=10, outline=0.003)
ball('victoryhead', M['gold'], VX, VY, VZ + 0.13, 0.012, outline=0.002)
for s in (-1, 1):
    wing = loft(f'victorywing{s}', M['gold'], [[(VX + s * 0.01, VY - 0.006, VZ + 0.08), (VX + s * 0.01, VY + 0.006, VZ + 0.08), (VX + s * 0.01, VY + 0.006, VZ + 0.14), (VX + s * 0.01, VY - 0.006, VZ + 0.14)],
                                                [(VX + s * 0.07, VY - 0.004, VZ + 0.12), (VX + s * 0.07, VY + 0.004, VZ + 0.12), (VX + s * 0.07, VY + 0.004, VZ + 0.18), (VX + s * 0.07, VY - 0.004, VZ + 0.18)]], outline=0.002)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
