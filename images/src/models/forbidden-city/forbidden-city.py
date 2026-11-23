# A cartoon Forbidden City for the country maps, built in the set's shared look (../toon.py): the
# Hall of Supreme Harmony on its three white marble terraces, its red walls and columns under a
# double-eaved golden roof, the stone courtyard in front with bronze incense burners, and the red
# side halls and walls round it under golden tiles. Turned a little towards the camera.
# Run: blender -b --factory-startup -P forbidden-city.py -- forbidden-city-1024.png 1024 forbidden-city.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#d8cfbc', shadow_mul=(0.82, 0.8, 0.88), lift=0.2),
    'marble': toon('marble', '#f4f2ec', shadow_mul=(0.8, 0.82, 0.92), lift=0.2),
    'red': toon('red', '#b8302a'),
    'gold': toon('roofGold', '#f0b830', shadow_mul=(0.8, 0.66, 0.56), lift=0.35),
    'beam': toon('beam', '#2f6a8a'),
    'window': flat('window', '#3a2a28'),
    'bronze': toon('bronze', '#6a5a44', shadow_mul=(0.82, 0.78, 0.76)),
})

G = tile(M['paving'])
before = set(bpy.data.objects)
rng = random.Random(1381)


def hip_roof(name, x, y, z, w, d, h, eave=0.04):
    # a hipped roof with its eaves turned up: a flared skirt, then the hip
    loft(f'{name}skirt', M['gold'], [[(x - w / 2 - eave, y - d / 2 - eave, z + 0.012), (x + w / 2 + eave, y - d / 2 - eave, z + 0.012), (x + w / 2 + eave, y + d / 2 + eave, z + 0.012),
                                      (x - w / 2 - eave, y + d / 2 + eave, z + 0.012)],
                                     [(x - w / 2, y - d / 2, z + h * 0.35), (x + w / 2, y - d / 2, z + h * 0.35), (x + w / 2, y + d / 2, z + h * 0.35), (x - w / 2, y + d / 2, z + h * 0.35)]],
         outline=0.008)
    loft(f'{name}hip', M['gold'], [[(x - w / 2, y - d / 2, z + h * 0.35), (x + w / 2, y - d / 2, z + h * 0.35), (x + w / 2, y + d / 2, z + h * 0.35), (x - w / 2, y + d / 2, z + h * 0.35)],
                                   [(x - w * 0.3, y - 0.006, z + h), (x + w * 0.3, y - 0.006, z + h), (x + w * 0.3, y + 0.006, z + h), (x - w * 0.3, y + 0.006, z + h)]], outline=0.008)


# ---------- the three marble terraces ----------
HX, HY = 0.0, 0.35
for i, (w, d) in enumerate(((1.0, 0.62), (0.86, 0.52), (0.72, 0.42))):
    box(f'terrace{i}', M['marble'], HX, HY, G - 0.005 + i * 0.045, w, d, 0.045, outline=0.01, bevel=0)
for i in range(3):
    box(f'stairs{i}', M['marble'], HX, HY - 0.31 - 0.02 * (2 - i) + 0.05 * i, G - 0.005, 0.16, 0.06, 0.045 * (i + 1), outline=0.005, bevel=0)
T = G + 0.13

# ---------- the Hall of Supreme Harmony ----------
box('hall', M['red'], HX, HY, T - 0.005, 0.6, 0.32, 0.15, outline=0.014, bevel=0)
box('beams', M['beam'], HX, HY, T + 0.13, 0.62, 0.34, 0.025, outline=0.005, bevel=0)
for j in range(9):
    x = HX - 0.28 + j * 0.07
    rod(f'column{j}', M['red'], (x, HY - 0.175, T - 0.005), (x, HY - 0.175, T + 0.13), 0.011, segs=8, outline=0.003)
    if 0 < j < 8:
        box(f'lattice{j}', M['window'], x + 0.035, HY - 0.163, T + 0.01, 0.045, 0.006, 0.1, outline=0, bevel=0)
hip_roof('lowerroof', HX, HY, T + 0.15, 0.66, 0.38, 0.07, eave=0.06)
box('upperwall', M['red'], HX, HY, T + 0.2, 0.5, 0.24, 0.05, outline=0.008, bevel=0)
hip_roof('upperroof', HX, HY, T + 0.245, 0.56, 0.3, 0.16, eave=0.05)

# ---------- the courtyard: bronze incense burners, side halls and walls ----------
for k, x in enumerate((-0.35, 0.35)):
    lathe(f'burner{k}', M['bronze'], ((0.035, 0), (0.045, 0.04), (0.03, 0.07), (0.02, 0.09), (0.004, 0.12)), G - 0.005, x, -0.45, segs=10, outline=0.005)
for s in (-1, 1):
    x = s * 0.92
    box(f'sidehall{s}', M['red'], x, 0.15, G - 0.005, 0.2, 0.7, 0.12, outline=0.012, bevel=0)
    hip_roof(f'sidehallroof{s}', x, 0.15, G + 0.115, 0.2, 0.7, 0.1, eave=0.03)
box('backwall', M['red'], 0.0, 0.95, G - 0.005, 1.4, 0.06, 0.12, outline=0.01, bevel=0)
box('backwallcap', M['gold'], 0.0, 0.95, G + 0.115, 1.44, 0.1, 0.03, outline=0.005, bevel=0)

turn(before, -20)
render(G)
