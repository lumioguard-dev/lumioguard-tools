import { z } from 'zod';

/**
 * `z.enum` demands a non-empty literal tuple, which a `readonly T[]` derived from
 * domain data is not. Narrowing here keeps the schema generated from the single
 * source of truth rather than retyped beside it, where the two drift silently.
 */
export function enumOf<T extends string>(values: readonly T[]): z.ZodEnum<[T, ...T[]]> {
  const [first, ...rest] = values;
  if (first === undefined) throw new Error('enumOf requires at least one value');
  return z.enum([first, ...rest]);
}
