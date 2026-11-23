# A cartoon Finlandia Hall for the country maps, built in the set's shared look (../toon.py):
# Alvar Aalto's white marble concert hall by Töölö Bay in Helsinki, its long low wing with bands of
# dark windows and black granite, the auditorium's tall tower block rising with its sloping roof,
# the terraces down to the water, and the birches of the park. Turned a little towards the camera.
# Run: blender -b --factory-startup -P finlandia-hall.py -- finlandia-hall-1024.png 1024 finlandia-hall.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'lawn': toon('lawn', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'bay': toon('bay', '#4a8ab0', lift=0.3),
    'marble': toon('marble', '#f6f6f2', shadow_mul=(0.82, 0.84, 0.9), lift=0.15),
    'granite': toon('granite', '#2e2e34'),
    'glass': flat('glass', '#3a4a5a'),
    'copper': toon('copper', '#5aa88a', lift=0.12),
    'birch': toon('birch', '#8ac860', shadow_mul=(0.72, 0.8, 0.74)),
    'birchTrunk': toon('birchTrunk', '#f0ece0'),
})

G = tile(M['lawn'])
before = set(bpy.data.objects)


def oval(cx, cy, rx, ry, z, sides=28):
    return [(cx + rx * math.cos(2 * math.pi * j / sides), cy + ry * math.sin(2 * math.pi * j / sides), G + z) for j in range(sides)]


loft('bay', M['bay'], [oval(-0.45, -0.55, 0.55, 0.32, -0.004), oval(-0.45, -0.55, 0.55, 0.32, 0.006)], outline=0.004, smooth=True)

# ---------- the long wing ----------
WY = 0.1
box('wing', M['marble'], 0.15, WY, G - 0.005, 0.9, 0.22, 0.14, outline=0.008, bevel=0)
box('plinth', M['granite'], 0.15, WY - 0.112, G - 0.005, 0.9, 0.006, 0.03, outline=0, bevel=0)
for k in range(2):
    box(f'band{k}', M['glass'], 0.15, WY - 0.113, G + 0.04 + k * 0.05, 0.86, 0.006, 0.025, outline=0, bevel=0)
box('canopy', M['marble'], 0.35, WY - 0.16, G + 0.07, 0.3, 0.1, 0.015, outline=0.002, bevel=0)
for j in range(4):
    rod(f'canopypost{j}', M['granite'], (0.23 + j * 0.08, WY - 0.2, G), (0.23 + j * 0.08, WY - 0.2, G + 0.07), 0.006, segs=6, outline=0)

# ---------- the auditorium tower ----------
AX, AY = -0.22, 0.2
loft('tower', M['marble'], [[(AX - 0.16, AY - 0.15, G - 0.005), (AX + 0.16, AY - 0.15, G - 0.005), (AX + 0.16, AY + 0.17, G - 0.005), (AX - 0.16, AY + 0.17, G - 0.005)],
                            [(AX - 0.16, AY - 0.15, G + 0.26), (AX + 0.16, AY - 0.15, G + 0.36), (AX + 0.16, AY + 0.17, G + 0.36), (AX - 0.16, AY + 0.17, G + 0.26)]], outline=0.008)
for k in range(5):
    box(f'towerstrip{k}', M['granite'], AX - 0.12 + k * 0.06, AY - 0.153, G + 0.04, 0.006, 0.006, 0.2 + k * 0.015, outline=0, bevel=0)
loft('towerroof', M['copper'], [[(AX - 0.165, AY - 0.155, G + 0.258), (AX + 0.165, AY - 0.155, G + 0.362), (AX + 0.165, AY + 0.175, G + 0.362), (AX - 0.165, AY + 0.175, G + 0.258)],
                                [(AX - 0.165, AY - 0.155, G + 0.272), (AX + 0.165, AY - 0.155, G + 0.376), (AX + 0.165, AY + 0.175, G + 0.376), (AX - 0.165, AY + 0.175, G + 0.272)]], outline=0.003)
box('lowerblock', M['marble'], AX - 0.08, AY - 0.25, G - 0.005, 0.3, 0.12, 0.1, outline=0.005, bevel=0)
box('lowerglass', M['glass'], AX - 0.08, AY - 0.313, G + 0.02, 0.26, 0.006, 0.05, outline=0, bevel=0)
for k in range(3):
    box(f'terrace{k}', M['marble'], -0.4 + k * 0.02, -0.18 - k * 0.04, G - 0.005, 0.4, 0.05, 0.03 - k * 0.008, outline=0.001, bevel=0)

for k, (x, y) in enumerate(((0.75, -0.3), (0.85, 0.45), (0.5, -0.55), (-0.75, 0.45), (0.25, 0.65), (0.6, 0.6))):
    rod(f'birchtrunk{k}', M['birchTrunk'], (x, y, G), (x, y, G + 0.22), 0.012, segs=6, outline=0.002)
    lathe(f'birch{k}', M['birch'], ((0.06, 0), (0.07, 0.08), (0.004, 0.22)), G + 0.12, x, y, segs=12, outline=0.004)

turn(before, -20)
render(G)
