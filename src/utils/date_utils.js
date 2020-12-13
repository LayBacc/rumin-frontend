import moment from 'moment'

const startWithLowerCase = (str) => {
	return str.slice(0, 1).toLowerCase() + str.slice(1,)
}

export const friendlyDateStr = (date) => {
	const momentDate = moment(date);
	return momentDate.calendar(null,{
	    lastDay : '[Yesterday]',
	    sameDay : '[Today]',
	    nextDay : '[Tomorrow]',
	    lastWeek : '[last] dddd',
	    nextWeek : 'dddd',
	    sameElse : 'L'
	})
}

export const friendlyDateTimeStr = (date) => {
	const momentDate = moment(date);
	const str = momentDate.calendar()
	return startWithLowerCase(str)
}
