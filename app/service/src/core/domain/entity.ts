import { UTCDate } from "@date-fns/utc";
import { randomUUIDv7 } from "bun";
import { mergeWith } from "es-toolkit";
import type { EmptyObject, PartialDeep, UnknownRecord } from "type-fest";
import z from "zod";

const entityIdSchema = z.uuidv7();
type EntityId = z.output<typeof entityIdSchema>;

const newEntityId = () => randomUUIDv7() as EntityId;

class Entity<T extends UnknownRecord = EmptyObject> {
  id: EntityId;

  props: T;

  createdAt: Date;
  updatedAt: Date;

  constructor(
    id: EntityId,
    requiredProps: T,
    optionalProps?: { createdAt: Date; updatedAt: Date },
  ) {
    this.id = id;

    this.props = requiredProps;

    this.createdAt = optionalProps?.createdAt ?? new UTCDate();
    this.updatedAt = optionalProps?.updatedAt ?? new UTCDate();
  }

  update(partialProps: PartialDeep<T>) {
    this.props = mergeWith(this.props, partialProps, (target, source) => {
      if (Array.isArray(target) && Array.isArray(source)) {
        return source;
      }
    });
    this.updatedAt = new UTCDate();
  }
}

export { Entity, entityIdSchema, type EntityId, newEntityId };
