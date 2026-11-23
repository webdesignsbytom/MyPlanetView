# A cartoon Xochimilco for the country maps, built in the set's shared look (../toon.py): the canals
# among the chinampas, the floating gardens with their willows and flowers, and the trajineras, flat
# boats painted every colour with a name-arch at the front and a roof over the benches, a mariachi
# band on one of them. Turned a little towards the camera.
# Run: blender -b --factory-startup -P xochimilco.py -- xochimilco-1024.png 1024 xochimilco.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'canal': toon('canal', '#4a8a7a', shadow_mul=(0.74, 0.84, 0.86), lift=0.3),
    'chinampa': toon('chinampa', '#6aa54a', shadow_mul=(0.7, 0.78, 0.8)),
    'willow': toon('willow', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
    'flower0': toon('flower0', '#e8402c'), 'flower1': toon('flower1', '#f0c030'), 'flower2': toon('flower2', '#e86a9a'),
    't0': toon('t0', '#e8402c'), 't1': toon('t1', '#2f8ac0'), 't2': toon('t2', '#f0c030'), 't3': toon('t3', '#3f9a4a'), 't4': toon('t4', '#a86ad0'),
    'hull': toon('hull', '#6a4a36'),
    'white': toon('white', '#f8f6f0', lift=0.2),
    'mariachi': toon('mariachi', '#2e2a30'),
    'hat': toon('hat', '#e0c88a', lift=0.2),
})

G = tile(M['canal'])
before = set(bpy.data.objects)
rng = random.Random(1831)

# ---------- the chinampas ----------
for k, (x, y, w, d) in enumerate(((-0.75, 0.6, 0.5, 0.35), (0.0, 0.75, 0.6, 0.3), (0.75, 0.55, 0.45, 0.4), (-0.85, -0.05, 0.35, 0.45), (0.9, -0.1, 0.3, 0.4))):
    box(f'chinampa{k}', M['chinampa'], x, y, G - 0.005, w, d, 0.04, outline=0.008, bevel=0)
    for j in range(3):
        u = x - w / 3 + j * w / 3
        rod(f'willowtrunk{k}{j}', M['hull'], (u, y + d * 0.2, G + 0.035), (u, y + d * 0.2, G + 0.14), 0.01, segs=6, outline=0.003)
        lathe(f'willow{k}{j}', M['willow'], ((0.06, 0), (0.07, 0.06), (0.04, 0.13), (0.004, 0.16)), G + 0.08, u, y + d * 0.2, segs=10, outline=0.006)
    for j in range(4):
        ball(f'flower{k}{j}', M[f'flower{j % 3}'], x - w / 2 + 0.06 + j * (w - 0.12) / 3, y - d / 2 + 0.05, G + 0.05, 0.02, outline=0.002)


# ---------- the trajineras ----------
def trajinera(name, x, y, a, col, band=False):
    c, s = math.cos(a), math.sin(a)

    def p(u, v, z):
        return (x + u * c - v * s, y + u * s + v * c, G + z)

    loft(f'{name}hull', M['hull'], [[p(-0.16, -0.06, -0.002), p(0.16, -0.06, -0.002), p(0.16, 0.06, -0.002), p(-0.16, 0.06, -0.002)],
                                    [p(-0.18, -0.07, 0.035), p(0.18, -0.07, 0.035), p(0.18, 0.07, 0.035), p(-0.18, 0.07, 0.035)]], outline=0.006)
    for u in (-0.14, 0.14):
        for v in (-0.06, 0.06):
            rod(f'{name}post{u}{v}', M[col], p(u, v, 0.035), p(u, v, 0.15), 0.006, segs=5, outline=0.002)
    box(f'{name}roof', M[col], x, y, G + 0.15, 0.34, 0.15, 0.015, rot_z=a, outline=0.004, bevel=0)
    box(f'{name}arch', M[col], *p(0.18, 0, 0)[:2], G + 0.035, 0.012, 0.15, 0.14, rot_z=a, outline=0.004, bevel=0)
    box(f'{name}name', M['white'], *p(0.188, 0, 0)[:2], G + 0.13, 0.006, 0.11, 0.03, rot_z=a, outline=0, bevel=0)
    if band:
        for j in range(3):
            u = -0.08 + j * 0.08
            rod(f'{name}mariachi{j}', M['mariachi'], p(u, 0, 0.035), p(u, 0, 0.1), 0.012, segs=6, outline=0.002)
            lathe(f'{name}hat{j}', M['hat'], ((0.025, 0), (0.012, 0.012), (0.008, 0.02)), G + 0.1, *p(u, 0, 0)[:2], segs=10, outline=0.002)


trajinera('trajinera0', -0.15, 0.25, 0.1, 't0')
trajinera('trajinera1', 0.35, 0.1, -0.2, 't1', band=True)
trajinera('trajinera2', -0.3, -0.3, 0.3, 't2')
trajinera('trajinera3', 0.3, -0.5, 0.0, 't3')
trajinera('trajinera4', -0.55, 0.3, 1.4, 't4')

turn(before, -20)
render(G)
