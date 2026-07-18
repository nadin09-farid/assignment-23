export const NODE_ENV = process.env.NODE_ENV;
export const SERVER_PORT = process.env.PORT || 3000;
export const DB_URL_LOCAL = process.env.DB_URL_LOCAL || '';
export const DB_URL_ATLAS = process.env.DB_URL_ATLAS || '';
export const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY as string;
export const SALT_ROUND = Number(process.env.SALT_ROUND) || 10;

export const REDIS_URL = process.env.REDIS_URL as string;

export const TOKEN_SIGNATURE_USER_ACCESS = process.env
  .TOKEN_SIGNATURE_USER_ACCESS as string;
export const TOKEN_SIGNATURE_USER_REFRESH = process.env
  .TOKEN_SIGNATURE_USER_REFRESH as string;
export const TOKEN_SIGNATURE_ADMIN_ACCESS = process.env
  .TOKEN_SIGNATURE_ADMIN_ACCESS as string;
export const TOKEN_SIGNATURE_ADMIN_REFRESH = process.env
  .TOKEN_SIGNATURE_ADMIN_REFRESH as string;

// export const S3BUCKET_SECRET_ACCESS_KEY = process.env
//   .S3BUCKET_SECRET_ACCESS_KEY as string;
// export const S3BUCKET_ACCESS_KEY = process.env.S3BUCKET_ACCESS_KEY as string;
