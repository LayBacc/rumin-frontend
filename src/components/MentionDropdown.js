import React, { useState, useEffect, useRef, useContext } from "react"
import { SpaceASResult } from './SpaceASResult'
import AppContext from './AppContext'
import { disableBodyScroll, enableBodyScroll, clearAllBodyScrollLocks } from 'body-scroll-lock'

export const MentionDropdown = (props) => {
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

  const [furthestCursorOffset, setFurthestCursorOffset] = useState(0)
  const [editorCurrPoint, setEditorCurrPoint] = useState(null)

  useEffect(() => {
    const el = ref.current
    if (!el || !props.domRange || isDropdownTopSet === true) return

    const rect = props.domRange.getBoundingClientRect()
    
    let left = rect.left + window.pageXOffset - el.offsetWidth / 2 + rect.width / 2
    if (left < 15) {
      left = 15
    }

    let top = rect.top + window.pageYOffset - el.offsetHeight + 80
    if (top + 200 > window.innerHeight) {
      top -= (top + 200 - window.innerHeight)
    }
    setDropdownTop(top) // - 150)
    setDropdownLeft(left)

    setIsDropdownTopSet(true)    
    // setDropdownLeft(rect.left + window.pageXOffset - el.offsetWidth/4)
    // el.style.top = `${rect.top + window.pageYOffset - el.offsetHeight - 100}px`
    // el.style.left = `${rect.left + window.pageXOffset - el.offsetWidth}`

    // disableBodyScroll(ref.current)
  }, [])

  useEffect(() => {
    if (props.currPoint) {
      setEditorCurrPoint(props.currPoint)

      // selected text
      props.getEditorSelectedText(props.startPoint, props.currPoint)
    }
  }, [props.currPoint])

  // const handleEnter = () => {
  //   if (query.startsWith('http://') || query.startsWith('https://') || query.startsWith('/') || query.startsWith('mailto:')) {
  //     props.linkUrl(query)
  //   }
  //   else {
  //     props.linkTitle(query)
  //   }
  //   props.closeDropdown()
  // }

  const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        props.closeDropdown()
      }

      if (e.key === 'Enter') {
        e.preventDefault()

        handleEnter()
      }
  }

  // const fetchAutosuggest = () => {
  //   if (query.length < 2) return

  //   setIsFetching(true)

  //   fetch(`/api/v1/search?q=${query}&is_as=true&page=${pageNum}`, {
  //     method: 'GET',
  //     headers: {
  //       'Content-type': 'application/json'
  //     }
  //   })
  //   .then(res => {
  //     if (!res.ok) {
  //       if (res.status === 401) {
  //         this.setState({ accessDenied: true })
  //       }
  //       throw new Error(res.status)
  //     } 
  //     else return res.json()
  //   })
  //   .then(data => {
  //     if (data.results.length === 0) {
  //       setNoResults(true)
  //       setIsFetching(false)
  //       return
  //     }

  //     if (pageNum === 1) {
  //       setResults(data.results)
  //     }
  //     else {
  //       setResults([...results, ...data.results])
  //     }

  //     setIsFetching(false)
  //     setPageNum(pageNum+1)
  //   })
  //   .catch(error => {
  //     console.log('error: ' + error)
  //   }) 
  // }

  const handleInputKeyUp = (e) => {
    // clearTimeout(typingTimer)
    // const timer = setTimeout(() => { fetchAutosuggest() }, 750)
    // setTypingTimer(timer)

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

    // fetchAutosuggest()
  }

  const handleResultKeyUp = (e, obj, objType) => {
    // if (e.key === 'ArrowDown') {
    //   e.preventDefault()
    //   setActiveIndex(activeIndex+1)
    // }

    // if (e.key === 'ArrowUp') {
    //   e.preventDefault()
      
    //   if (activeIndex === 0) {
    //     inputRef.current.focus()
    //   }

    //   setActiveIndex(activeIndex-1)
    // }

    // if (e.key === 'Enter') {
    //   e.preventDefault()

    //   if (objType === 'Activity') {
    //     handleActivityResultClick(e, obj)
    //   }
    //   else {
    //     handleSpaceResultClick(e, obj)
    //   }
    // }
  }

  const handleTodayClick = () => {
    const date = new Date()
    props.selectDate(props.startPoint, editorCurrPoint, date)
    props.closeDropdown()
  }

  const getQueryText = () => {
    return props.getEditorSelectedText(props.startPoint, props.currPoint)
  }

  return(
    <div
      ref={ref}
      className="dropdown mention-dropdown"
      style={{
        top: `${dropdownTop}px`,
        left: `${dropdownLeft}px`,
        zIndex: `${appContext.modalSpace ? '6' : '2'}`
      }}
    >
      <div
        className="small-text"
        style={{paddingLeft: '1em', borderBottom: '1px solid #eee', paddingBottom: '6px'}}
      >
        Type to mention a date
      </div>

      <div 
        className="dropdown-action"
        onClick={handleTodayClick}
        // onClick={handleMoveToClick}
      >
        Today
      </div>
      <div 
        className="dropdown-action"
        // onClick={handleMoveToClick}
      >
        Pick a date
      </div>
    </div>
  )
}
