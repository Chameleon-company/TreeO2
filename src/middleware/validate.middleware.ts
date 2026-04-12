import type { NextFunction, Request, Response } from "express";
import { type AnyZodObject } from "zod";

export const validateMiddleware =
  (schema: AnyZodObject) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    // Express exposes req.body/query/params as broad mutable bags. The parsed
    // values are intentionally written back after Zod validation.
    /* eslint-disable @typescript-eslint/no-unsafe-assignment */
    const parsed = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    /* eslint-enable @typescript-eslint/no-unsafe-assignment */

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    req.body = parsed.body;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    req.query = parsed.query;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    req.params = parsed.params;

    next();
  };
