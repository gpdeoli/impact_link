import { PrismaClient } from '@prisma/client';

const CHARACTERS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const CODE_LENGTH = 6;

export async function generateShortCode(prisma: PrismaClient): Promise<string> {
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    const code = generateRandomCode();
    
    const existing = await prisma.link.findUnique({
      where: { shortCode: code }
    });

    if (!existing) {
      return code;
    }

    attempts++;
  }

  // If we couldn't find a unique code, try with longer length
  return generateRandomCode(CODE_LENGTH + 2);
}

function generateRandomCode(length: number = CODE_LENGTH): string {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += CHARACTERS.charAt(Math.floor(Math.random() * CHARACTERS.length));
  }
  return code;
}

