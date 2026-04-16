type Metadata = {
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly version: number;
};

const createMetadata = (now: Date): Metadata => ({
  createdAt: now,
  updatedAt: now,
  version: 1,
});

const touchMetadata = (metadata: Metadata, now: Date): Metadata => ({
  createdAt: metadata.createdAt,
  updatedAt: now,
  version: metadata.version + 1,
});

export { createMetadata, touchMetadata };
export type { Metadata };
