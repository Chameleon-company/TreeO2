import type { Request } from "express";
import type { z } from "zod";
import {
	createOrganisationSchema,
	listOrganisationsSchema,
	organisationIdSchema,
	updateOrganisationSchema,
} from "./organisations.schemas";

export type ListOrganisationsQuery = z.infer<
	typeof listOrganisationsSchema
>["query"];
export type OrganisationIdParams = z.infer<
	typeof organisationIdSchema
>["params"];
export type CreateOrganisationBody = z.infer<
	typeof createOrganisationSchema
>["body"];
export type UpdateOrganisationBody = z.infer<
	typeof updateOrganisationSchema
>["body"];

export type ListOrganisationsRequest = Omit<Request, "query"> & {
	query: ListOrganisationsQuery;
};
export type OrganisationIdRequest = Omit<Request, "params"> & {
	params: OrganisationIdParams;
};
export type CreateOrganisationRequest = Omit<Request, "body"> & {
	body: CreateOrganisationBody;
};
export type UpdateOrganisationRequest = Omit<Request, "body" | "params"> & {
	body: UpdateOrganisationBody;
	params: OrganisationIdParams;
};
