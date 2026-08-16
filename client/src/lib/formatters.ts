export const inr = (value: number) => `₹${new Intl.NumberFormat("en-IN").format(value)}`;
export const pluralize = (value: number, noun: string) => `${value} ${noun}${value === 1 ? "" : "s"}`;
