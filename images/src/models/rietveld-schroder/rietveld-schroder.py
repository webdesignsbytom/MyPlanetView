# A cartoon Rietveld Schröder House for the country maps, built in the set's shared look (../toon.py):
# Gerrit Rietveld's De Stijl house in Utrecht, a play of white and grey planes sliding past each
# other, the slender steel posts and beams picked out in red, blue, yellow and black, the big
# corner windows that open away to nothing, the balcony, and the plain brick terrace it ends, with
# its little garden and hedge. Turned a little towards the camera.
# Run: blender -b --factory-startup -P rietveld-schroder.py -- rietveld-schroder-1024.png 1024 rietveld-schroder.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'lawn': toon('lawn', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'white': toon('white', '#f6f4ee', shadow_mul=(0.82, 0.84, 0.9), lift=0.22),
    'grey': toon('grey', '#a8aaae', lift=0.12),
    'greyDark': toon('greyDark', '#6a6c70'),
    'red': toon('red', '#d8302a', lift=0.12),
    'blue': toon('blue', '#2a4ab0', lift=0.12),
    'yellow': toon('yellow', '#f0c820', lift=0.15),
    'black': toon('black', '#1e1e22'),
    'glass': toon('glass', '#6a8aa8', lift=0.25),
    'brick': toon('brick', '#a85a3e', lift=0.06),
    'roof': toon('roof', '#5a5e66'),
    'hedge': toon('hedge', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
    'path': toon('path', '#d8d0c0'),
})

G = tile(M['lawn'])
before = set(bpy.data.objects)

HX, HY = 0.05, 0.05
# ---------- the brick terrace the house ends ----------
box('terrace', M['brick'], HX + 0.55, HY + 0.15, G - 0.005, 0.5, 0.42, 0.3, outline=0.007, bevel=0)
for row in range(2):
    for j in range(3):
        box(f'terracewin{row}{j}', M['black'], HX + 0.4 + j * 0.13, HY + 0.15 - 0.213, G + 0.07 + row * 0.12, 0.06, 0.006, 0.07, outline=0, bevel=0)
loft('terraceroof', M['roof'], [[(HX + 0.3, HY - 0.06, G + 0.295), (HX + 0.8, HY - 0.06, G + 0.295), (HX + 0.8, HY + 0.36, G + 0.295), (HX + 0.3, HY + 0.36, G + 0.295)],
                                [(HX + 0.3, HY + 0.146, G + 0.4), (HX + 0.8, HY + 0.146, G + 0.4), (HX + 0.8, HY + 0.154, G + 0.4), (HX + 0.3, HY + 0.154, G + 0.4)]], outline=0.004)

# ---------- the house: the core, then the planes sliding out of it ----------
box('core', M['white'], HX, HY + 0.1, G - 0.005, 0.48, 0.36, 0.3, outline=0.006, bevel=0)
# the big glass windows in the corner
box('windowsground', M['glass'], HX - 0.12, HY - 0.083, G + 0.04, 0.2, 0.006, 0.1, outline=0, bevel=0)
box('windowsupper', M['glass'], HX - 0.05, HY - 0.083, G + 0.18, 0.32, 0.006, 0.09, outline=0, bevel=0)
box('windowscorner', M['glass'], HX - 0.243, HY + 0.05, G + 0.18, 0.006, 0.2, 0.09, outline=0, bevel=0)
# the sliding planes: a white wall slab, a grey slab, the roof slab overhanging
box('planewhite', M['white'], HX + 0.12, HY - 0.1, G - 0.005, 0.18, 0.025, 0.2, outline=0.003, bevel=0)
box('planegrey', M['grey'], HX - 0.27, HY + 0.15, G + 0.12, 0.025, 0.22, 0.16, outline=0.003, bevel=0)
box('roofslab', M['white'], HX - 0.03, HY + 0.08, G + 0.295, 0.56, 0.42, 0.022, outline=0.004, bevel=0)
box('floorslab', M['grey'], HX - 0.06, HY - 0.02, G + 0.15, 0.42, 0.22, 0.016, outline=0.003, bevel=0)
# the balcony on the upper floor with its railing
box('balcony', M['white'], HX - 0.14, HY - 0.16, G + 0.15, 0.2, 0.1, 0.014, outline=0.002, bevel=0)
bar('balconyrail', M['black'], (HX - 0.24, HY - 0.21, G + 0.2), (HX - 0.04, HY - 0.21, G + 0.2), 0.008, outline=0)
# the coloured steel posts and beams
rod('postred', M['red'], (HX - 0.24, HY - 0.21, G - 0.005), (HX - 0.24, HY - 0.21, G + 0.2), 0.008, segs=6, outline=0.001)
box('beamyellow', M['yellow'], HX + 0.02, HY - 0.11, G + 0.15, 0.24, 0.02, 0.016, outline=0.001, bevel=0)
box('beamblue', M['blue'], HX - 0.28, HY - 0.02, G + 0.28, 0.02, 0.28, 0.018, outline=0.001, bevel=0)
box('beamred', M['red'], HX + 0.2, HY - 0.06, G + 0.27, 0.12, 0.016, 0.016, outline=0.001, bevel=0)
rod('postblack', M['black'], (HX - 0.04, HY - 0.21, G - 0.005), (HX - 0.04, HY - 0.21, G + 0.15), 0.006, segs=6, outline=0)
box('door', M['black'], HX + 0.1, HY - 0.083, G - 0.005, 0.05, 0.006, 0.1, outline=0, bevel=0)
box('doorframeblue', M['blue'], HX + 0.13, HY - 0.085, G - 0.005, 0.01, 0.006, 0.12, outline=0, bevel=0)

# ---------- the garden ----------
box('path', M['path'], HX + 0.1, HY - 0.45, G - 0.004, 0.1, 0.6, 0.01, outline=0.001, bevel=0)
for k, (x0, y0, x1, y1) in enumerate(((-0.85, -0.6, 0.0, -0.6), (0.3, -0.6, 0.85, -0.6), (-0.85, -0.6, -0.85, 0.5))):
    bar(f'hedge{k}', M['hedge'], (x0, y0, G + 0.04), (x1, y1, G + 0.04), 0.08, outline=0.004)
ball('tree', M['hedge'], -0.55, 0.55, G + 0.16, 0.13, outline=0.012)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
