import React, { useState, useContext, useEffect, useRef } from "react"
import { SpaceASResult } from './SpaceASResult'
import { disableBodyScroll, enableBodyScroll, clearAllBodyScrollLocks } from 'body-scroll-lock'

import AppContext from './AppContext'

export const BlockContextMenu = (props) => {
  const ref = useRef()
  const appContext = useContext(AppContext)
  const [dropdownTop, setDropdownTop] = useState(-10000)
  const [dropdownLeft, setDropdownLeft] = useState(0)

  const [currMenu, setCurrMenu] = useState('main')

  useEffect(() => {
    setDropdownLeft(props.clickCoords.x)
    setDropdownTop(props.clickCoords.y)
  })

  const handleToggleClick = (e) => {
    e.preventDefault()
    e.stopPropagation()

    // setCurrMenu('add-to')
    props.handleToggleClick()
  }

  const buildMainMenu = () => {
    return(
	    <div
	      ref={ref}
	      className="context-menu-dropdown dropdown"
	      style={{
	        top: `${dropdownTop}px`,
	        left: `${dropdownLeft}px`,
	        // zIndex: `${appContext.modalSpace ? '6' : '2'}`
	      }}
	    >
        <div 
          className="dropdown-action"
          onClick={handleToggleClick}
        >
          <i className="fa fa-minus-square mr-1"></i> Collapse / expand
        </div>
	    </div>
	  )
  }

  switch (currMenu) {
    case 'main':
      return buildMainMenu()
    // case 'move-to':
    // 	return(
    // 		<MoveToMenu 
    //       {...props}
    //       placeholder="Move to..."
    // 			dropdownTop={dropdownTop}
    // 			dropdownLeft={dropdownLeft}
    // 		/>
    // 	)
    // case 'add-to':
    //   return(
    //     <MoveToMenu 
    //       {...props}
    //       placeholder="Add to..."
    //       copy={true}
    //       dropdownTop={dropdownTop}
    //       dropdownLeft={dropdownLeft}
    //     />
    //   )
    default:
      return buildMainMenu()
  }
}
