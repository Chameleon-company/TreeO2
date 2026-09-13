import { randomInt } from "crypto";
import bcrypt from "bcryptjs";

const OTP_LENGTH = 6;
const OTP_MAX = 10 ** OTP_LENGTH;
const OTP_SALT_ROUNDS = 12;
const OTP_EXPIRY_MINUTES = 15;

export const generateOtp = (): string => {
	const otp = randomInt(0, OTP_MAX);

	return otp.toString().padStart(OTP_LENGTH, "0");
};

export const hashOtp = async (otp: string): Promise<string> => {
	return bcrypt.hash(otp, OTP_SALT_ROUNDS);
};

export const verifyOtp = async (
	otp: string,
	hash: string,
): Promise<boolean> => {
	return bcrypt.compare(otp, hash);
};

export const getOtpExpiry = (): Date => {
	return new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
};
