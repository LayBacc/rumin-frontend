import React, { useRef } from "react"

export const SpaceASResult = (props) => {
  const ref = useRef()

  const buildTextBody = () => {
    if (!props.space.text_body) return ''

    return(
      <div style={{padding: '8px', fontSize: '0.9em'}}>
        { props.space.text_body.slice(0,300) }
      </div>
    )
  }

  if (props.index === props.activeIndex) {
    if (ref.current) {
      ref.current.focus()
    }
  }

  return (
    <div
      ref={ref}
      tabindex="0"
      key={`space_suggestion_${props.space.id}`}
      className="as-result"
      onClick={(e) => props.handleClick(e, props.space)}
      onMouseOver={(e) => props.handleResultMouseOver(e, props.index)}
      onKeyUp={(e) => props.handleResultKeyUp(e, props.space, 'Space')}
    >
      <div>{ props.space.title || 'Untitled' }</div>
      
      { buildTextBody() }      
    </div>
  )
}