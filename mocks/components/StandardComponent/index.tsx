import type { FunctionComponent } from "preact";

type TheProps = { name: string };
export const StandardComponent: FunctionComponent<TheProps> = ({ name }) => (
  <div>StandardComponent={name}</div>
);
