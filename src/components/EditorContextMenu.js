import React, { useState, useEffect, useRef, useContext } from "react"
import { MoveToMenu } from './CardContextMenu'
import AppContext from './AppContext'

export const EditorContextMenu = (props) => {
  const ref = useRef()
  const appContext = useContext(AppContext)
  const [dropdownTop, setDropdownTop] = useState(-10000)
  const [dropdownLeft, setDropdownLeft] = useState(0)

  const [isDropdownTopSet, setIsDropdownTopSet] = useState(false)

  const [currMenu, setCurrMenu] = useState('main')

  useEffect(() => {
    setDropdownLeft(props.clickCoords.x)
    setDropdownTop(props.clickCoords.y)

    setIsDropdownTopSet(true)
  })

  const handleMoveToClick = (e) => {
    e.preventDefault()
    e.stopPropagation()

    setCurrMenu('move-to')
  }

  const handleTurnIntoPageClick = () => {
    props.turnIntoPage()
    props.closeDropdown()
  }

  const handleMoveToResultClick = (e, space) => {
    props.moveBlocksToSpace(space)    
  }

  const buildMainMenu = () => {
    return(
      <div
        ref={ref}
        className="context-menu-dropdown dropdown"
        style={{
          top: `${dropdownTop}px`,
          left: `${dropdownLeft}px`,
          zIndex: `${appContext.modalSpace ? '6' : '2'}`
        }}
      >
        <div 
          className="dropdown-action"
          onClick={handleTurnIntoPageClick}
        >
          Turn into page
        </div>
        <div 
          className="dropdown-action"
          onClick={handleMoveToClick}
        >
          <i className="fa fa-share mr-1"></i> 
          Move to
        </div>
      </div>
    )
  }

  switch (currMenu) {
    case 'main':
      return buildMainMenu()
    case 'move-to':
      return(
        <MoveToMenu 
          {...props}
          placeholder="Move to..."
          dropdownTop={dropdownTop}
          dropdownLeft={dropdownLeft}
          handleSpaceResultClick={handleMoveToResultClick}
          disableTopLevel={true}
        />
      )
    default:
      return buildMainMenu()
  }

}
