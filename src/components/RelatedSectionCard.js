import React, { useState, useContext, useEffect, useRef } from "react"
import { BlockEditorSlate } from "./BlockEditorSlate"
import { ArchiveAction } from './ListItemAction'
import { CardContextMenu } from './CardContextMenu'
import { ClickHandler } from './ClickHandler'
import AppContext from './AppContext'
import { clearAllBodyScrollLocks } from 'body-scroll-lock';
import moment from 'moment'

import ReactDOM from "react-dom"

const Portal = ({ children }) => {
  return ReactDOM.createPortal(children, document.body)
}

export const DraggableCard = (props) => {
  const appContext = useContext(AppContext)
  const [showDnDHandle, setShowDnDHandle] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isSelected, setIsSelected] = useState(false)

  const [showContextMenu, setShowContextMenu] = useState(false)
  const [contextMenuX, setContextMenuX] = useState(0)
  const [contextMenuY, setContextMenuY] = useState(0)

  const isUnderlined = () => {
    return appContext.underlinedContentId === props.content.id
  }

  const handleKeyDown = (e) => {
    if (!isSelected) return

    console.log('handleKeyDown', e.key)

    if (e.key === 'Delete') {
      props.removeFromCollection(props.content)
    }
  }

  const handleMouseEnter = (e) => {
    setShowDnDHandle(true)
  }

  const handleMouseLeave = (e) => {
    setShowDnDHandle(false) 
  }

  const handleDragStart = (e) => {
    e.stopPropagation()
    appContext.updateDraggedContent(props.content, true)
    setIsDragging(true)
  }

  const handleDragEnd = (e) => {
    appContext.updateDraggedContent(props.content, false)
    appContext.updateUnderlinedContentId('', false);
    setIsDragging(false)
  }

  const handleDragOver = (e) => {
    e.stopPropagation()
    e.preventDefault()

    appContext.updateUnderlinedContentId(props.content.id, true);
  }

  const handleDragLeave = (e) => {
    appContext.updateUnderlinedContentId(props.content.id, false);
  }

  const handleDrop = (e) => {
    if (appContext.draggedContent && appContext.draggedContent.id === props.content.id) return

    props.moveInCollection(appContext.draggedContent, props.content)
    appContext.clearDraggedContent()
  }

  const handleContextMenu = (e) => {
    e.preventDefault()

    setIsSelected(true)

    setContextMenuX(e.pageX)
    setContextMenuY(e.pageY)
    setShowContextMenu(true)

    return false
  }

  const buildDnDHandle = () => {
    if (!showDnDHandle) return ''

    return(
      <div 
        className={`dnd-handle ${isDragging ? 'dragging' : ''}`}
        draggable="true"
        onClick={() => setIsSelected(true)}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onContextMenu={handleContextMenu}
        title="Drag to reorder. Right click for menu"
      >
        <img src="https://storage.googleapis.com/rumin-gcs-bucket/icon-drag.png" />
      </div>
    )
  }

  const closeContextMenu = () => {
    setShowContextMenu(false)
    clearAllBodyScrollLocks()
  }

  const buildContextMenu = () => {
    if (!showContextMenu) return ''

    return(
      <Portal>
        <ClickHandler
          close={closeContextMenu}
        >
          <CardContextMenu
            removeFromCollection={props.removeFromCollection}
            content={props.content}
            closeDropdown={closeContextMenu} 
            clickCoords={{x: contextMenuX, y: contextMenuY}}
          />
        </ClickHandler>
      </Portal>
    )
  }

  if (props.disableDrag) {
    return(
      <div 
        key={`card_${props.content.id}`}
        className="page-card"
      >
        { props.children }
      </div>
    )
  }

  return(
    <ClickHandler close={() => setIsSelected(false)}>
      <div 
        tabIndex="-1"
        className={`page-card-container ${ isUnderlined() ? 'underline' : '' } ${ isSelected ? 'selected' : '' }`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onKeyDown={handleKeyDown}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        droppable="true"
        onDrop={handleDrop}
      >
 
        <div 
          key={`card_${props.content.id}`}
          className="page-card"
        >
          <div>
            { buildContextMenu() }
            { buildDnDHandle() }
          </div>
          { props.children }
        </div>
      </div>
    </ClickHandler>
  )
}

export const SpaceCard = (props) => {
  const [title, setTitle] = useState(props.space.title)
  const [isFetchingCollection, setIsFetchingCollection] = useState(false)
  const [hasFetchedCollection, setHasFetchedCollection] = useState(false)

  useEffect(() => {
    // on props change
    setTitle(props.space.title)
  }, [props.space])

  const updateCollectionSpace = (space) => {
    props.updateCollectionItem(space)
  }

  const handleTitleBlur = () => {
    const body = { title: title }

    fetch(`/api/v1/spaces/${props.space.id}/`, {
      method: 'PATCH',
      headers: {
        'Content-type': 'application/json'
      },
      body: JSON.stringify(body)
    })
    .then(res => {
      if (!res.ok) throw new Error(res.status)
      else return res.json()
    })
    .then(data => {
      updateCollectionSpace(data)
    })
    .catch(error => {
      console.log('error: ' + error)
    })
  }

  const getUrl = () => {
    return `/spaces/${props.space.id}`
  }

  const getCapturedUrl = () => {
    return props.space.custom_fields.url
  }

  const fetchCollectionData = () => {
    setIsFetchingCollection(true)

    fetch(`/api/v1/spaces/${props.space.id}/`, {
      method: 'GET',
      headers: {
        'Content-type': 'application/json'
      }
    }) 
    .then(res => {
      if (!res.ok) {
        if (res.status === 401) {}
        throw new Error(res.status)
      }
      else return res.json()
    })
    .then(data => {
      setIsFetchingCollection(false)
      setHasFetchedCollection(true)

      const space = {
        ...props.space,
        collection: data.collection,
        collection_data: data.collection_data
      }
      updateCollectionSpace(space)
    })
    .catch(error => {
    })
  }

  const buildUrl = () => {
    if (!getCapturedUrl()) {
      return ''
    }

    return(
      <div className=""><i className="fa fa-globe gray-text btn-icon"></i><a href={getCapturedUrl()} target="_blank">{props.truncatedUrl || getCapturedUrl()} <i className="fa fa-external-link" style={{fontSize: '0.8em'}}></i></a></div>
    )
  }

  const buildTimestamp = () => {
    const createdAt = moment(props.space.created_at);
    return createdAt.calendar();
  }

  const buildBodyPreview = () => {
    if (!props.space.json_body) return ''

    return(
      <div className="body-preview">
        <BlockEditorSlate
          updateSpace={updateCollectionSpace} 
          content_type={'Space'}
          content={props.space}
          value={props.space.json_body}
          disableBlockControls={true}
          // readOnly={true}
        />
      </div>
    ) 
  }

  const buildCollectionPreview = () => {
    // console.log(props.space.collection_data)
    if (isFetchingCollection) {
      return(
        <div>
          <div className="small-text">Fetching...</div>
        </div>
      )
    }

    if (!props.space.collection_data) {
      return(
        <div>
          <div 
            className="small-text link-btn"
            onClick={fetchCollectionData}
          >
            See collection <i className="fa fa-caret-down"></i>
          </div>
        </div>
      )
    }


    const contentCards = props.space.collection_data.map(content => {
      const url = content.content_type === 'Space' ? `/spaces/${content.id}` : `/activities/${content.id}`
      const bodyPreview = content.text_body && content.text_body.length > 0 ? content.text_body.slice(0, 300) + '...' : ''

      return(
        <div className="card carousel-card padding-default align-top mr-1">
          <div style={{marginBottom: '0.5em'}}>
            <a href={url}>{ content.title }</a>
          </div>
          <div className="">
            { bodyPreview }
          </div>
        </div>
      )
    }) 

    return(
      <div>
        <div className="carousel mb-1">
          { contentCards }
        </div>

        <div>
          <a href={getUrl()}><i className="fa fa-arrow-right"></i> See full collection </a>
        </div>
      </div>
    )
  }

  const getSpaceUrl = () => {
    return `/spaces/${props.space.id}`
  }

  const buildCurrTimeField = () => {
    if (!props.space.custom_fields || !props.space.custom_fields.current_time) return ''
    return(
      <small>
        At { props.space.custom_fields.current_time }
      </small>
    )
  } 

  return(
    <DraggableCard 
      content={props.space}
      moveInCollection={props.moveInCollection}
      removeFromCollection={props.removeFromCollection}
      disableDrag={props.disableDrag}
    >
      <div className="card-header">
        <span className="block-timestamp"><a href={getSpaceUrl()}><small>created { buildTimestamp() }</small></a></span>
      </div>

      <div className="mb-1">
        <input  
          className="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleTitleBlur}
          placeholder="Untitled page"
        />
        <a 
          href={getUrl()} 
        >open</a>
      </div>

      { buildUrl() }

      { buildCurrTimeField() }

      { buildBodyPreview() }

      { buildCollectionPreview() }
    </DraggableCard>
  )
}

export const CapturedSpaceCard = props => {
  const [title, setTitle] = useState(props.space.title)

  useEffect(() => {
    // on props change
    setTitle(props.space.title)
  }, [props.space])

  const getUrl = () => {
    return `/spaces/${props.space.id}`
  }

  const getCapturedUrl = () => {
    return props.space.custom_fields.url
  }

  // const updateCollectionActivity = (activity) => {
  //   props.updateCollectionItem(activity)
  // }

  // const updateActivity = (body) => {
  //   fetch(`/api/v1/activities/${props.space.id}/`, {
  //     method: 'PATCH',
  //     headers: {
  //       'Content-type': 'application/json'
  //     },
  //     body: JSON.stringify(body)
  //   })
  //   .then(res => {
  //     if (!res.ok) throw new Error(res.status)
  //     else return res.json()
  //   })
  //   .then(data => {
  //     updateCollectionActivity(data)
  //   })
  //   .catch(error => {
  //     console.log('error: ' + error)
  //   })
  // }

  // const handleArchive = () => {
  //   const body = { is_archived: true }
  //   updateActivity(body)
  // }

  // const handleTitleBlur = () => {
  //   const body = { title: title }
  //   updateActivity(body)
  // }

  const buildUrl = () => {
    return(
      <div className="activity-url mb-1"><a href={getCapturedUrl()} target="_blank">{props.truncatedUrl || getCapturedUrl()} <i className="fa fa-external-link" style={{fontSize: '0.8em'}}></i></a></div>
    )
  }

  const buildTimestamp = () => {
    const createdAt = moment(props.space.created_at);
    return createdAt.calendar();
  }

  const buildSelection = () => {
    if (!props.space.custom_fields || !props.space.custom_fields.selection) return ''

    return(
      <div className="selection gray-text">
        { props.space.custom_fields.selection }
      </div>
    )
  }

  const buildBodyPreview = () => {
    if (!props.space.json_body) return ''

    return(
      <div className="body-preview">
        <BlockEditorSlate
          // updateActivity={updateCollectionActivity} 
          content_type={'Space'}
          content={props.space}
          value={props.space.json_body}
          disableBlockControls={true}
          // readOnly={true}
        />
      </div>
    ) 
  }

  const getSpaceUrl = () => {
    return `/spaces/${props.space.id}`
  }

  const buildCurrTimeField = () => {
    if (!props.space.custom_fields || !props.space.custom_fields.current_time) return ''
    return(
      <small>
        At { props.space.custom_fields.current_time }
      </small>
    )
  } 

  const buildIcon = () => {
    if (!props.space.custom_fields || !props.space.custom_fields.favicon_url || props.space.custom_fields.favicon_url.startsWith('http://')) return ''
    return <img src={props.space.custom_fields.favicon_url} className="icon" style={{marginRight: '0.5em', width: '20px'}} />
  }

  return(
    <DraggableCard 
      content={props.space}
      moveInCollection={props.moveInCollection}
      removeFromCollection={props.removeFromCollection}
      disableDrag={props.disableDrag}
    >
      <div className="card-header">
        { buildIcon() }
        Web <span className="block-timestamp">&nbsp;· <a href={getSpaceUrl()}><small>created { buildTimestamp() }</small></a></span>
      </div>

      <div className="mb-1">
        <a href={getSpaceUrl()} ><h3>{ title || 'Untitled' }</h3></a>
      </div>

      { buildUrl() }

      { buildCurrTimeField() }

      { buildSelection() }

      { buildBodyPreview() }

      <div className="controls">
        <div className="control">
          <a 
            href={getCapturedUrl()}
            target="_blank"
            className="icon-container"
            title="Open external link"
            style={{'color': '#777'}}
          >
            <i className="fa fa-external-link"></i>
          </a>
        </div>

        { props.removeListResult ? <ArchiveAction handleArchive={handleArchive} /> : '' }
      </div>
    </DraggableCard>
  );
}
