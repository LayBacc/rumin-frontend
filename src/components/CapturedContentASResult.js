import React, { useRef } from "react"

export const CapturedContentASResult = (props) => {
  const ref = useRef()

  const getCapturedUrl = () => { 
    return props.content.custom_fields && props.content.custom_fields.url ? props.content.custom_fields.url : ''
  }

  return(
		<div 
      ref={ref}
      tabindex="0"
      key={`captured_suggestion_${props.content.id}`}
      className="activity-as-result as-result"
      onClick={(e) => props.handleClick(e, props.content)}
      onMouseOver={(e) => props.handleResultMouseOver(e, props.index)}
      onKeyUp={(e) => props.handleResultKeyUp(e, props.content, 'Activity')}
    >
      <h4 className="mt-0" style={{marginBottom: '0.5em'}}>{ props.content.title }</h4>
      <div className="activity-url" style={{marginBottom: '0.5em'}}>{ getCapturedUrl() }</div>
    </div>
  )
}

