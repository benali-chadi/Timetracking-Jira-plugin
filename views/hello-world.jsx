import SectionMessage from "@atlaskit/section-message";
import React from "react";
import NewComp from "./new-comp";

export default function HelloWorld() {
  const [excitementLevel, setExcitementLevel] = React.useState(0);
  return (
    <>
      <SectionMessage title="Hey">
        <p>
          Welcome hey!
        </p>
      </SectionMessage>
      <NewComp />
    </>
  );
}
