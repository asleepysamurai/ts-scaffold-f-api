/**
 * This is an autogenerated file.
 * Please do not change the types by hand here.
 * They will be overwritten.
 *
 * File generated by types-from-env
 */

export const EnvVarNames = [
  'NODE_ENV',
  'APP_SERVER_HOST',
  'APP_SERVER_PORT',
  'APP_SERVER_DEFAULT_URL',
  'DB_NAME',
  'DB_HOST',
  'DB_USER',
  'DB_PASSWORD',
  'DB_MIN_CONNECTIONS',
  'DB_MAX_CONNECTIONS',
  'MAILER_HOST',
  'MAILER_USER',
  'MAILER_PASSWORD',
  'MAILER_USE_TLS',
  'MAILER_PORT',
  'MAILER_LINK_PREFIX',
] as const;
export type EnvVarKey = typeof EnvVarNames[number];
