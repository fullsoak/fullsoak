import type { FunctionComponent } from "preact";
import { useEffect } from "preact/hooks";

type TheProps = { name: string };

export const StandardComponent: FunctionComponent<TheProps> = ({ name }) => {
  // @TODO add Playwright tests to assert client-side behavior (ie. hydration)
  // @TODO make this work with preact@10.26.8
  useEffect(() => {
    console.log("StandardComponent mounted");
    return () => console.log("StandardComponent unmounted");
  }, []);
  return <div>StandardComponent={name}</div>;
};
