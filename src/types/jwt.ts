export interface JwtPayload {
  adminId: string;
  iat?: number;
  exp?: number;
}

export interface UserJwtPayload {
  userId: string;
  phone: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface JwtError extends Error {
  name: 'JsonWebTokenError' | 'TokenExpiredError' | 'NotBeforeError';
  message: string;
}

export interface MongoError extends Error {
  code?: number;
  name: string;
}

export interface MongoDuplicateKeyError extends MongoError {
  code: 11000;
}
