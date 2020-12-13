import React, { useState, useEffect } from "react";

export const CollectionsDropdown = (props) => {
	const [spaceSuggestions, setSpaceSuggestions] = useState([]) // results
  const [query, setQuery] = useState('')
  const [selectedSpaces, setSelectedSpaces] = useState([])
  const [hasStoragePermission, setHasStoragePermission] = useState(false)

  const [queryTimer, setQueryTimer] = useState(null)
  // const [showDropdown, setShowDropdown] = useState(false)

  const updateSelectedSpaces = (selected) => {
    setSelectedSpaces(selected)
    window.selectedSpaces = selected

    if (hasStoragePermission) {
      chrome.storage.local.set({ selectedSpaces: selected })
    }
  }

  const handleSuggestionClick = (space) => {
    const updatedSelection = [...selectedSpaces, space]
    updateSelectedSpaces(updatedSelection)
    setQuery('')
  }

  const handleRemoveToken = (space) => {
    const updatedSelection = selectedSpaces.filter(s => s.id !== space.id)
    updateSelectedSpaces(updatedSelection)
  }

  const fetchAutosuggest = () => {
    if (query.length < 2) return
    
    fetch(`/api/v1/search/?q=${query}&lite=true`, {
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
      setSpaceSuggestions(data.results)
    })
    .catch(error => {
      console.log('error: ' + error)
    })
  }

  const handleQueryKeyDown = (e) => {
    if (e.key === 'Backspace' && query.length === 0) {
      handleRemoveToken(selectedSpaces[selectedSpaces.length-1])
    }

    if (e.key === 'Escape') {
      props.closeDropdown()
    }
  }

  const handleQueryKeyUp = () => {
    clearTimeout(queryTimer)
    const timer = setTimeout(() => { fetchAutosuggest() }, 750)
    setQueryTimer(timer)
  }

  const handleNewSpaceClick = () => {
    const body = {
      title: query
    }

    // fetch(`https://getrumin.com/api/v1/spaces/`, {
    //   method: 'POST',
    //   headers: {
    //     'Content-type': 'application/json'
    //   },
    //   body: JSON.stringify(body)
    // })
    // .then(res => {
    //   if (!res.ok) throw new Error(res.status)
    //   else return res.json()
    // })
    // .then(space => {
    //   // success
    //   const updatedSelection = [...selectedSpaces, space]
    //   updateSelectedSpaces(updatedSelection)
    //   setQuery('')
    // })
    // .catch(error => {
    //   console.log('error: ' + error)
    // }) 
  }

  const buildResults = () => {
    if (query.length < 2) return ''

    return spaceSuggestions.map(space => {
      return(
        <SuggestionResult 
          key={`suggestion_${space.id}`}
          space={space}
          handleSuggestionClick={handleSuggestionClick} 
        />
      );
    });
  }

  const buildSelectedTokens = () => {
    return selectedSpaces.map(space => {
      return(
        <div className="token">
        	<span>
	          { space.title } 
	        </span>
          <div 
            className="remove-btn"
            onClick={() => handleRemoveToken(space)}
          >
            <svg viewBox="0 0 8 8" className="closeThick" style={{width: '8px', height: '8px', display: 'block', fill: 'inherit', flexShrink: 0, backfaceVisibility: 'hidden', opacity: 0.5}}><polygon points="8 1.01818182 6.98181818 0 4 2.98181818 1.01818182 0 0 1.01818182 2.98181818 4 0 6.98181818 1.01818182 8 4 5.01818182 6.98181818 8 8 6.98181818 5.01818182 4"></polygon></svg>
          </div>
        </div>
      )
    })
  }

  const buildASResultsSection = () => {
    if (query.length < 2) return ''

    return(
    	<div className="collections-dropdown">
	      <div className="section results">
	        { buildResults() }
	      </div>
	    </div>
    )
	        // { buildCreateCollection() }
  }

  // const buildCreateCollection = () => {
  //   if (query.length < 1) return ''

  //   return(
  //     <div 
  //       role="button"
  //       className="as-result"
  //       onClick={handleNewSpaceClick}
  //     >
  //       + New page "{ query }"
  //     </div>
  //   )
  // }

  return(
  	<div className="collections-dropdown-container">
      <div 
      	className="field-label mb-1"
      >
      	Filter for content connected to all of the following
      </div>

      <div className="collections-selected">
        { buildSelectedTokens() }

        <div className="collections-search-container">
          <input 
            className="collections-search" 
            placeholder="Type to search" 
            value={query}
            onChange={(e) => setQuery(e.target.value)} 
            onKeyDown={handleQueryKeyDown}
            onKeyUp={handleQueryKeyUp}
          />
        </div>
      </div>
      
	    { buildASResultsSection() }
    </div>
  );
}

const SuggestionResult = (props) => {
  const handleClick = () => {
    props.handleSuggestionClick(props.space)
  }

  return(
    <div 
      className="as-result"
      onClick={handleClick}
    >
      { props.space.title }
    </div>
  )
}

const SuggestedLinkToken = (props) => {
  return(
    <div className="token">
      { props.space.title }
      <div 
        className="remove-btn"
      >
        <svg viewBox="0 0 8 8" className="closeThick" style={{width: '8px', height: '8px', display: 'block', fill: '#ffffff', flexShrink: 0, backfaceVisibility: 'hidden', opacity: 0.5}}><polygon points="8 1.01818182 6.98181818 0 4 2.98181818 1.01818182 0 0 1.01818182 2.98181818 4 0 6.98181818 1.01818182 8 4 5.01818182 6.98181818 8 8 6.98181818 5.01818182 4"></polygon></svg>
      </div>
    </div>
  )
}
