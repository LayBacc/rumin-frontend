import React, { useState, useContext, useEffect } from 'react'
import { CapturedContentASResult } from './CapturedContentASResult'
import { SpaceCard } from './RelatedSectionCard'
import { SuggestionCard } from './SuggestionCard'
import { ClickHandler } from './ClickHandler'
import { BlockEditorSlate } from "./BlockEditorSlate"
import { CustomCollectionResults } from './CustomCollectionResults'
import { ResultFilters } from './ResultFilters'
import { CollectionResults } from './CollectionResults'
import { Resizable, ResizeCallback } from 're-resizable'
import { FieldsForm } from './FieldsForm'
import { NewNodeDropdown } from './NewNodeDropdown'
import AppContext from './AppContext'

import queryString from 'query-string'
import uuidv4 from "uuid/v4"

export const PageTabContent = (props) => {
  const [isExpanded, setIsExpanded] = useState(true)
  const [references, setReferences] = useState([])
  const [hasFetchedReferences, setHasFetchedReferences] = useState(false)
  const [isFetchingReferences, setIsFetchingReferences] = useState(false)

  const [urlObj, setUrlObj] = useState(null)
  const [hasFetchedUrlObj, setHasFetchedUrlObj] = useState(false)
  const [isFetchingUrlObj, setIsFetchingUrlObj] = useState(false)

  const appContext = useContext(AppContext)

  const fetchReferences = () => {
    if (hasFetchedReferences || isFetchingReferences) return

    setIsFetchingReferences(true)

    const url = props.space ? `/api/v1/spaces/${props.space.id}/references` : `/api/v1/activities/${props.activity.id}/references`

    fetch(url, {
      method: 'GET',
      headers: {
        'Content-type': 'application/json'
      }
    })
    .then(res => {
      // if (res.status === 401 || res.status === 404) {
      // }
      if (!res.ok) {
        setHasFetchedReferences(true)
       
        throw new Error(res.status)
      }
      else return res.json()
    })
    .then(data => {
      // console.log('references after fetch', data)
      setReferences(data)
      setHasFetchedReferences(true)
      setIsFetchingReferences(false)
    })
    .catch(error => {
      console.log('error: ' + error)
    })
  }

  const encodedActivityUrl = () => {
    return encodeURIComponent(encodeURIComponent(props.activity.url))
  }

  const fetchUrlObj = () => {
    if (hasFetchedUrlObj || isFetchingUrlObj) return

    setIsFetchingUrlObj(true)

    const url = `/api/v1/url/${encodedActivityUrl()}`

    fetch(url, {
      method: 'GET',
      headers: {
        'Content-type': 'application/json'
      }
    })
    .then(res => {
      if (!res.ok) {
        setHasFetchedUrlObj(true)
        setIsFetchingUrlObj(false)
        throw new Error(res.status)
      }
      else return res.json()
    })
    .then(data => {
      setUrlObj(data)
      setHasFetchedUrlObj(true)
      setIsFetchingUrlObj(false)
    })
    .catch(error => {
      console.log('error: ' + error)
    })
  }

  const fetchContentSuggestions = () => {
    if (hasFetchedContentSuggestions || isFetchingContentSuggestions) return

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
    if (props.isNewSpace) return

    if (!hasFetchedReferences && !isFetchingReferences) {
      fetchReferences()
    }

    if (props.activity && !hasFetchedUrlObj && !isFetchingUrlObj) {
      fetchUrlObj()
    }  
  })

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

  const buildActivityEditor = () => {
    if (props.isDataFetched) {
      return(
        <BlockEditorSlate 
          content_type="Activity"
          content={props.activity}
          value={props.json_body}
          // updateValue={this.updateEditorValue}
        />
      )
    }
  }

  const buildSelection = () => {
    if (!props.activity.selection) return ''

    return(
      <div className="selection gray-text">{ props.activity.selection }
      </div>
    )
  }

  const buildScreenshot = () => {
    if (!props.activity.screenshot) return ''

    return(
      <div className="">
       <img src={ props.activity.screenshot } style={{maxWidth: '60%'}} />
      </div>
    )
  }

  const removeUrlObjActivity = (type, objId) => {
    if (type !== 'Activity') return

    const activities = urlObj.results.filter(a => {
      return a.id !== objId
    })

    setUrlObj({
      ...urlObj,
      activities: activities
    })
  }

//   const buildUrlObjContent = () => {
//     if (!urlObj) return ''

//     const activities = urlObj.results.filter(a => {
//       return a.id !== props.activity.id
//     })
  
//     if (activities.length === 0) return ''

//     const activityEl = activities.map(activity => {
//       return(
//         <ActivityCard 
//           activity={activity} 
//           removeListResult={removeUrlObjActivity}
//           disableDrag={true}
//         />
//       ) 
//     })

//         //<div style={{display: 'flex', alignItems: 'center'}}>
// //          <h3>Other content from this url</h3>
// //          <div style={{marginLeft: 'auto'}}>
// //            <a href={`/url/${encodedActivityUrl()}`}><i className="fa fa-arrow-right"></i> See all</a>
// //          </div>
// //        </div>
//     return(
//       <div>
//         <div className="mb-1">
//           <a href={`/url/${encodedActivityUrl()}`}><i className="fa fa-arrow-right"></i> See all</a>
//         </div>
//         <div>
//           { activityEl }
//         </div>
//       </div>
//     )
//   }

  const buildActivityMain = () => {
    return(
      <div>
        { buildSelection() }
        { buildScreenshot() }
        
        <div className="collection-blocks page-card" style={{marginTop: '1em', marginBottom: '2em', padding: '0 1em'}}>
          { buildActivityEditor() }
        </div>
      </div>
    )
        // { buildUrlObjContent() }
  }

  const buildActivityFields = () => {
    if (!props.activity.custom_fields) return ''

    const fieldElements = Object.keys(props.activity.custom_fields).map(fieldName => {
      let value = props.activity.custom_fields[fieldName]
      if (typeof value === 'object') {
        value = JSON.stringify(value, null, 2)
      }
      return(
        <div className="custom-property">
          <div className="prop-name inline-block align-top mr-1">
            { fieldName }:
          </div>
          <div className="prop-value inline-block align-top">
            { value }
          </div>
        </div>
      )
    })

    const singularFields = Object.keys(props.activity.custom_fields).filter(fieldName => {
      return !Array.isArray(props.activity.custom_fields[fieldName])
    }).reduce((obj, key) => {
      obj[key] = props.activity.custom_fields[key]
      return obj
    }, {})

    return(
      <div className="page-card prop-form" style={{paddingTop: '1em', paddingBottom: '1em'}}>
        <div>
          <div className="heading mb-1" style={{display: 'flex'}}>
            <span>
              <h5 className="mt-0 mb-0 inline-block" style={{color: '#666', marginRight: '0.5em'}}>Properties</h5>
              <i className="fa fa-question-circle small-icon" title="Properties about the current page/thought. These help Rumin structure and organize your knowledge better."></i>
            </span>
          </div>

          <FieldsForm 
            content={props.activity}
            updateCustomFields={props.updateCustomFields}
            filteredFields={singularFields}
          />        
        </div>
      </div>
    )
          // { fieldElements } 
  }

  const buildSpaceFields = () => {
    if (!props.space.custom_fields) return ''

    // const fieldElements = Object.keys(props.space.custom_fields).map(fieldName => {
    //   let value = props.space.custom_fields[fieldName]
    //   if (typeof value === 'object') {
    //     value = JSON.stringify(value, null, 2)
    //   }
    //   return(
    //     <div className="custom-property">
    //       <div className="prop-name inline-block align-top mr-1">
    //         { fieldName }:
    //       </div>
    //       <div className="prop-value inline-block align-top">
    //         { value }
    //       </div>
    //     </div>
    //   )
    // })

    return(
      <div className="page-card prop-form" style={{paddingTop: '1em', paddingBottom: '1em'}}>
        <div>
          <div className="heading mb-1" style={{display: 'flex'}}>
            <span>
              <h5 className="mt-0 mb-0 inline-block" style={{color: '#666', marginRight: '0.5em'}}>Properties</h5>
              <i className="fa fa-question-circle small-icon" title="Properties about the current page/thought. These help Rumin structure and organize your knowledge better."></i>
            </span>
          </div>
          
          <FieldsForm 
            content={props.space}
            updateCustomFields={props.updateCustomFields}
          />  
        </div>
      </div>
    )
  }

  const buildCustomCollectionField = () => {
    return(
      <CustomCollectionResults 
        {...props}
        content={props.space ? props.space : props.activity}
        fieldName={props.currTab}
      />
    )
  }

  const buildTabContent = () => {
    switch (props.currTab) {
      case 'activityOverview': 
        return buildActivityMain()
      case 'activityCustomFields': 
        return buildActivityFields()
      case 'spaceCustomFields': 
        return buildSpaceFields()
      case 'references':
        return(
          <CollectionResults 
            viewType="list"
            results={references}
            disableDrag={true}
          />
        )
      case 'suggested':
        return <SuggestedTabResults />
      case 'about':
        return <AboutTab {...props} fields={fields} />
      default:
        return buildCustomCollectionField()
    }
  } 

  return(
    <div className="">
      { buildTabContent() }
    </div>
  ) 
}

const FieldInput = (props) => {
  const [value, setValue] = useState(props.initValue)

  const handleBlur = (e, fieldName) => {
    props.setIsSaving(true)

    // TODO - validate if it is the correct url 
    const body = {
      name: fieldName,
      expected_type: 'text',
      text_value: value
    }

    fetch(`/api/v1/spaces/${props.space.id}/fields/${props.fieldName}/`, {
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
      props.setIsSaving(false)
    })
    .catch(error => {
      console.log('error: ' + error)
    })
  }

  return(
    <input 
      placeholder={props.placeholder} 
      className="field-input" 
      value={value}
      onBlur={(e) => handleBlur(e, props.fieldName)} 
      onChange={(e) => setValue(e.target.value)}
    />
  )
}

const AboutTab = (props) => {
  const [isSaving, setIsSaving] = useState(false)

  const getFieldValue = (fieldName) => {
    const field = props.fields.find(f => f.name === fieldName)
    return field ? field.text_value : ''
  }

  return(
    <div>
      <div className="mb-1">
        <div className="field-label">Website</div>
        <FieldInput 
          {...props} 
          placeholder="e.g. https://getrumin.com, https://www.who.int/"
          fieldName="website_url"
          initValue={getFieldValue('website_url')}
          setIsSaving={setIsSaving}
        />
      </div>

      <div className="mb-1">
        <div className="field-label">Wikipedia page</div>
        <FieldInput 
          {...props} 
          placeholder="e.g. https://en.wikipedia.org/wiki/Sigmoid_function" 
          fieldName="wikipedia_url"
          initValue={getFieldValue('wikipedia_url')}
          setIsSaving={setIsSaving}
        />
      </div>

      <div className={isSaving ? '' : 'hidden'}>Saving...</div>
    </div>
  )
}

const SuggestedTabResults = () => {
  return(
    <div className="related-results">
      <p>AI suggestions coming soon!</p>
      <p>You will be able to view or dismiss the suggested connections here</p>
    </div>
  )
}
