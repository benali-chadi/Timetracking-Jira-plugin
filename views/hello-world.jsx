import SectionMessage from "@atlaskit/section-message";
import React from "react";
import Button from "@atlaskit/button";

export default function HelloWorld() {
  return (
    <>
      <SectionMessage title="Hey">
        <p>
          Welcome!
        </p>
      </SectionMessage>
      <Button
        appearance="primary"
        onClick={() =>
          AP.dialog.create({
            key: "dialog",
            chrome: false,
          })}
      >
        Create Worklog
      </Button>
    </>
  );
}
