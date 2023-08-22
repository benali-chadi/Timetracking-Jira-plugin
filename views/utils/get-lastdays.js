const moment = require('moment');

export default function getLastDays(param){
    const daysOfWeek = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
    const today = moment();
    const lastDays = Array.from({ length: param }, (_, i) => {
        const date = moment(today).subtract(i, 'days');
        const day = date.format('DD');
        const dayOfWeek = daysOfWeek[date.day()];
        return `${day}-${dayOfWeek}`;
    }).reverse();
    return lastDays;
}