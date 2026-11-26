# Delphi in the high-quality look (hq.py), laid out in metres (drawn closer together, to fit): the
# sanctuary of Apollo on the slope of Mount Parnassus under the cliffs of the Phaedriades; the Temple of
# Apollo's long platform with its few re-erected Doric columns among the stumps of the rest; the
# theatre's stone tiers cut into the hillside above it; the little Athenian Treasury beside the Sacred
# Way zigzagging up; the Tholos's three columns on their round base below; olive trees and cypresses,
# and people.
# Run: blender -b --factory-startup -P delphi.py -- delphi-1024.png 1024 delphi.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
rng = random.Random(582)
M['limestoneD'] = material('delphiLimestone', '#d8cdb8', 0.85, vary='#cbbfa8', vary_scale=24, bump=0.25, bump_scale=200)
M['limestoneDark'] = material('delphiLimestoneDark', '#b9ad96', 0.85, vary='#ab9f88', vary_scale=24, bump=0.25, bump_scale=200)
M['marbleD'] = material('delphiMarble', '#efeae0', 0.6, vary='#e4ded2', vary_scale=24)
M['slopeD'] = material('parnassusSlope', '#8d8a5a', 0.9, vary='#7f7c50', vary_scale=14, bump=0.3, bump_scale=200)
M['cliff'] = layered('phaedriades', ['#a89c88', '#988c78', '#b8ac98'], scale=10.0, distortion=1.5, rough=0.9, bump=0.5, bump_scale=90, axis='X')
M['pathD'] = material('sacredWay', '#cbbd9f', 0.9, vary='#bfb193', vary_scale=40)
M['olive'] = material('oliveTree', '#7a8f5a', 0.85, vary='#869b64', vary_scale=14, bump=0.3, bump_scale=90)
M['cypressD'] = material('delphiCypress', '#2f5a33', 0.85, vary='#3a683d', vary_scale=14, bump=0.3, bump_scale=90)

S = 0.0215              # metres to the tile's units
Z0 = G


def smooth(t):
    t = min(1.0, max(0.0, t))
    return t * t * (3 - 2 * t)


def ground(x, y):
    """The slope rising to the north, terraced where the sanctuary stands, the cliffs above."""
    slope = 0.28 * (y + 60.0)
    cliff = 22.0 * smooth((y - 46.0) / 6.0)
    return max(0.0, slope + cliff)


def terraced(x, y):
    """The ground, levelled where the temple and the theatre stand."""
    g = ground(x, y)
    if abs(x) < 36.0 and -8.0 < y < 20.0:
        return ground(0.0, 6.0)
    return g


def H(x, y):
    rim = smooth((1.48 - math.hypot(x, y)) / 0.14)
    return terraced(x / S, y / S) * S * rim


land = terrain('slope', H, [M['slopeD'], M['cliff']], lambda z, nz, x, y: 1 if nz < 0.6 else 0, rings=200, segs=500)
BEFORE = set(bpy.data.objects)


def P(x, y, z):
    return Vector((x * S, y * S, Z0 + z * S))


def doric(name, x, y, z, h, r=0.9, mat='limestoneD'):
    cylinder(name, M[mat], r * S, h * S, P(x, y, z), segs=20, r2=r * 0.85 * S)
    lathe(name + 'Echinus', M[mat], [(r * 0.85 * S, 0.0), (r * 1.25 * S, 0.5 * S), (r * 1.25 * S, 0.7 * S)], P(x, y, z + h), segs=20)
    box(name + 'Abacus', M[mat], P(x, y, z + h + 0.95), (r * 2.6 * S, r * 2.6 * S, 0.5 * S), bevel=0)


# ------------------------------------------------------------------ the Temple of Apollo: its platform, the columns standing among the stumps
TZ = ground(0.0, 6.0)
box('templeStylobate', M['limestoneDark'], P(0.0, 6.0, TZ + 1.2), (54.0 * S, 22.0 * S, 2.4 * S), bevel=0)
for j in range(3):
    box(f'templeStep{j}', M['limestoneDark'], P(0.0, -5.4 - 0.7 * j, TZ + 2.4 - 0.8 * (j + 1)), (54.0 * S, 0.7 * S, 0.8 * S), bevel=0)
for k in range(15):
    x = -24.0 + 48.0 * k / 14
    for y in (-3.0, 15.0):
        standing = (y < 0 and 5 <= k <= 10)
        if standing:
            doric(f'col{k}{y:+.0f}', x, y, TZ + 2.4, 10.4)
        else:
            cylinder(f'stump{k}{y:+.0f}', M['limestoneD'], 0.9 * S, rng.uniform(0.4, 1.6) * S, P(x, y, TZ + 2.4), segs=20)
for y in (1.5, 6.0, 10.5):
    for x in (-24.0, 24.0):
        cylinder(f'stumpS{x:+.0f}{y:.0f}', M['limestoneD'], 0.9 * S, rng.uniform(0.3, 1.0) * S, P(x, y, TZ + 2.4), segs=20)
box('architrave', M['limestoneD'], P(-1.7, -3.0, TZ + 2.4 + 11.6), (17.4 * S, 1.6 * S, 1.2 * S), bevel=0)

# ------------------------------------------------------------------ the theatre above: its tiers cut into the hill, the orchestra
TY = 30.0
OZ = ground(0.0, TY - 6.0)
for k in range(11):
    r0, r1 = 6.0 + 1.5 * k, 7.5 + 1.5 * k
    z = OZ + 0.8 * (k + 1)
    arc = [math.radians(a) for a in range(-12, 193, 6)]
    poly = [(r1 * math.cos(t), TY - 6.0 + r1 * math.sin(t)) for t in arc] + [(r0 * math.cos(t), TY - 6.0 + r0 * math.sin(t)) for t in reversed(arc)]
    bm = bmesh.new()
    add_prism(bm, [bm.verts.new(P(x, y, z)) for x, y in poly], [bm.verts.new(P(x, y, OZ - 1.0)) for x, y in poly])
    finish(f'tier{k}', bm, M['limestoneD'] if k % 2 else M['limestoneDark'], smooth_sides=False)
cylinder('orchestra', M['limestoneDark'], 7.0 * S, 0.3 * S, P(0.0, TY - 6.0, OZ - 0.2), segs=40)

# ------------------------------------------------------------------ the Athenian Treasury, the Sacred Way, the Tholos
AX_, AY_ = -24.0, -22.0
az = ground(AX_, AY_)
box('treasuryBase', M['limestoneDark'], P(AX_, AY_, az + 0.6), (8.0 * S, 12.0 * S, 1.6 * S), bevel=0)
box('treasury', M['marbleD'], P(AX_, AY_ + 1.2, az + 1.4 + 3.4), (6.6 * S, 8.4 * S, 6.8 * S), bevel=0)
for s in (-1, 1):
    doric(f'treasuryCol{s}', AX_ + s * 1.4, AY_ - 4.0, az + 1.4, 5.4, r=0.45, mat='marbleD')
box('treasuryEntablature', M['marbleD'], P(AX_, AY_, az + 1.4 + 7.2), (7.0 * S, 10.0 * S, 1.2 * S), bevel=0)
gable_roof('treasuryRoof', M['marbleD'], (AX_ - 3.6) * S, (AX_ + 3.6) * S, (AY_ - 5.2) * S, (AY_ + 5.2) * S, Z0 + (az + 9.0) * S, 1.8 * S, over=0.0, along='y')
WAY = [(-10.0, -56.0), (-30.0, -40.0), (-14.0, -30.0), (-30.0, -14.0), (-6.0, -8.0)]
for k, ((xa, ya), (xb, yb)) in enumerate(zip(WAY, WAY[1:])):
    L = math.hypot(xb - xa, yb - ya)
    ang = math.atan2(yb - ya, xb - xa)
    for j in range(int(L / 2.0)):
        t = (j + 0.5) / int(L / 2.0)
        x, y = xa + (xb - xa) * t, ya + (yb - ya) * t
        box(f'way{k}{j}', M['pathD'], P(x, y, ground(x, y) + 0.05), (2.2 * S, 3.6 * S, 0.3 * S), rot_z=ang + math.pi / 2, bevel=0)
HX, HY = 26.0, -34.0
hz = ground(HX, HY)
cylinder('tholosBase', M['limestoneDark'], 7.6 * S, 1.6 * S, P(HX, HY, hz - 0.4), segs=48)
cylinder('tholosStep', M['marbleD'], 7.0 * S, 0.6 * S, P(HX, HY, hz + 1.2), segs=48)
for k, a in enumerate((200.0, 225.0, 250.0)):
    t = math.radians(a)
    doric(f'tholosCol{k}', HX + 6.2 * math.cos(t), HY + 6.2 * math.sin(t), hz + 1.8, 7.2, r=0.55, mat='marbleD')
box('tholosEntablature', M['marbleD'], P(HX + 6.2 * math.cos(math.radians(225.0)), HY + 6.2 * math.sin(math.radians(225.0)), hz + 1.8 + 8.6), (6.8 * S, 1.4 * S, 1.4 * S), rot_z=math.radians(225.0) + math.pi / 2, bevel=0)
for k in range(9):
    t = math.radians(260.0 + 26.0 * k)
    cylinder(f'tholosStump{k}', M['marbleD'], 0.55 * S, rng.uniform(0.3, 1.2) * S, P(HX + 6.2 * math.cos(t), HY + 6.2 * math.sin(t), hz + 1.8), segs=16)

# ------------------------------------------------------------------ olives and cypresses, people
OL, CY = [], []
for p in scatter_on(land, 8000, (-1.5, 1.5, -1.5, 1.5), lambda p, m: m == 0 and math.hypot(p.x, p.y) < 1.34, seed=5):
    x, y = p.x / S, p.y / S
    if (abs(x) < 34.0 and -10.0 < y < 44.0) or math.hypot(x - HX, y - HY) < 10.0 or math.hypot(x - AX_, y - AY_) < 8.0:
        continue
    if rng.random() < 0.3:
        CY.append(((p.x, p.y, p.z + 4.0 * S), 1.1 * S, 3.0))
    else:
        OL.append(((p.x, p.y, p.z + 2.4 * S), rng.uniform(1.6, 2.4) * S, 0.8))
    if len(OL) + len(CY) >= 130:
        break
blob_cloud('olives', M['olive'], OL)
blob_cloud('cypresses', M['cypressD'], CY)
for k, (x, y, shirt) in enumerate(((-12.0, -4.0, 'red'), (8.0, -6.0, 'blue'), (-20.0, -36.0, 'yellow'), (20.0, -30.0, 'green'))):
    c = P(x, y, (TZ + 2.4) if y > -6.0 else ground(x, y) + 0.3)
    person(f'p{k}', c.x, c.y, rng.random() * 6, shirt, z=c.z, scale=0.85)

R = Matrix.Rotation(math.radians(-32.0 + 14.0), 4, 'Z')
for ob in [land] + list(set(bpy.data.objects) - BEFORE):
    ob.matrix_world = R @ ob.matrix_world
render('delphi')
