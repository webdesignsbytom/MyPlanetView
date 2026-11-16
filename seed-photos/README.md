# Seed photos

Test photos for the demo accounts, from Wikimedia Commons (downloaded 16 Nov 2026). Development and testing only: they are never part of a build.

- **The server seed** (`server/prisma/seed/photos.js`) uploads them to the **private** bucket as photos on the seeded USER's map, the way an upload does: a MediaItem per file, a Photo, its PhotoVariants and landmark suggestions.
- **Mock mode** (`client/src/dev/mock/`) shows them on the test account's map. In development, Vite serves this folder at `/seed-photos` (`vite.config.js`).
- **`photos.json`** lists each photo: country, caption, date, GPS position (from Commons), trip, who uploaded it, its three files (`THUMB` 400 px and `DISPLAY` 1600 px WebP, `ORIGINAL` JPEG) and its credit.

## Credits and licences

Each folder holds resized copies of the Commons file below, under the same licence. CC BY-SA files may be used and changed if the author is credited and the copies keep the licence; public domain and CC0 files need nothing.

| Folder | Commons file | Author | Licence |
| --- | --- | --- | --- |
| eiffel-tower | [Paris - The Eiffel Tower in spring - 2307.jpg](https://commons.wikimedia.org/wiki/File:Paris_-_The_Eiffel_Tower_in_spring_-_2307.jpg) | Jorge Royan | CC BY-SA 3.0 |
| mont-saint-michel | [Mont St Michel 3, Brittany, France - July 2011.jpg](https://commons.wikimedia.org/wiki/File:Mont_St_Michel_3,_Brittany,_France_-_July_2011.jpg) | Diliff | Public domain |
| louvre | [Aile Richelieu Louvre.jpg](https://commons.wikimedia.org/wiki/File:Aile_Richelieu_Louvre.jpg) | Jebulon | CC0 |
| colosseum | [Cross Colosseum Rome Italy.jpg](https://commons.wikimedia.org/wiki/File:Cross_Colosseum_Rome_Italy.jpg) | Jebulon | CC0 |
| florence-cathedral | [Florence Cathedral seen from Piazzale Michelangelo night dllu.jpg](https://commons.wikimedia.org/wiki/File:Florence_Cathedral_seen_from_Piazzale_Michelangelo_night_dllu.jpg) | Dllu | CC BY-SA 4.0 |
| cinque-terre | [Manarola NW Cemetery Corniglia Monterosso Cinque Terre Sep23 A7C 06872.jpg](https://commons.wikimedia.org/wiki/File:Manarola_NW_Cemetery_Corniglia_Monterosso_Cinque_Terre_Sep23_A7C_06872.jpg) | Timothy A. Gonsalves | CC BY-SA 4.0 |
| venice-grand-canal | [Panorama of Canal Grande and Ponte di Rialto, Venice - September 2017.jpg](https://commons.wikimedia.org/wiki/File:Panorama_of_Canal_Grande_and_Ponte_di_Rialto,_Venice_-_September_2017.jpg) | Martin Falbisoner | CC BY-SA 4.0 |
| alhambra | [Pavillon Cour des Lions Alhambra Granada Spain.jpg](https://commons.wikimedia.org/wiki/File:Pavillon_Cour_des_Lions_Alhambra_Granada_Spain.jpg) | Jebulon | CC0 |
| sagrada-familia | [Sagrada Familia March 2015-19bw.jpg](https://commons.wikimedia.org/wiki/File:Sagrada_Familia_March_2015-19bw.jpg) | Alvesgaspar | CC BY-SA 4.0 |
| belem-tower | [Lisbon Torre de Belém BW 2018-10-03 16-33-21.jpg](https://commons.wikimedia.org/wiki/File:Lisbon_Torre_de_Bel%C3%A9m_BW_2018-10-03_16-33-21.jpg) | Berthold Werner | CC BY-SA 4.0 |
| amsterdam-canal | [Water reflection of canal houses at blue hour in Damrak Amsterdam the Netherlands.jpg](https://commons.wikimedia.org/wiki/File:Water_reflection_of_canal_houses_at_blue_hour_in_Damrak_Amsterdam_the_Netherlands.jpg) | Basile Morin | CC BY-SA 4.0 |
| lower-manhattan | [Lower Manhattan from Jersey City September 2020 panorama.jpg](https://commons.wikimedia.org/wiki/File:Lower_Manhattan_from_Jersey_City_September_2020_panorama.jpg) | King of Hearts | CC BY-SA 4.0 |
| golden-gate-bridge | [Crissy Field beach and Golden Gate Bridge.jpg](https://commons.wikimedia.org/wiki/File:Crissy_Field_beach_and_Golden_Gate_Bridge.jpg) | Brocken Inaglory | Public domain |
| tower-bridge | [London, Tower Bridge -- 2016 -- 4676.jpg](https://commons.wikimedia.org/wiki/File:London,_Tower_Bridge_--_2016_--_4676.jpg) | Dietmar Rabich | CC BY-SA 4.0 |
| edinburgh-castle | [Edinburgh Castle from Esplanade 20211019.jpg](https://commons.wikimedia.org/wiki/File:Edinburgh_Castle_from_Esplanade_20211019.jpg) | Daniel Kraft | CC BY-SA 3.0 |
| cliffs-of-moher | [Ireland Cliffs of Moher BW 2025-09-11 14-27-51.jpg](https://commons.wikimedia.org/wiki/File:Ireland_Cliffs_of_Moher_BW_2025-09-11_14-27-51.jpg) | Berthold Werner | CC BY-SA 4.0 |
