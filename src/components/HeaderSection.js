import React, { useState, useContext } from "react"
import DatePicker from "react-datepicker"
// import "react-datepicker/dist/react-datepicker.css"
// require("react-datepicker/dist/react-datepicker.css")
// require('react-datepicker/dist/react-datepicker.css')
import { CollectionsDropdown } from './CollectionsDropdown'
import queryString from 'query-string'
import moment from 'moment'
import { ClickHandler } from './ClickHandler'

import AppContext from './AppContext'

export const HeaderSection = (props) => {
	const [query, setQuery] = useState(props.initialQuery || '')
  const [showTimeDropdown, setShowTimeDropdown] = useState(false)
  // const [showFieldDropdown, setShowFieldDropdown] = useState(false)
  const [showTypeDropdown, setShowTypeDropdown] = useState(false)
  const [showSourceDropdown, setShowSourceDropdown] = useState(false)
  const [showConnectionDropdown, setShowConnectionDropdown] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  // FIXME - maintaining both the state and props params seems unnecessary and error-prone

  const [currParams, setCurrParams] = useState(props.params || queryString.parse(location.search)) // used to keep track of what params are active, since React doesn't track changes in URL parameters
  const isTimeFilterActive = () => {
    return currParams.start_date && currParams.end_date
  }

  const isTypeFilterActive = () => {
    return currParams.content_type
  }
  const [showFilters, setShowFilters] = useState(isTimeFilterActive() || isTypeFilterActive()) 
  
  const initStartDate = () => {
    if (props.initialStartDateStr) {
      return new Date(props.initialStartDateStr)
    }
    return new Date()
  }

  const initEndDate = () => {
    if (props.initialEndDateStr) {
      return new Date(props.initialEndDateStr)
    }
    return new Date()
  }

  const initFieldFilters = () => {
    const params = queryString.parse(location.search)
    if (params.filters) {
      return JSON.parse(decodeURIComponent(params.filters))
    }

    return []
  }

  const [startDate, setStartDate] = useState(initStartDate())
  const [endDate, setEndDate] = useState(initEndDate())

  const [isSpaceTypeChecked, setIsSpaceTypeChecked] = useState(props.params && props.params.content_type !== 'Activity')
  const [isActivityTypeChecked, setIsActivityTypeChecked] = useState(props.params && props.params.content_type !== 'Space')
  const [searchFields, setSearchFields] = useState({ title: true, text_body: true })

  const [fieldFilters, setFieldFilters] = useState(initFieldFilters())


  // drop empty values
  const cleanParams = (params) => {
    let cleaned = {...params}
    Object.keys(cleaned).forEach((key) => (cleaned[key] == '') && delete cleaned[key])
    return cleaned
  }

  const updateUrlParams = (params) => {
    const path = '/search?' + queryString.stringify(params)
    props.history.push(path)
  }

  const handleQueryChange = (e) => {
    setQuery(e.target.value)
  }

  const handleKeyDown = (e) => {    
    if (e.key === 'Enter') {
      handleQuerySubmit()
    }
  }

  const handleSearchClick = () => {
    handleQuerySubmit()
  }

  const handleQuerySubmit = () => {
    // when the user issues a query, it's a new search so we don't pass on the other filters
    // props.updateQueryPath(path)
    const params = { q: query }
    updateUrlParams({ q: query })
    setCurrParams(params)
    setShowTimeDropdown(false)
  }

  const handleStartFilterChange = (date) => {
    setStartDate(date)
  }

  const handleEndFilterChange = (date) => {
    setEndDate(date)
  }

  const handleClearFiltersClick = () => {
    const params = { q: query }
    updateUrlParams(params)
    setCurrParams(params)
  }

  const formatDateStr = (date) => {
    return moment(date).format("YYYY-MM-DD")
  }

  const mergedParams = (newParams) => {
    const params = Object.assign(cleanParams(currParams), newParams)
    return Object.assign({ q: query }, params)
  }

  const handleTimeFilterSubmit = () => {
    const params = mergedParams({ start_date: formatDateStr(startDate), end_date: formatDateStr(endDate) })
    updateUrlParams(params)
    setCurrParams(params)
    setShowTimeDropdown(false)
  }

  const handleSpaceTypeCheckedChange = (isChecked) => {
    setIsSpaceTypeChecked(isChecked)
  }

  const handleActivityTypeCheckedChange = (isChecked) => {
    setIsActivityTypeChecked(isChecked)
  }

  const handleFieldCheckedChange = (field, isChecked) => {
    setSearchFields({
      ...searchFields,
      [field]: isChecked
    })
  }

  const isHomePage = () => {
    return location.pathname === '/' && location.search === ''
  }

  const isFavoritesPage = () => {
    return queryString.parse(location.search).favorites === 'true'
  }

  // const isCapturedContentPage = () => {
  //   return queryString.parse(location.search).content_type === 'Activity'
  // }

  const isSerp = () => {
    // return location.pathname.startsWith('/search')
    return location.pathname.startsWith('/search') && !isFavoritesPage() && !isHomePage() //&& currParams.q
  }

  const buildTimeFilterDropdown = () => {
    if (!showTimeDropdown) {
      return(<div></div>);
    }
    return(
      <ClickHandler
        close={() => setShowTimeDropdown(false)}
        displayBlock={true}
      >
        <TimeFilterDropdown 
          startDate={startDate}
          endDate={endDate}
          handleStartFilterChange={handleStartFilterChange}
          handleEndFilterChange={handleEndFilterChange}
          handleTimeFilterSubmit={handleTimeFilterSubmit}
        />
      </ClickHandler>
    )
  }

  const handleFieldFilterSubmit = () => {
    let newParams = { ...cleanParams(currParams) }
    
    // if all are selected
    if (searchFields.title && searchFields.text_body) {
      delete newParams.fields
    }
    else {
      // TODO - loop through the params
      let fields = []

      Object.keys(searchFields).forEach(key => {
        if (searchFields[key] === true) {
          fields.push(key)
        }
      })

      newParams.fields = fields.join(',')
    }

    const params = mergedParams(newParams)
    setCurrParams(params)
    setShowFieldDropdown(false)
    updateUrlParams(params)
  }

  const buildFieldFilterDropdown = () => {
    if (!showFieldDropdown) {
      return(<div></div>);
    }
    return(
      <ClickHandler
        close={() => setShowFieldDropdown(false)}
        displayBlock={true}
      >
        <SearchByFieldDropdown 
          handleFieldCheckedChange={handleFieldCheckedChange}
          handleFieldFilterSubmit={handleFieldFilterSubmit}
          searchFields={searchFields}
        />
      </ClickHandler>
    )
  }

  const handleTypeFilterSubmit = () => {
    let newParams = { ...cleanParams(currParams) }

    // console.log('newParams in handleTypeFilterSubmit', newParams)
    
    if (isSpaceTypeChecked && isActivityTypeChecked) {
      delete newParams.content_type
    }
    else if (isSpaceTypeChecked && !isActivityTypeChecked) {
      newParams.content_type = 'Space'
    }
    else if (isActivityTypeChecked && !isSpaceTypeChecked) {
      newParams.content_type = 'Activity'
    }

    const params = mergedParams(newParams)
    setCurrParams(params)
    setShowTypeDropdown(false)
    updateUrlParams(params)
  }

  // const buildTypeFilterDropdown = () => {
  //   if (!showTypeDropdown) {
  //     return(<div></div>);
  //   }
  //   return(
  //     <ClickHandler
  //       close={() => setShowTypeDropdown(false)}
  //       displayBlock={true}
  //     >
  //       <TypeFilterDropdown 
  //         isSpaceTypeChecked={isSpaceTypeChecked}
  //         isActivityTypeChecked={isActivityTypeChecked}
  //         handleSpaceTypeCheckedChange={handleSpaceTypeCheckedChange}
  //         handleActivityTypeCheckedChange={handleActivityTypeCheckedChange}
  //         handleTypeFilterSubmit={handleTypeFilterSubmit}
  //       />
  //     </ClickHandler>
  //   )
  // }

  const handleConnectionFilterSubmit = () => {
    // TODO - 

  }

  const buildConnectionFilterDropdown = () => {
    if (!showConnectionDropdown) {
      return(<div></div>)
    }

    return(
      <ClickHandler
        close={() => setShowConnectionDropdown(false)}
        displayBlock={true}
      >
        <ConnectionFilterDropdown 
          handleConnectionFilterSubmit={handleConnectionFilterSubmit}
        />
      </ClickHandler>
    )
  }

//    <div className="filter-btn-container">
//          <div 
//            className={`filter-btn ${currParams.fields ? 'active' : ''}`}
//            onClick={() => setShowFieldDropdown(!showFieldDropdown)}
//          >
//            Field
//          </div>
//          { buildFieldFilterDropdown() }
//        </div>
  const addFieldFilter = () => {
    setFieldFilters([...fieldFilters, {}])
  }

  const removeFieldFilter = (removeIndex) => {
    console.log('removeIndex', removeIndex)
    
    setFieldFilters([...fieldFilters.slice(0, removeIndex), ...fieldFilters.slice(removeIndex+1,)])
  }

  const updateConditionField = (index, fieldName) => {
    console.log('index in updateConditionField', index)

    const updated = {
      ...fieldFilters[index],
      condition_field: fieldName
    }

    console.log([...fieldFilters.slice(0, index), updated, ...fieldFilters.slice(index+1, )], updated)

    setFieldFilters([...fieldFilters.slice(0, index), updated, ...fieldFilters.slice(index+1, )])
  }

  const updateConditionType = (index, type) => {
    const updated = {
      ...fieldFilters[index],
      condition_type: type
    }

    setFieldFilters([...fieldFilters.slice(0, index), updated, ...fieldFilters.slice(index+1, )])
  }

  const updateConditionArg1 = (index, value) => {
    const updated = {
      ...fieldFilters[index],
      condition_arg1: value
    }

    setFieldFilters([...fieldFilters.slice(0, index), updated, ...fieldFilters.slice(index+1, )])
  }

  const handleUpdateFiltersClick = () => {
    console.log('fieldFilters', fieldFilters)
    // TODO - serialize each
    const params = { q: query, filters: encodeURIComponent(JSON.stringify(fieldFilters)) }
    updateUrlParams(params)
    setCurrParams(params)
  }

  const buildFilterSection = () => {
    // if (!showFilters) return ''
    const filterComponents = fieldFilters.map((filter, index) => {
      return(
        <FieldFilter 
          index={index} 
          condition_field={filter.condition_field}
          condition_type={filter.condition_type}
          condition_arg1={filter.condition_arg1}
          removeFieldFilter={removeFieldFilter}
          updateConditionField={updateConditionField}
          updateConditionType={updateConditionType}
          updateConditionArg1={updateConditionArg1}
        />
      )
    })

    return(
      <div className="filters-container">
        { filterComponents } 
        <div 
          className="clickable inline-block mr-1"
          onClick={() => addFieldFilter()}
        >+ Add filter</div> 
        <div 
          className="clickable btn btn-primary"
          onClick={handleUpdateFiltersClick}
        >Update results</div>
      </div>
    )

    // return(
    //   <div className="filters-container">
    //     <div className="filter-btn-container">
    //       <div 
    //         className={`filter-btn ${isTimeFilterActive() ? 'active' : ''}`}
    //         onClick={() => setShowTimeDropdown(!showTimeDropdown)}
    //       >
    //         Time
    //       </div>
    //       { buildTimeFilterDropdown() }
    //     </div>

    //     <div className="filter-btn-container">
    //       <div 
    //         className={`filter-btn`}
    //         onClick={() => setShowConnectionDropdown(!showConnectionDropdown)}
    //       >
    //         Connections
    //       </div>
    //       { buildConnectionFilterDropdown() }
    //     </div>


    //     <span
    //       className="clear-filters"
    //       style={{cursor: 'pointer'}}
    //       role="button"
    //       onClick={handleClearFiltersClick}
    //     >
    //       Clear filters
    //     </span>
    //   </div>
    // )
  }

  const buildMenu = () => {
    if (!showMenu) return ''

    return(
      <ClickHandler
        close={() => setShowMenu(false)}
      >
        <HamMenuDropdown>
        </HamMenuDropdown>
      </ClickHandler>
    )
  }

  const buildSearchScopes = () => {
    // don't show on other pages
    if (props.disableFilters || !(isSerp() || isFavoritesPage())) { //|| isCapturedContentPage())) {//location.pathname.match('/activities/') || location.pathname.match('/spaces/') || location.pathname.match('/demo_content_block')) {
      return(
        <div className="header-section-border">

        </div>
      )
    }
    
    return(
      <div className="search-filters-section feeds-section">
        { buildFilterSection() }
      </div>
    )
    // return(
    //   <div className="search-filters-section feeds-section">
    //     <div className="feed-tabs tabs">
    //       { isSerp() ? <div className="tab active"><i className="fa fa-search nav-icon"></i> Recent</div> : '' }
    //       <a href="/search?favorites=true"
    //         className={`tab ${isFavoritesPage() ? 'active' : ''}`}
    //       ><i className="fa fa-star-o nav-icon"></i> Favorites</a>
    //       { buildFilterToggleBtn() }
    //     </div>
        
    //     { buildFilterSection() }
    //   </div>
    // )
  }

  const buildSortOptions = () => {

  }

          //<a href="/search?content_type=Activity" className={`tab ${isCapturedContentPage() ? 'active' : ''}`}><i className="fa fa-inbox nav-icon"></i> Captured content</a>
//      <div className="filter-btn-container">
//          <div 
//            className="filter-btn"
//            onClick={() => setShowTypeDropdown(!showTypeDropdown)}
//          >
//            Type
//          </div>
//          { buildTypeFilterDropdown() }
//        </div>
//        <div className="filter-btn-container">
//          <div 
//            className="filter-btn"
//            onClick={() => setShowSourceDropdown(!showSourceDropdown)}
//          >
//            Source
//          </div>
//        </div>  

  const buildFilterToggleBtn = () => {
    return(
      <div 
        className={`inline-block filter-toggle ${showFilters ? 'active' : ''}`} 
        onClick={() => {setShowFilters(!showFilters)}}
      >Filters</div>
    )
  }

  return(
    <div className="header-section">
    	<div className="flex top-bar">
        <div className="mr-1">
          <a href="/" className="mb-0" style={{color: '#2D6EAB', fontFamily: 'Varela Round, sans-serif', display: 'flex', 'alignItems': 'center'}}>
            <img src="https://storage.googleapis.com/rumin-gcs-bucket/logo-search2.png" className="logo-img" /> 
          </a>
        </div>
        
        <div className="search-box-container">
          <input 
            value={query}
            className="search-box" 
            placeholder="Search your pages" 
            onChange={handleQueryChange}
            onKeyDown={handleKeyDown}
          />
          <div 
            className="search-icon-container"
            onClick={handleSearchClick}
          >
            <svg focusable="false" xmlns="https://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#4285f4" d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"></path></svg>
          </div>
        </div>

        <div className="ham-menu right-side mr-1">
          <div 
            className="icon-container clickable gray-text"
            role="button"
            onClick={() => setShowMenu(!showMenu)}
          >
              <i className="fa fa-bars"></i>
          </div>

          { buildMenu() }
        </div>
      </div>

      { buildSearchScopes() }
      <div className="header-section-border"></div>

      { buildSortOptions() }
    </div>
  )
//      <div
//        className="ham-menu"
//      >
//        <div 
//          className="icon-container"
//          role="button"
//          onClick={() => setShowMenu(!showMenu)}
//        >
//            <i className="fa fa-ellipsis-h"></i>
//        </div>//////

//        { buildMenu() }
//      </div>
//           <i className="fa fa-bars"></i>
//       <span>{(e) => { handleSpaceTypeCheckedChange() }} Query</span>
}



export const FieldFilter = (props) => {
  return(
    <div className="mb-1">
      <input 
        type="text" 
        placeholder="Property / column name" 
        value={props.condition_field || ''}
        onChange={(e) => props.updateConditionField(props.index, e.target.value)}
        className="filter-input mr-1"
      />
      
      <select 
        value={props.condition_type}
        onChange={(e) => props.updateConditionType(props.index, e.target.value)}
        className="filter-input mr-1"
      >
        <option value="text-contains">Text contains</option>
        <option value="text-does-not-contain">Text does not contain</option>
        <option value="text-starts-with">Text starts with</option>
        <option value="text-ends-with">Text ends with</option>
      </select>

      <input 
        type="text" 
        placeholder="Value"
        value={props.condition_arg1 || ''}
        onChange={(e) => props.updateConditionArg1(props.index, e.target.value)}
        className="filter-input"
      />

      <span 
        onClick={() => props.removeFieldFilter(props.index)}
        className="clickable ml-1"
       >x</span>
    </div>
  )
}






export const HamMenuDropdown = (props) => {
  const appContext = useContext(AppContext)

  const buildAuthBtn = () => {
    if (window.django.user.is_authenticated) {
      return(
        <form method="post" action="/users/logout/">
          <button class="link-btn" type="submit">Log out</button>
        </form>
      )
    }

    return <a href="/users/login">Log in</a>
  } 

  const isFirefox = typeof InstallTrigger !== 'undefined'
  const extensionLink = isFirefox ? 'https://addons.mozilla.org/en-US/firefox/addon/rumin/' : 'https://chrome.google.com/webstore/detail/rumin/eboiffdknchlbeboepkadciilgmaojbj' 

        //<li 
//          className="dropdown-action"
//          onClick={appContext.openOnboardingModal}
//        >
//          <i className="fa fa-lightbulb-o icon"></i> Getting started
//        </li>
//        <li className="dropdown-action">
//          <a href="https://getrumin.com/blog/a6e22fa3-d57a-40e7-a8cd-56067e8b6040" target="_blank">
//            <i className="fa fa-text-height icon"></i> Formatting guide <i className="fa fa-external-link" style={{fontSize: '0.7em', marginLeft: '0.25em'}}></i>
//          </a>
//        </li>
  return(
    <div 
      className="dropdown dropdown-narrow"
      style={{right: '0'}}
    >
      <ul>
        <li className="dropdown-action">
          <a href="/explorer?viewId=a07ccb04-ebb0-4307-833a-b2fa1e56fba1&viewTitle=Rumin tutorial" target="_blank">
            <i className="fa fa-lightbulb-o icon"></i> Tutorial <i className="fa fa-external-link" style={{fontSize: '0.7em', marginLeft: '0.25em'}}></i>
          </a>
        </li>
        <li className="dropdown-action">
          <a href={ extensionLink } target="_blank">
            <i className="fa fa-bookmark-o icon"></i> Browser extension <i className="fa fa-external-link" style={{fontSize: '0.7em', marginLeft: '0.25em'}}></i>
          </a>
        </li>
        
        <li className="dropdown-action">
          <span>Dark mode</span>
          <div 
            className="ml-1 inline-block" 
            title="Control read access for people with a link to this page"
          >
            <label className="toggle-switch inline-block align-top"> 
              <input
                type="checkbox"
                checked={ appContext.isDarkMode() }
                onClick={ appContext.toggleIsDarkMode }
              />
              <span className="slider round"></span>
            </label>
            <div className="toggle-label-container">
              <span className="toggle-label">{ appContext.isDarkMode() ? 'On' : 'Off' }</span>
            </div>
          </div>
        </li>
        <li className="dropdown-action">
          { buildAuthBtn() }
        </li>
      </ul>
    </div>
  )
}






const TimeFilterDropdown = (props) => {
  return(
    <div className="filter-dropdown dropdown">
      <div className="datepicker-container">
        <DatePicker
          selected={props.startDate}
          onChange={props.handleStartFilterChange}
        />
      </div>
      <div className="datepicker-container">
        <DatePicker
          selected={props.endDate}
          onChange={props.handleEndFilterChange}
          minDate={props.startDate}
        />
      </div>
      <div
        className=""
        style={{marginTop: '1em'}}
      >
        <div 
          className="btn-primary"
          onClick={props.handleTimeFilterSubmit}
        >
          Apply
        </div>
      </div>
    </div>
  )
}

const SearchByFieldDropdown = (props) => {
  return(
    <div className="filter-dropdown dropdown">
      <h4 className="mt-0 mb-1">Search by fields:</h4>
      <input 
        type="checkbox"
        className=""
        id="title_checkbox"
        value="Title"
        onChange={(e) => { props.handleFieldCheckedChange('title', e.target.checked) }}
        checked={props.searchFields.title}
      />
      <label htmlFor="title_checkbox">Title</label>

      <br />

      <input 
        type="checkbox"
        className=""
        id="text_body_checkbox"
        value="Body"
        onChange={(e) => { props.handleFieldCheckedChange('text_body', e.target.checked) }}
        checked={props.searchFields.text_body}
      />
      <label htmlFor="text_body_checkbox">Body</label>

      <div
        className=""
        style={{marginTop: '1em'}}
      >
        <div 
          className="btn-primary"
          onClick={props.handleFieldFilterSubmit}
        >
          Apply
        </div>
      </div>
    </div>
  )
} 

// const TypeFilterDropdown = (props) => {
//   return(
//     <div 
//       className="filter-dropdown dropdown"
//       style={{width: '250px'}}
//     >
//       <input 
//         type="checkbox"
//         className=""
//         id="space_checkbox"
//         value="Space"
//         onChange={(e) => { props.handleSpaceTypeCheckedChange(e.target.checked) }}
//         checked={props.isSpaceTypeChecked}
//       />
//       <label htmlFor="space_checkbox">Space</label>

//       <br />
//       <input 
//         type="checkbox"
//         className=""
//         id="activity_checkbox"
//         value="Activity"
//         onChange={(e) => { props.handleActivityTypeCheckedChange(e.target.checked) }}
//         checked={props.isActivityTypeChecked}
//       />
//       <label htmlFor="activity_checkbox">Captured content</label>

//       <div
//         className=""
//         style={{marginTop: '1em'}}
//       >
//         <div 
//           className="btn-primary"
//           onClick={props.handleTypeFilterSubmit}
//         >
//           Apply
//         </div>
//       </div>
//     </div>
//   )
// }

const ConnectionFilterDropdown = (props) => {
  return(
    <div className="filter-dropdown dropdown">
      <div>
        <CollectionsDropdown />
      </div>

      <div
        className=""
        style={{marginTop: '1em'}}
      >
        <div 
          className="btn-primary"
          onClick={props.handleConnectionFilterSubmit}
        >
          Apply
        </div>
      </div>
    </div>
  )
}

const Checkbox = (props) => {
  return(
    <input type={props.type} name={props.name} checked={props.checked} onChange={props.onChange} />
  )
} 

