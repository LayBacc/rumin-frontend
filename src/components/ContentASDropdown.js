import React, { useState, useEffect, useRef, useContext } from "react"
import { CapturedContentASResult } from './CapturedContentASResult'
import { SpaceASResult } from './SpaceASResult'
import AppContext from './AppContext'

// largely copied from LinkDropdown
export const ContentASDropdown = (props) => {
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

  const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        props.closeDropdown()
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

  const handleActivityResultClick = (e, activity) => { 
    props.selectContent(activity)
    props.closeDropdown()
  }

  const handleSpaceResultClick = (e, space) => {
    props.selectContent(space)
    props.closeDropdown()
  }

  const handleResultMouseOver = (e, index) => {
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
    <div
      className="dropdown as-dropdown"
    >
      <div className="content-input mb-1">
        <input 
          autoFocus
          className="content-search" 
          placeholder="Search" 
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
      // { buildNewSearch() }
}
