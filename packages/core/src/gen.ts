export class SingleShotGen<T, A> implements IterableIterator<T, A> {
  private called = false;

  constructor(readonly self: T) {}

  next(a: A): IteratorResult<T, A> {
    return this.called
      ? { value: a, done: true }
      : ((this.called = true), { value: this.self, done: false });
  }

  [Symbol.iterator](): IterableIterator<T, A> {
    return new SingleShotGen<T, A>(this.self);
  }
}
