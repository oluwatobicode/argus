import bcrypt from "bcryptjs";
import { HASH_ROUNDS } from "../config/constants.config";

export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(HASH_ROUNDS);

  const passwordHashed = await bcrypt.hash(password, salt);

  return passwordHashed;
};

export const comparePassword = async (
  password: string,
  hashed: string,
): Promise<boolean> => {
  return await bcrypt.compare(password, hashed);
};
