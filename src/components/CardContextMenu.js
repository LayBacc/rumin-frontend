import React, { useState, useContext, useEffect, useRef } from "react"
import { SpaceASResult } from './SpaceASResult'
import { disableBodyScroll, enableBodyScroll, clearAllBodyScrollLocks } from 'body-scroll-lock'

import AppContext from './AppContext'

export const CardContextMenu = (props) => {
  const ref = useRef()
  const appContext = useContext(AppContext)
  const [dropdownTop, setDropdownTop] = useState(-10000)
  const [dropdownLeft, setDropdownLeft] = useState(0)

  const [currMenu, setCurrMenu] = useState('main')

  useEffect(() => {
    setDropdownLeft(props.clickCoords.x)
    setDropdownTop(props.clickCoords.y)
  })

  const handleMoveToClick = (e) => {
  	e.preventDefault()
  	e.stopPropagation()

  	setCurrMenu('move-to')
  }

  const handleAddToClick = (e) => {
    e.preventDefault()
    e.stopPropagation()

    setCurrMenu('add-to')
  }

  const buildMainMenu = () => {
    // let moveToAction = ''
    // if (props.content.content_type === 'Space') {
    const moveToAction = (
      <div 
        className="dropdown-action"
        onClick={handleMoveToClick}
      >
        <i className="fa fa-share mr-1"></i> Move to
      </div>
    )
    // }

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
	      { moveToAction }
        <div 
          className="dropdown-action"
          onClick={handleAddToClick}
        >
          <i className="fa fa-tags mr-1"></i> Add to
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
    		/>
    	)
    case 'add-to':
      return(
        <MoveToMenu 
          {...props}
          placeholder="Add to..."
          copy={true}
          dropdownTop={dropdownTop}
          dropdownLeft={dropdownLeft}
        />
      )
    default:
      return buildMainMenu()
  }
}

export const MoveToMenu = (props) => {
  const ref = useRef()
  const inputRef = useRef()
  const appContext = useContext(AppContext)

  const [results, setResults] = useState([])
  const [query, setQuery] = useState('')
  const [typingTimer, setTypingTimer] = useState(null)
  const [isFetching, setIsFetching] = useState(false)
  const [noResults, setNoResults] = useState(false)
  const [pageNum, setPageNum] = useState(1)
  
  const [activeIndex, setActiveIndex] = useState(-1)


  const handleComponentUnmount = () => {
  	clearAllBodyScrollLocks()
  } 

  // componentDidMount
  useEffect(() => {
  	disableBodyScroll(ref.current)
  }, [])

  const handleMoveMany = (space) => {
    const url = `/api/v1/spaces/${space.id}/collection_data/`
    let body = { space_ids: props.content.map(s => s.id) }

    fetch(url, {
      method: 'POST',
      headers: {
        'Content-type': 'application/json'
      },
      body: JSON.stringify(body)
    })
    .then(res => {
      if (!res.ok) {
        if (res.status === 401) {

        }
        throw new Error(res.status)
      } 
      else return res.json()
    })
    .then(data => {
      // if (!props.copy && props.removeFromCollection) {
      //   props.removeFromCollection(props.content, true) // update UX wtihout API calls to server
      // }

      if (props.onSuccess) {
        props.onSuccess(space)
      }

      props.closeDropdown()
    })
    .catch(error => {
      console.log('error: ' + error)
    }) 
  }

  const handleSpaceResultClick = (e, space) => {
    if (props.handleSpaceResultClick) {
      props.handleSpaceResultClick(e, space)
      return
    }

    // add multiple Spaces at the same time
    if (props.many === true) {
      handleMoveMany(space)
      return
    }

    const url = `/api/v1/spaces/${props.content.id}/move/` //props.content.content_type === 'Space' ? `/api/v1/spaces/${props.content.id}/move/` : `/api/v1/activities/${props.content.id}/move/`
  	
    let body = { new_parent_id: space ? space.id : 'root' }
    if (props.copy === true) {
      body.copy = true
    }

    // console.log('body in handleSpaceResultClick in MoveToMenu', body, space)

    fetch(url, {
      method: 'POST',
      headers: {
        'Content-type': 'application/json'
      },
      body: JSON.stringify(body)
    })
    .then(res => {
      if (!res.ok) {
        if (res.status === 401) {

        }
        throw new Error(res.status)
      } 
      else return res.json()
    })
    .then(data => {
      if (!props.copy && props.removeFromCollection) {
        props.removeFromCollection(props.content, true) // update UX wtihout API calls to server
      }

      if (props.onSuccess) {
        props.onSuccess(space)
      }

    	props.closeDropdown()
    })
    .catch(error => {
      console.log('error: ' + error)
    }) 
  }

  const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        props.closeDropdown()
      }
  }

  const fetchAutosuggest = () => {
    if (query.length < 2) return

    setIsFetching(true)

    fetch(`/api/v1/search?q=${query}&lite=true&page=${pageNum}`, {
      method: 'GET',
      headers: {
        'Content-type': 'application/json'
      }
    })
    .then(res => {
      if (!res.ok) {
        if (res.status === 401) {
          this.setState({ accessDenied: true })
        }
        throw new Error(res.status)
      } 
      else return res.json()
    })
    .then(data => {
      if (data.results.length === 0) {
        setNoResults(true)
        setIsFetching(false)
        return
      }

      if (pageNum === 1) {
        setResults(data.results)
      }
      else {
        setResults([...results, ...data.results])
      }

      setIsFetching(false)
      setPageNum(pageNum+1)
    })
    .catch(error => {
      console.log('error: ' + error)
    }) 
  }

  const handleInputKeyUp = (e) => {
    clearTimeout(typingTimer)
    const timer = setTimeout(() => { fetchAutosuggest() }, 750)
    setTypingTimer(timer)

    // go up and down with arrow keys
    if (e.key === 'ArrowDown') {
      setActiveIndex(activeIndex+1)
    }

    if (e.key === 'ArrowUp') {
      setActiveIndex(activeIndex-1)
    }
  }

  const handleQueryChange = (e) => {
    setQuery(e.target.value)
    
    setPageNum(1)
    setResults([])
    setActiveIndex(-1)
  }

  const handleResultMouseOver = (index) => {
    setActiveIndex(index)
  }

  const handleScroll = (e) => {
    const remainingScrollHeight = e.target.scrollHeight - e.target.scrollTop
    const bottom = (remainingScrollHeight - e.target.clientHeight) < 50

    if (!bottom || isFetching || results.length === 0) return 
    fetchAutosuggest()
  }

  const handleResultKeyUp = (e, obj, objType) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(activeIndex+1)
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault()
      
      if (activeIndex === 0) {
        inputRef.current.focus()
      }

      setActiveIndex(activeIndex-1)
    }
  }

  const buildResults = () => {
    if (query.length === 0 && !props.disableTopLevel) {
      return(
        <div
          className="section"
        >
          <div className="as-results">
            <div
              tabindex="0"
              key="space_suggestion_root"
              className="as-result"
              onClick={(e) => handleSpaceResultClick(e, null)}
              // onMouseOver={(e) => handleResultMouseOver(e, 0)}
              onKeyUp={handleResultKeyUp}
            >
              Move to top-level pages
            </div>
          </div>
        </div> 
      ) 
    }

    if (query.length < 2) {
      return ''
    } 

    // TOOD - add an option
    // index the 

    // if (props.content.content_type === 'Space') {
    // }

    const asResults = results.map((result, index) => {      
      return(
        <SpaceASResult
          key={`as_reuslt_${result.id}`}
          index={index}
          activeIndex={activeIndex}
          space={result}
          handleClick={(e) => handleSpaceResultClick(e, result)}
          handleResultMouseOver={handleResultMouseOver}
          handleResultKeyUp={handleResultKeyUp}
        />
      )
    })

    return(
      <div
        className="section"
      >
        <div className="as-results" style={{overflowY: 'scroll', overflowX: 'hidden', height: '225px'}} onScroll={handleScroll}>
          { asResults }
        </div>
      </div>
    )
  }

  const buildLoadingGIF = () => {
    if (query.length < 2) return ''
    
    let message = ''
    if (results.length === 0 && isFetching) {
      message = ''
    } 

    return(
      <div style={{width: '100%', marginTop: '-6em'}} >
        { message }
        <img
          src="https://storage.googleapis.com/rumin-gcs-bucket/static/spinner.gif"
          width="100"
          height="100"
          style={{margin: 'auto', display: 'block'}} 
        />
      </div>
    )
  }

  const buildLoadingMoreIndicator = () => {
    if (isFetching) {
      return buildLoadingGIF()
    }

    if (noResults === true) {
      return('')
    }
  }

  let style = { zIndex: `${appContext.modalSpace ? '6' : '2'}` }

  // console.log('props.dropdownTop in MoveToMenu', props.dropdownTop, props.dropdownLeft)

  if (props.dropdownTop && props.dropdownLeft) {
    Object.assign(style, { top: `${props.dropdownTop}px`, left: `${props.dropdownLeft}px` })
  }

  return(
    <div
      ref={ref}
      className="context-menu-dropdown dropdown"
      style={style}
    >
      <div className="input-container">
        <input 
          ref={inputRef}
          autoFocus
          className="move-search" 
          placeholder={props.placeholder || 'Search'}
          value={query}
          onChange={handleQueryChange}
          onKeyDown={handleKeyDown} 
          onKeyUp={handleInputKeyUp}
          onFocus={() => setActiveIndex(-1)}
        />
      </div>
      { buildResults() }
      { buildLoadingMoreIndicator() }
    </div>
  )
}
