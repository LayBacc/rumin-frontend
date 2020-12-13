import React, { useState, useContext, useEffect } from 'react'

export const SuggestionCard = (props) => {
	// 1 is accept, -1 is dismiss
	const updateAccepted = (accepted) => {
		fetch(`/api/v1/suggestions/${props.suggestion.id}/`, {
      method: 'PATCH',
      headers: {
        'Content-type': 'application/json'
      },
      body: JSON.stringify({ accepted: accepted })
    })
    .then(res => {
      if (!res.ok) throw new Error(res.status)
      else return res.json()
    })
    .then(data => {
      props.updateSuggestions(props.suggestion, accepted)
    })
    .catch(error => {
      console.log('error: ' + error)
    })
	}

	const handleAddClick = () => {
		updateAccepted(1)
	}

	const handleDismissClick = () => {
		updateAccepted(-1)
	}

  const buildAcceptControls = () => {
  	if (props.suggestion.accepted) return ''

  	return(
	    <div className="suggestion-controls">
	      <div 
	        className="inline-block accept-btn mr-1"
	        onClick={handleAddClick}
	      >
	        <i className="fa fa-check" style={{color: '#2fe23e'}}></i> Add as sub-page
	      </div>
	      <div 
	        className="inline-block accept-btn"
	        onClick={handleDismissClick}
	      >
	        <i className="fa fa-times" style={{color: '#ea7e72'}}></i> Dismiss
	      </div>
	    </div>
  	)
  }

  if (!props.suggestion.custom_fields) {
    return(
      <div className="page-card">
        { props.suggestion.short_description }

        { buildAcceptControls() }
      </div>
    )
  }

  const buildTitle = () => {
    if (props.suggestion.suggested_obj) {
      const content = props.suggestion.suggested_obj
      const url = props.suggestion.suggested_obj.content_type === 'Space' ? `/spaces/${props.suggestion.suggested_obj.id}` : `/activities/${props.suggestion.suggested_obj.id}`

      return(
        <div className="mb-1">
          <div>
            <h4 className="mt-0 mb-0">
              <a href={url}>{ content.title }</a>
            </h4>
          </div>
        </div>
      )
    }

    const title = props.suggestion.custom_fields.entity_title || ''
    const subtitle = props.suggestion.custom_fields.entity_subtitle || ''

    return(
      <div className="mb-1">
        <div>
          <h4 className="mt-0 mb-0">{ title }</h4>
        </div>
        <div>
          <small>
            { subtitle }
          </small>
        </div>
      </div>
    )
  }

  const buildDescription = () => {
    if (props.suggestion.suggested_obj) {
      const content = props.suggestion.suggested_obj

      return(
        <div className="mb-1" style={{    whiteSpace: 'pre-wrap'}}>
          { (content.text_body && content.text_body.slice(0, 300)) || '' }
        </div>
      )
    }

    return(
      <div className="mb-1">
        { props.suggestion.short_description }
      </div>
    )
  }

  const buildFields = () => {
    const excludedFields = ['entity_title', 'entity_subtitle', 'entity_description', 'people_also_search_for', 'related_people', 'wikipedia_url', 'twitter_url', 'youtube_url', 'official site_url', 'official_site_url', 'linkedin_url']
    const fieldNames = Object.keys(props.suggestion.custom_fields).filter(k => !excludedFields.includes(k))

      const fields = fieldNames.map(fieldName => { 
      const val = props.suggestion.custom_fields[fieldName]

      if (val.split(':').length > 1) {
        const [key, value] = val.split(':')

        return(
          <div className="field" style={{marginBottom: '0.5em'}}>
            <span style={{fontWeight: '600'}}>{ key }: </span>
            <span>{ value }</span>
          </div>
        )
      }

      return(
        <div>
          { val }
        </div>
      )
    })

    return(
      <div className="mb-1">
        { fields }
      </div>
    )
  }

  return(
    <div className="page-card">
      { buildTitle() }

      { buildDescription() }

      { buildFields() }

      { buildAcceptControls() }
    </div>
  )
}
