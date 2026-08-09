import { prisma } from "./client";

export const seedLocalization = async (): Promise<void> => {
	await prisma.culture.upsert({
		where: { code: "tet" },
		update: {},
		create: { code: "tet", name: "Tetum" },
	});

	await prisma.localizedString.upsert({
		where: {
			cultureCode_stringKey_context: {
				cultureCode: "tet",
				stringKey: "common.thank_you",
				context: "ui.common",
			},
		},
		update: {},
		create: {
			cultureCode: "tet",
			stringKey: "common.thank_you",
			value: "Obrigadu barak",
			context: "ui.common",
		},
	});
};
