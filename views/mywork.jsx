import React, {useEffect, useState} from "react";
import Button from "@atlaskit/button";
import EditIcon from '@atlaskit/icon/glyph/edit';
import AddIcon from '@atlaskit/icon/glyph/add';
import TrashIcon from '@atlaskit/icon/glyph/trash';
import TableTree, {
    Cell,
    Header,
    Headers,
    Row,
    Rows,
} from "@atlaskit/table-tree";


export default function MyWork() {
    const [issues, setIssues] = useState([]);
    const [issueTypes, setIssueTypes] = useState([])
    const [worklogMap, setWorklogMap] = useState(new Map());
    const [displayItems, setDisplayItems] = useState([]);
    const [selectedIssue, setSelectedIssue] = useState(null)
    const [selectedAction, setSelectedAction] = useState(null)
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
    const [accId, setAccId] = useState(null)



    useEffect(() => {
        AP.user.getCurrentUser(async (user) => {
            setAccId(user.atlassianAccountId)
        })
    },[]);
    useEffect(() => {
        if(accId!=null){
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
                            url: `/rest/api/3/issue/${element.key}/worklog/`,
                            type: "GET",
                            success: (data) => {
                                const parsedWorklog = JSON.parse(data);
                                setWorklogMap((prev) => {
                                    let newMap = new Map(prev);
                                    newMap.set(element.key, parsedWorklog);
                                    newMap.forEach(e => {
                                        console.log("Account IIIIIIIIIIDDD", accId)
                                        console.log('BEFOOOOOOOOOORE', e.worklogs)
                                        e.worklogs = e.worklogs.filter((worklog) => worklog.author.accountId == accId)
                                        console.log('AFTEEEEEEEEEEEER', e.worklogs)

                                    })
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
        }
    }, [accId]);

    useEffect(() => {
        if (worklogMap.size > 0) {
            setDisplayItems(getItems());
        }
    }, [worklogMap]);
    useEffect(() => {
        if (selectedIssue) {
            // console.log('1ST',selectedIssue)
            AP.dialog.create({
                key: "dialog",
                chrome: false,
                customData: {selectedIssue, selectedAction}
            }).on("close", (output) => {
                console.log(output)
                if (!output)
                    return;
                if (output.responseText) {
                    const flag = AP.flag.create({
                        title: ' ',
                        body: `${output.responseText}`,
                        type: 'error'
                    });
                }
                if (!output.responseText && output.output != 'none') {
                    const flag = AP.flag.create({
                        title: ' ',
                        body: `Worklog ${output.output} successfuly.`,
                        type: 'success'
                    });
                    // setTimeout(() => {
                    //     flag.close();
                    // }, 3000);
                }
                // AP.navigator.reload();
            })
        }

    }, [selectedIssue])
    const handleClick = (id, action, parent, comment, logId, description, startDate) => {
        // Update the state using the setMyStateValue function
        if (!parent)
            setSelectedIssue({label: id, value: id});
        else
            setSelectedIssue({comment, logId, description, startDate, data: {label: parent, value: parent}})
        setSelectedAction(action)

        console.log('ISSUE :', selectedIssue)
        console.log('ACTION :', selectedAction)
    };

    const handleDelete = (parent, logId) => {
        AP.request({
            url: `/rest/api/3/issue/${parent}/worklog/${logId}`,
            type: 'DELETE',
            success: function (responseText) {
                const flag = AP.flag.create({
                    title: ' ',
                    body: 'Worklog deleted successfuly',
                    type: 'success'
                });
                setTimeout(() => {
                    flag.close();
                }, 4000);
            },
            error: function (err) {
                console.log(err);
                const flag = AP.flag.create({
                    title: ' ',
                    body: `${err.responseText}`,
                    type: 'error'
                });
                setTimeout(() => {
                    flag.close();
                }, 4000);
            }
        });
        const parentIndex = displayItems.findIndex(obj => obj.id === parent);

        if (parentIndex !== -1) {
            let childIndexToDelete = displayItems[parentIndex].children.findIndex(child => child.logId === logId);

            if (childIndexToDelete !== -1) {
                displayItems[parentIndex].children.splice(childIndexToDelete, 1);
            }
        }
    };

    const getItems = () => {

        let arr = Array.from(worklogMap).map(([k, v]) => {
            // console.log(v);
            return {
                id: k,
                title: k,
                // description: v.total.toString(),
                action: 'Add',
                children: v.worklogs.map((elm) => {
                    return {
                        parent: k,
                        logId: elm.id,
                        title: elm.author.displayName,
                        comment: (elm.comment ? (elm.comment.content[0] ? elm.comment.content[0].content[0].text : null) : null),
                        description: elm.timeSpentSeconds / 3600,
                        startDate: new Date(elm.started).toISOString().slice(0, 16) + "+0100",
                        action: 'Edit'
                    };
                }),
            };
        });
        return arr;
    };


    return (

        <div style={{margin: "2rem"}}>
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
                    {/*<Header width={300}>Comment</Header>*/}
                    <Header width={300}>Comment</Header>
                    <Header width={300}>Actions</Header>
                </Headers>
                <Rows
                    items={displayItems}
                    render={({
                                 id,
                                 title,
                                 description,
                                 parent,
                                 action,
                                 comment,
                                 logId,
                                 startDate,
                                 children = []
                             }) => (
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
                            <Cell>{parent ? (description != 8 ? (description + 'h') : (description + 'h (1 day)')) : (description)}</Cell>
                            {/*<Cell>{new Date(startDate).toLocaleString()}</Cell>*/}
                            <Cell>{startDate ? new Date(startDate).toLocaleString() : startDate}</Cell>
                            <Cell>{comment}</Cell>
                            <Cell>
                                <Button
                                    isDisabled={(new Date(startDate).getMonth() !== currentMonth) && action == 'Edit'}
                                    onClick={() => {
                                        handleClick(id, action, parent, comment, logId, description, startDate)
                                    }}
                                    iconBefore={action === 'Add' ? (<AddIcon size="small"/>) : (
                                        <EditIcon size="small"/>)}>
                                </Button>
                                {parent && (<Button
                                    iconBefore={<TrashIcon size="small"/>}
                                    onClick={() => {
                                        handleDelete(parent, logId)
                                    }}>
                                </Button>)
                                }
                            </Cell>
                        </Row>
                    )}
                />
            </TableTree>
        </div>
    )
        ;
}
