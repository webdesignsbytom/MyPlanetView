-- Special places, a stable key for landmarks, one traveller per account per map, and
-- CHECK constraints for rules the code already enforces (docs/DATABASE-REVIEW.md).
-- Made with `prisma migrate diff`; the landmark backfill and the CHECKs are added by hand
-- (Prisma can't express CHECK constraints, and leaves them alone on later diffs).

-- CreateEnum
CREATE TYPE "PlaceKind" AS ENUM ('COUNTRY', 'SPECIAL');

-- AlterTable: special places (Antarctica, the poles) are rows of country with kind SPECIAL;
-- the North Pole and the magnetic poles have no continent. The rows themselves come from
-- the seed or `npm run db:reference`.
ALTER TABLE "country" ADD COLUMN     "kind" "PlaceKind" NOT NULL DEFAULT 'COUNTRY',
ALTER COLUMN "continent" DROP NOT NULL;

-- AlterTable: each landmark's Wikidata item, which the reference loader upserts by.
-- A database that already has landmarks gets them filled in by slug (both slugs of the two
-- renamed on 15 Nov); anything left gets a placeholder, so the column can be required.
ALTER TABLE "landmark" ADD COLUMN     "wikidataId" TEXT;

UPDATE "landmark" AS l
SET "wikidataId" = v.qid
FROM (VALUES
  ('minaret-of-jam', 'Q192981'),
  ('butrint', 'Q188694'),
  ('kissama-national-park', 'Q3179197'),
  ('perito-moreno-glacier', 'Q367943'),
  ('geghard-monastery', 'Q499285'),
  ('sydney-opera-house', 'Q45178'),
  ('schonbrunn-palace', 'Q131330'),
  ('gobustan-rock-art', 'Q4313909'),
  ('sundarbans', 'Q4526'),
  ('grand-place', 'Q215429'),
  ('christ-the-redeemer', 'Q79961'),
  ('rila-monastery', 'Q207945'),
  ('ruins-of-loropeni', 'Q1269931'),
  ('kibira-national-park', 'Q3084668'),
  ('angkor-wat', 'Q43473'),
  ('dja-faunal-reserve', 'Q843147'),
  ('cn-tower', 'Q134883'),
  ('cidade-velha', 'Q464913'),
  ('manovo-gounda-st-floris-national-park', 'Q503835'),
  ('zakouma-national-park', 'Q1561524'),
  ('easter-island', 'Q14452'),
  ('great-wall-of-china-badaling', 'Q798826'),
  ('lost-city-ciudad-perdida', 'Q1094367'),
  ('mount-karthala', 'Q527548'),
  ('odzala-national-park', 'Q263883'),
  ('pre-columbian-chiefdom-settlements-with-stone-spheres', 'Q65114170'),
  ('plitvice-lakes-national-park', 'Q189849'),
  ('old-havana', 'Q1165566'),
  ('paphos-archaeological-park', 'Q12065255'),
  ('prague-castle', 'Q193369'),
  ('tivoli-gardens', 'Q110289'),
  ('lake-assal', 'Q81239'),
  ('morne-trois-pitons-national-park', 'Q629436'),
  ('colonial-city-of-santo-domingo', 'Q2470834'),
  ('galapagos-islands', 'Q38095'),
  ('pyramids-of-giza', 'Q12508'),
  ('joya-de-ceren', 'Q27985'),
  ('malabo-cathedral', 'Q8342845'),
  ('asmara', 'Q3642'),
  ('tallinn-old-town', 'Q726803'),
  ('mlilwane-wildlife-sanctuary', 'Q1941204'),
  ('rock-hewn-churches-of-lalibela', 'Q642979'),
  ('sigatoka-sand-dunes', 'Q7511961'),
  ('suomenlinna', 'Q1292442'),
  ('eiffel-tower', 'Q243'),
  ('loango-national-park', 'Q1756690'),
  ('kunta-kinteh-island', 'Q213188'),
  ('gelati-monastery', 'Q679979'),
  ('brandenburg-gate', 'Q82425'),
  ('cape-coast-castle', 'Q1254826'),
  ('acropolis-of-athens', 'Q131013'),
  ('fort-george', 'Q65129375'),
  ('tikal', 'Q181172'),
  ('fouta-djallon-highlands', 'Q850245'),
  ('bijagos-archipelago', 'Q63353195'),
  ('kaieteur-falls', 'Q38120'),
  ('citadelle-laferriere', 'Q206194'),
  ('copan', 'Q214827'),
  ('buda-castle', 'Q46313'),
  ('ingvellir-national-park', 'Q107370'),
  ('taj-mahal', 'Q9141'),
  ('borobudur-temple', 'Q42798'),
  ('persepolis', 'Q129072'),
  ('hatra', 'Q466614'),
  ('cliffs-of-moher', 'Q239477'),
  ('western-wall', 'Q134821'),
  ('colosseum', 'Q10285'),
  ('blue-and-john-crow-mountains', 'Q24082981'),
  ('mount-fuji', 'Q39231'),
  ('petra', 'Q5788'),
  ('mausoleum-of-khoja-ahmed-yasawi', 'Q46069'),
  ('maasai-mara', 'Q207724'),
  ('kuwait-towers', 'Q1335640'),
  ('tien-shan-ala-archa', 'Q40544'),
  ('tien-shan-mountains', 'Q40544'),
  ('wat-phou', 'Q579860'),
  ('historic-centre-of-riga', 'Q1026415'),
  ('baalbek', 'Q178835'),
  ('thaba-bosiu', 'Q2408243'),
  ('providence-island', 'Q27459317'),
  ('leptis-magna', 'Q191504'),
  ('vaduz-castle', 'Q694782'),
  ('trakai-castle', 'Q1482013'),
  ('bock-casemates', 'Q125561209'),
  ('ohrid-region', 'Q1223508'),
  ('tsingy-de-bemaraha', 'Q1405154'),
  ('lake-malawi-national-park', 'Q1077596'),
  ('petronas-towers', 'Q83063'),
  ('muliaage-palace', 'Q3327612'),
  ('timbuktu', 'Q9427'),
  ('hypogeum-of-al-saflieni', 'Q755514'),
  ('bikini-atoll', 'Q152225'),
  ('banc-d-arguin-national-park', 'Q539518'),
  ('le-morne-cultural-landscape', 'Q1129992'),
  ('chichen-itza', 'Q5859'),
  ('orheiul-vechi', 'Q2382751'),
  ('prince-s-palace-of-monaco', 'Q1164788'),
  ('orkhon-valley', 'Q1453235'),
  ('bay-of-kotor', 'Q207468'),
  ('jemaa-el-fnaa', 'Q258348'),
  ('island-of-mozambique', 'Q331099'),
  ('bagan', 'Q29317'),
  ('etosha-national-park', 'Q675633'),
  ('command-ridge', 'Q2667931'),
  ('kathmandu-valley', 'Q3037'),
  ('rijksmuseum', 'Q190804'),
  ('milford-sound', 'Q187197'),
  ('ruins-of-leon-viejo', 'Q1422898'),
  ('air-and-tenere-natural-reserves', 'Q794643'),
  ('sukur-cultural-landscape', 'Q1123956'),
  ('kaesong', 'Q109079'),
  ('bryggen', 'Q153430'),
  ('bahla-fort', 'Q1408909'),
  ('mohenjo-daro', 'Q5725'),
  ('rock-islands-southern-lagoon', 'Q17215490'),
  ('church-of-the-nativity', 'Q194504'),
  ('panama-canal-miraflores-locks', 'Q100144719'),
  ('kokoda-track', 'Q5347553'),
  ('jesuit-missions-of-la-santisima-trinidad-de-parana', 'Q1366015'),
  ('machu-picchu', 'Q676203'),
  ('banaue-rice-terraces', 'Q826551'),
  ('wieliczka-salt-mine', 'Q454019'),
  ('tower-of-belem', 'Q215003'),
  ('al-zubarah', 'Q2727469'),
  ('peles-castle', 'Q917702'),
  ('red-square', 'Q41116'),
  ('volcanoes-national-park', 'Q932736'),
  ('brimstone-hill-fortress', 'Q200521'),
  ('pitons', 'Q639487'),
  ('la-soufriere-volcano', 'Q26544'),
  ('papaseea-sliding-rocks', 'Q61695244'),
  ('guaita-tower', 'Q2711604'),
  ('obo-national-park', 'Q2943640'),
  ('al-hijr-madain-salih', 'Q27356'),
  ('island-of-goree', 'Q244347'),
  ('studenica-monastery', 'Q143042'),
  ('vallee-de-mai-nature-reserve', 'Q573558'),
  ('bunce-island', 'Q1004939'),
  ('marina-bay-sands', 'Q548679'),
  ('spis-castle', 'Q205558'),
  ('lake-bled', 'Q648902'),
  ('east-rennell', 'Q852433'),
  ('laas-geel', 'Q1799347'),
  ('table-mountain', 'Q213360'),
  ('gyeongbokgung-palace', 'Q482485'),
  ('boma-national-park', 'Q891743'),
  ('alhambra', 'Q47476'),
  ('sigiriya', 'Q272153'),
  ('meroe', 'Q5780'),
  ('central-suriname-nature-reserve', 'Q189934'),
  ('drottningholm-palace', 'Q208559'),
  ('chateau-de-chillon', 'Q372647'),
  ('palmyra', 'Q5747'),
  ('taroko-gorge', 'Q101217786'),
  ('pamir-lake-karakul', 'Q720015'),
  ('pamir-mountains', 'Q720015'),
  ('mount-kilimanjaro', 'Q7296'),
  ('historic-city-of-ayutthaya', 'Q1025100'),
  ('koutammakou', 'Q508040'),
  ('ha-amonga-a-maui', 'Q1433433'),
  ('pitch-lake', 'Q717351'),
  ('amphitheatre-of-el-jem', 'Q2914326'),
  ('hagia-sophia', 'Q12506'),
  ('darvaza-gas-crater', 'Q70458'),
  ('funafuti-conservation-area', 'Q5508708'),
  ('bwindi-impenetrable-national-park', 'Q500397'),
  ('saint-sophia-cathedral', 'Q830054'),
  ('burj-khalifa', 'Q12495'),
  ('stonehenge', 'Q39671'),
  ('statue-of-liberty', 'Q9202'),
  ('historic-quarter-of-colonia-del-sacramento', 'Q56064'),
  ('samarkand-crossroad-of-cultures', 'Q17255582'),
  ('chief-roi-mata-s-domain', 'Q1072369'),
  ('st-peter-s-basilica', 'Q12512'),
  ('angel-falls', 'Q80299'),
  ('ha-long-bay', 'Q190128'),
  ('old-city-of-sanaa', 'Q12220316'),
  ('victoria-falls', 'Q43278'),
  ('great-zimbabwe-national-monument', 'Q209217')
) AS v(slug, qid)
WHERE l."slug" = v.slug;

UPDATE "landmark" SET "wikidataId" = 'unmatched-' || "id" WHERE "wikidataId" IS NULL;

ALTER TABLE "landmark" ALTER COLUMN "wikidataId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "landmark_wikidataId_key" ON "landmark"("wikidataId");

-- CreateIndex: one traveller per account on a map (rows with no login are unaffected)
CREATE UNIQUE INDEX "traveller_mapId_userId_key" ON "traveller"("mapId", "userId");

-- CHECKs (each mirrors a rule in the code: utils/travelValidation.js, controllers)
ALTER TABLE "trip" ADD CONSTRAINT "trip_dates_in_order"
  CHECK ("startDate" IS NULL OR "endDate" IS NULL OR "endDate" >= "startDate");

ALTER TABLE "trip_stop" ADD CONSTRAINT "trip_stop_dates_in_order"
  CHECK ("arriveOn" IS NULL OR "leaveOn" IS NULL OR "leaveOn" >= "arriveOn");

ALTER TABLE "photo" ADD CONSTRAINT "photo_position_valid"
  CHECK (
    ("latitude" IS NULL AND "longitude" IS NULL)
    OR ("latitude" IS NOT NULL AND "longitude" IS NOT NULL
        AND "latitude" BETWEEN -90 AND 90 AND "longitude" BETWEEN -180 AND 180)
  );

ALTER TABLE "photo_landmark" ADD CONSTRAINT "photo_landmark_manual_confirmed"
  CHECK ("source" <> 'MANUAL' OR "confirmed");

ALTER TABLE "user" ADD CONSTRAINT "user_role_known"
  CHECK ("role" IN ('USER', 'ADMIN', 'DEVELOPER'));
