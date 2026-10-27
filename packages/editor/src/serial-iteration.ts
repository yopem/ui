export async function* mapSerial<Input, Output>(
  values: Iterable<Input>,
  transform: (value: Input) => Output | PromiseLike<Output>,
) {
  for (const value of values) yield transform(value)
}
