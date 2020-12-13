import * as React from "react";
import {
  BrowserRouter as Router,
  Switch,
  Route
} from "react-router-dom";

import HomePage from '../HomePage';
import ResultsPage from '../ResultsPage';
import SpacePage from '../SpacePage';
import { ExplorerPage } from '../ExplorerPage';
import { AppProvider } from '../AppContext';

import { ClickHandler } from '../ClickHandler';

import * as uuid from 'uuid';
import { IRuminWindow } from "../Utils/IRuminWindow";

declare var window: any;

export interface AppState {
  isAltKeyPressed: boolean;
  editorValueCopy: [];
  pagePreviews: any;
  updatePagePreviews: any;
  
  updateGraphData: any;
  graphData: any;
  graphNodeLocations: any;
  updateNodeLocations: any;
  nodeLinks: any;
  hasFetchedNodeLinks: any;
  updateHasFetchedNodeLinks: any;
  updateNodeLinks: any;
  updateLinksForNode: any;
  updateDraggedContent: any;
  updateUnderlinedContentId: any;
  clearDraggedContent: any;
  draggedContent: any;
  underlinedContentId: any;
  
  // dark mode
  isDarkMode: any;
  toggleIsDarkMode: any;
  // explorer
  getCurrExplorerTabId: any;
  graphDataByTabId: any;
  graphMetadataByTabId: any;
  getGraphNodeById: any;
  getCurrGraphData: any;
  updateCurrGraphData: any;
  initGraphData: any;
  getGraphDataByTabId: any;
  updateGraphDataByTabId: any;
  getCurrGraphMetadata: any;
  updateCurrGraphMetadata: any;
  updateExplorerTabs: any;
  updateCurrExplorerTab: any;
  explorerTabSaveStatus: any;
  getCurrTabSaveStatus: any;
  isSavingExplorerTab: any;
  setIsSavingExplorerTab: any;
  fetchedContent: any; 
  getCurrFetchedContent: any;
  getFetchedContentById: any;
  updateFetchedContentByTabId: any;
  updateFetchedContentById: any;
  updateFetchedContent: any;
  connectedData: any;
  updateConnectedDataById: any;
  getConnectedData: any;
  getConnectedDataById: any;  
  nodeFromContent: any;
  explorerTabs: any;
  currExplorerTab: any;
  connectedContentDisplay: any;
  updateConnectedContentDisplayById: any;
  getCurrConnectedContentDisplay: any;
  getConnectedContentDisplayById: any;
}

class App extends React.Component<{}, AppState> {
  constructor(props: any) {
    super(props);

    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    
    // dark mode
    this.isDarkMode = this.isDarkMode.bind(this)
    this.toggleIsDarkMode = this.toggleIsDarkMode.bind(this)

    this.updatePagePreviews = this.updatePagePreviews.bind(this);
    this.updateNodeLinks = this.updateNodeLinks.bind(this);
    this.updateLinksForNode = this.updateLinksForNode.bind(this);

    // dnd
    this.updateUnderlinedContentId = this.updateUnderlinedContentId.bind(this);
    this.updateDraggedContent = this.updateDraggedContent.bind(this);
    this.clearDraggedContent = this.clearDraggedContent.bind(this);

    // graph
    this.updateHasFetchedNodeLinks = this.updateHasFetchedNodeLinks.bind(this);
    this.updateGraphData = this.updateGraphData.bind(this);
    this.updateNodeLocations = this.updateNodeLocations.bind(this);

    // explorer 
    this.nodeFromContent = this.nodeFromContent.bind(this)
    this.getCurrFetchedContent = this.getCurrFetchedContent.bind(this)
    this.getFetchedContentById = this.getFetchedContentById.bind(this)
    this.updateFetchedContentById = this.updateFetchedContentById.bind(this)
    this.updateFetchedContentByTabId = this.updateFetchedContentByTabId.bind(this)
    this.updateFetchedContent = this.updateFetchedContent.bind(this)
    this.updateConnectedDataById = this.updateConnectedDataById.bind(this)
    this.getConnectedDataById = this.getConnectedDataById.bind(this)
    this.getConnectedData = this.getConnectedData.bind(this)

    this.getCurrGraphData = this.getCurrGraphData.bind(this)
    this.updateCurrGraphData = this.updateCurrGraphData.bind(this);
    this.initGraphData = this.initGraphData.bind(this)
    this.getGraphDataByTabId = this.getGraphDataByTabId.bind(this)
    this.updateGraphDataByTabId = this.updateGraphDataByTabId.bind(this)
    this.getCurrGraphMetadata = this.getCurrGraphMetadata.bind(this)
    this.updateCurrGraphMetadata = this.updateCurrGraphMetadata.bind(this)
    this.getCurrTabSaveStatus = this.getCurrTabSaveStatus.bind(this)
    this.isSavingExplorerTab = this.isSavingExplorerTab.bind(this)
    this.setIsSavingExplorerTab = this.setIsSavingExplorerTab.bind(this)
    this.getCurrExplorerTabId = this.getCurrExplorerTabId.bind(this)
    this.getGraphNodeById = this.getGraphNodeById.bind(this)
    this.updateExplorerTabs = this.updateExplorerTabs.bind(this)
    this.updateCurrExplorerTab = this.updateCurrExplorerTab.bind(this)
    this.updateConnectedContentDisplayById = this.updateConnectedContentDisplayById.bind(this)
    this.getConnectedContentDisplayById = this.getConnectedContentDisplayById.bind(this)
    this.getCurrConnectedContentDisplay = this.getCurrConnectedContentDisplay.bind(this)

    const initExplorerTabs = [this.getNewExplorerTab()]

    this.state = {
      isAltKeyPressed: false,
      editorValueCopy: [],
      pagePreviews: {},
      updatePagePreviews: this.updatePagePreviews,
      // dark mode
      isDarkMode: this.isDarkMode,
      toggleIsDarkMode: this.toggleIsDarkMode,
      // graph (in SpacePage)
      updateGraphData: this.updateGraphData,
      graphData: { nodes: [], edges: [] },
      graphNodeLocations: {},
      updateNodeLocations: this.updateNodeLocations,
      nodeLinks: {},
      hasFetchedNodeLinks: {},
      updateHasFetchedNodeLinks: this.updateHasFetchedNodeLinks,
      updateNodeLinks: this.updateNodeLinks,
      updateLinksForNode: this.updateLinksForNode,
      // Explorer
      graphDataByTabId: {},
      graphMetadataByTabId: {},
      explorerTabSaveStatus: {},
      getCurrTabSaveStatus: this.getCurrTabSaveStatus,
      isSavingExplorerTab: this.isSavingExplorerTab,
      setIsSavingExplorerTab: this.setIsSavingExplorerTab,
      getCurrGraphData: this.getCurrGraphData,
      updateCurrGraphData: this.updateCurrGraphData,
      initGraphData: this.initGraphData,
      getGraphDataByTabId: this.getGraphDataByTabId,
      updateGraphDataByTabId: this.updateGraphDataByTabId,
      getCurrGraphMetadata: this.getCurrGraphMetadata,
      updateCurrGraphMetadata: this.updateCurrGraphMetadata,
      getCurrExplorerTabId: this.getCurrExplorerTabId,
      getGraphNodeById: this.getGraphNodeById,
      fetchedContent: {}, // map from ID to object
      updateFetchedContentById: this.updateFetchedContentById,
      updateFetchedContentByTabId: this.updateFetchedContentByTabId,
      updateFetchedContent: this.updateFetchedContent,
      connectedData: {}, // map from node ID to array of object IDs 
      updateConnectedDataById: this.updateConnectedDataById,  
      getConnectedDataById: this.getConnectedDataById,
      getConnectedData: this.getConnectedData,
      nodeFromContent: this.nodeFromContent,
      getFetchedContentById: this.getFetchedContentById,
      getCurrFetchedContent: this.getCurrFetchedContent,
 
      connectedContentDisplay: {},
      explorerTabs: initExplorerTabs,
      updateExplorerTabs: this.updateExplorerTabs,
      currExplorerTab: initExplorerTabs[0],
      updateCurrExplorerTab: this.updateCurrExplorerTab,
      updateConnectedContentDisplayById: this.updateConnectedContentDisplayById,
      getConnectedContentDisplayById: this.getConnectedContentDisplayById,
      getCurrConnectedContentDisplay: this.getCurrConnectedContentDisplay,
      // dnd
      updateDraggedContent: this.updateDraggedContent,
      updateUnderlinedContentId: this.updateUnderlinedContentId,
      clearDraggedContent: this.clearDraggedContent,
      draggedContent: null,
      underlinedContentId: '',
    };
  }

  userIsAuthenticated() {
    return window.django.user.is_authenticated
  }

  isMobile() {
    return window.django.is_mobile
  }

  isDarkMode() {
    return localStorage.getItem('isDarkMode') == 'true'
  }

  toggleIsDarkMode() {
    const setting = localStorage.getItem('isDarkMode') == 'true'
    localStorage.setItem('isDarkMode', JSON.stringify(!setting))
    location.reload()
  }

  nodeFromContent(content: any) {
    return({
      id: content.id,
      title: content.title,
      url: content.url,
      icon: content.icon,
      favicon_url: content.favicon_url,
      screenshot: content.screenshot,
      selection: content.selection,
      content_type: content.content_type,
      custom_fields: content.custom_fields,
      json_body: content.json_body,
      collection: content.collection,
      ancestry: content.ancestry,
    })
  }

  getCurrTabSaveStatus() {
    return this.state.explorerTabSaveStatus[this.getCurrExplorerTabId()] || {}
  }

  isSavingExplorerTab() {
    return this.getCurrTabSaveStatus().isSaving
  }

  setIsSavingExplorerTab(isSaving: boolean) {
    this.setState({
      explorerTabSaveStatus: {
        ...this.state.explorerTabSaveStatus,
        [this.getCurrExplorerTabId()]: {
          ...this.getCurrTabSaveStatus(),
          isSaving: isSaving
        }
      }
    })
  }

  getCurrFetchedContent() {
    return this.state.fetchedContent[this.getCurrExplorerTabId()] || {}
  }

  getFetchedContentById(nodeId: string) {
    return this.getCurrFetchedContent()[nodeId] || {}
  }

  getConnectedData() {
    return this.state.connectedData[this.getCurrExplorerTabId()] || {}
  }

  getConnectedDataById(nodeId: string) {
    // console.log('getConnectedDataById', this.getConnectedData(), nodeId)

    return this.getConnectedData()[nodeId] || []
  }

  updateFetchedContentByTabId(tabId: string, newContent: any) {
    this.setState({
      fetchedContent: {
        ...this.state.fetchedContent,
        [tabId]: {
          ...this.state.fetchedContent[tabId],
          ...newContent
        }
      }
    })
  }

  updateFetchedContent(newContent: any) {
    this.setState({
      fetchedContent: {
        ...this.state.fetchedContent,
        [this.getCurrExplorerTabId()]: {
          // fetchedContent: updatedContent
          ...this.getCurrFetchedContent(),
          ...newContent 
        }
      }
    })
  }

  updateFetchedContentById(uuid: string, obj: any) {
    const existingObj = this.getFetchedContentById(uuid) // this.state.fetchedContent[uuid] || {}
    const updatedObj = { ...existingObj, ...obj }

    this.setState({
      fetchedContent: {
        ...this.state.fetchedContent,
        [this.state.currExplorerTab.id]: {
          ...this.getCurrFetchedContent(), //...this.state.fetchedContent,
          [uuid]: updatedObj
        }
      }
    })
  }

  // filter unique objects by ID
  uniqueById(items: any) {
    return [...items.reduce((a: any, c: any)=>{
      a.set(c.id, c);
      return a;
    }, new Map()).values()];
  }

  updateConnectedDataById(uuid: string, collection: any) {
    const existingCollection = this.getConnectedDataById(uuid) // this.state.fetchedContent[uuid] || {}
    const updatedCollection = this.uniqueById([...existingCollection, ...collection]) //{ ...existingObj, ...collection }

    // console.log('updateConnectedDataById', uuid, collection)

    // TODO - implement 
    this.setState({
      connectedData: {
        ...this.state.connectedData,
        [this.getCurrExplorerTabId()]: {
          ...this.getConnectedData(), //...this.state.connectedData,
          [uuid]: updatedCollection
        }
      }
    })
  }

  updatePagePreviews(url: string, obj: any) {
    this.setState({
      pagePreviews: {
        ...this.state.pagePreviews,
        [url]: obj
      }
    })
  }

  updateNodeLinks(nodeLinks: any) {
    this.setState({
      nodeLinks: {
        ...this.state.nodeLinks,
        ...nodeLinks
      }
    })
  }

  updateGraphData(graph: any) {
    this.setState({ graphData: graph })
  }

  getGraphNodeById(nodeId: string) {
    return this.getFetchedContentById(nodeId)
  }

  getCurrGraphData() {
    return this.getGraphDataByTabId(this.state.currExplorerTab.id)
  }

  updateCurrGraphData(graph: any) {
    this.setState({ 
      graphDataByTabId: {
        ...this.state.graphDataByTabId,
        [this.state.currExplorerTab.id]: graph
      } 
    })
  }

  initGraphData() {
    return { nodes: [] as any[], edges: [] as any[] }
  }

  getGraphDataByTabId(tabId: string) {
    return this.state.graphDataByTabId[tabId] ? this.state.graphDataByTabId[tabId] : this.initGraphData()
  }

  updateGraphDataByTabId(tabId: string, graph: any) {
    this.setState({ 
      graphDataByTabId: {
        ...this.state.graphDataByTabId,
        [tabId]: graph
      } 
    })
  }

  getCurrGraphMetadata() {
    const tabId = this.state.currExplorerTab.id
    return this.state.graphMetadataByTabId[tabId] ? this.state.graphMetadataByTabId[tabId] : {}
  }

  updateCurrGraphMetadata(graphView: any) {
    this.setState({ 
      graphMetadataByTabId: {
        ...this.state.graphMetadataByTabId,
        [this.state.currExplorerTab.id]: graphView
      } 
    })
  }

  getNewExplorerTab() {
    return({ id: uuid.v4(), title: '' })
  }

  getCurrExplorerTabId() {
    return this.state.currExplorerTab.id
  }

  updateExplorerTabs(tabs: any) {
    this.setState({ explorerTabs: tabs })

    // do not persist for the sandbox demo
    if (location.pathname.indexOf('expdemo') === -1) {
      localStorage.setItem('explorerTabs', JSON.stringify(tabs))
    }
  }

  updateCurrExplorerTab(tab: any) {
    this.setState({ currExplorerTab: tab })
  }

  defaultConnectedContentDisplay() {
    return({
      mentions: false,
      subpages: false,
      undirected: false
    })
  }

  getCurrConnectedContentDisplay() {
    return this.state.connectedContentDisplay[this.getCurrExplorerTabId()] || {}
  }

  // whether to show each type of connected content
  getConnectedContentDisplayById(nodeId: string) {
    let display = this.getCurrConnectedContentDisplay()[nodeId] || {}
    // initialize the node display config
    if (!display || Object.keys(display).length === 0) {
      display = this.defaultConnectedContentDisplay()
      this.updateConnectedContentDisplayById(nodeId, display)
    }
    
    return display
  }

  updateConnectedContentDisplayById(nodeId: string, display: any) {
    this.setState({
      connectedContentDisplay: {
        ...this.state.connectedContentDisplay,
        [this.getCurrExplorerTabId()]: {
          ...this.getCurrConnectedContentDisplay(),
          [nodeId]: display
        }
      }
    })
  } 

  updateLinksForNode(node: any, direction: any, connectedNodes: any) {
    const currNode = this.state.nodeLinks[node.id]
    const connections = currNode && currNode[direction] ? [...currNode[direction], ...connectedNodes] : connectedNodes

    const links = {
      ...currNode,
      [direction]: connections      
    }

    this.setState({
      nodeLinks: {
        ...this.state.nodeLinks,
        [node.id]: links
      }
    })

    connectedNodes.forEach((obj: { content_type: string; id: any; }) => {
      if (obj.content_type === 'Space') {
        const url = `/spaces/${obj.id}`
        this.updatePagePreviews(url, obj)
      }
      else if (obj.content_type === 'Activity') {
        const url = `/activities/${obj.id}`
        this.updatePagePreviews(url, obj)
      }
    })
  }

  updateDraggedContent(content: any, isDragging: any) {
    if (isDragging && !this.state.draggedContent) {
      this.setState({ draggedContent: content });
    } 
    else {
      this.setState({ draggedContent: null });
    }
  }

  updateUnderlinedContentId(contentId: any, isUnderlined: any) {
    if (contentId === this.state.draggedContent) return;

    if (!this.state.draggedContent) return;

    if (isUnderlined) {
      if (this.state.underlinedContentId === contentId) return;
      this.setState({ underlinedContentId: contentId });

      return;
    }

    // remove underline
    if (this.state.underlinedContentId === contentId || !contentId) {
      this.setState({ underlinedContentId: '' });
    }
  }

  updateNodeLocations(nodeLocations: any) {
    this.setState({ graphNodeLocations: nodeLocations })
  }

  clearDraggedContent() {
    this.setState({
      draggedContent: null,
      underlinedContentId: ''
    });
  }

  handleKeyDown(e: any) {
    if (e.altKey && !this.state.isAltKeyPressed) {
      this.setState({ isAltKeyPressed: true })
    }
  }

  handleKeyUp() {
    if (this.state.isAltKeyPressed) {
      this.setState({ isAltKeyPressed: false })
    }
  }

  updateHasFetchedNodeLinks(node: any, direction: any) {
    this.setState({ 
      hasFetchedNodeLinks: {
        ...this.state.hasFetchedNodeLinks,
        [node.id]: {
          ...this.state.hasFetchedNodeLinks[node.id],
          [direction]: true
        }
      } 
    })
  }

  // for the ResultsPage editor
  // since we can't access the children state, and lifting the Editor state to parent was way too slow 
  copyEditorValue(value: any) {
    this.setState({ editorValueCopy: value })
  }

  render() {
    const context = {
      ...this.state,
      copyEditorValue: this.copyEditorValue
    }

    return(
      <div 
        className={`react-container ${this.isDarkMode() ? 'dark-mode' : ''}`}
        onKeyDown={this.handleKeyDown}
        onKeyUp={this.handleKeyUp}
      >
        <AppProvider 
            value={context}
          >
          <Router>
            <Switch>
              <Route 
                exact path="/"
                render={(props) => <HomePage {...props} /> }
              >
              </Route>
            </Switch>
            <Switch>
              <Route 
                exact path="/explorer"
                render={(props) => <ExplorerPage {...props} isMobile={this.isMobile} /> }
              >
              </Route>
            </Switch>   
            <Switch>
              <Route 
                exact path="/search"
                render={(props) => <ResultsPage {...props} /> }
              >
              </Route>
            </Switch>
            <Switch>
              <Route 
                exact path="/spaces/:id"
                render={(props) => <SpacePage {...props} /> }
              >
              </Route>
            </Switch>
          </Router>
        </AppProvider>
      </div>
    )
  }
}

export default App
