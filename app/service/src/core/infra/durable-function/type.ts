declare const __durableFunction: unique symbol;

/**
 * Opaque type representing a durable function registration.
 * Infrastructure adapters cast to/from their vendor-specific type.
 */
type DurableFunction = { readonly [__durableFunction]: true };

export type { DurableFunction };
