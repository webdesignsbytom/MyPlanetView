// Database
import { prisma } from '../../src/prisma.js';
// Seed helpers
import { verifySeeded } from './utils.js';
import { seedAccounts } from './users.js';

export async function seedContactForms() {
  const adminEmail = seedAccounts.find((acc) => acc.role === 'ADMIN').email;

  // Contact form
  await prisma.contactForm.create({
    data: {
      name: 'Test Traveller',
      email: adminEmail,
      message: 'Test contact form seed message: can I share one trip without sharing my whole map?',
    },
  });

  await verifySeeded('contactForm', prisma.contactForm, 1);
}
