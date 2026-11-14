import { prisma } from '../prisma.js';

// Contact forms

export const createContactFormInDB = (data) =>
  prisma.contactForm.create({
    data: {
      name: data.name,
      email: data.email,
      message: data.message,
      imageKey: data.imageKey ?? null,
    },
  });

export const findAllContactForms = () =>
  prisma.contactForm.findMany({
    orderBy: { createdAt: 'desc' },
  });

export const deleteContactFormById = (id) =>
  prisma.contactForm.delete({
    where: { id },
  });

// Image keys (read before deleteMany)
export const findContactFormImageKeys = () =>
  prisma.contactForm.findMany({
    where: { imageKey: { not: null } },
    select: { imageKey: true },
  });

export const deleteAllContactFormsFromDB = () =>
  prisma.contactForm.deleteMany({});

