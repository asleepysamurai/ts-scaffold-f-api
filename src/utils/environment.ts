/**
 * Environment util
 *
 * Uses dotenv to parse different env files based on process.env.NODE_ENV
 * Also parses a default.env file and merges it to the <env>.env
 */

import dotenv from 'dotenv';
import * as path from 'path';

class Environment {
  constructor() {
    const defaultEnvironment = 'development';
    const environmentFileDir = (env: string): string =>
      path.resolve(__dirname, `../../config/${env}.env`);

    dotenv.config({
      path: environmentFileDir(process.env.NODE_ENV || defaultEnvironment),
    });
    dotenv.config({
      path: environmentFileDir('default'),
    });
  }

  get(key: string): any | undefined {
    return process.env[key];
  }

  getAsInt(key: string): number | undefined {
    if (process.env[key] === undefined) return;

    const value = parseInt(process.env[key] || '');

    if (isNaN(value)) {
      throw new Error(`Cannot cast ${key} value to int`);
    }

    return value;
  }

  getAsBool(key: string): boolean {
    return (process.env[key] || '').toLowerCase() === 'true';
  }
}

export const env = new Environment();
