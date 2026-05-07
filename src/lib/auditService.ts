import { prisma } from "./prisma";
import { logger } from "../config/logger";
import { Prisma } from "@prisma/client";

export interface AuditScanChangeParams {
  treeScanId: number;
  changedBy: number;
  changeReason: string;
  oldData: Prisma.InputJsonValue;
  newData: Prisma.InputJsonValue;
}

export const logScanChange = async (
  params: AuditScanChangeParams,
): Promise<void> => {
  try {
    await prisma.treeScanAudit.create({
      data: {
        treeScanId: params.treeScanId,
        changedBy: params.changedBy,
        changeReason: params.changeReason,
        oldData: params.oldData,
        newData: params.newData,
      },
    });

    logger.info("Scan change audited", {
      treeScanId: params.treeScanId,
      changedBy: params.changedBy,
      changeReason: params.changeReason,
    });
  } catch (error) {
    logger.error("Failed to log scan change to audit table", {
      error,
      treeScanId: params.treeScanId,
      changedBy: params.changedBy,
    });
  }
};
