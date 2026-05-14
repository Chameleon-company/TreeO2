import { z } from "zod";

const positiveInteger = z.coerce.number().int().positive();

export const listProjectTreeTypesSchema = z.object({
  query: z.object({
    project_id: positiveInteger.optional(),
  }),
});

export const createProjectTreeTypeSchema = z.object({
  body: z.object({
    project_id: positiveInteger,
    tree_type_id: positiveInteger,
  }),
});

export const deleteProjectTreeTypeSchema = z.object({
  params: z.object({
    project_id: positiveInteger,
    tree_type_id: positiveInteger,
  }),
});

export type ListProjectTreeTypesQuery = z.infer<
  typeof listProjectTreeTypesSchema
>["query"];
export type CreateProjectTreeTypeInput = z.infer<
  typeof createProjectTreeTypeSchema
>["body"];
export type DeleteProjectTreeTypeParams = z.infer<
  typeof deleteProjectTreeTypeSchema
>["params"];
