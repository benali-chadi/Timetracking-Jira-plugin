import SectionMessage from "@atlaskit/section-message";
import React, { useEffect, useState } from "react";
import NewComp from "./new-comp";
import Button from "@atlaskit/button";
import TableTree, {
  Cell,
  Header,
  Headers,
  Row,
  Rows,
} from "@atlaskit/table-tree";

export default function HelloWorld() {
  const [issues, setIssues] = useState([]);
  const [worklogMap, setWorklogMap] = useState(new Map());
  const [displayItems, setDisplayItems] = useState([]);

  useEffect(() => {
    AP.request({
      url: "/rest/api/3/search?jql=",
      type: "GET",
      success: (data) => {
        const parsed = JSON.parse(data);
        setIssues(parsed.issues);
        console.log("CALL 1 \n");
        parsed.issues.forEach((element) => {
          console.log("CALL BEFORE \n");
          AP.request({
            url: `/rest/api/3/issue/${element.key}/worklog`,
            type: "GET",
            success: (data) => {
              const parsedWorklog = JSON.parse(data);

              setWorklogMap((prev) => {
                let newMap = new Map(prev);
                newMap.set(element.key, parsedWorklog);
                return newMap;
              });
            },
            error: (err) => {
              console.log("err:", err);
            },
          });
        });
      },
      error: (err) => {
        console.log("err:", err);
      },
    });
  }, []);

  useEffect(() => {
    if (worklogMap.size > 0) {
      setDisplayItems(getItems());
    }
  }, [worklogMap]);

  const getItems = () => {
    let arr = Array.from(worklogMap).map(([k, v]) => {
      return {
        id: k,
        title: k,
        description: v.total.toString(),
        children: v.worklogs.map((elm) => {
          return {
            id: elm.id,
            title: elm.author.displayName,
            description: elm.timeSpent,
          };
        }),
      };
    });
    return arr;
  };

  return (
    <>
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
      <TableTree>
        <Headers>
          <Header width={120}>Users</Header>
          <Header width={300}>Time Spent</Header>
        </Headers>
        <Rows
          items={displayItems}
          render={({ id, title, description, children = [] }) => (
            <Row
              itemId={id}
              items={children}
              hasChildren={children.length > 0}
            >
              <Cell>{title}</Cell>
              <Cell>{description}</Cell>
            </Row>
          )}
        />
      </TableTree>
    </>
  );
}
