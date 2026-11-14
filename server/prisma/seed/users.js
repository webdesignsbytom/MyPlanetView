// Database
import { prisma } from '../../src/prisma.js';
// Auth
import { auth, disableAuthEmails } from '../../src/auth.js';

// Dev-only logins
export const seedAccounts = [
  { role: 'USER', email: 'user@gmail.com', password: '12345678', name: 'User' },
  { role: 'ADMIN', email: 'tom@gmail.com', password: '12345678', name: 'Admin' },
  { role: 'DEVELOPER', email: 'dev@gmail.com', password: '12345678', name: 'Dev' },
];

// Create a user via better-auth sign-up
async function signUp({ email, password, name }) {
  try {
    await auth.api.signUpEmail({ body: { email, password, name } });
  } catch (err) {
    throw new Error(`Sign-up failed for ${email}: ${err.message}`);
  }
}

export async function seedUsers() {
  disableAuthEmails();

  for (const acc of seedAccounts) {
    await signUp(acc);

    // Set role and mark email verified
    const updated = await prisma.user.update({
      where: { email: acc.email },
      data: { role: acc.role, emailVerified: true },
    });

    console.log(`✅ Seeded ${acc.role} user: ${acc.email} (id: ${updated.id})`);
  }
}
