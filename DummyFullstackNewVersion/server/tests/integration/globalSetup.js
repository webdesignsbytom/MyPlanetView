// Runs once before the integration tests: refuses anything but a test database,
// then loads the countries and landmarks (upserts, so it's safe to repeat).

const databaseName = (url) => {
  try {
    return new URL(url).pathname.replace(/^\//, '');
  } catch {
    return '';
  }
};

export default async function setup() {
  const name = databaseName(process.env.DATABASE_URL || '');
  if (!/_test$/.test(name)) {
    throw new Error(
      `Integration tests create and delete real rows, so DATABASE_URL must point at a migrated ` +
        `test database whose name ends in "_test" (got "${name || 'nothing'}").`
    );
  }

  const { prisma } = await import('../../src/prisma.js');
  const { upsertCountries, upsertLandmarks } = await import('../../prisma/seed/reference.js');
  try {
    await upsertCountries();
    await upsertLandmarks();
  } finally {
    await prisma.$disconnect();
  }
}
