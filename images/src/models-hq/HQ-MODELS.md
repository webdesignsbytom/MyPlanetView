# The high-quality landmark models

The landmark models remade in the high-quality look (`hq.py`, the Pisa diorama the user approved
on 25 Nov 2026). Nothing here is on the site yet: the user will put them all on together once they
are all made (25 Nov 2026). Each folder is `<id>/` with `<id>.py`, `model.json` (copied from
`../models/<id>/`), `<id>-1024.png` and `<id>-1024.json`; the `<id>.blend` a render saves stays on this
machine (`.gitignore`: the scripts rebuild it; the user's decision, 26 Nov 2026).

Run one (from its folder): `blender -b --factory-startup -P <id>.py -- <id>-1024.png 1024 <id>.blend 256`
(the last number is the samples; a preview: a smaller size and 32 samples, no `.blend`).

The rules every model keeps (the user's, 25 Nov 2026): the landmark fills the tile; nothing goes over
the base's edge (`render()` prints `OUT OF BOUNDS`; ground pieces through `slab()`); trees and
scenery never hide the landmark from the camera; the landmark stands out from its ground; cartoony
warmth over realism.

Two surfaces lying exactly on each other render black in Cycles (each shadows the other): never let
two pieces share a face where they overlap (a box stacked into another of the same footprint, a slab
on another slab at the same height); set one a hair inside or below the other.

Statues and sculpture come from sculpted or scanned models (`_sources/`, CC0 or CC BY only, credited
in each folder's `SOURCE.md`; the user's decision, 26 Nov 2026): a figure built from code shapes
isn't good enough. `import_model` brings one in, `stand_sourced` cuts it from its base and stands it.

## The pilot (25 Nov 2026): 11, done

leaning-tower, big-ben, eiffel-tower, colosseum, taj-mahal, pyramids-of-giza, sydney-opera-house,
saint-basils, neuschwanstein, golden-gate-bridge, mount-fuji

## The first 150 (picked 26 Nov 2026: the most famous first, buildings, statues and structures, a few natural sights)

A `*` marks a model the country maps don't draw (`onMap: false`); it still shows in the landmark
card and the celebration. `[x]` is done (rendered at 1024 px, 256 samples).

1. [x] sagrada-familia, [x] parthenon, [x] statue-of-liberty, [x] great-wall, [x] christ-the-redeemer, [x] machu-picchu, [x] chichen-itza, [x] angkor-wat, [x] petra, [x] stonehenge
2. [x] mont-saint-michel, [x] tower-bridge*, [x] louvre*, [x] notre-dame*, [x] arc-de-triomphe*, [x] brandenburg-gate, [x] st-peters, [x] trevi-fountain*, [x] pantheon*, [x] hagia-sophia
3. [x] burj-khalifa, [x] forbidden-city*, [x] temple-of-heaven*, [x] cn-tower, [x] mount-rushmore, [x] moai, [x] abu-simbel, [x] table-mountain, [x] sydney-harbour-bridge*, [x] uluru
4. [x] alhambra, [x] florence-duomo*, [x] ponte-vecchio*, [x] rialto-bridge*, [x] venice, [x] pompeii, [x] milan-cathedral*, [x] cologne-cathedral, [x] charles-bridge*, [x] prague-castle
5. [x] hungarian-parliament, [x] schonbrunn, [x] blue-mosque*, [x] galata-tower*, [x] edinburgh-castle, [x] buckingham-palace*, [x] westminster-abbey*, [x] tower-of-london*, [x] london-eye*, [x] versailles*
6. [x] sacre-coeur*, [x] chambord, [x] carcassonne, [x] kinderdijk, [x] bryggen, [x] dubrovnik, [x] meteora, [x] santorini, [x] hallstatt, [x] lake-bled
7. [x] peles-castle, [x] bran-castle, [x] spasskaya-tower*, [x] saint-petersburg, [x] grand-place, [x] amsterdam-canals, [x] rijksmuseum*, [x] park-guell*, [x] casa-batllo*, [x] plaza-de-espana*
8. [x] segovia-aqueduct, [x] pont-du-gard, [x] belem-tower, [x] pena-palace*, [x] cordoba-mezquita, [x] seville-giralda, [x] krakow, [x] strasbourg, [x] ephesus, [x] st-stephens*
9. [x] riesenrad*, [x] trulli, [x] valletta, [x] cesky-krumlov, [x] malbork, [x] giants-causeway, [x] cliffs-of-moher, [x] matterhorn, [x] teotihuacan, [x] tikal
10. [x] chateau-frontenac, [x] independence-hall*, [x] alamo, [x] old-havana, [x] panama-canal, [x] iguazu-falls, [x] grand-canyon, [x] bellas-artes*, [x] angel-of-independence*, [x] palenque
11. [x] cartagena, [x] teatro-amazonas, [x] fallingwater, [x] terracotta-army, [x] potala-palace, [x] borobudur, [x] petronas-towers, [x] marina-bay-sands, [x] sheikh-zayed-mosque, [x] golden-temple
12. [x] hawa-mahal, [x] red-fort, [x] gateway-of-india*, [x] humayuns-tomb*, [x] qutb-minar*, [x] himeji-castle, [x] itsukushima, [x] kinkakuji*, [x] fushimi-inari*, [x] hiroshima-peace-memorial*
13. [x] gyeongbokgung, [x] grand-palace-bangkok, [x] wat-arun*, [x] bagan, [x] ha-long-bay, [x] tigers-nest, [x] leshan-buddha, [x] registan, [x] dome-of-the-rock*, [x] western-wall
14. [ ] persepolis, [ ] naqsh-e-jahan, [ ] karnak, [ ] victoria-falls, [ ] kilimanjaro, [ ] lalibela, [ ] djenne, [ ] hassan-tower, [ ] ait-benhaddou, [ ] cappadocia
15. [ ] mostar, [ ] fishermans-bastion*, [ ] forth-bridge*, [ ] kiyomizu-dera*, [ ] summer-palace*, [ ] rila, [ ] sigiriya, [ ] konark, [ ] verona-arena, [ ] delphi
