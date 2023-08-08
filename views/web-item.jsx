import Button from "@atlaskit/button";
import React, {useEffect, useState} from "react";

import Modal, {
    ModalBody,
    ModalFooter,
    ModalHeader,
    ModalTitle,
} from "@atlaskit/modal-dialog";
import Select from "@atlaskit/select";
import TextField from "@atlaskit/textfield";
import TextArea from "@atlaskit/textarea";
import {DateTimePicker} from "@atlaskit/datetime-picker";
import getTimespent from "./utils/get-timespent";
import ProgressBar from '@atlaskit/progress-bar';


export default function WebItem() {
    const [issues, setIssues] = useState([]);
    const [selectedIssue, setSelectedIssue] = useState(null);
    const [displayedIssue, setDisplayedIssue] = useState(null);

    const [timeSpent, setTimeSpent] = useState(0);
    const [comment, setComment] = useState("");
    const [logId, setLogId] = useState("");

    const [startDate, setStartDate] = useState(null);
    // const [isStartDate, setIsStartDate] = useState(true);
    const [totalTimeSpent, setTotalTimeSpent] = useState(0);
    const [oldVal, setOldVal] = useState(0)

    const [selectedAction, setSelectedAction] = useState('Indep')
    const [output, setOutput] = useState('none')
    const [accId,setAccId] = useState('')


    const onClose = () => {
        AP.dialog.close();
    };

    useEffect(() => {
        // For the generalPages
        AP.dialog.getCustomData(function (customData) {

            if(!customData){
                // For webItem button
                setStartDate(new Date().toISOString().slice(0, 16) + "+0100")
                AP.context.getContext(function (response) {
                    const obj = {
                        label: response.jira.issue.key,
                        value: response.jira.issue.id
                    }
                    console.log("Response : ", response)
                    console.log("Object : ", obj)
                    setSelectedIssue(obj.value)
                    setDisplayedIssue(obj)
                });
            }
            setSelectedAction(customData.selectedAction)
            if (customData.selectedIssue.logId) {
                setSelectedIssue(customData.selectedIssue.data.value)
                setDisplayedIssue(customData.selectedIssue.data)
                // setTimeSpent(parseInt(customData.selectedIssue.description.slice(0, 2)))
                // setOldVal(parseInt(customData.selectedIssue.description.slice(0, 2)))
                setTimeSpent(customData.selectedIssue.description)
                setOldVal(customData.selectedIssue.description)
                setComment(customData.selectedIssue.comment)
                setLogId(customData.selectedIssue.logId)
                setStartDate(customData.selectedIssue.startDate)
                setOutput('edited')
            } else if (customData) {
                setStartDate(new Date().toISOString().slice(0, 16) + "+0100")
                setSelectedIssue(customData.selectedIssue.value)
                setDisplayedIssue(customData.selectedIssue)
                setOutput('created')

            }

        });
        setOutput('created')

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
        if (startDate != null) {
            AP.user.getCurrentUser(async (user) => {
                // if (selectedAction=='Add') {
                console.log(user)
                setAccId(user.atlassianAccountId)
                const t1 = await getTimespent(user.atlassianAccountId, new Date(startDate));
                console.log("t1 : ", t1)
                setTotalTimeSpent(t1);
                // } else if (selectedAction=='Edit'){
                //     console.log("Start date: ",startDate)
                //     console.log("Start date on Date() : ",new Date(startDate))
                //     const t2 = await getTimespent(user.atlassianAccountId,new Date(startDate));
                //     console.log("t2 : ",t2)
                //     setTotalTimeSpent(t2);
                // }
            });
        }
    }, [startDate])


    const onSubmit = async (e) => {
        e.preventDefault();
        // if (!startDate) {
        //     setIsStartDate(false);
        //     return;
        // }
        const splitedStartDate = startDate.split("+");
        const dateStart = splitedStartDate[0] + ":00.000+" + splitedStartDate[1];
        console.log("startDate", dateStart);

        if (selectedAction == 'Add' || selectedAction == 'Indep') {
            AP.request({
                url: `/rest/api/3/issue/${selectedIssue}/worklog`,
                type: "POST",
                data: JSON.stringify({
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
                }),
                contentType: "application/json",
                success: (res) => {
                    console.log("Created Worklog:", res);
                },
                error: (err) => {
                    console.log("err", err);
                },
            });
        } else if (selectedAction == 'Edit') {
            AP.request({
                url: `/rest/api/3/issue/${selectedIssue}/worklog/${logId}`,
                type: "PUT",
                data: JSON.stringify({
                    comment: {
                        content: [
                            {
                                content: [
                                    {
                                        text: comment ? comment : '',
                                        type: "text",
                                    },
                                ],
                                type: "paragraph",
                            },
                        ],
                        type: "doc",
                        version: 1,
                    },
                    timeSpentSeconds: timeSpent * 60 * 60,
                }),
                contentType: "application/json",
                success: (res) => {
                    console.log("Edited Worklog:", res);
                },
                error: (err) => {
                    console.log("err", err);
                },
            });
        }
        console.log('reached !!')
        AP.dialog.close({output});
    };

    return (

        <Modal onClose={onClose} width={'medium'}>

            <form
                onSubmit={onSubmit}
                style={{
                    height: "100%",
                    width: "100%",
                }}
            >
                <ModalHeader>
                    <ModalTitle>{selectedAction == 'Edit' ? "Edit worklog" : "Create worklog"}</ModalTitle>
                </ModalHeader>
                <ModalBody
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "1rem",
                    }}
                >
                    <label>Issues</label>
                    <Select
                        isDisabled={selectedAction == 'Edit'}
                        required
                        placeholder={'Select an issue'}
                        options={issues}
                        value={displayedIssue}
                        // defaultValue={selectedIssue}
                        onChange={(v) => {
                            setSelectedIssue(v.value);
                            setDisplayedIssue(v)
                        }}
                    />

                    <label style={{marginTop: '30px'}}>Time spent</label>
                    <TextField
                        type="number"
                        value={timeSpent}
                        max={selectedAction == 'Add' ? (8 - totalTimeSpent) : (8 - totalTimeSpent + oldVal)}
                        // max={8 - totalTimeSpent}
                        min={0}
                        placeholder="Enter time spent in hours"
                        isRequired
                        onChange={(e) => setTimeSpent(e.target.value)}
                    />
                    <ProgressBar
                        style={{marginTop: '10px'}}
                        ariaLabel="Done: 6 of 10 issues"
                        value={selectedAction == 'Add' ? ((Number(timeSpent) + totalTimeSpent) / 8) : ((Number(timeSpent) + totalTimeSpent - oldVal) / 8)}
                    />
                    {<p>You
                        have {selectedAction == 'Add' ? (8 - timeSpent - totalTimeSpent) : (8 - totalTimeSpent - Number(timeSpent) + oldVal)} hours
                        left on this start date</p>}
                    <label style={{marginTop: '30px'}}>Comment</label>
                    <TextArea
                        placeholder="Enter a comment"
                        value={comment}
                        resize="auto"
                        onChange={(e) => setComment(e.target.value)}
                    />
                    {<div>comment: {comment}</div>}

                    <div>
                        <label htmlFor="Start Date" style={{marginTop: '10px'}}>Start Date</label>
                        <DateTimePicker
                            datePickerProps={{minDate: new Date().toISOString().slice(0, 8) + "01"}}
                            isDisabled={selectedAction == 'Edit'}
                            name="Start Date"
                            value={startDate}
                            required
                            onChange={(e) => {
                                // console.log(e);
                                return setStartDate(e);
                            }}
                        />
                        {/*{!isStartDate && (*/}
                        {/*    <p style={{color: "red"}}>Please select a start date</p>*/}
                        {/*)}*/}
                    </div>
                    {totalTimeSpent >= 8 && (
                        <p style={{color: "red"}}>
                            You cant create more than 8 hours a day
                        </p>
                    )}
                </ModalBody>
                <ModalFooter>
                    <div>{totalTimeSpent}</div>
                    <div>{timeSpent}</div>
                    <div>{oldVal}</div>
                    <Button appearance="primary" type="submit"
                            isDisabled={selectedAction == 'Add' ? (totalTimeSpent >= 8 || totalTimeSpent + Number(timeSpent) > 8) : (totalTimeSpent + Number(timeSpent) - oldVal > 8)}>Create</Button>
                    <Button onClick={onClose}>Cancel</Button>
                </ModalFooter>
            </form>
        </Modal>
    );
}
