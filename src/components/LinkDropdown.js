import React, { useState, useEffect, useRef, useContext } from "react"
import { CapturedContentASResult } from './CapturedContentASResult'
import { SpaceASResult } from './SpaceASResult'
import AppContext from './AppContext'
import { disableBodyScroll, enableBodyScroll, clearAllBodyScrollLocks } from 'body-scroll-lock'

export const LinkDropdown = (props) => {
  const ref = useRef()
  const inputRef = useRef()
  const appContext = useContext(AppContext)

  const [results, setResults] = useState([])
  const [query, setQuery] = useState('')
  const [typingTimer, setTypingTimer] = useState(null)
  const [isFetching, setIsFetching] = useState(false)
  const [noResults, setNoResults] = useState(false)
  const [pageNum, setPageNum] = useState(1)
  const [dropdownTop, setDropdownTop] = useState(-10000)
  const [dropdownLeft, setDropdownLeft] = useState(0)
  const [isDropdownTopSet, setIsDropdownTopSet] = useState(false)

  const [activeIndex, setActiveIndex] = useState(-1)

  useEffect(() => {
    const el = ref.current
    if (!el || !props.domRange || isDropdownTopSet === true) return

    const rect = props.domRange.getBoundingClientRect()
    
    let left = rect.left + window.pageXOffset - el.offsetWidth / 2 + rect.width / 2
    if (left < 15) {
      left = 15
    }

    let top = rect.top + window.pageYOffset - el.offsetHeight + 25
    if (top + 350 > window.innerHeight) {
      top -= (top + 350 - window.innerHeight)
    }
    setDropdownTop(top) // - 150)
    setDropdownLeft(left)


    setIsDropdownTopSet(true)    
    // setDropdownLeft(rect.left + window.pageXOffset - el.offsetWidth/4)
    // el.style.top = `${rect.top + window.pageYOffset - el.offsetHeight - 100}px`
    // el.style.left = `${rect.left + window.pageXOffset - el.offsetWidth}`

    disableBodyScroll(ref.current)
  }, [])

  const handleEnter = () => {
    if (query.startsWith('http://') || query.startsWith('https://') || query.startsWith('/') || query.startsWith('mailto:')) {
      props.linkUrl(query)
    }
    else {
      props.linkTitle(query)
    }
    props.closeDropdown()
  }

  const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        props.closeDropdown()
      }

      if (e.key === 'Enter') {
        e.preventDefault()

        handleEnter()
      }
  }

  const fetchAutosuggest = () => {
    if (query.length < 2) return

    setIsFetching(true)

    fetch(`/api/v1/search?q=${query}&is_as=true&page=${pageNum}`, {
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

  const linkUrl = (url, label) => {
    props.linkUrl(url, label)
    props.closeDropdown()
  }

  const handleActivityResultClick = (e, activity) => { 
    props.linkUrl(`/activities/${activity.id}`, activity.title)
    props.closeDropdown()
  }

  const linkToSpace = (space) => {
    props.linkUrl(`/spaces/${space.id}`, space.title)
  }

  const handleSpaceResultClick = (e, space) => {
    linkToSpace(space)
    props.closeDropdown()
  }

  const handleResultMouseOver = (e, index) => {
    setActiveIndex(index)
  }

  // FIXME - ???
  const handleLinkClick = () => {
    props.linkUrl(query)
    props.closeDropdown()
  }

  const handleUnlinkClick = () => {
    props.unlinkUrl()
    props.closeDropdown()
  }

  const handleCreateNewSpaceClick = () => {
    const body = {
      title: query,
      parent_id: props.space ? props.space.id : null
    }

    fetch(`/api/v1/spaces/`, {
      method: 'POST',
      headers: {
        'Content-type': 'application/json'
      },
      body: JSON.stringify(body)
    })
    .then(res => {
      if (!res.ok) throw new Error(res.status)
      else return res.json()
    })
    .then(space => {
      // success
      linkToSpace(space)
      props.closeDropdown()
    })
    .catch(error => {
      console.log('error: ' + error)
    }) 
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

    if (e.key === 'Enter') {
      e.preventDefault()

      if (objType === 'Activity') {
        handleActivityResultClick(e, obj)
      }
      else {
        handleSpaceResultClick(e, obj)
      }
    }
  }

  const buildResults = () => {
    if (query.length < 2) {

      return ''
    } 

    const asResults = results.map((result, index) => {
      const buildContent = {
        Activity: () => {
          return(
            <CapturedContentASResult
              key={`as_reuslt_${result.id}`}
              index={index}
              activeIndex={activeIndex}
              content={result}
              handleResultMouseOver={handleResultMouseOver}
              handleClick={handleActivityResultClick}
              handleResultKeyUp={handleResultKeyUp}
            />
          )
        },
        Space: () => {
          return(
            <SpaceASResult
              key={`as_reuslt_${result.id}`}
              index={index}
              activeIndex={activeIndex}
              space={result}
              handleClick={handleSpaceResultClick}
              handleResultMouseOver={handleResultMouseOver}
              handleResultKeyUp={handleResultKeyUp}
            />
          )
        }
      }[result.content_type]

      return buildContent()
    })

    return(
      <div
        className="section"
      >
        <div className="section-header">
          Matching thoughts
        </div>
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
      message = <div>
        Tip: you can link to (or create) a page by just hitting 'Enter' now
      </div>
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

  const buildCreateNewSpace = () => {
    if (query.length < 2) return ''

    return(
      <div
        className="as-result"
        style={{ marginTop: '0.5em', borderTop: '1px solid #f0f0f0' }}
        onClick={handleCreateNewSpaceClick}
      >
        Create and link to page "{ query }"
      </div>
    )
  }

  const buildNewSearch = () => {
    if (query.length < 2) return ''

    const newTabUrl = `/?q=${query}`

    return(
      <a href={newTabUrl} target="_blank">
        <div className="as-result" style={{ marginTop: '0.5em', borderTop: '1px solid #f0f0f0' }}>
          Search in new tab "{ query }"
        </div>
      </a>
    )
  }

  return(
        // left: `${dropdownLeft}px` 
        // top: query.length < 2 ? `${dropdownTop}px` : `${dropdownTop+300}px`,
    <div
      ref={ref}
      className="link-dropdown"
      style={{
        top: `${dropdownTop}px`,
        left: `${dropdownLeft}px`,
        zIndex: `${appContext.modalSpace ? '6' : '2'}`
      }}
    >
      <div className="link-input">
        <input 
          ref={inputRef}
          autoFocus
          className="link-search" 
          placeholder="Search your thoughts, or paste a link" 
          value={query}
          onChange={handleQueryChange}
          onKeyDown={handleKeyDown} 
          onKeyUp={handleInputKeyUp}
          onFocus={() => setActiveIndex(-1)}
        />
        <div 
          className="link-action"
          onClick={handleLinkClick}
        >
          Link
        </div>
        <div 
          className="link-action"
          onClick={handleUnlinkClick}
        >
          Unlink
        </div>
      </div>
      { buildResults() }
      { buildLoadingMoreIndicator() }
      { buildCreateNewSpace() }
    </div>
  )
      // { buildNewSearch() }
}
