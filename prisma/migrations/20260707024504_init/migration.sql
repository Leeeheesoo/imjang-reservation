-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "role" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Complex" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "district" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Property" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hostId" TEXT NOT NULL,
    "complexId" TEXT NOT NULL,
    "dong" TEXT NOT NULL,
    "ho" TEXT,
    "pyeong" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "price" TEXT,
    "photos" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Property_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Property_complexId_fkey" FOREIGN KEY ("complexId") REFERENCES "Complex" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AvailabilitySlot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "propertyId" TEXT NOT NULL,
    "dayOfWeek" INTEGER,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "exceptionDate" DATETIME,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AvailabilitySlot_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Reservation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "propertyId" TEXT NOT NULL,
    "slotId" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "visitDate" DATETIME NOT NULL,
    "partySize" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "requestedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" DATETIME,
    "expiresAt" DATETIME NOT NULL,
    "cancelledBy" TEXT,
    "noShowMarkedBy" TEXT,
    CONSTRAINT "Reservation_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Reservation_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "AvailabilitySlot" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Reservation_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE INDEX "AvailabilitySlot_propertyId_idx" ON "AvailabilitySlot"("propertyId");

-- CreateIndex
CREATE INDEX "Reservation_propertyId_visitDate_idx" ON "Reservation"("propertyId", "visitDate");

-- CreateIndex
CREATE INDEX "Reservation_slotId_visitDate_idx" ON "Reservation"("slotId", "visitDate");
