# The high-quality landmark models

The landmark models remade in the high-quality look (`hq.py`, the Pisa diorama the user approved
on 25 Nov 2026). Nothing here is on the site yet: the user will put them all on together once they
are all made (25 Nov 2026). Each folder is `<id>/` with `<id>.py`, `model.json` (copied from
`../models/<id>/`), `<id>-1024.png`, `<id>-1024.json` and `<id>.blend`.

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
6. [ ] sacre-coeur*, [ ] chambord, [ ] carcassonne, [ ] kinderdijk, [ ] bryggen, [ ] dubrovnik, [ ] meteora, [ ] santorini, [ ] hallstatt, [ ] lake-bled
7. [ ] peles-castle, [ ] bran-castle, [ ] spasskaya-tower*, [ ] saint-petersburg, [ ] grand-place, [ ] amsterdam-canals, [ ] rijksmuseum*, [ ] park-guell*, [ ] casa-batllo*, [ ] plaza-de-espana*
8. [ ] segovia-aqueduct, [ ] pont-du-gard, [ ] belem-tower, [ ] pena-palace*, [ ] cordoba-mezquita, [ ] seville-giralda, [ ] krakow, [ ] strasbourg, [ ] ephesus, [ ] st-stephens*
9. [ ] riesenrad*, [ ] trulli, [ ] valletta, [ ] cesky-krumlov, [ ] malbork, [ ] giants-causeway, [ ] cliffs-of-moher, [ ] matterhorn, [ ] teotihuacan, [ ] tikal
10. [ ] chateau-frontenac, [ ] independence-hall*, [ ] alamo, [ ] old-havana, [ ] panama-canal, [ ] iguazu-falls, [ ] grand-canyon, [ ] bellas-artes*, [ ] angel-of-independence*, [ ] palenque
11. [ ] cartagena, [ ] teatro-amazonas, [ ] fallingwater, [ ] terracotta-army, [ ] potala-palace, [ ] borobudur, [ ] petronas-towers, [ ] marina-bay-sands, [ ] sheikh-zayed-mosque, [ ] golden-temple
12. [ ] hawa-mahal, [ ] red-fort, [ ] gateway-of-india*, [ ] humayuns-tomb*, [ ] qutb-minar*, [ ] himeji-castle, [ ] itsukushima, [ ] kinkakuji*, [ ] fushimi-inari*, [ ] hiroshima-peace-memorial*
13. [ ] gyeongbokgung, [ ] grand-palace-bangkok, [ ] wat-arun*, [ ] bagan, [ ] ha-long-bay, [ ] tigers-nest, [ ] leshan-buddha, [ ] registan, [ ] dome-of-the-rock*, [ ] western-wall
14. [ ] persepolis, [ ] naqsh-e-jahan, [ ] karnak, [ ] victoria-falls, [ ] kilimanjaro, [ ] lalibela, [ ] djenne, [ ] hassan-tower, [ ] ait-benhaddou, [ ] cappadocia
15. [ ] mostar, [ ] fishermans-bastion*, [ ] forth-bridge*, [ ] kiyomizu-dera*, [ ] summer-palace*, [ ] rila, [ ] sigiriya, [ ] konark, [ ] verona-arena, [ ] delphi
