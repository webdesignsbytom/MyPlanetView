# A cartoon Naumburg Cathedral for the country maps, built in the set's shared look (../toon.py): the
# late Romanesque and early Gothic cathedral with its four towers, two at each end, the eastern pair
# with their green copper spires and the western pair in pale stone with their tall pointed roofs,
# the long nave between, the west choir's tall windows, and the statue of Uta, the most famous
# sculpture in Germany, in her niche by the door. Turned a little towards the camera.
# Run: blender -b --factory-startup -P naumburg.py -- naumburg-1024.png 1024 naumburg.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass2', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'paving': toon('paving', '#d0c8b8', lift=0.15),
    'stone': toon('stone', '#d8ccb0', shadow_mul=(0.86, 0.84, 0.86), lift=0.15),
    'stoneDark': toon('stoneDark', '#b8aa8a'),
    'slate': toon('slate', '#5a6270', shadow_mul=(0.84, 0.86, 0.92)),
    'copper': toon('copper', '#4a9a7a', lift=0.12),
    'dark': flat('dark', '#2e2e3a'),
    'red': toon('red', '#b8402e'),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['grass'])
before = set(bpy.data.objects)
box('square', M['paving'], -0.1, -0.55, G - 0.004, 1.0, 0.4, 0.01, outline=0.001, bevel=0)

# ---------- the nave, running left to right ----------
X0, X1 = -0.55, 0.55
CY, NW, NH = 0.15, 0.3, 0.3
box('nave', M['stone'], (X0 + X1) / 2, CY, G - 0.005, X1 - X0, NW, NH, outline=0.009, bevel=0)
loft('naveroof', M['slate'], [[(X0, CY - NW / 2, G + NH - 0.005), (X1, CY - NW / 2, G + NH - 0.005), (X1, CY + NW / 2, G + NH - 0.005), (X0, CY + NW / 2, G + NH - 0.005)],
                              [(X0, CY - 0.004, G + NH + 0.13), (X1, CY - 0.004, G + NH + 0.13), (X1, CY + 0.004, G + NH + 0.13), (X0, CY + 0.004, G + NH + 0.13)]], outline=0.005)
for j in range(8):
    x = X0 + 0.12 + j * (X1 - X0 - 0.24) / 7
    box(f'navewin{j}', M['dark'], x, CY - NW / 2 - 0.003, G + 0.12, 0.04, 0.006, 0.12, outline=0, bevel=0)
    pyramid(f'navewintop{j}', M['dark'], x, CY - NW / 2 - 0.003, G + 0.24, 0.04, 0.03, outline=0)
    box(f'buttress{j}', M['stoneDark'], x + 0.06, CY - NW / 2 - 0.015, G - 0.005, 0.03, 0.03, 0.22, outline=0.002, bevel=0)


def tower(name, x, y, roof_mat, roof_h):
    box(name, M['stone'], x, y, G - 0.005, 0.15, 0.15, 0.52, outline=0.007, bevel=0)
    for k in range(3):
        box(f'{name}band{k}', M['stoneDark'], x, y, G + 0.17 + k * 0.12, 0.155, 0.155, 0.012, outline=0, bevel=0)
    for k in range(2):
        for j in (-1, 1):
            box(f'{name}win{k}{j}', M['dark'], x + j * 0.03, y - 0.078, G + 0.3 + k * 0.12, 0.022, 0.006, 0.06, outline=0, bevel=0)
    lathe(f'{name}roof', roof_mat, ((0.11, 0), (0.08, roof_h * 0.2), (0.003, roof_h)), G + 0.515, x, y, segs=8, outline=0.004, smooth=False)


tower('westnorth', X0 + 0.05, CY + 0.12, M['slate'], 0.36)
tower('westsouth', X0 + 0.05, CY - 0.12, M['slate'], 0.36)
tower('eastnorth', X1 - 0.12, CY + 0.12, M['copper'], 0.3)
tower('eastsouth', X1 - 0.12, CY - 0.12, M['copper'], 0.3)
# the west choir's tall windows on the end facing left
for j in range(3):
    box(f'westchoirwin{j}', M['dark'], X0 - 0.003, CY - 0.06 + j * 0.06, G + 0.1, 0.006, 0.035, 0.16, outline=0, bevel=0)
# the doorway and Uta in her niche beside it
box('door', M['dark'], -0.05, CY - NW / 2 - 0.004, G - 0.005, 0.07, 0.006, 0.12, outline=0, bevel=0)
pyramid('doortop', M['dark'], -0.05, CY - NW / 2 - 0.004, G + 0.115, 0.07, 0.05, outline=0)
box('utaniche', M['stoneDark'], 0.08, CY - NW / 2 - 0.004, G + 0.06, 0.05, 0.006, 0.12, outline=0, bevel=0)
rod('uta', M['stone'], (0.08, CY - NW / 2 - 0.012, G + 0.06), (0.08, CY - NW / 2 - 0.012, G + 0.16), 0.016, r2=0.01, segs=8, outline=0.002)
ball('utahead', M['stone'], 0.08, CY - NW / 2 - 0.012, G + 0.17, 0.01, outline=0.001)
box('utacloak', M['red'], 0.08, CY - NW / 2 - 0.02, G + 0.1, 0.022, 0.004, 0.05, outline=0, bevel=0)

for k, (x, y) in enumerate(((-0.85, -0.25), (0.8, -0.3), (-0.75, 0.6), (0.7, 0.6), (0.0, 0.75))):
    ball(f'tree{k}', M['tree'], x, y, G + 0.14, 0.11, outline=0.012)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
