// Identity & Access Public API
// Only public operations, DTOs and interfaces are exported here

export * from '../types/identity-access.types';
export * from '../services/user.service';
export * from '../services/auth.service';

// Re-export models only for type references
export type { default as User } from '../models/user';
export type { default as IdentityVerification } from '../models/identity-verification';
export type { default as VerificationDocument } from '../models/verification-document';
