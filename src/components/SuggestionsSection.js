import React, { useState, useEffect } from 'react'
import { SuggestionCard } from './SuggestionCard'

export const SuggestionsSection = (props) => {
  const [contentSuggestions, setContentSuggestions] = useState([])
  const [hasFetchedContentSuggestions, setHasFetchedContentSuggestions] = useState(false)
  const [isFetchingContentSuggestions, setIsFetchingContentSuggestions] = useState(false)

  const fetchContentSuggestions = () => {
    setIsFetchingContentSuggestions(true)

    fetch(`/api/v1/spaces/${props.space.id}/suggestions`, {
      method: 'GET',
      headers: {
        'Content-type': 'application/json'
      }
    })
    .then(res => {
      if (!res.ok) {
        setHasFetchedContentSuggestions(true)
        setIsFetchingContentSuggestions(false)
        throw new Error(res.status)
      }
      else return res.json()
    })
    .then(data => {
      setContentSuggestions(data)
      setHasFetchedContentSuggestions(true)
      setIsFetchingContentSuggestions(false)
    })
    .catch(error => {
      console.log('error: ' + error)
    })
  }

  useEffect(() => {
    if (props.space && !hasFetchedContentSuggestions && !isFetchingContentSuggestions) {
      fetchContentSuggestions()
    }    
  })

  useEffect(() => {
    // fetch new suggestions, on title change
    fetch(`/api/v1/spaces/${props.space.id}/suggestions`, {
      method: 'GET',
      headers: {
        'Content-type': 'application/json'
      }
    })
    .then(res => {
      if (!res.ok) {
        throw new Error(res.status)
      }
      else return res.json()
    })
    .then(data => {
      setContentSuggestions(uniqueById([...contentSuggestions, ...data]))
    })
    .catch(error => {
      console.log('error: ' + error)
    })
  }, [props.space.title])

  const uniqueById = (content) => {
    return [...content.reduce((a,c)=>{
      a.set(c.id, c);
      return a;
    }, new Map()).values()];
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

  const updateSuggestions = (suggestion, accepted) => {
    const updated = contentSuggestions.map(s => {
      if (s.id !== suggestion.id) return s
      
      const updatedSuggestion = {
        ...s,
        accepted: accepted
      }
      return updatedSuggestion
    })
    setContentSuggestions(updated)

    // if accepted, add to the space.collection_data on client side
    if (accepted === 1 && suggestion.suggested_obj) {
      let newSpace = Object.assign({}, props.space)
      newSpace.collection_data = [...newSpace.collection_data, suggestion.suggested_obj]
      props.updateSpace(newSpace)
    }
  }

  const getPendingSuggestions = () => {
    return contentSuggestions.filter(s => s.accepted === 0)
  }

  const buildPendingSuggestions = () => {
    const suggestions = getPendingSuggestions()
    if (suggestions.length === 0) {
      return(
        <div className="gray-text">
          <p>
            No more suggestions for this page for now.
          </p>
        </div>
      )
    }

    return suggestions.map(suggestion => {
      return(
        <SuggestionCard 
          suggestion={suggestion}
          updateSuggestions={updateSuggestions}
        />
      )
    })
  }

  const buildPendingSuggestionsSection = () => {
    if (isFetchingContentSuggestions) {
      return(
        <div className="mt-1">
          <small>💡</small> Checking for AI suggestions...
        </div>
      )
    }
    // if (getPendingSuggestions().length === 0) return ''

        // <h3 style={{marginBottom: '0.5em'}}><small>💡</small> AI suggestions</h3>
    return(
      <div className="mt-1">
        { buildPendingSuggestions() }
      </div>
    )
  }


  return(
    <div>
      
      { buildPendingSuggestionsSection() }
    </div>
  )
}