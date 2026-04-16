abstract class Entity<TId extends string> {
  readonly id: TId;

  protected constructor(id: TId) {
    this.id = id;
  }

  equals(other: Entity<TId>): boolean {
    return this.id === other.id;
  }
}

export { Entity };
