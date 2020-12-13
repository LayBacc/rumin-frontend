import * as React from "react"
import { BlockEditorSlate } from './BlockEditorSlate'
import AppContext from './AppContext'
import { IRuminWindow } from "./Utils/IRuminWindow";

declare var window: IRuminWindow;

export interface ISpaceModelState {
  isDataFetched: boolean;
  isFetching: boolean;
  jsonBody: any;
}

export class SpaceModal extends React.Component <{}, ISpaceModelState> {
  static contextType = AppContext

  constructor(props: any, context: any) {
    super(props, context);

    this.handleTitleChange = this.handleTitleChange.bind(this)
    this.handleTitleBlur = this.handleTitleBlur.bind(this)
    
    this.state = {
      // listItems: this.initDemoListItems(),
      isDataFetched: false,
      jsonBody: [], 
      isFetching: null
    };
  }
  // const appContext = useContext(AppContext)

  // const [isFetching, setIsFetching] = useState(false)
  // const [jsonBody, setJsonBody] = useState()

  componentDidMount() {
    if (this.context.modalSpaceId && !this.context.modalSpace && !this.state.isFetching) {
      console.log('TODO - fetch space')

      this.setState({ isFetching: true })

      fetch(`/api/v1/spaces/${this.context.modalSpaceId}/`, {
        method: 'GET',
        headers: {
          'Content-type': 'application/json'
        }
      }) 
      .then(res => {
        if (!res.ok) {
          // if (res.status === 401) {
          //   this.setState({ accessDenied: true })
          // }
          throw new Error(`${res.status}`)
        }
        else return res.json()
      })
      .then(data => {
        console.log('fetched data for modalSpace', data)
        this.context.updateModalSpace(data)

        this.setState({ isFetching: false, isDataFetched: true })
      })
      .catch(error => {
        
      })
    }

  }

  // componentDidUpdate(prevProps, prevState) {
  //   console.log('nextProps', nextProps, 'nextState', nextState)  
  // }

  // shouldComponentUpdate(nextProps, nextState) {
  //   if (!nextState.jsonBody) return false

  //   return true
  // }


  // useEffect(() => {
  // })

  userIsAuthenticated () {
    return window.django.user.is_authenticated
  }

  userIsAuthor () {
    return this.userIsAuthenticated() && window.django.user.id.toString() == this.context.modalSpace.user
  }

  handleTitleChange (e: any) {
    this.context.updateModalSpace({
        ...this.context.modalSpace,
        title: e.target.value
    })
  }

  handleTitleBlur (e: any) {
    console.log('this.context.modalSpace', this.context.modalSpace, this.context)
    console.log('this.context.modalSpace.title', this.context.modalSpace.title)

    fetch(`/api/v1/spaces/${this.context.modalSpaceId}/`, {
      method: 'PATCH',
      headers: {
        'Content-type': 'application/json'
      },
      body: JSON.stringify({ title: this.context.modalSpace.title })
    })
    .then(res => {
      if (!res.ok) throw new Error(`${res.status}`)
      else return res.json()
    })
    .then(data => {
      console.log('saved title!', data)
    })
    .catch(error => {
      console.log('error: ' + error)
    })    
  }

  buildSpaceTitle () {
    if (!this.context.modalSpace) return ''

    return(
      <input
        className="mb-0 space-title"
        value={this.context.modalSpace.title}
        placeholder="Untitled page"
        onChange={this.handleTitleChange} 
        onBlur={this.handleTitleBlur}
        // onKeyDown={handleTitleKeyDown}
        style={{margin: '30px 30px 10px 30px'}}
      />
    )
  }

  buildSpaceContent () {
    if (!this.context.modalSpace) return ''

    return(
      <div 
        className="collection-blocks" 
        style={{
          margin: '0 30px 30px 30px',
          height: '100vh'
        }}
      >
        <BlockEditorSlate 
          content_type="Space"
          content={this.context.modalSpace}
          value={this.state.jsonBody}
          userIsAuthor={this.userIsAuthor()}
        />
      </div>
    )
  }
      // <div>{ appContext.modalSpace }</div>
  render() {
    return(
  		<div style={{overflowX: 'hidden'}}>
        { this.buildSpaceTitle() }
        { this.buildSpaceContent() }
      </div> 
    )
  }
}
