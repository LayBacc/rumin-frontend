import React, { useState, useRef, useContext, useEffect } from 'react'

import { ClickHandler } from './ClickHandler'

export const FieldsForm = props => {
  const [showForm, setShowForm] = useState(false)

  const [fields, setFields] = useState(props.filteredFields || props.content.custom_fields)
  const [fieldTypes, setFieldTypes] = useState(props.content.custom_field_types)
  const [fieldNames, setFieldNames] = useState(Object.keys(fields))  // maintain the order of fields on the UI
  
  const [saveState, setSaveState] = useState('unsaved')
  const [saveTimer, setSaveTimer] = useState(null)

  const handleAddPropertyClick = () => {
    setFields({ 
      ...fields, 
      '': ''
    })

    if (fieldNames.indexOf('') < 0) {
      setFieldNames([...fieldNames, ''])
    }
  }

  const updateFieldName = (fieldName, newName) => {
    // update fields and field_types
    let updatedFields = Object.assign({}, fields)
    let updatedTypes = Object.assign({}, fieldTypes)
    
    // update fieldNames
    const fieldIndex = fieldNames.indexOf(fieldName)
    setFieldNames([...fieldNames.slice(0, fieldIndex), newName, ...fieldNames.slice(fieldIndex+1,)])    

    const value = updatedFields[fieldName]
    const type = updatedTypes[fieldName] || 'Text'
    
    delete updatedFields[fieldName]
    delete updatedTypes[fieldName]

    updatedFields[newName] = value
    updatedTypes[newName] = type

    setFields(updatedFields)
    setFieldTypes(updatedTypes)
  }

  const updateFieldValue = (fieldName, newValue) => {
    let updatedFields = Object.assign({}, fields)
    updatedFields[fieldName] = newValue
    setFields(updatedFields)
  }

  const updateFieldType = (fieldName, fieldType) => {
    let updatedTypes = Object.assign({}, fieldTypes)
    updatedTypes[fieldName] = fieldType
    setFieldTypes(updatedTypes)
    // props.updateCustomFieldTypes(updated)
  }

  const handleSaveFieldsClick = () => {
    const body = { 
      custom_fields: fields,
      custom_field_types: fieldTypes
    }

    setSaveState('saving')

    const url = props.content.content_type === 'Space' ? `/api/v1/spaces/${props.content.id}/` : `/api/v1/activities/${props.content.id}/`
    fetch(url, {
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
      setSaveState('saved')

      // reset the save button in 2 seconds
      clearTimeout(saveTimer)
      const timer = setTimeout(() => { setSaveState('unsaved') }, 2000)
      setSaveTimer(timer)

      props.updateCustomFields(fields, fieldTypes)
    })
    .catch(error => {
      console.log('error: ' + error)
    })
  }

  const handleFieldNameChange = (fieldName, newName) => {
    updateFieldName(fieldName, newName)
  }

  const handleFieldValueChange = (fieldName, newValue) => {
    updateFieldValue(fieldName, newValue)
  }

  const handleFieldTypeChange = (fieldName, fieldType) => {
    updateFieldType(fieldName, fieldType)
  }

  const buildFields = () => {
    return fieldNames.map(fieldName => {
      const fieldValue = fields[fieldName]

      return(
        <div>
          <CustomField
            {...props}
            fieldName={fieldName}
            fieldValue={fieldValue}
            fieldType={fieldTypes[fieldName] || "Text"}
            handleFieldTypeChange={handleFieldTypeChange}
            handleFieldNameChange={handleFieldNameChange}
            handleFieldValueChange={handleFieldValueChange}
          />
        </div>
      )
    })
  }

  const buildSaveBtn = () => {
    if (saveState === 'saving') {
      return(
        <div className="ml-1">
          Saving...
        </div>
      )
    }

    if (saveState === 'saved') {
      return(
        <div className="ml-1">
          Saved
        </div>
      )
    }

    return(
      <div 
        className="btn btn-secondary" 
        style={{marginLeft: '1em'}}
        onClick={handleSaveFieldsClick}
      >
        Save properties
      </div>
    )
  }

  return(
    <div>
      { buildFields() }

      <div className="flex flex-center mt-1">
        <div 
          className="clickable padding-small gray-text"
          onClick={handleAddPropertyClick}
        >
          + Add a property
        </div>

        { buildSaveBtn() }
      </div>
    </div>
  )
}

const CustomField = (props) => {
  const buildLink = () => {
    if (typeof(props.fieldValue) !== 'string' || !props.fieldValue.startsWith('https://')) return ''

    return(
      <a 
        href={props.fieldValue}
        style={{marginLeft: '0.5em'}} 
        target="_blank"
      ><i className="fa fa-external-link small-icon"></i></a>
    )
  }

  return(
    <div style={{marginBottom: '0.5em'}}>
      <FieldTypeBtn 
        {...props}
        fieldName={props.fieldName}
        fieldType={props.fieldType}
        handleFieldTypeChange={props.handleFieldTypeChange}
      />
      <div className="inline-block mr-1">
        <input 
          type="text"
          value={props.fieldName}
          className="prop-name" 
          placeholder="property name"
          onChange={(e) => props.handleFieldNameChange(props.fieldName, e.target.value)}
          onBlur={() => props.handleFieldNameChange(props.fieldName, props.fieldName.trim())}
        />
      </div>
      <div className="inline-block">
        <input 
          type={props.fieldType === 'Number' ? 'number' : 'text' }
          value={props.fieldValue}
          min={props.min ? props.min : null }
          max={props.max ? props.max : null }
          className="prop-value" 
          placeholder={props.placeholder || "value"}
          onChange={(e) => props.handleFieldValueChange(props.fieldName, e.target.value)}
        />
        { buildLink() }
      </div>
    </div>
  )
}

const FieldTypeOption = (props) => {
  const handleOptionClick = () => {
    props.handleFieldTypeChange(props.fieldName, props.fieldType)
    props.closeDropdown()
  }

  return(
    <div
      tabindex="0"
      className="as-result"
      onClick={handleOptionClick}
      style={{padding: '0.5em 1.5em'}}
      title={props.fieldTypeDescription}
    >
      <div><i className={`fa ${ props.faIcon } mr-1`}></i> { props.fieldType }</div>
    </div>
  )
}

const FieldTypeDropdown = (props) => {
  const inputRef = useRef()
  const [query, setQuery] = useState('')
  const [typingTimer, setTypingTimer] = useState(null)

  const fetchAutosuggest = () => {
    
  }

  const handleInputKeyUp = (e) => {
    clearTimeout(typingTimer)
    const timer = setTimeout(() => { fetchAutosuggest() }, 750)
    setTypingTimer(timer)
  }

  const buildFieldOptions = () => {
    return(
      <div
        className="section"
      >
        <div className="as-results">
          <FieldTypeOption
            {...props} 
            fieldType="Text"
            faIcon="fa-align-left"
            fieldTypeDescription="Property type: Text"
          />
          <FieldTypeOption
            {...props} 
            fieldType="Number"
            faIcon="fa-hashtag"
            fieldTypeDescription="Property type: Number"
          />
        </div>
      </div>
    )
  }

  return(
    <div className="dropdown" style={{width: '250px'}}>
      { buildFieldOptions() }
    </div>
  )
}

const FieldTypeBtn = (props) => {
  const [showDropdown, setShowDropdown] = useState(false)

  const closeDropdown = () => {
    setShowDropdown(false)
  }

  const buildFieldTypeIcon = () => {
    const icon = {
      Text: <i className="fa fa-align-left"></i>,
      Number: <i className="fa fa-hashtag"></i>,
    }[props.fieldType]

    return icon
  }

  const buildPropTypeDropdown = () => {
    if (!showDropdown) return ''

    return(
      <ClickHandler
        close={() => {setShowDropdown(false)}}
      >
        <FieldTypeDropdown 
          {...props} 
          closeDropdown={closeDropdown}
        />
      </ClickHandler>
    )
  }

  return(
    <div className="inline-block" title={props.moreInfo ? props.moreInfo : 'property' }>
      <div 
        className="prop-btn"
        style={{marginRight: '1em'}}
        onClick={() => setShowDropdown(true)}
      >
        { buildFieldTypeIcon() }
      </div>
      { buildPropTypeDropdown() }
    </div>
  )
} 
