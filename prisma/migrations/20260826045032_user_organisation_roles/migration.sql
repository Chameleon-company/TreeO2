-- CreateTable
CREATE TABLE "user_organisations_roles" (
    "user_id" INTEGER NOT NULL,
    "organisation_id" INTEGER NOT NULL,
    "role_id" INTEGER NOT NULL,

    CONSTRAINT "user_organisations_roles_pkey" PRIMARY KEY ("user_id","organisation_id","role_id")
);

-- AddForeignKey
ALTER TABLE "user_organisations_roles" ADD CONSTRAINT "user_organisations_roles_user_id_organisation_id_fkey" FOREIGN KEY ("user_id", "organisation_id") REFERENCES "user_organisations"("user_id", "organisation_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_organisations_roles" ADD CONSTRAINT "user_organisations_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "organisation_roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
