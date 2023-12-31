import Button from "@atlaskit/button";
import React, { useEffect, useState } from "react";

import Modal, {
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from "@atlaskit/modal-dialog";
import Select from "@atlaskit/select";
import TextField from "@atlaskit/textfield";
import TextArea from "@atlaskit/textarea";

import { DateTimePicker } from "@atlaskit/datetime-picker";
import getTimespent from "./utils/get-timespent";

export default function WebItem() {
  const [issues, setIssues] = useState([]);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [timeSpent, setTimeSpent] = useState(0);
  const [comment, setComment] = useState("");
  const [startDate, setStartDate] = useState(
    new Date().toISOString().slice(0, 16) + "+0100",
  );
  const [isStartDate, setIsStartDate] = useState(true);
  const [totalTimeSpent, setTotalTimeSpent] = useState(0);

  const onClose = () => {
    AP.dialog.close();
  };

  useEffect(() => {
    AP.context.getContext(function (response) {
      const obj = {
        label: response.jira.issue.key,
        value: response.jira.issue.id,
      };
      console.log("Response : ", response);
      console.log("Object : ", obj);
      setSelectedIssue(obj);
    });

    AP.user.getCurrentUser(async (user) => {
      const timespent = await getTimespent(user.atlassianAccountId);
      console.log("ts", timespent);
      setTotalTimeSpent(timespent);
    });

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

  useEffect(() => {
    if (!startDate) return;
    else setIsStartDate(true);
  }, [startDate]);

  const onSubmit = (e) => {
    e.preventDefault();
    if (!startDate) {
      setIsStartDate(false);
      return;
    }
    const splitedStartDate = startDate.split("+");
    const dateStart = splitedStartDate[0] + ":00.000+" + splitedStartDate[1];
    console.log("startDate", dateStart);

    const bodyData = {
      comment: {
        content: [
          {
            content: [
              {
                text: comment,
                type: "text",
              },
            ],
            type: "paragraph",
          },
        ],
        type: "doc",
        version: 1,
      },
      started: dateStart,
      timeSpentSeconds: timeSpent * 60 * 60,
    };

    AP.request({
      url: `/rest/api/3/issue/${selectedIssue.value}/worklog`,
      type: "POST",
      data: JSON.stringify(bodyData),
      contentType: "application/json",
      success: (res) => {
        console.log("Created Worklog:", res);
      },
      error: (err) => {
        console.log("err", err);
      },
    });
    AP.dialog.close();
  };

  return (
    <Modal onClose={onClose}>
      <form
        onSubmit={onSubmit}
        style={{
          height: "100%",
          width: "100%",
        }}
      >
        <ModalHeader>
          <ModalTitle>Create worklog</ModalTitle>
        </ModalHeader>
        <ModalBody
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <Select
            required
            placeholder="Select an issue"
            options={issues}
            value={selectedIssue}
            onChange={(v) => {
              console.log("v", v);
              return setSelectedIssue(v);
            }}
          />

          <TextField
            type="number"
            max={8 - totalTimeSpent}
            min={1}
            placeholder="Enter time spent in hours"
            isRequired
            onChange={(e) => {
              return setTimeSpent(e.target.value);
            }}
          />

          <TextArea
            style={{ marginTop: "10px" }}
            placeholder="Enter a comment"
            resize="auto"
            onChange={(e) => setComment(e.target.value)}
          />

          <div>
            <label htmlFor="Start Date">Start Date</label>
            <DateTimePicker
              name="Start Date"
              value={startDate}
              onChange={(e) => {
                return setStartDate(e);
              }}
            />
            {!isStartDate && (
              <p style={{ color: "red" }}>Please select a start date</p>
            )}
          </div>
          {totalTimeSpent >= 8 && (
            <p style={{ color: "red" }}>
              You can't create more than 8 hours a day
            </p>
          )}
        </ModalBody>
        <ModalFooter>
          <Button
            appearance="primary"
            type="submit"
            isDisabled={totalTimeSpent >= 8}
          >
            Create
          </Button>
          <Button onClick={onClose}>Cancel</Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
