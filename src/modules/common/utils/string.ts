export const getCommaSeparatedString = (...args: unknown[]): string => {
  return args.map((arg: unknown) => `${arg}`).join(',')
}
