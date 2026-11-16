-- Monthly photo themes (docs/API.md "Photo themes"; docs/FEATURE-PLAN.md "Monthly photo
-- themes"): one theme per calendar month, set by an admin, and the photos each map enters
-- in it (the theme's album on that map). Made with `prisma migrate diff`; the CHECKs at the
-- end are added by hand (Prisma can't express them, and leaves them alone on later diffs).

-- CreateTable
CREATE TABLE "photo_theme" (
    "id" TEXT NOT NULL,
    "month" DATE NOT NULL,
    "title" TEXT NOT NULL,
    "blurb" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "photo_theme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "photo_theme_entry" (
    "themeId" TEXT NOT NULL,
    "photoId" TEXT NOT NULL,
    "mapId" TEXT NOT NULL,
    "enteredById" TEXT,
    "enteredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "photo_theme_entry_pkey" PRIMARY KEY ("themeId","photoId")
);

-- CreateIndex
CREATE UNIQUE INDEX "photo_theme_month_key" ON "photo_theme"("month");

-- CreateIndex
CREATE INDEX "photo_theme_entry_mapId_themeId_enteredAt_photoId_idx" ON "photo_theme_entry"("mapId", "themeId", "enteredAt" DESC, "photoId" DESC);

-- CreateIndex
CREATE INDEX "photo_theme_entry_photoId_idx" ON "photo_theme_entry"("photoId");

-- CreateIndex
CREATE INDEX "photo_theme_entry_enteredById_idx" ON "photo_theme_entry"("enteredById");

-- AddForeignKey
ALTER TABLE "photo_theme_entry" ADD CONSTRAINT "photo_theme_entry_themeId_fkey" FOREIGN KEY ("themeId") REFERENCES "photo_theme"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "photo_theme_entry" ADD CONSTRAINT "photo_theme_entry_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "photo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "photo_theme_entry" ADD CONSTRAINT "photo_theme_entry_mapId_fkey" FOREIGN KEY ("mapId") REFERENCES "travel_map"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "photo_theme_entry" ADD CONSTRAINT "photo_theme_entry_enteredById_fkey" FOREIGN KEY ("enteredById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- A theme's month is stored as its first day
ALTER TABLE "photo_theme" ADD CONSTRAINT "photo_theme_first_of_month" CHECK (EXTRACT(DAY FROM "month") = 1);

-- A title is never empty and at most 60 characters (utils/themes.js THEME_LIMITS)
ALTER TABLE "photo_theme" ADD CONSTRAINT "photo_theme_title_length" CHECK (char_length("title") BETWEEN 1 AND 60);
