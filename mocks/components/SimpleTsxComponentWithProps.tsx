import type { FunctionComponent } from "preact";

type TheProps = { name: string };
export const SimpleTsxComponentWithProps: FunctionComponent<TheProps> = (
  { name },
) => <div>SimpleTsxComponentWithProps={name}</div>;
