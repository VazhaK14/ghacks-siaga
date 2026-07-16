-- CreateEnum
CREATE TYPE "DispatchAgencyAvailability" AS ENUM ('AVAILABLE', 'BUSY', 'OFFLINE');

-- AlterTable
ALTER TABLE "dispatch_agency"
ADD COLUMN "address" TEXT,
ADD COLUMN "latitude" DOUBLE PRECISION,
ADD COLUMN "longitude" DOUBLE PRECISION,
ADD COLUMN "availability" "DispatchAgencyAvailability" NOT NULL DEFAULT 'AVAILABLE';

-- AlterTable
ALTER TABLE "dispatch_request"
ADD COLUMN "enRouteAt" TIMESTAMP(3),
ADD COLUMN "estimatedArrivalAt" TIMESTAMP(3),
ADD COLUMN "unitCode" TEXT;
