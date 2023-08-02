import React, {useEffect, useState} from "react";
import Button from "@atlaskit/button";
import EditIcon from '@atlaskit/icon/glyph/edit'
import AddIcon from '@atlaskit/icon/glyph/add'
import TableTree, {
    Cell,
    Header,
    Headers,
    Row,
    Rows,
} from "@atlaskit/table-tree";

export default function HelloWorld() {
    const [issues, setIssues] = useState([]);
    const [issueTypes, setIssueTypes] = useState([])
    const [worklogMap, setWorklogMap] = useState(new Map());
    const [displayItems, setDisplayItems] = useState([]);
    const [selectedIssue, setSelectedIssue] = useState(null)
    const [selectedAction, setSelectedAction] = useState(null)


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
                            iconUrl: e.fields.issuetype.iconUrl
                        }
                    }
                }))
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
    useEffect(()=>{
        if(selectedIssue){
            console.log('1ST',selectedIssue)
            AP.dialog.create({
                key: "dialog",
                chrome: false,
                customData: {selectedIssue,selectedAction}
            }).on("close",(output)=>{
                if(!output)
                    return;
                if(output.output!='none') {
                    const flag = AP.flag.create({
                        title: ' ',
                        body: `Worklog ${output.output} successfuly.`,
                        type: 'success'
                    });
                    setTimeout(()=>{
                        flag.close();
                    }, 3000);
                }
            })
        }

    },[selectedIssue])
    const handleClick = (id,action,parent,comment,logId,description,startDate) => {
        // Update the state using the setMyStateValue function
        if(!parent)
            setSelectedIssue({label: id,value:id});
        else
            setSelectedIssue({comment,logId,description,startDate,data:{label: parent,value:parent}})
        setSelectedAction(action)

        console.log('ISSUE :',selectedIssue)
        console.log('ACTION :',selectedAction)
    };

    const getItems = () => {

        let arr = Array.from(worklogMap).map(([k, v]) => {
            console.log(v);
            return {
                id: k,
                title: k,
                description: v.total.toString(),
                action: 'Add',
                children: v.worklogs.map((elm) => {
                    return {
                        parent:k,
                        logId: elm.id,
                        title: elm.author.displayName,
                        comment:(elm.comment?(elm.comment.content[0]?elm.comment.content[0].content[0].text:null):null ),
                        description: elm.timeSpent,
                        startDate: new Date(elm.started).toISOString().slice(0, 16) + "+0100",
                        action: 'Edit'
                    };
                }),
            };
        });
        return arr;
    };



    return (
        <>
            {
                // console.log('B E F OOOOOOOOOOOOOOOOOOO')
                // AP.events.emit('custom-event')
                // console.log('A F T EEEEEEEEEEEEEEEEEEE')
            }
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
                    render={({id, title, description, parent,action,comment,logId, startDate, children = []}) => (
                        <Row
                            itemId={id}
                            items={children}
                            hasChildren={children.length > 0}
                        >
                            <Cell>
                                {issueTypes.map(e => {
                                    if (e.issueId === title) {
                                        return (
                                            <span key={e.issueId}>
                                                <img
                                                    src={`${e.issueType.iconUrl}`}
                                                    alt="Issue Icon"/>
                                              </span>
                                        );
                                    }
                                })}
                                {title}
                            </Cell>
                            <Cell>{description}</Cell>
                            {/*<Cell>{new Date(startDate).toLocaleString()}</Cell>*/}
                            <Cell>{startDate?new Date(startDate).toLocaleString():startDate}</Cell>
                            <Cell>{comment}</Cell>
                            <Cell>
                                {
                                    <Button
                                        onClick={() => {
                                            handleClick(id,action,parent,comment,logId,description,startDate)
                                        }}
                                        iconBefore={action === 'Add' ? (<AddIcon size="small"/>) : (
                                            <EditIcon size="small"/>)}></Button>
                                }
                            </Cell>
                        </Row>
                    )}
                />
            </TableTree>
        </>
    );
}
