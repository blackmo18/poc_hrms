import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prismaRepository: PrismaClient | undefined;
};

export const prismaRepository = globalForPrisma.prismaRepository ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prismaRepository = prismaRepository;
}

export class BaseRepository {
  protected prisma: PrismaClient;

  constructor() {
    this.prisma = prismaRepository;
  }
}
