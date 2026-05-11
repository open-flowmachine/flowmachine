type ExactPartial<T> = { [K in keyof T]?: T[K] | undefined };
