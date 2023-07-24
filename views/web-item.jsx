import Button from "@atlaskit/button";
import React, { useEffect, useState } from "react";

import Modal, {
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalTitle,
  // ModalTransition,
} from "@atlaskit/modal-dialog";
import Select from "@atlaskit/select";

export default function WebItem() {
  const [issues, setIssues] = useState([]);
  const [selectedIssue, setSelectedIssue] = useState(null);
  // const [timeSpent, setTimeSpent] = useState(0);

  const onClose = () => {
    AP.dialog.close();
  };

  // key
  // id
  // fields.issuetype.iconUrl

  useEffect(() => {
    AP.request({
      url: "/rest/api/3/search?jql=",
      type: "GET",
      success: (data) => {
        const parsed = JSON.parse(data);

        const iss = parsed.issues.map((i) => {
          return {
            label: i.key,
            value: i.id,
          };
        });

        setIssues(iss);
      },
      error: (err) => {
        console.log("err:", err);
      },
    });
  }, []);

  const onSubmit = (e) => {
    e.preventDefault();

    console.log("okokok");
  };

  return (
    <Modal onClose={onClose}>
      <form onSubmit={onSubmit} style={{ height: "100%", width: "100%" }}>
        <ModalHeader>
          <ModalTitle>Create worklog</ModalTitle>
        </ModalHeader>
        <ModalBody>
          <p>Issues select list</p>
          <Select
            required
            placeholder="Select an issue"
            options={issues}
            onChange={(e) => {
              setSelectedIssue(e.value);
            }}
          />
          <p>Selected issue: {selectedIssue}</p>

          <p>Time spent</p>
          <p>Calendar</p>
        </ModalBody>
        <ModalFooter>
          <Button appearance="primary" type="submit">Create</Button>
          <Button onClick={onClose}>Cancel</Button>
        </ModalFooter>
        {/* <p>issues: {issues}</p> */}
      </form>
    </Modal>
  );
}
