-- AlterEnum (kept in its own migration: a new enum value cannot be used in the same transaction it is added)
ALTER TYPE "PlanTier" ADD VALUE IF NOT EXISTS 'FREE';
