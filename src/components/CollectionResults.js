import React, { useState } from 'react'
import { SpaceCard, CapturedSpaceCard } from './RelatedSectionCard'
import { friendlyDateTimeStr } from '../utils/date_utils'
import { ClickHandler } from './ClickHandler'

import { Resizable, ResizeCallback } from 're-resizable'
import shortid from 'shortid'

export const CollectionResults = (props) => {
  switch (props.viewType) {
    case 'list':
      return <CollectionList {...props} />
    case 'table':
      return(
        <CollectionTable {...props} />
      )
    default:
      return <CollectionList {...props} />
  }
}

export const CollectionTable = (props) => {
  const DEFAULT_COLUMNS = [{name: 'title', displayName: 'Name'}, {name: 'updated_at', displayName: 'Last modified'}, { name: 'created_at', displayName: 'Date created' }]
  
  // if (r.url) {
  //       fields[url] = true
  //     }

  const customFieldColumns = () => {
    let fields = {}

    props.results.forEach(r => {
      if (!r || Object.keys(r).length === 0) return

      const singularFields = Object.keys(r.custom_fields).filter(fieldName => {
        return !Array.isArray(r.custom_fields[fieldName])
      }).reduce((obj, key) => {
        obj[key] = r.custom_fields[key]
        return obj
      }, {})
    })

    return Object.keys(fields).map(field => { 
      return(
        { name: field, displayName: field, isCustom: true }
      )
    })
  }

  const [columns, setColumns] = useState([...DEFAULT_COLUMNS, ...customFieldColumns()])

  const addColumn = () => {
    const newColumn = { 
      name: shortid.generate(), 
      displayName: 'Untitled column',
      isCustom: true
    }
    setColumns([...columns, newColumn])
  }

  const hideColumn = (column) => {
    setColumns(columns.filter(c => c != column))
  }

  const updateCellValue = (content, column, cellValue) => {
    const body = { custom_fields: {  [column.name]: cellValue } }

    fetch(`/api/v1/spaces/${content.id}/`, {
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

    })
    .catch(error => {
      console.log('error: ' + error)
    })
    // if (content.content_type === 'Space') {
    // }
    
    // if (content.content_type === 'Activity') {
    //   fetch(`/api/v1/activities/${content.id}/`, {
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

    //   })
    //   .catch(error => {
    //     console.log('error: ' + error)
    //   })
    // }
  }

  const buildResults = () => {
    if (!props.results) return ''

    return props.results.map(content => {
      const url = `/spaces/${content.id}`//content.content_type === 'Space' ? `/spaces/${content.id}` : `/activities/${content.id}`

      const cells = columns.map(c => {
        return(
          <TableCell 
            content={content}
            column={c}
            updateCellValue={updateCellValue}
          />
        )
      })

      // with a last cell for the "add column" column
      return(
        <tr>
          { cells }
          <td></td>
        </tr>
      )
    })
  }

  const buildTableHeaders = () => {
    return columns.map(c => {
      return(
        <ColumnHeader 
          column={c}
          hideColumn={hideColumn} 
        />
      )
    })
  }

  if (!props.results) {
    return ''
  }

  return(
    <div className="collection-table-container">
      <table className="collection-table">
        <tr style={{borderBottom: '1px solid #ccc'}}>
          { buildTableHeaders() }
          <NewColumnBtn 
            addColumn={addColumn}
          />
        </tr>

        { buildResults() }
      </table>
    </div>
  )
}

const TableCell = (props) => {
  const BLACKLISTED_COLS = ['title', 'updated_at', 'created_at']
  const [isEditing, setIsEditing] = useState(false)

  const buildCustomFieldCell = (content, column) => {
    if (!content.custom_fields || !content.custom_fields[column]) return ''

    return content.custom_fields[column]
  }

  const buildCellContent = (content, column) => {
    switch (column) {
      case 'title':
        const url = `/spaces/${content.id}` //content.content_type === 'Space' ? `/spaces/${content.id}` : `/activities/${content.id}`
        return(
          <a href={url}>{ content.title || 'Untitled' }</a>
        )
      case 'created_at':
        return(
          friendlyDateTimeStr(content.created_at)
        )
      case 'updated_at':
        return(
          friendlyDateTimeStr(content.created_at)
        )
      default:
        return buildCustomFieldCell(content, column)
    }
  }
  const [cellValue, setCellValue] = useState(buildCellContent(props.content, props.column.name))

  const handleCellClick = () => {
    if (BLACKLISTED_COLS.includes(props.column.name)) {
      return
    }
    setIsEditing(true)
  }

  const updateCellValue = () => {
    props.updateCellValue(props.content, props.column, cellValue)
    setIsEditing(false)
  }

  if (isEditing) {
    return(
        <td
          // onBlur={() => setIsEditing(false)}
        >
          <ClickHandler
            close={() => setIsEditing(false)}
          >
            <textarea 
              value={ cellValue }
              onChange={ (e) => setCellValue(e.target.value) }
            ></textarea>
            <div 
              className="btn-primary"
              onClick={updateCellValue}
            >Save</div>
          </ClickHandler>
        </td>
    )
  }
  else {
    console.log('cellValue', props.column.name, cellValue)
    return(
      <td
        onClick={handleCellClick}
        onBlur={() => setIsEditing(false)}
      >
        { Array.isArray(cellValue) ? '' : cellValue }
      </td>
    )
  }
}

const ColumnHeader = (props) => {
  const [showDropdown, setShowDropdown] = useState(false)

  const handleContextMenu = (e) => {
    e.preventDefault()
    setShowDropdown(true)
    return false
  } 

  const handleHideColumnClick = () => {
    props.hideColumn(props.column)
    setShowDropdown(false)
  }

  const buildDropdown = () => {
    if (!showDropdown) return ''

    return(
      <ClickHandler
        close={() => setShowDropdown(false)}
      >
        <div className="column-header-dropdown dropdown">
          <div 
            className="dropdown-action"
            onClick={handleHideColumnClick}
          >
            <i className="fa fa-eye-slash icon"></i> Hide
          </div>
        </div>
      </ClickHandler>
    )
  }

  return(
    <th>
      <Resizable
        // maxWidth={'100%'}
        enable={{ top:false, right:true, bottom:false, left:true, topRight:false, bottomRight:false, bottomLeft:false, topLeft:false }}
        lockAspectRatio={false}
      >
        <div
          className="clickable column-label"
          onClick={() => setShowDropdown(true)}
          onContextMenu={handleContextMenu}
        >
          { props.column.displayName }
        </div>
      </Resizable>
      { buildDropdown() }
    </th>
  )
}

const NewColumnBtn = (props) => {
  const handleNewColumnClick = () => {
    props.addColumn()
  }

  return(
    <th
    >
      <div
        className="clickable column-label"
        onClick={handleNewColumnClick}
      >
        +
      </div>
    </th>
  )
}

export const CollectionList = (props) => {
  const buildCapturedSpaceResult = (content) => {
    return(
      <CapturedSpaceCard 
        space={content}
        updateCollectionItem={props.updateCollectionItem}
        moveInCollection={props.moveInCollection}
        removeFromCollection={props.removeFromCollection}
        disableDrag={props.disableDrag}
      />
    )
  }

  const buildSpaceResult = (space) => {
    return(
      <SpaceCard 
        space={space}
        updateCollectionItem={props.updateCollectionItem}
        moveInCollection={props.moveInCollection}
        removeFromCollection={props.removeFromCollection}
        disableDrag={props.disableDrag}
      />
    )
  }

  const buildResults = () => {
    if (!props.results) return ''

    // return getFilteredResults().map(result => {
    return props.results.map(result => {
      const buildFunc = {
        Space: buildSpaceResult,
        Activity: buildCapturedSpaceResult
      }[result.content_type]

      return buildFunc(result)
    })
  }

  return(
    <div className="related-results">
      { buildResults() }
    </div>
  )
}
