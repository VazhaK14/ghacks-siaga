-- AlterEnum
ALTER TYPE "DispatchStatus" ADD VALUE 'RETURNING_TO_BASE';
ALTER TYPE "DispatchStatus" ADD VALUE 'RETURNED_TO_BASE';

-- AlterTable
ALTER TABLE "dispatch_request"
ADD COLUMN "returnStartedAt" TIMESTAMP(3),
ADD COLUMN "estimatedReturnAt" TIMESTAMP(3),
ADD COLUMN "returnedAt" TIMESTAMP(3);
