export function truckingDeliveryDates(mode, first, extra = [], end = '', weekdays = []) {
  const valid = value => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0,10) === value;
  if (!valid(first)) throw new Error('Choose a valid requested delivery date.');
  let dates = [first];
  if (mode === 'multiple') {
    if (extra.some(value => !valid(value))) throw new Error('Complete or remove the additional dates.');
    dates.push(...extra);
  }
  if (mode === 'weekly') {
    if (!valid(end) || end < first) throw new Error('Choose an end date on or after the first date.');
    if (!weekdays.length) throw new Error('Select at least one weekday.');
    dates = [];
    for (let time = Date.parse(first); time <= Date.parse(end); time += 86400000) {
      const date = new Date(time);
      if (weekdays.includes(date.getUTCDay())) dates.push(date.toISOString().slice(0,10));
      if (dates.length > 100) throw new Error('Choose no more than 100 delivery dates.');
    }
  }
  dates = [...new Set(dates)].sort();
  if (!dates.length || dates.length > 100) throw new Error('Choose between 1 and 100 delivery dates.');
  return dates;
}
