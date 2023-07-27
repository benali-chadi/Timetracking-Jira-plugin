import React, { useEffect, useState } from "react";
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
  const [expanded, setExpanded] = useState({});
  const [issueTypes, setIssueTypes] = useState([]);

  useEffect(() => {
    AP.request({
      url: "/rest/api/3/search?jql=",
      type: "GET",
      success: (data) => {
        const parsed = JSON.parse(data);
        setIssues(parsed.issues);
        setIssueTypes(parsed.issues.map((e) => {
          return {
            issueId: e.key,
            issueType: {
              name: e.fields.issuetype.name,
              iconUrl: e.fields.issuetype.iconUrl,
            },
          };
        }));
        parsed.issues.forEach((element) => {
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
      setExpanded({ ...expanded, [k]: true });
      let icon = issueTypes.find((e) => e.issueId === k)?.issueType?.iconUrl;
      return {
        id: k,
        title: k,
        description: v.total.toString(),
        children: v.worklogs.map((elm) => {
          return {
            id: elm.id,
            title: elm.author.displayName,
            description: elm.timeSpent,
            startDate: new Date(elm.started).toLocaleString(),
            icon,
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
          <Header width={300}>Issues</Header>
          <Header width={300}>Time Spent</Header>
          <Header width={300}>Start Date</Header>
        </Headers>
        <Rows
          items={displayItems}
          render={(
            { id, title, description, startDate, icon, children = [] },
          ) => (
            <Row
              itemId={id}
              items={children}
              hasChildren={children.length > 0}
              isExpanded={expanded[id]}
              onExpand={() => setExpanded({ ...expanded, [id]: true })}
              onCollapse={() => setExpanded({ ...expanded, [id]: false })}
            >
              <Cell>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  {icon &&
                    (
                      <img
                        src={icon}
                        alt="Issue Icon"
                      />
                    )}

                  <p>{title}</p>
                </div>
              </Cell>
              <Cell>{description}</Cell>
              <Cell>{startDate}</Cell>
            </Row>
          )}
        />
      </TableTree>
    </>
  );
}
