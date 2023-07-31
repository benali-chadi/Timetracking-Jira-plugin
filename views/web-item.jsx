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

export default function WebItem() {
    const [issues, setIssues] = useState([]);
    const [selectedIssue, setSelectedIssue] = useState(null);
    const [displayedIssue, setDisplayedIssue] = useState(null);
    const [timeSpent, setTimeSpent] = useState(0);
    const [comment, setComment] = useState("");
    const [logId, setLogId] = useState("");
    const [startDate, setStartDate] = useState(null);
    const [isStartDate, setIsStartDate] = useState(true);
    const [sysDate, setSysDate] = useState(new Date().toISOString().slice(0, 16) + "+0100")
    const [selectedAction, setSelectedAction] = useState(null)



    const onClose = () => {
        AP.dialog.close();
    };

    useEffect(() => {
        AP.dialog.getCustomData(function (customData) {
            console.log('*************************\n',customData)
            setSelectedAction(customData.selectedAction)
            if(customData.selectedIssue.logId){
                setSelectedIssue(customData.selectedIssue.data.value)
                setDisplayedIssue(customData.selectedIssue.data)
                setComment(customData.selectedIssue.comment)
                setLogId(customData.selectedIssue.logId)
                setTimeSpent(parseInt(customData.selectedIssue.description.slice(0,2)))
            }
            else {
                setSelectedIssue(customData.selectedIssue.value)
                setDisplayedIssue(customData.selectedIssue)
            }
        });

        // For webItem button
        // AP.context.getContext(function (response) {
        //     const obj = {
        //         label: response.jira.issue.key,
        //         value: response.jira.issue.id
        //     }
        //     console.log("Response : ", response)
        //     console.log("Object : ", obj)
        //     setContextIssue(obj)
        //     setSelectedIssue(obj)
        // });

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
        setStartDate(sysDate)
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
        if(selectedAction=='Add'){
            AP.request({
                url: `/rest/api/3/issue/${selectedIssue}/worklog`,
                type: "POST",
                data: JSON.stringify(bodyData),
                contentType: "application/json",
                success: (res) => {
                    console.log("Created Worklog:", res);
                    AP.flag.create({
                        title: 'Worklog created successfuly.',
                        body: 'This is a flag.',
                        type: 'success',
                        actions: {
                            'actionkey': 'Click me'
                        }
                    });
                },
                error: (err) => {
                    console.log("err", err);
                },
            });
        }
        else if(selectedAction=='Edit'){
            AP.request({
                url: `/rest/api/3/issue/${selectedIssue}/worklog/${logId}`,
                type: "PUT",
                data: JSON.stringify(bodyData),
                contentType: "application/json",
                success: (res) => {
                    console.log("Updated Worklog:", res);
                },
                error: (err) => {
                    console.log("err", err);
                },
            });
        }

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
                    <ModalTitle>{selectedAction=='Add'?"Create worklog":"Update worklog"}</ModalTitle>
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
                        placeholder={'Select an issue'}
                        options={issues}
                        value={displayedIssue}
                        // defaultValue={selectedIssue}
                        onChange={(v) => {
                            setSelectedIssue(v.value);
                        }}
                    />


                    <TextField
                        type="number"
                        value={timeSpent}
                        max={8}
                        min={0}
                        placeholder="Enter time spent in hours"
                        isRequired
                        onChange={(e)=> setTimeSpent(e.target.value)}
                    />

                    <TextArea
                        style={{marginTop: "10px"}}
                        placeholder="Enter a comment"
                        value={comment}
                        resize="auto"
                        onChange={(e)=> setComment(e.target.value)}
                    />

                    <div>
                        <label htmlFor="Start Date">Start Date</label>
                        <DateTimePicker
                            name="Start Date"
                            value={sysDate}
                            timePickerProps={{}}
                            onChange={(e) => {
                                // console.log(e);
                                return setStartDate(e);
                            }}
                        />
                        {!isStartDate && (
                            <p style={{color: "red"}}>Please select a start date</p>
                        )}
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button appearance="primary" type="submit">Create</Button>
                    <Button onClick={onClose}>Cancel</Button>
                </ModalFooter>
            </form>
        </Modal>
    );
}
