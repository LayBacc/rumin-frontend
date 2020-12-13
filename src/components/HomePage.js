import React, { useState } from 'react'
import { LeftPane } from './LeftPane'
import { HeaderSection } from './HeaderSection'
import { BlockEditorSlate } from './BlockEditorSlate'
import { MobileNewPostForm } from './ResultsPage'
import { ClickHandler } from './ClickHandler'
import moment from 'moment'
import { friendlyDateTimeStr } from '../utils/date_utils'
import uuidv4 from "uuid/v4";

import queryString from 'query-string'

import { withRouter } from 'react-router'

class HomePage extends React.Component {
  constructor(props, context) {
    super(props, context);

    this.handleNewSpaceClick = this.handleNewSpaceClick.bind(this)

    this.state = {
      currTab: 'graph_views', //'recent',
      isFetchingFavorite: false,
      isFetchingRecent: false,
      isFetchingGraphViews: false,
      isFavoriteSpacesFetched: false,
      isRecentContentFetched: false,
      hasFetchedGraphViews: false,
      // isFetchingCaptured: false,
      // isCapturedContentFetched: false,
      // capturedContent: [],
      recentContent: [],
      favoriteSpaces: [],
      graphViews: [],
      showMoreRecentPages: false,
      showMoreFavoritePages: false
    }
  }

  isMobile() {
    return window.django.is_mobile
  }

  componentDidMount() {    
    if (!this.state.isFavoriteSpacesFetched && !this.state.isFetchingFavorite) {
      this.setState({ isFetchingFavorite: true })

      fetch(`/api/v1/search?favorites=true&lite=true`, {
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
        this.setState({ 
          isFavoriteSpacesFetched: true,
          isFetchingFavorite: false,
          favoriteSpaces: data.results
        })
      })
      .catch(error => {
        
      })
    }

    if (!this.state.isRecentContentFetched && !this.state.isFetchingRecent) {
      this.setState({ isFetchingRecent: true })

      fetch(`/api/v1/content?lite=true`, {
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
        this.setState({ 
          isRecentContentFetched: true,
          isFetchingRecent: false,
          recentContent: data//.results
        })
      })
      .catch(error => {
        
      })
    }

    if (!this.state.isFetchingGraphViews && !this.state.hasFetchedGraphViews) {
      this.setState({ isFetchingGraphViews: true })

      fetch(`/api/v1/graph_views/`, {
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
        this.setState({ 
          hasFetchedGraphViews: true,
          isFetchingGraphViews: false,
          graphViews: data//.results
        })
      })
      .catch(error => {
        
      })
    }
  }

  handleNewSpaceClick() {
    const newSpaceId = uuidv4()

    // redirect with React Router
    this.props.history.push({
      pathname: `/spaces/${newSpaceId}`,
      state: { isNew: true }
    })
  }

  buildMobileNewPostForm() {
    if (this.isMobile()) {
      return(
        <div className="list-item new-post-form" style={{ padding: '0.5em 1.5em 1.5em 1.5em' }}>
          <MobileNewPostForm 
          />
        </div>
      )
    }
    // return(
    //   <div className="list-item " style={{ padding: '0.5em 1.5em 1.5em 1.5em' }}>
    //     <BlockEditorSlate 
    //       content_type="Timeline"
    //       content={{}}
    //       placeholder={"What's on your mind? Posts"}
    //       disableSave={true}
    //       showForm={true}
    //       disableBlockControls={true}
    //       // value={this.state.newPostValue}
    //       // updateValue={this.updateNewPostValue}
    //     />

    //   </div>
    // )
  }

  buildNewGraphViewBtn() {
    return(
      <div className="mb-2">
        <div className="inline-block mr-1">
          <a href="/explorer?newTab=true" class="gray-text inline-block">
            <div 
              className="text-center gray-text clickable clickable-blue"
              style={{ width: '100px', height: '100px', padding: '16px', border: '1px solid #eee', borderRadius: '10px'}}
             >
                <div style={{fontSize: '3em'}}>
                  +
                </div>
                <div>
                  New Canvas
                </div>
            </div>
          </a>
        </div>

        <div className="inline-block">
          <div class="gray-text inline-block" onClick={this.handleNewSpaceClick}>
            <div 
              className="text-center gray-text clickable clickable-blue"
              style={{ width: '100px', height: '100px', padding: '16px', border: '1px solid #eee', borderRadius: '10px'}}
             >
                <div style={{fontSize: '3em'}}>
                  <i className="fa fa-file-o" style={{fontSize: '0.7em'}}></i>
                </div>
                <div>
                  New page
                </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  buildTabs() {
    return(
      <div className="feeds-section"
        style={{padding: '0'}}
      >
        <div className="feed-tabs tabs">
          <div 
            className={`tab ${ this.state.currTab === 'graph_views' ? 'active' : '' }`}
            onClick={() => { this.setState({ currTab: 'graph_views' }) }}
          >
            <img src="https://storage.googleapis.com/rumin-gcs-bucket/static/icon-network-gray.png" class="icon align-middle" style={{ width: '16px'}} />Canvases
          </div>
          <div
            className={`tab ${ this.state.currTab === 'recent' ? 'active' : '' }`}
            onClick={() => { this.setState({ currTab: 'recent' }) }}
          ><i className="fa fa-file-o nav-icon"></i> Pages
          </div>
        </div>
      </div>
    )
          //<div 
//            className={`tab ${ this.state.currTab === 'favorites' ? 'active' : '' }`}
//            onClick={() => { this.setState({ currTab: 'favorites' }) }}
//          >
//            <i className="fa fa-star-o nav-icon"></i> Favorite pages
//          </div>
  }

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

  buildRecentLoadingIndicator() {
    if (this.state.isFetchingRecent) {
      return this.buildLoadingGIF()
    }

    if (this.state.noResults === true) {
      return(
        <p style={{margin: '2em', textAlign: 'center'}}>
          You do not have any yet pages yet. Create one using the "What's on your mind?" box above, or with the "New page" button on the bottom left corner.
        </p>
      )
    }
  }

  buildLoadingFavoriteIndicator() {
    if (this.state.isFetchingFavorite) {
      return this.buildLoadingGIF()
    }

    if (this.state.noResults === true) {
      return(
        <p style={{margin: '2em', textAlign: 'center'}}>
          You do not have any yet pages yet. Create one using the "What's on your mind?" box above, or with the "New page" button on the bottom left corner.
        </p>
      )
    }
  }

  buildLoadingGraphViewsIndicator() {
    if (this.state.isFetchingGraphViews) {
      return this.buildLoadingGIF()
    }
  }

  // buildLoadingCapturedIndicator() {
  //   if (this.state.isFetchingCaptured) {
  //     return this.buildLoadingGIF()
  //   }
  // }

  buildFavoritePages() {
    if (!this.state.isFavoriteSpacesFetched) return ''

    const spaces = this.state.favoriteSpaces //this.state.showMoreFavoritePages ? this.state.favoriteSpaces : this.state.favoriteSpaces.slice(0, 5)

    if (spaces.length === 0) {
      return(
        <div className="list-item">
          <p>You do not have any pinned pages yet.</p> 
          <p>Use the star button <i className="fa fa-star-o"></i> on each page to add to favorites.</p>
        </div>
      )
    }

    // let showMoreBtn = ''
    // if (!this.state.showMoreFavoritePages) {
    //   showMoreBtn = (
    //     <div 
    //       className="link-btn"
    //       onClick={() => this.setState({ showMoreFavoritePages: true })}
    //     >
    //       <small>Show more</small>
    //     </div>
    //   )
    // } 

    let showAllBtn = ''
    // if (this.state.showMoreFavoritePages) {
    showAllBtn = (
      <a 
        className="link-btn"
        href="/search?favorites=true"
      >
        <small><i className="fa fa-arrow-right"></i> Show all</small>
      </a>
    )
    // }

    const spaceItems = spaces.map(s => {
      return(
        <div className="list-item slim-item mb-1">
          <div>
            <a href={`/spaces/${s.id}`}>{ s.title || 'Untitled page' }</a>
          </div>
          <div className="small-text mb-0">
            updated { friendlyDateTimeStr(s.updated_at) } &middot; created { friendlyDateTimeStr(s.created_at) }
          </div>
        </div>
      )
    })

    return(
      <div>
        { spaceItems }
        { showAllBtn }
      </div>
        // { showMoreBtn }
    )
  }

  buildRecentPages() {
    if (!this.state.isRecentContentFetched) return ''

    const content = this.state.recentContent //this.state.showMoreRecentPages ? this.state.recentContent : this.state.recentContent.slice(0, 5)

    if (content.length === 0) {
      const isFirefox = typeof window.InstallTrigger !== 'undefined'

      const extensionLink = isFirefox ? <a href="https://addons.mozilla.org/en-US/firefox/addon/rumin/" onClick={() => handleExtensionLinkClick('firefox', 'text')} target="_blank">Firefox addon <i className="fa fa-external-link small-icon"></i></a> : <a href="https://chrome.google.com/webstore/detail/rumin/eboiffdknchlbeboepkadciilgmaojbj" target="_blank" onClick={() => handleExtensionLinkClick('chrome', 'text')}>Chrome extension <i className="fa fa-external-link small-icon"></i></a>

      let extensionImg
      if (isFirefox) {
        extensionImg = (
          <a 
            href="https://addons.mozilla.org/en-US/firefox/addon/rumin/" 
            target="_blank"
            className="clickable inline-block align-top" 
            style={{border: '1px solid #eee', padding: '6px'}} 
          >
            <img src="https://storage.googleapis.com/rumin-gcs-bucket/firefox-addon.svg" style={{width: '200px'}} />
          </a>
        )
      }
      else {
        extensionImg = (
          <a 
            href="https://chrome.google.com/webstore/detail/rumin/eboiffdknchlbeboepkadciilgmaojbj"
            onClick={() => handleExtensionLinkClick('chrome', 'image')}
            target="_blank"
            className="clickable inline-block align-top mr-1" 
            style={{border: '1px solid #eee'}} 
          >
            <img src="https://developer.chrome.com/webstore/images/ChromeWebStore_Badge_v2_340x96.png" style={{width: '200px'}} />
          </a>
        )
      }

      return(
        <div className="list-item">
          <p>This is where your newly created or captured Pages will be.</p>
          <p>Install the Rumin { extensionLink } (it's <a href="https://github.com/jhlyeung/rumin-web-clipper" target="_blank">open source</a>) to effortlessly capture learnings as you go.</p>
          { extensionImg }
        </div>
      )
    }


    let showAllBtn = ''
    // if (this.state.showMoreRecentPages) {
    showAllBtn = (
      <a 
        className="link-btn"
        href="/search"
      >
        <small><i className="fa fa-arrow-right"></i> Show more</small>
      </a>
    )
    // } 

    const contentList = content.map(c => {
      const url = c.content_type === 'Space' ? `/spaces/${c.id}` : `/activities/${c.id}`

      return(
        <div className="list-item slim-item mb-1">
          <div>
            <a href={url}>{ c.title || 'Untitled page' }</a>
          </div>
          <div className="small-text mb-0">
            updated { friendlyDateTimeStr(c.updated_at) } &middot; created { friendlyDateTimeStr(c.created_at) }
          </div>
        </div>
      )
    })

    return(
      <div>
        { contentList }
        { showAllBtn }
      </div>
    )
        // { showMoreBtn }
  }

  buildGraphViews() {
    if (!this.state.hasFetchedGraphViews) return ''

    const graphViews = this.state.graphViews //this.state.showMoreFavoritePages ? this.state.favoriteSpaces : this.state.favoriteSpaces.slice(0, 5)

//     if (graphViews.length === 0) {
//       return(
//         <div className="list-item">
//           <a href="/explorer" className="btn btn-primary mb-1">Create your first Canvas</a>
//         </div>
//       )
//           //<a href="/explorer?viewId=a07ccb04-ebb0-4307-833a-b2fa1e56fba1&viewTitle=Rumin tutorial" className="btn btn-primary mb-1">Go to main Canvas</a>
// //          <p>Or create a new Canvas using the "+" button above.</p>
//     }

    // let showAllBtn = ''
    // showAllBtn = (
    //   <a 
    //     className="link-btn"
    //     href="/search?content_type=graph_views"
    //   >
    //     <small><i className="fa fa-arrow-right"></i> Show all</small>
    //   </a>
    // )
    
    const graphViewItems = graphViews.map(gv => {
      return(
        <div 
          className="list-card default-border padding-default mr-1 mb-1"
          style={{flex: '1 0 220px', borderRadius: '12px', borderColor: '#eee', whiteSpace: 'initial', padding: '0'}}
        >
          <a href={`/explorer?viewId=${gv.id}&viewTitle=${gv.title}`} style={{display: 'block', padding: '1em'}}>
            <div>
              { gv.title || 'Untitled' }
            </div>
            <div className="small-text mb-0">
              updated { friendlyDateTimeStr(gv.updated_at) }
            </div>
          </a>
        </div>
      )
    })

    return(
      <div className="flex flex-wrap mt-1">
        { graphViewItems }
      </div>
        // { showAllBtn }
    )
  }

  // buildCapturedContent() {
  //   if (!this.state.isCapturedContentFetched) return ''

  //   const content = this.state.capturedContent

  //   if (content.length === 0) {
  //     return(
  //       <div>
  //         You will see your newly created or captured content here.
  //       </div>
  //     )
  //   }

  //   let showAllBtn = ''
  //   showAllBtn = (
  //     <a 
  //       className="link-btn"
  //       href="/search?content_type=Activity"
  //     >
  //       <small><i className="fa fa-arrow-right"></i> Show all</small>
  //     </a>
  //   )
    
  //   const contentList = content.map(c => {
  //     const url = c.content_type === 'Space' ? `/spaces/${c.id}` : `/activities/${c.id}`

  //     return(
  //       <div className="list-item slim-item mb-1">
  //         <div>
  //           <a href={url}>{ c.title || 'Untitled page' }</a>
  //         </div>
  //         <div className="small-text mb-0">
  //           updated { friendlyDateTimeStr(c.updated_at) } &middot; created { friendlyDateTimeStr(c.created_at) }
  //         </div>
  //       </div>
  //     )
  //   })

  //   return(
  //     <div>
  //       { contentList }
  //       { showAllBtn }
  //     </div>
  //   )
  // }

  buildTabContent() {
    if (this.state.currTab === 'recent') {
      return(
        <div>
          { this.buildRecentPages() }
          { this.buildRecentLoadingIndicator() }
        </div>
      )
    }

    if (this.state.currTab === 'favorites') {
      return(
        <div>
          { this.buildFavoritePages() }
          { this.buildLoadingFavoriteIndicator() }
        </div>
      )
    }

    if (this.state.currTab === 'graph_views') {
      return(
        <div>
          { this.buildGraphViews() }
          { this.buildLoadingGraphViewsIndicator() }
        </div>
      )
    }

    // if (this.state.currTab === 'captured') {
    //   return(
    //     <div>
    //       { this.buildCapturedContent() }
    //       { this.buildLoadingCapturedIndicator() }
    //     </div>
    //   )
    // }
  }

  render() {
    return(
      <div>
        <div className="main-content">
          <HeaderSection 
            {...this.props}
          />
          <div className="log-page">
            <div 
              className="main-line"
              style={{margin: '0 auto'}}
            >
              <div className="flex flex-center">
                { this.buildTabs() }
                <div className="right-side relative">
                  <AddNewBtn 
                    handleNewSpaceClick={this.handleNewSpaceClick}
                  />
                </div>
              </div>

              { this.buildTabContent() }
            </div>
          </div>
        </div>
      </div>
    );
              // { this.buildMobileNewPostForm() }

              // { this.buildNewGraphViewBtn() }


                // <h4>📁 Top-level pages <i className="fa fa-question-circle small-icon" title="Workspaces/folders in your home directory"></i></h4>
            //<div className="inline-block align-top" style={{paddingLeft: '2em'}}>
//              <div>
//                <h4>🕖 Recently updated <i className="fa fa-question-circle small-icon" title="Recently updated pages or captured content"></i></h4>
//                <div>
//                  { this.buildRecentPages() }
//                </div>
//              </div>
//           </div>
  }
           //  <div className="inline-block align-top">
           //    { this.buildContextPane() }
           // </div>
}

const AddNewBtn = (props) => {
  const [showDropdown, setShowDropdown] = useState(false)

  return(
    <div>
      <div 
        className="clickable"
        onClick={() => setShowDropdown(true)}
      >
        <img src="https://storage.googleapis.com/rumin-gcs-bucket/newsletter/plus-icon.svg.svg" style={{width: '26px'}} />
      </div>

      {showDropdown && 
        <ClickHandler
          close={() => setShowDropdown(false)}
        >
          <div className="dropdown dropdown-narrow" style={{right: '0'}}>
            <div 
              className="dropdown-action"
              title="Open a new thinking board. Use this for free-form idea generation"
            >
              <a href="/explorer?newTab=true" class="gray-text inline-block">
                New canvas
              </a>
            </div>
            <div 
              className="dropdown-action"
              title="Use this for writing/editing a document or collection."
              onClick={props.handleNewSpaceClick}
            >
              New page
            </div>
          </div>
        </ClickHandler>
      }
    </div>
  )
}

export default withRouter(HomePage)
