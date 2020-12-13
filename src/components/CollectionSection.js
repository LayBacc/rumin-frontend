import React, { useState, useContext, useEffect } from 'react'
import { ContentASDropdown } from './ContentASDropdown'
import { ClickHandler } from './ClickHandler'
import { CollectionResults } from './CollectionResults'
import { CustomCollectionResults } from './CustomCollectionResults'
import { CapturedSpaceCard } from './RelatedSectionCard'
import { SuggestionsSection } from './SuggestionsSection'
import { ResultFilters } from './ResultFilters'
import uuidv4 from "uuid/v4";

export const CollectionSection = (props) => {
	const [filterQuery, setFilterQuery] = useState('')
	const [viewType, setViewType] = useState('list')
	const [currTab, setCurrTab] = useState('subpages')

	const [showControls, setShowControls] = useState(false)

	const [references, setReferences] = useState([])
  const [hasFetchedReferences, setHasFetchedReferences] = useState(false)
  const [isFetchingReferences, setIsFetchingReferences] = useState(false)

  const [graphViews, setGraphViews] = useState([])
  const [hasFetchedGraphViews, setHasFetchedGraphViews] = useState(false)
  const [isFetchingGraphViews, setIsFetchingGraphViews] = useState(false)

  // fetch content from the same url
  const [urlObj, setUrlObj] = useState(null)
  const [hasFetchedUrlObj, setHasFetchedUrlObj] = useState(false)
  const [isFetchingUrlObj, setIsFetchingUrlObj] = useState(false)

	useEffect(() => {
    if (props.isNewSpace) return

    if (!hasFetchedReferences && !isFetchingReferences) {
      fetchReferences()
    }

    if (!hasFetchedGraphViews && !isFetchingGraphViews) {
      fetchGraphViews()
    }

    if (props.space && props.space.custom_fields && props.space.custom_fields.url && !hasFetchedUrlObj && !isFetchingUrlObj) {
      fetchUrlObj()
    }
  })

	const getFilteredResults = () => {
		if (!props.space.collection_data) return []

		return props.space.collection_data.filter(result => {
			const query = filterQuery.toLowerCase()

			return result.title.toLowerCase().includes(query) || JSON.stringify(result.json_body).toLowerCase().includes(query)
		})
	}

  const fetchReferences = () => {
    if (hasFetchedReferences || isFetchingReferences) return

    setIsFetchingReferences(true)

    // const url = props.space ? `/api/v1/spaces/${props.space.id}/references` : `/api/v1/activities/${props.activity.id}/references`
    const url = `/api/v1/spaces/${props.space.id}/references`

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

  const fetchGraphViews = () => {
  	if (hasFetchedGraphViews || isFetchingGraphViews) return

    setIsFetchingGraphViews(true)

    const url = `/api/v1/graph_views/?content_id=${props.space.id}`

    fetch(url, {
      method: 'GET',
      headers: {
        'Content-type': 'application/json'
      }
    })
    .then(res => {
      if (!res.ok) {
        setHasFetchedGraphViews(true)
       
        throw new Error(res.status)
      }
      else return res.json()
    })
    .then(data => {
      setGraphViews(data)
      setHasFetchedGraphViews(true)
      setIsFetchingGraphViews(false)
    })
    .catch(error => {
      console.log('error: ' + error)
    })
  }

  const fetchUrlObj = () => {
    if (!props.space.custom_fields || !props.space.custom_fields.url || hasFetchedUrlObj || isFetchingUrlObj) return

    setIsFetchingUrlObj(true)

    const url = `/api/v1/url/${encodedSpaceUrl()}`

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

  const encodedSpaceUrl = () => {
    return encodeURIComponent(encodeURIComponent(props.space.custom_fields.url))
  }

  const buildDefaultCollectionTabs = () => {
  	const defaultTabsData = [
      {
        name: 'subpages',
        displayName: 'Subpages',
        description: 'Pages contained in this page. Similar to files in a folder.'
      },
      {
        name: 'mentions',
        displayName: 'Backlinks',
        description: 'Other pages referencing this page'
      },
      {
      	name: 'graph_views',
      	displayName: 'Canvases',
      	description: 'Visual Canvases that this Page is a part of'
      },
      {
      	name: 'suggestions',
      	displayName: 'Suggestions',
      	description: 'Related content suggetsed by the Rumin AI engine',
      	faIcon: 'fa-lightbulb-o'
      }
    ]

    return defaultTabsData.map(tab => buildCollectionTab(tab))
  }

  const buildSameUrlTab = () => {
  	if (!props.space.custom_fields || !props.space.custom_fields.url) return ''

  	return buildCollectionTab({ name: 'sameUrl',
      displayName: 'From the same web page',
      description: 'Pages that link to, or contain the current page'
     })
  }

  const buildCustomCollectionTabs = () => {
  	if (!props.space.custom_fields) return ''

		const customCollectionTabData = Object.keys(props.space.custom_fields).filter(fieldName => {
      return Array.isArray(props.space.custom_fields[fieldName])
    }).map(fieldName => {
      return({
        name: fieldName,
        displayName: fieldName,
        description: `Property "${fieldName}"`
      })
    })

    return customCollectionTabData.map(tab => buildCollectionTab(tab))
  }

  const buildCollectionTab = (tab) => {
  	return(
  		<div
        className={`tab ${ currTab === tab.name ? 'active' : '' }`}
        onClick={() => { setCurrTab(tab.name) }}
        title={tab.description}
      >
      	{ tab.faIcon ? (<i class={`fa ${tab.faIcon} nav-icon`}></i>) : '' }
      { tab.displayName }
      </div>
  	)
  }

	const buildCollectionTabs = () => {
		

		return(
      <div className="feeds-section mb-1"
        style={{padding: '0'}}
      >
        <div className="feed-tabs tabs">
        	{ buildDefaultCollectionTabs() }
        	{ buildSameUrlTab() }
          { buildCustomCollectionTabs() }
        </div>
      </div>
    )
	}

	const buildSubpagesCollection = () => {
		let blankMsg

		if (!props.space.collection_data || props.space.collection_data.length === 0) {
			blankMsg = (
				<div className="gray-text">
					<p>Create a new subpage or add an existing page to this collection.</p>
					<p>You can use this like a folder.</p>
				</div>
			)
		}

		return(
			<div>
				{ blankMsg }

				<div className="flex flex-center mb-1" style={{minWidth: '660px'}}>

					{ 
					  viewType === 'list' ? 
						<NewItemBtn 
							{...props}
							addToCollection={props.addToCollection} 
						/>
						: ''
					} 

					<CollectionControls 
						filterQuery={filterQuery}
						setFilterQuery={setFilterQuery}
						viewType={viewType}
						setViewType={setViewType}
						showControls={showControls}
					/>
				</div>

				<CollectionResults 
					{...props}
					viewType={viewType}
					results={getFilteredResults()} 
				/>
			</div>
		)
					// <CollectionViewBtn {...props} />
	}

	const buildMentionsCollection = () => {
		if (hasFetchedReferences && references.length === 0) {
			return(
				<div className="gray-text">
					<p>Other pages that reference this page (via subpages or hyperlinks) will be shown here.</p>
				</div>
			)
		}

		return(
      <CollectionResults 
        viewType="list"
        results={references}
        disableDrag={true}
      />
    )
	}

	const buildGraphViewsCollection = () => {
		if (hasFetchedGraphViews && graphViews.length === 0) {
			return(
				<div className="gray-text">
					<p>You can include this page in the <a href="/explorer">Graph Explorer</a>, to visually edit, and connect it with other content you have.</p>
				</div>
			)
		}

		return graphViews.map(view => {
			return(
				<div className="page-card"
				>
					<a href={`/explorer?viewId=${view.id}&viewTitle=${view.title}`}>{ view.title || 'Untitled' }</a>
				</div>
			)
		})
	}

	const buildSuggestionsCollection = () => {
		return(
			<SuggestionsSection
        space={props.space} 
        updateSpace={props.updateSpace}
      />
		)
	}

	const buildSameUrlCollection = () => {
    if (!urlObj) return ''

    // exclude the current page
    const results = urlObj.results.filter(a => {
      return a.id !== props.space.id
    })
  
    if (results.length === 0) return ''

    const cardElements = results.map(content => {
    	return(
        <CapturedSpaceCard 
        	truncatedUrl={urlObj.truncated_url}
          space={content} 
          disableDrag={true}
        />
      ) 
    })

        //<div className="mb-1">
//          <a href={`/url/${encodedSpaceUrl()}`}><i className="fa fa-arrow-right"></i> See all</a>
//        </div>
    return(
      <div>
        { cardElements }
      </div>
    )
  }

	const buildCustomCollection = () => {
    return(
      <CustomCollectionResults 
        {...props}
        content={props.space}
        fieldName={currTab}
      />
    )
  }

	const buildCollectionTabContent = () => {
		// TODO - reuse code from PageTabContent for Activities
		switch (currTab) {
      case 'subpages': 
        return buildSubpagesCollection()
      case 'mentions': 
        return buildMentionsCollection()
      case 'graph_views':
      	return buildGraphViewsCollection()
      case 'suggestions':
      	return buildSuggestionsCollection()
      case 'sameUrl':
      	return buildSameUrlCollection()
      default:
      	return buildCustomCollection()
    }
	}

	// const buildFileDropZone = () => {
	// 	return(
	// 		<div 
	// 			className="page-card"
	// 			style={{height: '5em', textAlign: 'center', backgroundColor: '#f6f6f6'}}
	// 		>
	// 			foobar
	// 		</div>
	// 	)
	// }

	const buildCollectionControls = () => {
		return(
			<div className="mb-1">
				<div className="inline-block default-border clickable mr-1">
					<small>Default view <i className="fa fa-caret-down"></i></small>
				</div>
				<div className="inline-block">
					<span>View as: </span> 
					<div 
						className="inline-block default-border clickable"
					>
						<small>Default view <i className="fa fa-caret-down"></i></small>
					</div>
				</div>
			</div>
		)
	}

	return(
		<div 
			className="collection-section"
			onMouseEnter={() => setShowControls(true)}
			onMouseLeave={() => setShowControls(false)}
		>
			{ buildCollectionTabs() }
			{ buildCollectionTabContent() }
		</div>
	)
}

const CollectionViewBtn = (props) => {
	const [showMenuDropdown, setShowMenuDropdown] = useState(false)
	// const [showASDropdown, setShowASDropdown] = useState(false)

	const buildDropdown = () => {
		if (!showMenuDropdown) return ''

		return(
			<ClickHandler
				close={() => setShowMenuDropdown(false)}
			>
				<div className="dropdown collections-dropdown">
					<div 
						className="dropdown-action"
						onClick={() => setShowMenuDropdown(false)}
					>
						Default view
					</div>
				</div>
			</ClickHandler>
		)
	}

	return(
		<div className="">
			<div 
				role="button"
				className="inline-block clickable small-text"
				onClick={() => setShowMenuDropdown(true)}
				style={{ color: '#777', padding: '4px'}}
			>Default view <img src="https://storage.googleapis.com/rumin-gcs-bucket/static/caret-down.png" style={{width: '12px', marginLeft: '3px', marginRight: '0'}} /></div>

			{ buildDropdown() }
		</div>
	)
}

const NewItemBtn = (props) => {
	const [showMenuDropdown, setShowMenuDropdown] = useState(false)
	const [showASDropdown, setShowASDropdown] = useState(false)

	const handleNewPageClick = () => {
		const newSpaceId = uuidv4()

		const body = { title: '', parent_id: props.space.id }

		fetch(`/api/v1/spaces/${newSpaceId}/`, {
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
		.then(space => {
			props.addToCollection(space)
			setShowMenuDropdown(false)
		})
		.catch(error => {
			console.log('error: ' + error)
		})
	}

	const handleAddPageClick = () => {
		setShowMenuDropdown(false)
		setShowASDropdown(true)
	}

	const handleSelectContent = (content) => {
		props.addToCollection(content)
	}

	const buildASDropdown = () => {
		if (!showASDropdown) return ''

		// reuse code in 
		return(
			<ClickHandler
				close={() => setShowASDropdown(false)}
			>
				<ContentASDropdown 
					closeDropdown={() => setShowASDropdown(false)}
					selectContent={handleSelectContent}
				/>
			</ClickHandler>
		)
	}

	const buildDropdown = () => {
		if (!showMenuDropdown) return ''

		return(
			<ClickHandler
				close={() => setShowMenuDropdown(false)}
			>
				<div className="dropdown collections-dropdown">
					<div 
						className="dropdown-action"
						onClick={handleNewPageClick}
					>
						Create a new subpage
					</div>
					<div 
						className="dropdown-action"
						onClick={handleAddPageClick}
					>
						Add an existing page
					</div>
				</div>
			</ClickHandler>
		)
	}

	return(
		<div className="mr-1">
			<div 
				role="button"
				className="btn inline-block gray-text"
				onClick={() => setShowMenuDropdown(true)}
			>+ Add subpage</div>

			{ buildDropdown() }
			{ buildASDropdown() }
		</div>
	)
}

const CollectionControls = (props) => {
	return(
		<div className={`inline-block ${props.showControls ? '' : 'hidden'}`} style={{marginLeft: 'auto'}}>
			<ResultFilters 
				query={props.filterQuery}
				handleQueryChange={(e) => { props.setFilterQuery(e.target.value) }}
			/>

			<div className="btn-group inline-block ml-1">
				<div 
					className={`view-btn btn inline-block clickable ${props.viewType === 'list' ? 'active' : ''}`}
					title="View collection as list"
					onClick={() => props.setViewType('list')}
				>
					<i className="fa fa-list-ul"></i>
				</div>
				
				<div 
					className={`view-btn btn inline-block clickable ${props.viewType === 'table' ? 'active' : ''}`}
					title="View collection as table"
					onClick={() => props.setViewType('table')}
				>
					<i className="fa fa-table"></i>
				</div>
			</div>
		</div>
	)
}
