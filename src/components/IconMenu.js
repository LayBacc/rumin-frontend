import React, { useState } from "react"
import { ClickHandler } from './ClickHandler'

export const IconMenu = (props) => {
	const [showDropdown, setShowDropdown] = useState(false)
	const [isSaving, setIsSaving] = useState(false)

	const handleIconSubmit = (iconData) => {
		const body = { icon: iconData }

		setIsSaving(true)

		fetch(`/api/v1/spaces/${props.space.id}/`, {
      method: 'PATCH',
      headers: {
        'Content-type': 'application/json'
      },
      body: JSON.stringify(body)
    }) 
    .then(res => {
      if (!res.ok) {
        if (res.status === 401) {}
        throw new Error(res.status)
      }
      else return res.json()
    })
    .then(data => {
      setShowDropdown(false)
      setIsSaving(false)

      props.updateSpace(data)
    })
    .catch(error => {

    })
	}

	const buildDropdown = () => {
		if (!showDropdown) return ''

		return(
			<ClickHandler
				close={() => setShowDropdown(false)}
			>
				<IconDropdown 
					isSaving={isSaving}
					handleIconSubmit={handleIconSubmit}
				/>
			</ClickHandler>
		)
	}

	if (props.space.icon) {
		return(
			<div 
        className="space-icon-container clickable"
        onClick={() => setShowDropdown(true)}
      >
        <img 
          src={props.space.icon}
          className="space-icon" 
        />

        { buildDropdown() }
      </div>
		)
	}

  return(
  	<div>
			<div 
				className="gray-text clickable inline-block padding-small small-text"
				onClick={() => setShowDropdown(true)}
			>
	      <i className="fa fa-smile-o" style={{marginRight: '0.5em'}}></i> Add icon
	    </div>

			{ buildDropdown() }	    
	  </div>
  )
}

export const IconDropdown = (props) => {
	const [iconUrl, setIconUrl] = useState('')

	const handleIconPaste = (e) => {
		// pasting from clipboard 		
		console.log('pasting image for icon', e, e.clipboardData, e.clipboardData.items)

		const dataTransfer = e.clipboardData.items[0]
		if (dataTransfer && dataTransfer.type === 'image/png') {
			const blob = dataTransfer.getAsFile()
			const fileReader = new FileReader()
		
			// send as raw base64 data
			fileReader.onloadend = () => {
				props.handleIconSubmit(fileReader.result)
			}
			fileReader.readAsDataURL(blob)
		}
	}

	const handleIconChange = (e) => {
		setIconUrl(e.target.value)
	}

	if (props.isSaving) {
		return(
			<div className="dropdown text-center">
				Saving...
			</div>
		)
	}	

	return(
		<div className="dropdown text-center">
			<div className="input-container">
				<input
					className="std-input"
					placeholder="Paste an image link or from clipboard"
					value={iconUrl}
					onChange={handleIconChange}
					onPaste={handleIconPaste}
				/>
			</div>

			<div style={{margin: '0.5em'}}>
				<div 
					className="btn-primary"
					style={{width: '50%'}}
					onClick={() => props.handleIconSubmit(iconUrl)}
				>Submit</div>
			</div>

			<div className="padding-small">
	    	<p>Paste an image link, or a copied image.</p>

	    	<p>Works with any image from the web and screenshots</p>
	    </div>
    </div>
	)
}
