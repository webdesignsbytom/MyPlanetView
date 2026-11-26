# The Sheikh Zayed Grand Mosque in the high-quality look (hq.py), laid out in metres (its long plan drawn
# shorter, to fit): Abu Dhabi's white marble mosque on its platform; the prayer hall with its great dome
# on a drum and the smaller domes round it on the roof; the courtyard before it, its marble floor inlaid
# with flowers; the arcades round the courtyard, pointed arches on white columns with gilded capitals,
# a little dome over every bay; the four tall minarets on the corners with their balconies and golden
# finials; the long reflecting pools outside the arcades, palms, and people.
# Run: blender -b --factory-startup -P sheikh-zayed-mosque.py -- sheikh-zayed-mosque-1024.png 1024 sheikh-zayed-mosque.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup(top='paving')
rng = random.Random(2007)
M['marbleZ'] = material('zayedMarble', '#f6f5f1', 0.35, vary='#ecebe6', vary_scale=30)
M['marbleShadeZ'] = material('zayedMarbleShade', '#e3e1da', 0.4)
M['courtyard'] = mosaic('zayedCourtyard', [(6, '#f4f3ee'), (2, '#e9e6dd'), (1, '#e8dcbc')], scale=26, mortar='#dcd8cd', rough=0.3)
M['giltZ'] = material('zayedGilt', '#d9ad48', 0.3, metallic=0.85)
M['poolZ'] = material('zayedPool', '#2f7fae', 0.05, vary='#3a8dbc', vary_scale=8, coat=0.8)
M['lawnZ'] = material('zayedLawn', '#6aa443', 0.85, vary='#78b14e', vary_scale=12, bump=0.3, bump_scale=200)
M['palmTrunkZ'] = material('palmTrunkZ', '#a49a86', 0.8, vary='#968c78', vary_scale=40)
M['frondZ'] = material('palmFrondZ', '#4f8f36', 0.8, vary='#5c9c40', vary_scale=20)
M['glassZ'] = material('zayedGlass', '#5b7a8d', 0.15, metallic=0.2)

S = 0.0102              # metres to the tile's units
Z0 = G + 0.004
PLAT = 3.0              # the platform's top


def P(x, y, z):
    return Vector((x * S, y * S, Z0 + z * S))


def block(name, mat, x0, x1, y0, y1, z0, z1, bevel=0.0004):
    return box(name, mat, P((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), ((x1 - x0) * S, (y1 - y0) * S, (z1 - z0) * S), bevel=bevel)


def dome_profile(r, h, point=0.18):
    """A slightly pointed dome's profile: swelling a little past its drum, then to a point."""
    out = []
    for j in range(17):
        t = j / 16
        a = math.pi / 2 * t
        rr = r * (1.0 + 0.08 * math.sin(math.pi * t * 0.9)) * math.cos(a)
        zz = h * math.sin(a) * (1.0 - point) + h * point * t ** 3
        out.append((max(rr, 0.0), zz))
    out[-1] = (0.0, out[-1][1])
    return out


def instance(name, data, at):
    ob = bpy.data.objects.new(name, data)
    bpy.context.scene.collection.objects.link(ob)
    ob.matrix_world = Matrix.Translation(at)


BEFORE = set(bpy.data.objects)
slab('ground', M['lawnZ'], [(-2.0, -2.0), (2.0, -2.0), (2.0, 2.0), (-2.0, 2.0)], Z0 - 0.003, Z0, margin=0.02)
XW, YF, YB = 92.0, -92.0, 96.0
block('platform', M['marbleShadeZ'], -XW - 6.0, XW + 6.0, YF - 6.0, YB + 2.0, -0.3, PLAT)
WIN = []

# ------------------------------------------------------------------ the courtyard and the arcades round it, a little dome over every bay
CY0, CY1 = -72.0, 34.0
CX = 72.0
block('courtyard', M['courtyard'], -CX, CX, CY0, CY1, PLAT, PLAT + 0.2, bevel=0)
small = lathe('smallDomeSource', M['marbleZ'], [(u * S, v * S) for u, v in dome_profile(3.4, 5.0)], (0, 0, 0), segs=24, smooth=True)
finial = lathe('finialSource', M['giltZ'], [(0.5 * S, 0.0), (0.35 * S, 0.8 * S), (0.1 * S, 2.0 * S), (0.0, 2.4 * S)], (0, 0, 0), segs=8)
SMALL, FIN = small.data, finial.data
bpy.data.objects.remove(small, do_unlink=True)
bpy.data.objects.remove(finial, do_unlink=True)
AR = 12.0               # the arcade's height
BAY = 8.0


def arcade(name, pts, normal_side):
    arcade_path(name, M['marbleZ'], [(x * S, y * S) for x, y in pts], 9.0 * S, Z0 + PLAT * S + 4.0 * S, (AR - 4.0) * S, 3.4 * S, pointed=0.5, normal_side=normal_side)


def bays(xa, ya, xb, yb):
    n = int(math.hypot(xb - xa, yb - ya) / BAY)
    pts = [(xa + (xb - xa) * k / n, ya + (yb - ya) * k / n) for k in range(n + 1)]
    return pts


for name, (xa, ya, xb, yb, side) in {'arcadeFront': (-CX - 9.0, CY0 - 9.0, CX + 9.0, CY0 - 9.0, 1), 'arcadeLeft': (-CX - 9.0, CY1, -CX - 9.0, CY0 - 9.0, -1),
                                       'arcadeRight': (CX + 9.0, CY0 - 9.0, CX + 9.0, CY1, -1)}.items():
    pts = bays(xa, ya, xb, yb)
    arcade(name, pts, side)
    dx, dy = (xb - xa), (yb - ya)
    L = math.hypot(dx, dy)
    nx, ny = -dy / L * side, dx / L * side
    for (pa, pb) in zip(pts, pts[1:]):
        mx, my = (pa[0] + pb[0]) / 2 + nx * 4.5, (pa[1] + pb[1]) / 2 + ny * 4.5
        instance(f'{name}Dome{mx:+.0f}{my:+.0f}', SMALL, P(mx, my, PLAT + AR + 0.6))
        instance(f'{name}Finial{mx:+.0f}{my:+.0f}', FIN, P(mx, my, PLAT + AR + 5.4))
    for p in pts:
        for o in (0.4, 8.6):
            cx, cy = p[0] + nx * o, p[1] + ny * o
            cylinder(f'{name}Col{cx:+.0f}{cy:+.0f}', M['marbleZ'], 0.7 * S, 4.0 * S, P(cx, cy, PLAT), segs=12)
            cylinder(f'{name}Cap{cx:+.0f}{cy:+.0f}', M['giltZ'], 0.95 * S, 0.8 * S, P(cx, cy, PLAT + 3.4), segs=12)
    block(f'{name}Roof', M['marbleShadeZ'], min(xa, xb + nx * 9.0, xa + nx * 9.0, xb), max(xa, xb + nx * 9.0, xa + nx * 9.0, xb),
          min(ya, yb + ny * 9.0, ya + ny * 9.0, yb), max(ya, yb + ny * 9.0, ya + ny * 9.0, yb), PLAT + AR, PLAT + AR + 0.6, bevel=0)

# ------------------------------------------------------------------ the prayer hall, its domes, the great dome on its drum
HY0, HY1 = CY1, YB - 6.0
block('hall', M['marbleZ'], -CX - 9.0, CX + 9.0, HY0, HY1, PLAT, PLAT + 20.0)
block('hallParapet', M['marbleShadeZ'], -CX - 9.6, CX + 9.6, HY0 - 0.6, HY1 + 0.6, PLAT + 20.0, PLAT + 21.0, bevel=0)
for k in range(9):
    x = -CX + 4.0 + k * (2 * CX - 8.0) / 8
    c = P(x, HY0 - 0.05, 0)
    WIN.append((c.x, c.y, Z0 + (PLAT + 3.0) * S, 4.0 * S, 12.0 * S, (0, -1), 'pointed'))
mid = lathe('midDomeSource', M['marbleZ'], [(u * S, v * S) for u, v in dome_profile(7.0, 9.5)], (0, 0, 0), segs=40, smooth=True)
MID = mid.data
bpy.data.objects.remove(mid, do_unlink=True)
DC = (0.0, (HY0 + HY1) / 2)
for x in (-58.0, -40.0, 40.0, 58.0):
    for y in (HY0 + 12.0, HY1 - 12.0):
        cylinder(f'midDrum{x:+.0f}{y:+.0f}', M['marbleZ'], 7.2 * S, 3.0 * S, P(x, y, PLAT + 21.0), segs=40)
        instance(f'midDome{x:+.0f}{y:+.0f}', MID, P(x, y, PLAT + 24.0))
        instance(f'midFinial{x:+.0f}{y:+.0f}', FIN, P(x, y, PLAT + 33.4))
for x in (-22.0, 22.0):
    for y in (HY0 + 8.0, HY1 - 8.0):
        cylinder(f'nearDrum{x:+.0f}{y:+.0f}', M['marbleZ'], 7.2 * S, 8.0 * S, P(x, y, PLAT + 21.0), segs=40)
        instance(f'nearDome{x:+.0f}{y:+.0f}', MID, P(x, y, PLAT + 29.0))
        instance(f'nearFinial{x:+.0f}{y:+.0f}', FIN, P(x, y, PLAT + 38.4))
cylinder('greatDrum', M['marbleZ'], 17.0 * S, 18.0 * S, P(*DC, PLAT + 21.0), segs=64)
cylinder('greatDrumBand', M['marbleShadeZ'], 17.6 * S, 1.2 * S, P(*DC, PLAT + 38.4), segs=64)
for k in range(16):
    a = 2 * math.pi * (k + 0.5) / 16
    c = P(DC[0] + 17.02 * math.cos(a), DC[1] + 17.02 * math.sin(a), 0)
    WIN.append((c.x, c.y, Z0 + (PLAT + 26.0) * S, 2.4 * S, 8.0 * S, (math.cos(a), math.sin(a)), 'pointed'))
lathe('greatDome', M['marbleZ'], [(u * S, v * S) for u, v in dome_profile(16.6, 26.0)], P(*DC, PLAT + 39.6), segs=72, smooth=True)
lathe('greatFinial', M['giltZ'], [(1.2 * S, 0.0), (0.8 * S, 2.0 * S), (1.1 * S, 3.0 * S), (0.3 * S, 5.6 * S), (0.0, 6.4 * S)], P(*DC, PLAT + 65.4), segs=16)

# ------------------------------------------------------------------ the four minarets on the corners
for sx in (-1, 1):
    for y in (YF + 2.0, HY1 - 2.0):
        x = sx * (XW - 2.0)
        block(f'minaretBase{sx}{y:+.0f}', M['marbleZ'], x - 4.0, x + 4.0, y - 4.0, y + 4.0, PLAT, PLAT + 26.0)
        cylinder(f'minaretShaft{sx}{y:+.0f}', M['marbleZ'], 3.2 * S, 28.0 * S, P(x, y, PLAT + 26.0), segs=8, r2=2.9 * S)
        cylinder(f'minaretBalcony{sx}{y:+.0f}', M['marbleShadeZ'], 4.4 * S, 1.6 * S, P(x, y, PLAT + 54.0), segs=24)
        cylinder(f'minaretUpper{sx}{y:+.0f}', M['marbleZ'], 2.5 * S, 18.0 * S, P(x, y, PLAT + 55.6), segs=16, r2=2.3 * S)
        cylinder(f'minaretBalcony2{sx}{y:+.0f}', M['marbleShadeZ'], 3.6 * S, 1.4 * S, P(x, y, PLAT + 73.6), segs=24)
        cylinder(f'minaretTop{sx}{y:+.0f}', M['marbleZ'], 2.1 * S, 8.0 * S, P(x, y, PLAT + 75.0), segs=16)
        lathe(f'minaretCap{sx}{y:+.0f}', M['giltZ'], [(2.4 * S, 0.0), (2.2 * S, 1.6 * S), (1.2 * S, 3.6 * S), (0.4 * S, 5.0 * S), (0.0, 7.6 * S)], P(x, y, PLAT + 83.0), segs=16, smooth=True)

# ------------------------------------------------------------------ the reflecting pools along the arcades, palms, people
for sx in (-1, 1):
    block(f'pool{sx}', M['poolZ'], *sorted((sx * (CX + 11.0), sx * (CX + 19.0))), CY0 - 6.0, CY1 - 4.0, PLAT, PLAT + 0.3, bevel=0)
for j, (x, y) in enumerate(((-70.0, -110.0), (-40.0, -112.0), (40.0, -112.0), (70.0, -110.0), (-105.0, -40.0), (105.0, -40.0))):
    h = 12.0
    lathe(f'palm{j}', M['palmTrunkZ'], [(0.55 * S, 0.0), (0.45 * S, h * 0.5 * S), (0.42 * S, h * S)], P(x, y, 0.0), segs=10, smooth=True)
    for f in range(8):
        b = 2 * math.pi * f / 8 + j
        tube(f'frond{j}{f}', M['frondZ'], [P(x, y, h), P(x + 2.4 * math.cos(b), y + 2.4 * math.sin(b), h + 0.8), P(x + 4.4 * math.cos(b), y + 4.4 * math.sin(b), h - 1.4)], 0.35 * S)
glazed('windows', WIN, M['marbleShadeZ'], glass=M['glassZ'], depth=0.3 * S, bars=False)
for k, (x, y, shirt) in enumerate(((-10.0, -30.0, 'white'), (6.0, -20.0, 'white'), (-30.0, 0.0, 'blue'), (20.0, 10.0, 'white'), (0.0, -104.0, 'red'))):
    c = P(x, y, PLAT + 0.2 if y > YF else 0.0)
    person(f'p{k}', c.x, c.y, rng.random() * 6, shirt, z=c.z, scale=1.0)

R = Matrix.Rotation(math.radians(-32.0 + 14.0), 4, 'Z')
for ob in set(bpy.data.objects) - BEFORE:
    ob.matrix_world = R @ ob.matrix_world
render('sheikh-zayed-mosque')
