import React, {useEffect, useState} from 'react'
import getLastDays from './utils/get-lastdays'
import Select from '@atlaskit/select';


function TimesheetCell({timeSpent}) {
    const [showButtons, setShowButtons] = useState(false);

    return (
        <div
            className="item-cell"
            onMouseEnter={() => setShowButtons(true)}
            onMouseLeave={() => setShowButtons(false)}
        >
            <span className="time-spent">{timeSpent}</span>
            {showButtons && (
                <div className="actions-item">
                    <button className="edit"></button>
                    <button className="delete">D</button>
                </div>
            )}
        </div>
    );
}

function TimesheetComponent() {
    const [issues, setIssues] = useState([]);
    const [issueTypes, setIssueTypes] = useState([])
    const [lastDays, setLastDays] = useState(getLastDays(7));
    const [worklogMap, setWorklogMap] = useState(new Map());
    const [startedAfter, setStartedAfter] = useState(() => {
        const currentDate = new Date();
        currentDate.setDate(currentDate.getDate() - 7);
        return currentDate.getTime();
    })
    const [accId, setAccId] = useState(null)

    // const [selectedDuration,setSelectedDuration] = useState(7)
    //
    // useEffect(() => {
    //     console.log(selectedDuration)
    //     setLastDays(getLastDays(selectedDuration))
    // }, [selectedDuration]);

    const fillArrayWithZeros = (array, length, lastDays) => {
        console.log(lastDays)
        const timeSpentValues = new Array(length).fill('0');
        array.forEach((item) => {
            const startedDate = new Date(item.started).getDate();
            lastDays.forEach((e,i)=>{
                if(parseInt(e.slice(0,2)) == new Date(item.started).getDate())
                    timeSpentValues[i] = item.timeSpent;
            })
        });
        return [...timeSpentValues];
    };


    useEffect(() => {
        AP.user.getCurrentUser(async (user) => {
            setAccId(user.atlassianAccountId)
        })
    }, []);

    useEffect(() => {
        if (accId != null) {
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
                            url: `/rest/api/3/issue/${element.key}/worklog?startedAfter=${startedAfter}`,
                            type: "GET",
                            success: (data) => {
                                const parsedWorklog = JSON.parse(data);
                                setWorklogMap((prev) => {
                                    let newMap = new Map(prev);
                                    newMap.set(element.key, parsedWorklog);
                                    newMap.forEach(e => {
                                        e.worklogs = e.worklogs.filter((worklog) => worklog.author.accountId == accId)
                                        // console.log(e.worklogs)
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
        if (worklogMap.size == issues.length && issues.length != 0) {
            const presentationElements = document.querySelectorAll('[role="presentation"]');
            presentationElements.forEach((element, index) => {
                element.style.position = 'absolute';
                const leftPosition = (index - 1) * 80; // Adjust the left position as needed
                element.style.width = '80px';
                element.style.left = leftPosition + 'px';
                // You can apply other styles or modifications as needed
            });

            let itemsContent = [];
            const container = document.getElementById("timesheet-items");
            issues.forEach((e) => {
                if (worklogMap.get(e.key) != null) {
                    // console.log(worklogMap.get(e.key).worklogs)
                    let arr = worklogMap.get(e.key).worklogs.map((e) => {
                        return {
                            timeSpent: e.timeSpent,
                            started: e.started
                        }
                    });
                    console.log("***************************", arr)
                    itemsContent = [...itemsContent, ...fillArrayWithZeros(arr, 7, lastDays)];
                    // console.log(worklogMap.get(e.key))
                }
            })
            console.log("final arraaay", itemsContent)
            const itemWidth = 80;
            const itemHeight = 50;
            const itemsPerRow = 7;
            let leftPosition = 1;
            let topPosition = 50;

            itemsContent.forEach((content, index) => {
                if (index > 0 && index % itemsPerRow === 0) {
                    topPosition += itemHeight;
                    leftPosition = 1;
                }

                const item = document.createElement("div");
                item.className = "item";
                item.style.width = `${itemWidth}px`;
                item.style.height = `${itemHeight}px`;
                item.style.top = `${topPosition}px`;
                item.style.left = `${leftPosition}px`;

                const innerDiv = document.createElement("div");
                innerDiv.className = "inner-item";

                const spanEl = document.createElement("span");
                spanEl.textContent = content;

                const actionsDiv = document.createElement("div");
                actionsDiv.className = "actions-item";

                const editButton = document.createElement("button");
                editButton.className = "edit";
                editButton.textContent = 'E';

                const deleteButton = document.createElement("button");
                deleteButton.className = "delete";
                deleteButton.textContent = 'D';

                item.appendChild(innerDiv);
                innerDiv.appendChild(spanEl);
                innerDiv.appendChild(actionsDiv);
                actionsDiv.appendChild(editButton);
                actionsDiv.appendChild(deleteButton);
                container.appendChild(item);

                leftPosition += itemWidth;
            });
        }

    }, [worklogMap, issues]);

    const getItems = () => {

        let arr = Array.from(worklogMap).map(([k, v]) => {
            // console.log(v);
            return {
                id: k,
                title: k,
                description: v.total.toString(),
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
        <div>
            {/*<Select*/}
            {/*    placeholder={'Select a duration'}*/}
            {/*    options={[*/}
            {/*        {label: 'Last week', value: 7},*/}
            {/*        {label: 'Last 2 weeks', value: 14},*/}
            {/*        {label: 'Last month', value: 30}*/}
            {/*    ]}*/}
            {/*    onChange={(v) => {*/}
            {/*        console.log(v)*/}
            {/*        setSelectedDuration(v.value)*/}
            {/*    }}*/}
            {/*/>*/}
            <div className="timesheet-row" style={{marginTop: "5rem"}}>
                <div className="timesheet-side" id="tickets">
                    <div className="timesheet-side-header">Issues</div>
                    <div className="timesheet-side-inner">
                        {issues && issues.map((issue) => (
                            <div className="ticket-ref" key={issue.key}>
                                <div className="ticket-ref-inner">{issue.key}</div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="timesheet-content" id="timesheet-wrap">
                    <div className="timesheet-content-header">
                        <div className="timesheet-content-inner-header">
                            {lastDays.map((day, index) => (
                                <div key={index} role="presentation" className="timesheet-header-cell">
                                    <div className="header-cell-date">{day.split('-')[0]}</div>
                                    <div className="header-cell-day">{day.split('-')[1]}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="timesheet-items" id="timesheet-items">
                        {/*{issues.map((issue) => (*/}
                        {/*    <div className="item-row" key={issue.key}>*/}
                        {/*        {lastDays.map((day, index) => {*/}
                        {/*            const worklogs = worklogMap.get(issue.key) || [];*/}
                        {/*            return (*/}
                        {/*                <TimesheetCell*/}
                        {/*                    key={`${issue.key}-${day}`}*/}
                        {/*                    worklogs={worklogs}*/}
                        {/*                    day={day}*/}
                        {/*                />*/}
                        {/*            );*/}
                        {/*        })}*/}
                        {/*    </div>*/}
                        {/*))}*/}
                    </div>

                </div>
            </div>
        </div>

    );
}

export default TimesheetComponent;
