function compareDates(d1, d2) {
    if (d1.getDate() !== d2.getDate()) {
        return false;
    }
    if (d1.getMonth() !== d2.getMonth()) {
        return false;
    }
    if (d1.getFullYear() !== d2.getFullYear()) {
        return false;
    }
    return true;
}



export default async function getTimespent(userId, date) {
    const bodyData = {
        fields: ["worklog", "assignee", "issueType"],
        jql: `assignee = ${userId}`,
    };

    let data = await AP.request({
        url: "/rest/api/3/search",
        type: "POST",
        data: JSON.stringify(bodyData),
        contentType: "application/json",
    });

    const parsed = JSON.parse(data.body);
    let timespent = 0;
    let targetDate = (date ? new Date(date) : new Date())
    console.log("date payload : ",date,"\ntarget date : ",targetDate)
    for (let issue of parsed.issues) {
        for (let worklog of issue.fields.worklog.worklogs) {
            // let started = new Date(worklog.started.split("T")[0]);
            let started = new Date(worklog.started);
            console.log('wawawa')
            if (compareDates(started, targetDate)) {
                timespent += worklog.timeSpentSeconds;
            }
        }
    }

    return timespent / 3600;
}