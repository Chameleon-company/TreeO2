import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

export const hashPassword = async (value: string): Promise<string> =>
  bcrypt.hash(value, SALT_ROUNDS);

export const comparePassword = async (
  value: string,
  hashedValue: string,
): Promise<boolean> => bcrypt.compare(value, hashedValue);
