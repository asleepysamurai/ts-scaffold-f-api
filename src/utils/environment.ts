/**
 * Environment util
 *
 * Uses dotenv to parse different env files based on process.env.NODE_ENV
 * Also parses a default.env file and merges it to the <env>.env
 */

import dotenv from 'dotenv';
import * as path from 'path';
import type { EnvVarKey } from 'codegen/env.types.ts';

class Environment {
  constructor() {
    const defaultEnvironment = 'development';
    const environmentFileDir = (env: string): string => {
      return path.resolve(__dirname, `../../config/${env}.env`);
    };

    dotenv.config({
      path: environmentFileDir(process.env.NODE_ENV || defaultEnvironment),
    });
    dotenv.config({
      path: environmentFileDir('default'),
    });
  }

  get(key: EnvVarKey): any {
    if (process.env[key] === undefined) {
      throw new Error(`Env var not configure for ${key}`);
    }

    return process.env[key];
  }

  getAsInt(key: EnvVarKey): number {
    const value = parseInt(this.get(key));

    if (isNaN(value)) {
      throw new Error(`Cannot cast ${key} value to int`);
    }

    return value;
  }

  getAsBool(key: EnvVarKey): boolean {
    return (this.get(key) || '').toLowerCase() === 'true';
  }
}

export const env = new Environment();
