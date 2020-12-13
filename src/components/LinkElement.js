import React, { useState, useContext, useEffect } from "react"
import { ClickHandler } from './ClickHandler'
import { BlockEditorSlate } from './BlockEditorSlate'

import moment from 'moment'

import AppContext from "./AppContext"

export const LinkElement = props => {
  const appContext = useContext(AppContext)

  const [hoverTimer, setHoverTimer] = useState(null)
  const [showLinkPreview, setShowLinkPreview] = useState(false)
  const [isClicked, setIsClicked] = useState(false)

  const handleClick = () => {
    // location.href = props.url
    setIsClicked(true)
    setShowLinkPreview(true)
  }

  const handleOutsideClick = () => {
    setIsClicked(false)
    setShowLinkPreview(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setShowLinkPreview(false)
    }
  }

  const handleMouseEnter = () => {
    if (!showLinkPreview) {
      clearTimeout(hoverTimer)
      const timer = setTimeout(() => { setShowLinkPreview(true) }, 750)
      setHoverTimer(timer)
    }
  }

  const handleMouseLeave = () => {
    if (!isClicked) {
      clearTimeout(hoverTimer)
      setShowLinkPreview(false)
    }
  }

  const buildLinkPreview = () => {
    if (!showLinkPreview) return ''

    return(
      <ClickHandler 
        close={() => { handleOutsideClick() }}
      >
        <LinkPreview
          {...props}
          userIsAuthor={props.userIsAuthor}
          disableLinkFetching={props.disableLinkFetching}
          url={props.url}
        />
      </ClickHandler>
    )
  }

  if (props.readOnly) {
    return(
      <a
        href={props.url}
        target="_blank"
        >{props.children}</a>
    )
  }


  return(
    <span
      onMouseLeave={handleMouseLeave}
    >
      <span
        style={{position: 'relative'}}
        className="link-editable"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onMouseEnter={handleMouseEnter}
        {...props.attributes} 
      >
        {props.children}
      </span>
      { buildLinkPreview() }
    </span>
  );    
}

const LinkPreview = (props) => { 
  const appContext = useContext(AppContext)
  const [isFetching, setIsFetching] = useState(false)

  const spaceRegex = () => {
    return /(\/spaces\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/
  }

  const activityRegex = () => {
    return /(\/activities\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/
  }

  const isActivity = () => {
    const re = activityRegex()
    return !!re.exec(props.url)
  }

  const getActivityId = () => {
    const re = activityRegex()
    const m = re.exec(props.url)
    if (!m) return null

    const parts = m[0].split('/')
    return parts[parts.length-1]
  }

  const isSpace = () => {
    const re = spaceRegex()
    return !!re.exec(props.url)
  }

  const getSpaceId = () => {
    const re = spaceRegex()
    const m = re.exec(props.url)
    if (!m) return null

    const parts = m[0].split('/')
    return parts[parts.length-1]
  }

  const buildUpdatedAtTimestamp = (space) => {
    const updatedAt = moment(space.updated_at);
    return updatedAt.calendar();
  }

  const buildSpacePreview = (space) => {
    if (space) {
      return(
        <div>
          <div className="mb-0">
            <a
            href={props.url}
            // target="_blank"
            >{space.title|| 'Go to link'}</a>
          </div>
          <div className="page-timestamp">
            last updated { buildUpdatedAtTimestamp(space) } 
          </div>
          <div className="link-preview-body">
            <BlockEditorSlate 
              placeholder={props.userIsAuthor === false ? '' : "✏️ Add notes or link to existing thoughts"}
              content_type="Space"
              content={space}
              value={space.json_body}
              previewUrl={props.url}
              readOnly={props.userIsAuthor === false}
              disableBlockControls={true}
            />
          </div>
        </div>
      )
    }

    return(
      <div>
        <div className="mb-1">
          <a
          href={props.url}
          // target="_blank"
          >{space.title|| 'Go to link'} 
          </a>
        </div>
      </div>
    )
            // <i className="fa fa-sm fa-external-link" style={{fontSize: '0.7em'}}></i>

          // { space.text_body.length > 500 ? `${space.text_body.slice(0,500)}...` : space.text_body }
  }

  const buildActivityPreview = (activity) => { 
    let domain = ''
    if (activity.url) {
      const domainRe = /^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/
      const m = domainRe.exec(activity.url)
      domain = m[1]
    }

          // <i className="fa fa-sm fa-external-link" style={{fontSize: '0.7em'}}></i>
    return(
      <div>
        <a
        href={props.url}
        // target="_blank"
        >{activity.title} 
        </a>
        <div className="activity-url mb-1" style={{fontSize: '0.9em'}}>{ domain }</div>
        <div>
          { activity.text_body.length > 250 ? `${activity.text_body.slice(0,250)}...` : activity.text_body }
        </div>
      </div>
    )
  }

  const buildPreview = () => {
    if (appContext.pagePreviews[props.url]) {
      const obj = appContext.pagePreviews[props.url]

      if (isSpace()) {
        return buildSpacePreview(obj)
      }
      if (isActivity()) {
        return buildActivityPreview(obj)
      }
    }

    return(
      <a
        href={props.url}
        target="_blank"
        style={{fontSize: '0.8em'}}
        >{props.url} <i className="fa fa-sm fa-external-link" style={{fontSize: '0.7em'}}></i></a>
    )
  }


  useEffect(() => {
    // if (props.readOnly) return

    if (props.disableLinkFetching || appContext.pagePreviews[props.url] || isFetching) return 

    setIsFetching(true)

    if (isSpace() && getSpaceId()) {
      fetch(`/api/v1/spaces/${getSpaceId()}/`, {
        method: 'GET',
        headers: {
          'Content-type': 'application/json'
        }
      })
      .then(res => {
        if (!res.ok) throw new Error(res.status)
        else return res.json()
      })
      .then(data => {
        appContext.updatePagePreviews(props.url, data)
        setIsFetching(false)
      })
      .catch(error => {
        console.log('error: ' + error)
      })
    }

    if (isActivity() && getActivityId()) {
      fetch(`/api/v1/activities/${getActivityId()}/`, {
        method: 'GET',
        headers: {
          'Content-type': 'application/json'
        }
      })
      .then(res => {
        if (!res.ok) throw new Error(res.status)
        else return res.json()
      })
      .then(data => {
        appContext.updatePagePreviews(props.url, data)
        setIsFetching(false)
      })
      .catch(error => {
        console.log('error: ' + error)
      })
    }

  })

  return(
    <div
      className="dropdown link-preview"
      contentEditable={false}
      style={{fontSize: '16px', fontWeight: '400'}}
    >
      { buildPreview() }
    </div>
  )
}

