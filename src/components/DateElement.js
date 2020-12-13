import React, { useEffect, useState, useRef } from "react"
import { ClickHandler } from './ClickHandler'
import DatePicker from "react-datepicker"
import { friendlyDateStr } from '../utils/date_utils'
import {  
  useSlate
} from "slate-react"

import moment from 'moment'

export const DateElement = (props) => {
	const editor = useSlate()
  
	const [showDropdown, setShowDropdown] = useState(false)

  const handleMouseDown = (e) => {
    e.preventDefault()
    props.setPersistedSelection(editor.selection)
    setShowDropdown(true)
  }

	const getParsedDate = () => {
		return moment(props.element.dateISOString)
	}

	const getDisplayStr = () => {
		return friendlyDateStr(getParsedDate())
	}

	const overriddenChildren = () => {
		const newNode = {
			...props.children.props.node,
			children: [{ text: getDisplayStr() }]
		}

		const newChildren = {
			...props.children,
			props: {
				...props.children.props,
				node: newNode
			}
		}
		console.log(props.children, newChildren)

		return newChildren //props.children
	}

	const handleMouseOver = () => {
		if (getDisplayStr() !== props.element.children[0].text) {
			props.updateDateStr(props.element, getDisplayStr())
		}
	}

	const handleDateChange = (date) => {
		props.updateDate(props.element, date)
	}

	const buildDropdown = () => {
		if (!showDropdown) return ''

		return (
			<DateDropdown 
				closeDropdown={() => setShowDropdown(false)}
				parsedDate={getParsedDate()}
				handleDateChange={handleDateChange}
			/>	
		)
	}

	// console.log('props.children in DateElement', props.children)

  return(
  	<span>
	    <span 
	    	contentEditable={false}
		  	className="date-element clickable"
	      {...props.attributes}
	    	onMouseOver={handleMouseOver}
	      onMouseDown={handleMouseDown}
	    >
	      { props.children }
	    </span>
	    { buildDropdown() }
	  </span>
  )
      // { getDisplayStr() }
}

const DateDropdown = (props) => {
	const [pickedDate, setPickedDate] = useState(props.parsedDate.toDate())

	const handleDateChange = (date) => {
		setPickedDate(date)
	}

	const closeMenu = () => {
		// TODO - update and save
		props.handleDateChange(pickedDate)
		props.closeDropdown()
	}

	return(
		<ClickHandler
			close={closeMenu}
		>
	    <div
	      className="dropdown date-dropdown"
	      contentEditable={false}
	      style={{paddingLeft: '0.5em'}}
	    >
	      <DatePicker
          selected={pickedDate}
          onChange={handleDateChange}
        />
	    </div>
	  </ClickHandler>
  )
}
