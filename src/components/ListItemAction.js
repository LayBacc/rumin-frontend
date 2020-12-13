import React, { useState } from "react"

import { ClickHandler } from './ClickHandler'

export const CopyLinkAction = props => {
  const urlRef = React.createRef()
  const [showDropdown, setShowDropdown] = useState(false)
  const [copySuccess, setCopySuccess] = useState('')

  const handleClick = () => {
  	setShowDropdown(true)

  	urlRef.current.select()
  	document.execCommand('copy')
  	setCopySuccess('link copied to clipboard')
  }

  const buildDropdown = () => {
  	return(
  		<ClickHandler
  			close={ () => setShowDropdown(false) }
  		>
	  		<div className={`dropdown ${showDropdown ? '' : 'hidden'}`}>
		      <input
		      	ref={urlRef}
		      	type="text"
		      	value={props.url} 
		      	style={{width: '100%', marginBottom: '0.5em'}}
		      />
		      { copySuccess }
	      </div>
	    </ClickHandler>
  	)
  }

  return(
  	<div className="control">
      <div 
      	className="icon-container"
      	onClick={handleClick}
        title="Copy link"
      >
        <i className="fa fa-link"></i>
      </div>
      
      { buildDropdown() }
    </div>
  );    
}

export const CopyContentAction = props => {
  const [showDropdown, setShowDropdown] = useState(false)

  const buildDropdown = () => {
  	return(
  		<ClickHandler
  			close={ () => setShowDropdown(false) }
  		>
	  		<div className={`dropdown ${showDropdown ? '' : 'hidden'}`}>
	  			"Copy content" feature is coming soon!
	      </div>
	    </ClickHandler>
  	)
  }

  return(
  	<div className="control">
      <div 
      	className="icon-container"
      	onClick={() => setShowDropdown(!showDropdown)}
        title="Copy content"
      >
        <i className="fa fa-clone"></i>
      </div>

      { buildDropdown() }
    </div>
  );    
}

export const ArchiveAction = props => {
  return(
		<div className="control">
      <div
        className="icon-container"
        onClick={() => props.handleArchive()}
        title="Archive"
      >
        <i className="fa fa-archive"></i>
      </div>
    </div>
  );    
}
