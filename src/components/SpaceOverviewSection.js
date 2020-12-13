import React, { useState, useEffect } from 'react'
import { BlockEditorSlate } from "./BlockEditorSlate"

export const SpaceOverviewSection = (props) => {
  const [showOverview, setShowOverview] = useState(true)

  useEffect(() => {
    if (props.isNewSpace) return
  })

  const uniqueById = (content) => {
    return [...content.reduce((a,c)=>{
      a.set(c.id, c);
      return a;
    }, new Map()).values()];
  }

  const buildHideOverviewBtn = () => {
    if (showOverview) {
      return(
        <span 
          className="right-side link pointer" 
          style={{marginTop: '0.5em', marginRight: '0.5em', marginBottom: '0.5em'}}
          onClick={() => setShowOverview(false)}
        >
          Hide
        </span>
      )
    }

    return(
      <span 
        className="right-side link pointer" 
        style={{marginTop: '0.5em', marginRight: '0.5em', marginBottom: '0.5em'}}
        onClick={() => setShowOverview(true)}
      >
        Show
      </span>
    )
  }

  const buildLoadingGIF = () => {
    return(
      <div style={{width: '100%'}} >
        <img
          src="https://storage.googleapis.com/rumin-gcs-bucket/static/spinner.gif"
          width="100"
          height="100"
          style={{margin: 'auto', display: 'block'}} 
        />
      </div>
    )
  }

  const buildSpaceEditor = () => {
    return(
      <div className={`${ showOverview ? '' : 'hidden' }`}>
        <BlockEditorSlate 
          placeholder="Content for this page."
          content={props.space}
          content_type="Space"
          isNewSpace={props.isNewSpace}
          value={props.json_body}
          userIsAuthor={props.userIsAuthor}
          readOnly={!props.userIsAuthor && !props.isNewSpace}
          setExportHTMLClick={props.handleHTMLExportClick}
          updateSpace={props.updateSpace}
          updateActivity={props.updateActivity}
          updateTimestamp={props.updateTimestamp}
        />
      </div>
    )
  }

  const buildOverviewSection = () => {
        //<div className="flex flex-center small-text">
//          <span>Overview</span>
//          { buildHideOverviewBtn() }
//        </div>
    return(
      <div className={`overview-section`}>
        <div 
          // className="page-card overview-card" 
          className="" 
          style={{padding: '0',  marginBottom: '2em'}}
        >
          { buildSpaceEditor() }
        </div>
      </div>
    )
  }

  if (props.accessDenied) {
    return(
      <div style={{padding: '2em', textAlign: 'center'}}>
        <p>You do not have the permission to access this page. </p>
        <p>
          Trying contacting the author to request for access.
        </p>
      </div>
    )
  }

  if (!props.isNewSpace && !props.isDataFetched) return buildLoadingGIF()

  if (!props.userIsAuthor && !props.isNewSpace) {
    return(
      <div style={{marginBottom: '1em'}}>
      { buildSpaceEditor() }
    </div>
    )
  }

  return(
    <div>
      { buildOverviewSection() }
    </div>
  )
}