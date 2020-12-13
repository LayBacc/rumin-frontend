import React, { useState } from "react"
import { HeaderSection } from "./HeaderSection"
import { BlockEditorSlate } from "./BlockEditorSlate"
import { PageTabContent } from "./PageTabContent"
import { SpaceOverviewSection } from './SpaceOverviewSection'
import { CollectionSection } from './CollectionSection'
import { FieldsForm } from './FieldsForm'
import { PageTabs } from './PageTabs'
import { MoveToMenu } from './CardContextMenu'
import { IconMenu } from './IconMenu'
import { ClickHandler } from './ClickHandler'
import { clearAllBodyScrollLocks } from 'body-scroll-lock'
import AppContext from './AppContext'

import queryString from 'query-string'

import moment from 'moment'
import { withRouter } from "react-router"

class SpacePage extends React.Component {
  static contextType = AppContext

  constructor(props, context) {
    super(props, context);

    this.addSpaceActivity = this.addSpaceActivity.bind(this)
    this.hideSpaceActivity = this.hideSpaceActivity.bind(this)
    this.removeSpaceActivity = this.removeSpaceActivity.bind(this)

    this.updateCustomFields = this.updateCustomFields.bind(this)

    // collection
    this.updateCollectionItem = this.updateCollectionItem.bind(this)
    this.addToCollection = this.addToCollection.bind(this)
    this.removeFromCollection = this.removeFromCollection.bind(this)
    this.moveInCollection = this.moveInCollection.bind(this)
    this.updateCollectionData = this.updateCollectionData.bind(this)

    // tags
    this.handleAddTag = this.handleAddTag.bind(this)
    this.handleRemoveTag = this.handleRemoveTag.bind(this)

    this.updateTimestamp = this.updateTimestamp.bind(this)
    this.updateSpace = this.updateSpace.bind(this)
    this.updateCurrTab = this.updateCurrTab.bind(this)

    this.handleHTMLExportClick = this.handleHTMLExportClick.bind(this)
    this.handleTitleChange = this.handleTitleChange.bind(this)
    this.handleTitleBlur = this.handleTitleBlur.bind(this)
    this.handleTitleKeyDown = this.handleTitleKeyDown.bind(this)
    this.handleAccessBtnClick = this.handleAccessBtnClick.bind(this)
    this.handleFillCollectionDetailsClick = this.handleFillCollectionDetailsClick.bind(this)
    this.addToFavorites = this.addToFavorites.bind(this)
    this.removeFromFavorites = this.removeFromFavorites.bind(this)
    this.archiveSpace = this.archiveSpace.bind(this)
    this.unarchiveSpace = this.unarchiveSpace.bind(this)
    this.setIsArchived = this.setIsArchived.bind(this)

    this.showIconMenu = this.showIconMenu.bind(this)
    this.hideIconMenu = this.hideIconMenu.bind(this)

    this.handleSaveCopy = this.handleSaveCopy.bind(this)

    this.state = {
      // listItems: this.initDemoListItems(),
      accessDenied: false,
      space: { id: this.getSpaceId() },
      isDataFetched: false,
      isModalDataFetched: false,
      title: '',
      json_body: [], 
      activities: [],
      showPageMenu: false,
      showIconMenu: false,
      copiedPage: {},
      isFetchingTags: false,
      hasFetchedTags: false,
      tags: [],
      currTab: this.activeTab() || 'overview'
    };

  }

  shouldReload(prevProps) {
    return (this.state.isDataFetched || this.isNewSpace()) && this.props.location.pathname !== prevProps.location.pathname && !this.hasModal()
  }

  componentDidUpdate(prevProps) {
    // route change
    if (this.shouldReload(prevProps)) {
      // location
      location.reload()
    }

    if (this.hasModal() && !this.context.isModalOpen) {
      this.context.openModal()
      this.context.updateModalSpaceId(this.modalSpaceId())
    }
  }

  componentDidMount() {    
    if (!this.state.isDataFetched) {
      fetch(`/api/v1/spaces/${this.getSpaceId()}/`, {
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
        const hash = location.hash
        this.props.history.replace()
        location.hash = hash

        this.setState({ 
          space: data,
          title: data.title, 
          json_body: data.json_body,
          isDataFetched: true 
        })

        if (data.title) {
          document.title = `${data.title} | Rumin`
        }
      })
      .catch(error => {
        
      })
    }

    if (!this.state.hasFetchedTags && !this.state.isFetchingTags) {
      fetch(`/api/v1/spaces/${this.getSpaceId()}/in_collections/`, {
        method: 'GET',
        headers: {
          'Content-type': 'application/json'
        }
      }) 
      .then(res => {
        if (!res.ok) {
          if (res.status === 401) {
            // this.setState({ accessDenied: true })
          }
          throw new Error(res.status)
        }
        else return res.json()
      })
      .then(data => {
        const hash = location.hash
        this.props.history.replace()
        location.hash = hash

        this.setState({ 
          tags: data,
          isFetchingTags: false,
          hasFetchedTags: true 
        })
      })
      .catch(error => {
        
      })
    }

    // for the modal Space
    if (this.hasModal() && !this.state.isModalDataFetched) {
      // TODO - 
      // console.log('TODO - fetch modal Space')
      // console.log('this.context', this.context)
      // this.context.openModal()
    }
  }

  activeTab() {
    return queryString.parse(location.search)['activeTab']
  }

  showIconMenu() {
    this.setState({ showIconMenu: true })
  } 

  hideIconMenu() {
    this.setState({ showIconMenu: false })
  } 

  // convert collection to an array to be saved
  collectionIds() {
    return this.state.space.collection_data.map(c => {
      return { id: c.id, type: c.content_type }
    })
  }

  updateCustomFields(customFields, customFieldTypes) {
    this.setState({
      space: {
        ...this.state.space,
        custom_fields: customFields,
        custom_field_types: customFieldTypes
      }
    })
  }

  updateCollectionItem(content) {
    const updated = this.state.space.collection_data.map(c => {
      return c.id === content.id ? content : c
    })

    this.setState({
      space: {
        ...this.state.space,
        collection_data: updated
      }
    })
  }

  addToCollection(content) {
    const collectionData = this.state.space.collection_data
    // console.log('collectionData in addToCollection', [content, ...collectionData])
    this.updateCollectionData([content, ...collectionData])
  } 

  removeFromCollection(content, noSync) {
    const collectionData = this.state.space.collection_data.filter(c => c.id !== content.id)
    this.updateCollectionData(collectionData, noSync)
  }

  // move content to after precedingContent
  moveInCollection(movedContent, precedingContent) {
    console.log('moveInCollection', movedContent, precedingContent)

    const currRemoved = this.state.space.collection_data.filter(c => c.id !== movedContent.id)

    const precedingIndex = currRemoved.findIndex(c => c.id === precedingContent.id)  
    
    if (precedingIndex >= currRemoved.length-1) {
      this.updateCollectionData([...currRemoved, movedContent])
      return
    }

    const currAdded = [...currRemoved.slice(0, precedingIndex+1), movedContent, ...currRemoved.slice(precedingIndex+1,)]
    this.updateCollectionData(currAdded)
  }

  updateCollectionData(newData, noSync) {
    this.setState({
      space: {
        ...this.state.space,
        collection_data: newData
      }
    }, () => {
      if (!noSync) {
        this.saveCollection()
      }
    })
  }

  saveCollection() {
    const body = { collection: this.collectionIds() }

    fetch(`/api/v1/spaces/${this.getSpaceId()}/`, {
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
  }

  hasModal() {
    return !!this.modalSpaceId()
  }

  modalSpaceId() {
    const query = queryString.parse(location.search)

    return query.p
  }

  initDemoListItems() {
    return [];
  }

  // FIXME - outdated
  handleAddBlockClick() {
    this.setState(prevState => ({
      listItems: [...prevState.listItems, {}]
    }));
  }

  // updateEditorValue(value, text_value) {
  //   this.setState({
  //     json_body: value
  //   })
  // }
 
  getSpaceId() {
    return this.props.match.params.id
  }

  handleTitleChange(e) {
    this.setState({ title: e.target.value })
  }

  handleTitleBlur() {
    const body = { title: this.state.title }

    fetch(`/api/v1/spaces/${this.getSpaceId()}/`, {
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
      // success
      // console.log('updated title', data)
      this.setState({
        space: {
          ...this.state.space,
          title: data.title
        }
      })
    })
    .catch(error => {
      console.log('error: ' + error)
    })
  }

  handleTitleKeyDown(e) {
    // TODO - on "Enter" - shift focus to Editor

  }

  handleAccessBtnClick() {
    this.setIsPublic(!this.state.space.is_public)
  }

  handleFillCollectionDetailsClick() {
    // TODO - send a request to the server
    console.log('handleFillCollectionDetailsClick')
  }

  handleSaveCopy() {
    fetch(`/api/v1/spaces/${this.state.space.id}/copy/`, {
      method: 'POST',
      headers: {
        'Content-type': 'application/json'
      }
    })
    .then(res => {
      if (!res.ok) throw new Error(res.status)
      else return res.json()
    })
    .then(data => {
      this.setState({ copiedPage: data })
    })
    .catch(error => {
      console.log('error: ' + error)
    })
  } 

  handleHTMLExportClick(click) {
    this.clickChild = click
  }

  handleAddTag(space) {
    this.setState({
      tags: [...this.state.tags, space]
    })

    fetch(`/api/v1/spaces/${this.state.space.id}/move/`, {
      method: 'POST',
      headers: {
        'Content-type': 'application/json'
      },
      body: JSON.stringify({ copy: true, new_parent_id: space.id })
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
  }

  handleRemoveTag(space) {
    // remove the tag in the state
    const updatedTags = this.state.tags.filter(tag => tag.id !== space.id)
    this.setState({
        tags: updatedTags
    })

    fetch(`/api/v1/spaces/${this.state.space.id}/move/`, {
      method: 'POST',
      headers: {
        'Content-type': 'application/json'
      },
      body: JSON.stringify({ remove_from_id: space.id })
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
  }

  addToFavorites() {
    fetch(`/api/v1/spaces/${this.state.space.id}/favorite/`, {
      method: 'POST',
      headers: {
        'Content-type': 'application/json'
      }
    })
    .then(res => {
      if (!res.ok) throw new Error(res.status)
      else return res.json()
    })
    .then(data => {
      this.setState({
        space: {
          ...this.state.space,
          is_favorite: true
        }
      })
    })
    .catch(error => {
      console.log('error: ' + error)
    })
  }

  removeFromFavorites() {
    fetch(`/api/v1/spaces/${this.state.space.id}/favorite/`, {
      method: 'DELETE',
      headers: {
        'Content-type': 'application/json'
      }
    })
    .then(res => {
      if (!res.ok) throw new Error(res.status)
      else return res.json()
    })
    .then(data => {
      this.setState({
        space: {
          ...this.state.space,
          is_favorite: false
        }
      })
    })
    .catch(error => {
      console.log('error: ' + error)
    })
  }

  addSpaceActivity(activity) {
    const body = { id: activity.id }
    fetch(`/api/v1/spaces/${this.state.space.id}/activities/`, {
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
    .then(data => {
      console.log('added to space', data)
      
      this.setState({ 
        space: {
          ...this.state.space,
          activities: [...this.state.space.activities, activity]
        }
      })
    })
    .catch(error => {
      console.log('error: ' + error)
    })
  }

  removeSpaceActivity(activity) { 
    const body = { id: activity.id }
    fetch(`/api/v1/spaces/${this.state.space.id}/activities/`, {
      method: 'DELETE',
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
      console.log('removed from space', data)
      
      this.setState({ 
        space: {
          ...this.state.space,
          activities: this.state.space.activities.filter(a => a.id !== activity.id)
        }
      })
    })
    .catch(error => {
      console.log('error: ' + error)
    })
  }

  hideSpaceActivity(activity) {
    this.setState({ 
      space: {
        ...this.state.space,
        activities: this.state.space.activities.filter(a => a.id !== activity.id)
      }
    })
  }

  setIsArchived(isArchived) {
    fetch(`/api/v1/spaces/${this.state.space.id}/`, {
      method: 'PATCH',
      headers: {
        'Content-type': 'application/json'
      },
      body: JSON.stringify({ is_archived: isArchived })
    })
    .then(res => {
      if (!res.ok) throw new Error(res.status)
      else return res.json()
    })
    .then(data => {
      console.log('successfully archived')
      this.setState({
        space: {
          ...this.state.space,
          is_archived: isArchived
        }
      })
    })
    .catch(error => {
      console.log('error: ' + error)
    })
  }

  setIsPublic(isPublic) {
    console.log('in setIsPublic', isPublic)

    fetch(`/api/v1/spaces/${this.state.space.id}/`, {
      method: 'PATCH',
      headers: {
        'Content-type': 'application/json'
      },
      body: JSON.stringify({ is_public: isPublic })
    })
    .then(res => {
      if (!res.ok) throw new Error(res.status)
      else return res.json()
    })
    .then(data => {
      console.log('successfully updated access')
      this.setState({
        space: {
          ...this.state.space,
          is_public: isPublic
        }
      })
    })
    .catch(error => {
      console.log('error: ' + error)
    })
  }

  archiveSpace() {
    this.setIsArchived(true)
  }

  unarchiveSpace() {
    this.setIsArchived(false)
  }

  isNewSpace() {
    return this.props.location.state && this.props.location.state.isNew
  }

  getNewParent() {
    if (!this.props.location.state) return null
    return this.props.location.state.parent
  }

  userIsAuthenticated() {
    return window.django.user.is_authenticated
  }

  userIsAuthor() {
    return this.userIsAuthenticated() && window.django.user.id.toString() == this.state.space.user
  }

  updateCurrTab(tab) {
    this.setState({ currTab: tab })
  }

  updateSpace(space) {
    this.setState({
      space: space,
      json_body: space.json_body
    })
  }

  updateTimestamp(space) {
    this.setState({
      space: {
        ...this.state.space,
        updated_at: space.updated_at
      }
    })
  }

  // buildArchive() {
  //   if (!this.userIsAuthor()) return ''

  //   if (this.state.space.is_archived) {
  //     return(
  //       <div
  //         className="archive-btn inline-block"
  //         onClick={this.unarchiveSpace}
  //       >
  //         Unarchive
  //       </div>
  //     )
  //   }

  //   return(
  //     <div
  //       className="archive-btn inline-block"
  //       onClick={this.archiveSpace}
  //     >
  //       Archive
  //     </div>
  //   )
  // }

  buildCanvasBtn() {
    return(
      <div className="inline-block">
        <a href={`/explorer?newTab=true&spaceId=${this.state.space.id}`}
          title="Open in Canvas"
        >
          <img src="https://storage.googleapis.com/rumin-gcs-bucket/static/icon-network-gray.png" className="" style={{width: '16px'}} />
        </a>
      </div>
    )
  }

  buildAccessBtn() {
    if (!this.userIsAuthor()) return ''

    return(
      <div 
        className="ml-1 inline-block" 
        title="Control read access for people with a link to this page"
      >
        <label className="toggle-switch">
          <input
            type="checkbox"
            checked={this.state.space.is_public} 
            onClick={this.handleAccessBtnClick}
          />
          <span className="slider round"></span>
        </label>
        <div className="toggle-label-container">
          <span className="toggle-label">{ this.state.space.is_public ? 'Public' : 'Private' }</span>
        </div>
      </div>
    )
  }

  buildPageMenuItems() {
    if (!this.state.showPageMenu) return ''

    return(
      <ClickHandler
        close={() => this.setState({showPageMenu: false})}
      >
        <MenuDropdown 
          closeDropdown={() => this.setState({showPageMenu: false})}
          clickChild={this.clickChild}
          userIsAuthor={this.userIsAuthor.bind(this)}
          userIsAuthenticated={this.userIsAuthenticated}
          addToFavorites={this.addToFavorites}
          removeFromFavorites={this.removeFromFavorites}
          space={this.state.space}
          unarchiveSpace={this.unarchiveSpace}
          archiveSpace={this.archiveSpace}
          handleAccessBtnClick={this.handleAccessBtnClick}
          fillCollectionDetails={this.handleFillCollectionDetailsClick}
        >
        </MenuDropdown>
      </ClickHandler>
    )
    // 
    // TODO
    // we can copy from HeaderSection as well
    return 'hello'
  }

  buildPageMenu() {
    // return ''
    return(
      <div
        className="more-actions"
      >
        <div 
          className="icon-container"
          role="button"
          onClick={() => this.setState({ showPageMenu: !this.state.showPageMenu })}
        >
            <i className="fa fa-ellipsis-h"></i>
        </div>
        { this.buildPageMenuItems() }
      </div>
    )
  }

  buildPublicBanner() {
    return '' // reading experience  

    // if (!this.userIsAuthenticated()) {
    //   return(
    //     <div className="archive-banner">
    //       The changes you make here will not be saved. <a href={`/users/login?next=${location.pathname}`} style={{color: 'white', textDecoration: 'underline'}}>Log in</a> to create your own page.
    //     </div>
    //   )
    // }

    // if (!this.userIsAuthor() && this.state.isDataFetched) {
    //   return(
    //     <div className="archive-banner">
    //       Your access to this page is read-only. The changes you make here will not be saved.
    //     </div>
    //   )
    // }
  }

  buildArchivedBanner() {
    if (!this.state.space.is_archived) return ''

    return(
      <div className="archive-banner">
        This page is archived. It will not appear in your search results or the graph view.
      </div>
    )
  }

  buildParentHeader() {
    // if (this.isNewSpace()) { 
    //   if (!this.getNewParent()) return

    //   return(
    //     <div style={{color: '#858585'}} className="mb-1">
    //       <a href={`/spaces/${this.getNewParent().id}`} style={{color: '#858585'}}>{this.getNewParent().title}</a> / {this.state.title || 'Untitled'}
    //     </div>
    //   )
    // }

    if (!this.state.space.parent) return ''

    // const ancestry = <a href={`/spaces/${this.state.space.parent.id}`} style={{color: '#858585'}}>{this.state.space.parent.title}</a>

    const ancestry = this.state.space.ancestry_data.map(obj => {
      return(
        <span>
          <a href={`/spaces/${obj.id}`} style={{color: '#858585'}}> {obj.title} </a>
          <span style={{color: '#aaa'}}> {">"} </span>
        </span>
      )
    })

    return(
      <div style={{color: '#858585'}} className="">
        {ancestry} { this.state.space.title || this.state.title || 'Untitled' }
      </div>
    )
  }

  buildCreatedAtTimestamp() {
    const createdAt = moment(this.state.space.created_at);
    return createdAt.calendar();
  }

  buildUpdatedAtTimestamp() {
    const updatedAt = moment(this.state.space.updated_at);
    return updatedAt.calendar();
  }

  buildSourceUrl() {
    if (!this.state.space.custom_fields || !this.state.space.custom_fields.url) return ''

    return(
      <div className="mb-1">
        <i className="fa fa-globe mr-1 align-top"></i> 
        <a 
          href={this.state.space.custom_fields.url}
          className="inline-block"
          style={{
            maxWidth: '300px',
            textOverflow: 'ellipsis',
            overflow: 'hidden'
          }}
          target="_blank"
        >{ this.state.space.custom_fields.url }</a>
        <i className="fa fa-external-link small-icon align-top"></i>
      </div>
    )
  }

  // buildBasicInfoBtn() {
  //   // TODO - importance, and urgency (scheduling)
  //   if (!this.userIsAuthor()) return ''

  //   return(
  //     <FieldsForm 
  //       space={this.state.space}
  //     />
  //   )
  // }

  buildLoadingGIF() {
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
 
  buildEditor() {
    return(
      <BlockEditorSlate 
        placeholder="✏️ Add notes, or link to existing thoughts"
        content_type="Space"
        content={this.state.space}
        value={this.state.json_body}
        userIsAuthor={this.userIsAuthor()}
        readOnly={!this.userIsAuthor()}
        setExportHTMLClick={click => this.clickChild = click}
        updateSpace={this.updateSpace}
        updateTimestamp={this.updateTimestamp}
      />
    )
  }

  // buildIcon() {
  //   if (!this.state.space.icon) return ''

  //   if (this.state.showIconMenu) {
  //     return(
  //       <IconMenu 
  //         space={this.state.space}
  //         updateSpace={this.updateSpace}
  //         showDropdown={true}
  //       />
  //     )
  //   }

  //   return(
  //     <div 
  //       className="space-icon-container clickable"
  //       onClick={this.showIconMenu}
  //     >
  //       <img 
  //         src={this.state.space.icon}
  //         className="space-icon" 
  //       />
  //     </div>
  //   )
  // }

  buildIconMenu() {
    if (this.state.space.icon) {
      return(
        <IconMenu 
          space={this.state.space}
          updateSpace={this.updateSpace}
        />
      )
    }

    if (!this.state.showIconMenu) {
      return(
        <div 
          className="" 
          style={{minHeight: '2.5em'}}
          onMouseOver={this.showIconMenu}
        >
        </div>
      )
    }

    return(
      <div 
        className="" 
        style={{minHeight: '2.5em'}}
        onMouseOver={this.showIconMenu}
      >
        <IconMenu 
          space={this.state.space}
          updateSpace={this.updateSpace}
        />
      </div>
    )
  }

  buildSpaceTitle() {
    if (this.state.accessDenied) return ''

    if (!this.state.isDataFetched) return ''

    if (!this.userIsAuthor() && !this.isNewSpace()) {
      return(
        <h1>{this.state.title}</h1>
      )
    }

    return(
      <input
        className="mb-0 space-title"
        value={this.state.title}
        placeholder="Untitled page"
        onChange={this.handleTitleChange} 
        onBlur={this.handleTitleBlur}
        onKeyDown={this.handleTitleKeyDown}
        onMouseOver={this.showIconMenu}
        onMouseLeave={this.hideIconMenu}
        max="300"
      />
    )
  }

  buildSpaceContent() {
    if (this.state.accessDenied) {
      return(
        <div style={{padding: '2em', textAlign: 'center'}}>
          <p>You do not have the permission to access this page. </p>
          <p>
            Trying contacting the author to request for access.
          </p>
        </div>
      )
    }

    if (!this.isNewSpace() && !this.state.isDataFetched) return this.buildLoadingGIF()

    if (!this.userIsAuthor()) {
      return(
        <div style={{marginBottom: '1em'}}>
        { this.buildEditor() }
      </div>
      )
    }

    return(
      <div className="page-card" style={{marginBottom: '1em', minHeight: '15em'}}>
        { this.buildEditor() }
      </div>
    )
  }

  buildTabContentSection() {
    if (this.state.accessDenied) return ''

    return(
      <PageTabContent 
        {...this.props}
        updateCustomFields={this.updateCustomFields}
        // Collection
        updateCollectionItem={this.updateCollectionItem}
        addToCollection={this.addToCollection}
        removeFromCollection={this.removeFromCollection}
        moveInCollection={this.moveInCollection}
        isNewSpace={this.isNewSpace()}
        accessDenied={this.state.accessDenied}
        currTab={this.state.currTab}
        space={this.state.space} 
        json_body={this.state.json_body}
        handleHTMLExportClick={this.handleHTMLExportClick}
        updateTimestamp={this.updateTimestamp}
        updateSpace={this.updateSpace}
        addSpaceActivity={this.addSpaceActivity}
        removeSpaceActivity={this.removeSpaceActivity}
        hideSpaceActivity={this.hideSpaceActivity}
        isDataFetched={this.state.isDataFetched}
        userIsAuthor={this.userIsAuthor()}
      />
    )
  }

  buildCopyBtn() {
    // already copied
    if (this.state.copiedPage.id) {
      return(
        <a href={`/spaces/${this.state.copiedPage.id}`}>
          Saved
        </a>
      )
    }

    return(
      <button 
        className="link-btn"
        onClick={this.handleSaveCopy}
      >+ Save a copy</button>
    )
  }

  buildScreenshot() {
    if (!this.state.space.screenshot) return ''

    return(
      <div className="mb-1">
        <div class="gray-text small-text">Screenshot:</div>
        <img src={ this.state.space.screenshot } style={{maxWidth: '60%'}} />
      </div>
    )
  }

  buildTags() {
    if (this.state.isFetchingTags) {
      return(
        <div>
          <p className="small-text">fetching tags...</p>
        </div>
      )
    }

    return(
      <TagsSection 
        tags={this.state.tags}
        handleAddTag={this.handleAddTag}
        handleRemoveTag={this.handleRemoveTag}
      />
    )
  }

  buildCustomFields() {
    if (!this.state.space.custom_fields) return ''

    return(
      <div className="page-card prop-form" style={{paddingTop: '1em', paddingBottom: '1em'}}>
        <div>
          <div className="heading mb-1" style={{display: 'flex'}}>
            <span>
              <h5 className="mt-0 mb-0 inline-block med-weight" style={{color: '#666', marginRight: '0.5em'}}>Properties</h5>
              <i className="fa fa-question-circle small-icon" title="Properties about the current page/thought. These help Rumin structure and organize your knowledge better."></i>
            </span>
          </div>
          
          <FieldsForm 
            content={this.state.space}
            updateCustomFields={this.updateCustomFields}
          />  
        </div>
      </div>
    )
  }

  // buildSuggestionsSection() {
  //   return(
  //     <SuggestionsSection
  //       space={this.state.space} 
  //       updateSpace={this.updateSpace}
  //     />
  //   )
  // }

  // for read-only pages
  buildNavMenu() {
    if (this.userIsAuthenticated()) {
      return(
        <div 
          style={{marginLeft: 'auto'}}
          title="Save a copy to your own knowledge base"
        >
          { this.buildCopyBtn() }
        </div>
      )
    }

    return(
      <div style={{marginLeft: 'auto'}}>
        <a href="/users/login">Log in</a>
        <a href="/users/signup" class="btn-primary" style={{marginLeft: '2em'}}>Sign up</a>
      </div>
    )
  }

  render() {
    if (!this.isNewSpace() && this.state.space.title === undefined && this.state.space.json_body === undefined) {
      
      if (this.state.accessDenied) {
        // return('TODO - access denied')
        return(
          <div>
            <div 
              className="reading-page-header"
              style={{display: 'flex', alignItems: 'center'}}
            >
              <div>
                <a href="/" className="mb-0" style={{color: '#2D6EAB', fontFamily: 'Varela Round, sans-serif', display: 'flex', 'alignItems': 'center'}}>
                  <span style={{marginRight: '0.5em'}}>
                    <img src="https://storage.googleapis.com/rumin-gcs-bucket/static/pages/img/logo-search.png" className="logo-img" /> 
                  </span>
                  <span style={{fontSize: '1.1em'}}>Rumin</span>
                </a>
              </div>
              { this.buildNavMenu() }

            </div>
            <div style={{padding: '2em', textAlign: 'center'}}>
              <p>You do not have the permission to access this page. </p>
              <p>
                Trying contacting the author to request for access.
              </p>
            </div>
          </div>
        )
      }

      return(
        <div>
          { this.buildLoadingGIF() }
        </div>
      )
    }

    if (!this.userIsAuthor() && !this.isNewSpace()) {
      return(
        <div>
          <div 
            className="reading-page-header"
            style={{display: 'flex', alignItems: 'center'}}
          >
            <div>
              <a href="/" className="mb-0" style={{color: '#2D6EAB', fontFamily: 'Varela Round, sans-serif', display: 'flex', 'alignItems': 'center'}}>
                <span style={{marginRight: '0.5em'}}>
                  <img src="https://storage.googleapis.com/rumin-gcs-bucket/static/pages/img/logo-search.png" className="logo-img" /> 
                </span>
                <span style={{fontSize: '1.1em'}}>Rumin</span>
              </a>
            </div>
            { this.buildNavMenu() }

          </div>
          <div className="reading-page-body" style={{display: 'flex'}}>
            <div className="reading-main-line">
              { this.buildParentHeader() }

              { this.buildSpaceTitle() }

              <div className="page-timestamp">
                created { this.buildCreatedAtTimestamp() }
              </div>

              { this.buildTabContentSection() }
            </div>
            <div className="side-pane">
              
            </div>
          </div>
        </div>
      )
    }

    return(
      <div>
        <div className="main-content">
          <HeaderSection 
            {...this.props} 
          />

          <div 
            className="page-body gray-page-body"
            style={{whiteSpace: 'nowrap'}}
          >
            { this.buildPublicBanner() }
            { this.buildArchivedBanner() }

            <div className="space-main-line mx-auto">
              <div className="flex flex-center mb-1">
                { this.buildParentHeader() }
                <div className="right-side">
                  <a href={`/explorer?newTab=true&spaceId=${this.state.space.id}`} className="btn btn-primary">
                    Open in Canvas
                  </a>
                </div>
              </div>

              <div 
                className="page-card mb-1"
              >
                <div className="flex flex-center">
                  { this.buildIconMenu() }
                  <div className="right-side">
                    { this.buildPageMenu() }
                  </div>
                </div>


                { this.buildSpaceTitle() }

                <div className="page-timestamp">
                  created { this.buildCreatedAtTimestamp() }&nbsp;· last updated { this.buildUpdatedAtTimestamp() } 
                </div>

                { this.buildSourceUrl() }

                <SpaceOverviewSection
                  // SpaceMainTab
                  {...this.props}
                  updateCustomFields={this.updateCustomFields}
                  isNewSpace={this.isNewSpace()}
                  accessDenied={this.state.accessDenied}
                  space={this.state.space} 
                  json_body={this.state.json_body}
                  handleHTMLExportClick={this.handleHTMLExportClick}
                  updateTimestamp={this.updateTimestamp}
                  updateSpace={this.updateSpace}
                  addSpaceActivity={this.addSpaceActivity}
                  removeSpaceActivity={this.removeSpaceActivity}
                  hideSpaceActivity={this.hideSpaceActivity}
                  isDataFetched={this.state.isDataFetched}
                  userIsAuthor={this.userIsAuthor()}
                />

                { this.buildScreenshot() }

                { this.buildTags() }
              </div>

              { this.buildCustomFields() }

              <div className="page-card">
                <h5 className="mt-0 med-weight" style={{color: '#666', marginRight: '0.5em'}}>Related content</h5>

                <CollectionSection
                  {...this.props}
                    // Collection
                    updateCollectionItem={this.updateCollectionItem}
                    addToCollection={this.addToCollection}
                    removeFromCollection={this.removeFromCollection}
                    moveInCollection={this.moveInCollection}
                    updateCustomFields={this.updateCustomFields}
                    isNewSpace={this.isNewSpace()}
                    accessDenied={this.state.accessDenied}
                    space={this.state.space} 
                    json_body={this.state.json_body}
                    handleHTMLExportClick={this.handleHTMLExportClick}
                    updateTimestamp={this.updateTimestamp}
                    updateSpace={this.updateSpace}
                    addSpaceActivity={this.addSpaceActivity}
                    removeSpaceActivity={this.removeSpaceActivity}
                    hideSpaceActivity={this.hideSpaceActivity}
                    isDataFetched={this.state.isDataFetched}
                    userIsAuthor={this.userIsAuthor()}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

const MenuDropdown = (props) => {
  const [showMoveToMenu, setShowMoveToMenu] = useState(false)
  const [showAddToMenu, setShowAddToMenu] = useState(false)

  const handleHTMLExportClick = () => {
    props.clickChild()
  }

  const handleMoveToClick = () => {
    setShowMoveToMenu(true)
  }

  const handleAddToClick = () => {
    setShowAddToMenu(true)
  }

  const handleMoveSuccess = () => {
    clearAllBodyScrollLocks()
    props.closeDropdown()
    location.reload()
  }

  const buildAccessBtn = () => {
    if (!props.userIsAuthor()) return ''

    return(
      <div 
        className="ml-1 inline-block" 
        title="Control read access for people with a link to this page"
      >
        <label className="toggle-switch">
          <input
            type="checkbox"
            checked={props.space.is_public} 
            onClick={props.handleAccessBtnClick}
          />
          <span className="slider round"></span>
        </label>
        <div className="toggle-label-container">
          <span className="toggle-label">{ props.space.is_public ? 'Public' : 'Private' }</span>
        </div>
      </div>
    )
  }

  const buildArchive = () => {
    if (!props.userIsAuthor()) return ''

    if (props.space.is_archived) {
      return(
        <li 
          className="dropdown-action"
          onClick={props.unarchiveSpace}
        >
          <i className="fa fa-archive mr-1"></i> Unarchive
        </li>
      )
    }
        // <div
        //   className="archive-btn inline-block"
        // >
        // </div>

    return(
      <li 
        className="dropdown-action"
        onClick={props.archiveSpace}
      >
        <i className="fa fa-archive mr-1"></i> Archive
      </li>
    )
  }
      // <div
      //   className="archive-btn inline-block"
      //   onClick={props.archiveSpace}
      //   title="Archive: remove from your search and graph views"
      // >
      // </div>

  const buildStar = () => {
    if (!props.userIsAuthenticated()) return ''

    if (props.space.is_favorite) {
      return(
        <li 
          className="dropdown-action"
          onClick={props.removeFromFavorites}
        >
          <img src="https://storage.googleapis.com/rumin-gcs-bucket/static/icon-star-filled.png" style={{width: '14px'}} className="mr-1" />Remove from favorites
        </li>
      )
      // return(
        
      //   <div
      //     className="star-btn inline-block"
      //     style={{marginLeft: '1em'}}
      //     onClick={props.removeFromFavorites}
      //   >
      //     <img src="https://storage.googleapis.com/rumin-gcs-bucket/static/icon-star-filled.png" style={{width: '14px'}} />
      //   </div>
      // )
    }

    // return(
    //   <div
    //     title="Mark this page as favorite to pin it on the left pane"
    //     className="star-btn inline-block"
    //     // style={{marginLeft: '1em'}}
    //     onClick={props.addToFavorites}
    //   >
    //     <img src="https://storage.googleapis.com/rumin-gcs-bucket/static/icon-star.png" style={{width: '14px'}} />
    //   </div>
    // )
    return(
      <li 
        className="dropdown-action"
        onClick={props.addToFavorites}
      >
        <img src="https://storage.googleapis.com/rumin-gcs-bucket/static/icon-star.png" style={{width: '14px'}} className="mr-1" />Add to favorites
      </li>
    )
  }


  const buildCollectionFetchBtn = () => {
    // limit to my own use
    if (window.django.user.id !== 2) return ''

    return(
      <li 
        className="dropdown-action"
        onClick={props.fillCollectionDetails}
      >
        <i className="fa fa-magic mr-1"></i> Fetch
      </li>
    )
  }

  if (showMoveToMenu) {
    return(
      <MoveToMenu
        placeholder="Move to..."
        content={props.space}
        closeDropdown={() => clearAllBodyScrollLocks()}
        onSuccess={handleMoveSuccess}
      />
    )
  }

  if (showAddToMenu) {
    return(
      <MoveToMenu
        placeholder="Add to..."
        copy={true}
        content={props.space}
        closeDropdown={() => clearAllBodyScrollLocks()}
        onSuccess={handleMoveSuccess}
      />
    )
  }

  return(
    <div className="dropdown">
      <ul>
        <li
          className="dropdown-action"
          onClick={handleMoveToClick}
        >
          <i className="fa fa-share mr-1"></i> Move to
        </li>
        <li
          className="dropdown-action"
          onClick={handleAddToClick}
        >
          <i className="fa fa-tags mr-1"></i> Add to
        </li>
        <li className="dropdown-action" onClick={handleHTMLExportClick}>
          <i className="fa fa-download mr-1"></i> Export as HTML
        </li>

        { buildCollectionFetchBtn() }
        { buildArchive() }
        { buildStar() }
        { buildAccessBtn() }
      </ul>
    </div>
  )
}

const TagsSection = (props) => {
  const [showDropdown, setShowDropdown] = useState(false)
  const [spaceSuggestions, setSpaceSuggestions] = useState([]) // results
  const [query, setQuery] = useState('')

  const [queryTimer, setQueryTimer] = useState(null)

  const tagComponents = props.tags.map(space => {
    return(
      <div className="token">
        <span>
          <a href={`/spaces/${space.id}`} style={{color: '#777'}}>
            { space.title } 
          </a>
        </span>
        <div 
          className="remove-btn"
          onClick={() => props.handleRemoveTag(space)}
        >
          <svg viewBox="0 0 8 8" className="closeThick" style={{width: '8px', height: '8px', display: 'block', fill: 'inherit', flexShrink: 0, backfaceVisibility: 'hidden', opacity: 0.5}}><polygon points="8 1.01818182 6.98181818 0 4 2.98181818 1.01818182 0 0 1.01818182 2.98181818 4 0 6.98181818 1.01818182 8 4 5.01818182 6.98181818 8 8 6.98181818 5.01818182 4"></polygon></svg>
        </div>
      </div>
    )
  })

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

  const handleResultClick = (space) => {
    props.handleAddTag(space)
    setShowDropdown(false)
  }

  const buildResults = () => {
    if (query.length < 2) return ''

    return spaceSuggestions.map(space => {
      return(
        <div 
          className="as-result"
          onClick={() => handleResultClick(space)}
        >
          { space.title }
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

  const handleQueryKeyDown = (e) => {
    if (e.key === 'Escape') {
      props.closeDropdown()
    }
  }

  const handleQueryKeyUp = () => {
    clearTimeout(queryTimer)
    const timer = setTimeout(() => { fetchAutosuggest() }, 750)
    setQueryTimer(timer)
  }

  const buildDropdown = () => {
    if (!showDropdown) return ''

    return(
      <ClickHandler
        close={() => setShowDropdown(false)}
      >
        <div className="dropdown dropdown-narrow">
          <div className="collections-dropdown-container">
            <div className="collections-selected">
              <div className="collections-search-container">
                <input 
                  className="collections-search"
                  style={{padding: '0.5em'}} 
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
        </div>
      </ClickHandler>
    )
  }

  return(
    <div className="">
      <div className={ `space-tags ${ props.tags.length > 0 ? 'mr-1' : '' }` }>
        { tagComponents }
      </div>
      <div 
        className="inline-block"
      >
        <span
          className="small-text gray-text clickable"
          onClick={() => setShowDropdown(true)}
        >
          <i className="fa fa-tags btn-icon"></i> Add to collections
        </span>

        { buildDropdown() }
      </div>
    </div>
  )
}

export default withRouter(SpacePage)
