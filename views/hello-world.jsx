import SectionMessage from "@atlaskit/section-message";
import React, {useEffect, useState} from "react";
import NewComp from "./new-comp";
import Button from "@atlaskit/button";
import TableTree, {Cell, Header, Headers, Row, Rows} from '@atlaskit/table-tree';


export default function HelloWorld() {
    const [excitementLevel, setExcitementLevel] = useState(0);
    const [issues, setIssues] = useState([]);
    const [worklogMap, setWorklogMap] = useState(new Map());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        AP.request({
            url: "/rest/api/3/search?jql=",
            type: "GET",
            success: (data) => {
                const parsed = JSON.parse(data);
                setIssues(parsed.issues);
                console.log("CALL 1 \n")
                parsed.issues.forEach((element) => {
                    console.log("CALL BEFORE \n")
                    AP.request({
                        url: `/rest/api/3/issue/${element.key}/worklog`,
                        type: "GET",
                        success: (data) => {
                            const parsedWorklog = JSON.parse(data);
                            // worklogMap.set(element.key, element)
                            setWorklogMap(prev => prev.set(element.key, parsedWorklog.worklogs))

                        },
                        error: (err) => {
                            console.log("err:", err);
                        }
                    })
                })

                setLoading(false);
            },
            error: (err) => {
                console.log("err:", err);
            },
        });

        // setLoading(false)
    }, [])

    const getItems = () => {
        console.log("map map", worklogMap)
        console.log("map", Array.from(worklogMap,([k,v])=>{
            return ({
                [k]:v
            })
        }))
        // let arr = [];

        // for (let [k, v] of worklogMap.entries()) {
        //     arr.push({
        //         id: k,
        //         title: k,
        //         description: v.total,
        //         children: v.worklogs.map(elm => {
        //             return {
        //                 id: elm.id,
        //                 title: elm.author.displayName,
        //                 description: elm.timeSpent
        //             }
        //         })
        //     })
        // }
        let arr = Array.from(worklogMap).map(([k, v]) => {
            return {
                id: k,
                title: k,
                description: v.total.toString(),
                children: []
                // children: v.worklogs.map(elm => {
                //     return {
                //         id: elm.id,
                //         title: elm.author.displayName,
                //         description: elm.timeSpent
                //     }
                // })
            }
        })
        console.log("arr: ", arr)
        return arr;
    }
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
            <TableTree>
                <Headers>
                    <Header width={120}>Users</Header>
                    <Header width={300}>Time Spent</Header>
                </Headers>
                {
                    !loading ? (
                        <Rows
                            items={getItems()}
                            render={({id, title, description, children = []}) => (
                                <Row itemId={id} items={children} hasChildren={children.length > 0}>
                                    <Cell>{title}</Cell>
                                    <Cell>{description}</Cell>
                                </Row>
                            )}
                        />

                    ) : <></>
                }
                <p>loading = {loading ? "ok" : "not ok"}</p>
            </TableTree>
        </>
    );
}
