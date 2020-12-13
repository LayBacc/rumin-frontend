import "core-js/stable";
import "regenerator-runtime/runtime";
import uuidv4 from "uuid/v4";

import React, { useCallback, useEffect, useMemo, useState, useRef, useContext } from "react"
import ReactDOM from "react-dom"
import { useParams } from "react-router-dom";

import escapeHtml from 'escape-html'
import isUrl from "is-url"
import isHotkey from "is-hotkey"

import { 
	Editor, 
	Transforms, 
	createEditor, 
	Text, 
	Range, 
	Node, 
	Path,
  Point
} from "slate"
import { 
  Slate, 
  Editable, 
  ReactEditor, 
  withReact, 
  useSlate,
  useFocused,
  useSelected,
  useReadOnly
} from "slate-react"
import { jsx } from 'slate-hyperscript'
import { withHistory } from "slate-history"
import imageExtensions from 'image-extensions'

import { ClickHandler } from './ClickHandler'
import { LinkDropdown } from './LinkDropdown'
import { EditorContextMenu } from './EditorContextMenu'
import { BlockContextMenu } from './BlockContextMenu'
import { HashtagDropdown } from './HashtagDropdown'
import { MentionDropdown } from './MentionDropdown'
import { LinkElement } from './LinkElement'
import { DateElement } from './DateElement'
import { clearAllBodyScrollLocks } from 'body-scroll-lock';

import AppContext from './AppContext'

import queryString from 'query-string'
import { Resizable, ResizeCallback } from 're-resizable'
import { cx, css } from 'emotion'

import { friendlyDateStr } from '../utils/date_utils'

const ELEMENT_TAGS = {
  A: el => ({ type: 'link', url: el.getAttribute('href') }),
  BLOCKQUOTE: () => ({ type: 'quote' }),
  H1: () => ({ type: 'heading-one' }),
  H2: () => ({ type: 'heading-two' }),
  H3: () => ({ type: 'heading-three' }),
  H4: () => ({ type: 'heading-four' }),
  H5: () => ({ type: 'heading-five' }),
  H6: () => ({ type: 'heading-six' }),
  IMG: el => ({ type: 'image', url: el.getAttribute('src') }),
  LI: () => ({ type: 'list-item' }),
  OL: () => ({ type: 'numbered-list' }),
  P: () => ({ type: 'paragraph' }),
  PRE: () => ({ type: 'code' }),
  UL: () => ({ type: 'bulleted-list' }),
}

const TEXT_TAGS = {
  CODE: () => ({ code: true }),
  DEL: () => ({ strikethrough: true }),
  EM: () => ({ italic: true }),
  I: () => ({ italic: true }),
  S: () => ({ strikethrough: true }),
  STRONG: () => ({ bold: true }),
  U: () => ({ underline: true }),
}

const SHORTCUTS = {
  '#': 'heading-one',
  '##': 'heading-two',
  '###': 'heading-three',
  '-': 'list-item',
  '*': 'list-item',
  '[]': 'checklist-item',
  '"': 'blockquote'
  // 'vvv': 'video'
}

const SHORTCUTS_ENTER = {
  '____': 'divider'
}

const FORMAT_HOTKEYS = {
  'mod+b': 'bold',
  'mod+i': 'italic',
  'mod+u': 'underline',
  'mod+`': 'code',
  'mod+shift+s': 'strikethrough'
}

const LIST_TYPES = ['numbered-list', 'bulleted-ul']
 
export const serializeText = nodes => {
  return nodes.map(n => {
    return Node.string(n)
  }).join('\n')
}

const deserialize = el => {
  if (el.nodeType === 3) {
    return el.textContent
  } else if (el.nodeType !== 1) {
    return null
  } else if (el.nodeName === 'BR') {
    return '\n'
  }

  const { nodeName } = el
  let parent = el

  if (
    nodeName === 'PRE' &&
    el.childNodes[0] &&
    el.childNodes[0].nodeName === 'CODE'
  ) {
    parent = el.childNodes[0]
  }
  const children = Array.from(parent.childNodes)
    .map(deserialize)
    .flat()

  if (el.nodeName === 'BODY') {
    return jsx('fragment', {}, children)
  }

  if (ELEMENT_TAGS[nodeName]) {
    const attrs = ELEMENT_TAGS[nodeName](el)
    return jsx('element', attrs, children)
  }

  if (TEXT_TAGS[nodeName]) {
    const attrs = TEXT_TAGS[nodeName](el)
    return children.map(child => jsx('text', attrs, child))
  }

  return children
}

// recursive
const serializeHTML = (node) => {
  if (Text.isText(node)) {
    return escapeHtml(node.text)
  }

  const children = node.children.map(n => serializeHTML(n)).join('')

  switch (node.type) {
    case 'quote':
      return `<blockquote><p>${children}</p></blockquote>`
    case 'paragraph':
      return `<p>${children}</p>`
    case 'link':
      return `<a href="${escapeHtml(node.url)}">${children}</a>`
    case 'list-item':
      return `<li>${children}</li>`
    case 'heading-one':
      return `<h1>${children}</h1>`
    case 'heading-two':
      return `<h2>${children}</h2>`
    case 'heading-three':
      return `<h3>${children}</h3>`
    default:
      return children
  }
}

const getLevel = (element) => {
  if (element.type === 'list-item' || element.type === 'checklist-item') {
    return element.level === undefined ? 1 : element.level
  }
  else if (element.type === 'paragraph') {
    // TODO - count tab space
    // return element.
    let level = 1
    const startingText = element.children[0].text
    for (const token of startingText.split('\t')) {
      if (token !== '') continue

      level += 1
    }

    return level
  }

  // the other items are not movable
  return 1
}

const getBlankNode = () => {
  return { id: uuidv4(), type: 'paragraph', children: [{text: ''}] }
}

export const BlockEditorSlate = (props) => {

  const routerParams = useParams()
  const appContext = useContext(AppContext)
  const editorProps = props

  // Create a Slate editor object that won't change across renders.
  const editor = useMemo(() => withEmbeds(withImages(withShortcuts(withUUID(withLinks(withHistory(withReact(createEditor()))))))), [])
  const [saveTimer, setSaveTimer] = useState(null)
  const [isSaving, setIsSaving] = useState(false)

  const defaultValue = [
    getBlankNode()
  ] 

  const initialValue = props.value && props.value.length > 0 ? props.value : defaultValue

  const [value, setValue] = useState(initialValue) 
  const [isTypingHashtag, setIsTypingHashtag] = useState(false)
  const [showLinkDropdown, setShowLinkDropdown] = useState(false)

  // maintain selection while using popup menus
  const [persistedSelection, setPersistedSelection] = useState({})
  const [domRange, setDOMRange] = useState(null)
  const [lastSavedValue, setLastSavedValue] = useState([])

  const [showContextMenu, setShowContextMenu] = useState(false)
  const [contextMenuX, setContextMenuX] = useState(0)
  const [contextMenuY, setContextMenuY] = useState(0)

  const [showMentionMenu, setShowMentionMenu] = useState(false)

  const handleExportHTMLClick = () => {
    // console.log('PARENT CLICKED!')
    // console.log('serialized HTML:', )

    const filename = props.content.title || 'untitled'
    const text = serializeHTML({ children: value})
    let element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', `${filename}.html`);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
  }

  // so that we can call functions in BlockEditorSlate
  useEffect(() => {
    if (props.setExportHTMLClick) {
      props.setExportHTMLClick(handleExportHTMLClick)
    }
  })

  // when the props.content is changed, rerender value
  useEffect(() => {
    // reset the editor selection 
    editor.selection = null

    setValue(props.value && props.value.length > 0 ? props.value : defaultValue)
  }, [props.content.id])

  // when the prop value is changed
  // useEffect(() => {
  //   setValue(props.value && props.value.length > 0 ? props.value : defaultValue)
  // }, [props.value])

  const getRenderElement = (props) => {
    switch (props.element.type) {
      case 'divider':
        return <DividerElement {...props} />
      case 'code':
        return <CodeElement {...props} />
      case 'date':
        return (
          <DateElement
            {...props}

            setPersistedSelection={setPersistedSelection}
            updateDate={updateDate}
            updateDateStr={updateDateStr}
          />
        )
      case 'link':
        return (
          <LinkElement
            {...props}
            {...editorProps}
            url={props.element.url}
            userIsAuthor={editorProps.userIsAuthor}
            disableLinkFetching={editorProps.disableLinkFetching} 
          />
        )
      case 'image':
        return <ImageElement {...props} />
      case 'video':
        return <VideoElement {...props} />
      case 'tweet':
        return <TweetElement {...props} />
      // case 'bulleted-ul':
      //  return <ul {...props.attributes}>{props.children}</ul>
      case 'checklist-item':
        return <ChecklistItemElement {...props} />
      case 'list-item':
        return <BulletElement {...props} />
      case 'blockquote':
        return <blockquote {...props.attributes}>{props.children}</blockquote>
      case 'heading-one':
        return <h1 className="editor-heading" {...props.attributes}>{props.children}</h1>
      case 'heading-two':
        return <h2 className="editor-heading" {...props.attributes}>{props.children}</h2>
      case 'heading-three':
        return <h3 className="editor-heading" {...props.attributes}>{props.children}</h3>
      default:
        return <DefaultElement {...props} />
    }
  }

  // Define a rendering function based on the element passed to `props`. We use
  // `useCallback` here to memoize the function for subsequent renders.
  const renderElement = useCallback(props => {
    const NOT_CONTROLLABLE = ['video', 'image', 'divider']

    if (Editor.isBlock(editor, props.element) && !NOT_CONTROLLABLE.includes(props.element.type) && !editorProps.disableBlockControls) {
      return(
        <ControllableBlock 
          // editorProps={editorProps}
          // editor={editor}
          handleToggleClick={handleToggleClick}
        >
          { getRenderElement(props) }
        </ControllableBlock>
      )
    }
    else {
      return getRenderElement(props)
    }

    // switch (props.element.type) {
    //   case 'divider':
    //     return <DividerElement {...props} />
    //   case 'code':
    //     return <CodeElement {...props} />
    //   case 'link':
    //     return (
    //       <LinkElement
    //         {...props}
    //         url={props.element.url}
    //         userIsAuthor={editorProps.userIsAuthor}
    //         disableLinkFetching={editorProps.disableLinkFetching} 
    //       />
    //     )
    //   case 'image':
    //     return <ImageElement {...props} />
    //   case 'video':
    //     return <VideoElement {...props} />
    //   // case 'bulleted-ul':
    //   // 	return <ul {...props.attributes}>{props.children}</ul>
    //   case 'checklist-item':
    //     return <ChecklistItemElement {...props} />
    //   case 'list-item':
    //   	return <BulletElement {...props} />
    //   case 'blockquote':
    //     return <blockquote {...props.attributes}>{props.children}</blockquote>
    //   case 'heading-one':
    //     return <h1 className="editor-heading" {...props.attributes}>{props.children}</h1>
    //   case 'heading-two':
    //     return <h2 className="editor-heading" {...props.attributes}>{props.children}</h2>
    //   case 'heading-three':
    //     return <h3 className="editor-heading" {...props.attributes}>{props.children}</h3>
    //   default:
    //     return <DefaultElement {...props} />
    // }
  }, [])

  const handleToggleClick = (element) => {
    // const node = Node.get(editor, path) 
    const toggleLevel = getLevel(element)
    let path = ReactEditor.findPath(editor, element)
    let node = Object.assign({}, element)
    node.isShowing = node.isShowing === undefined ? false : !node.isShowing

    console.log(element, node)

    // toggle isShowing on the current node
    Transforms.setNodes(editor, node, { at: path })

    // find subsequent elements that are nested deeper than the current level
    let endReached = false
    while (!endReached) {
      const nextPoint = Editor.next(editor, { at: path })  
      // end of document
      if (!nextPoint) {
        endReached = true
        break
      }

      let currNode = Object.assign({}, nextPoint[0])
      const currLevel = getLevel(currNode)
      // end of nested elements
      if (currLevel <= toggleLevel) {
        endReached = true
        break
      }

      // console.log('toggleLevel', toggleLevel, 'level: ', getLevel(currNode))
      currNode.isVisible = node.isShowing //currNode.isVisible === undefined ? false : !currNode.isVisible
      Transforms.setNodes(editor, currNode, { at: nextPoint[1] })

      // update path for the next iteration
      path = nextPoint[1]
    }
  }

  const isDOMText = (value) => {
    return value.nodeType === 3
  }

  /**
   * Set the currently selected fragment to the clipboard.
   */

  // right click
  const handleContextMenu = (e) => {
    const { selection } = editor

    if (Range.isCollapsed(selection)) return true
    
    e.preventDefault()

    setContextMenuX(e.pageX)
    setContextMenuY(e.pageY)
    setPersistedSelection(editor.selection)

    setShowContextMenu(true)

    return false  // disable the original context menu
  }

  const handleOnCopy = useCallback(e => {
    const { selection } = editor

    const [start, end] = Range.edges(selection)
    const startVoid = Editor.void(editor, { at: start.path })
    const endVoid = Editor.void(editor, { at: end.path })

    if (Range.isCollapsed(selection) && !startVoid) {
      return
    }

    const domRange = ReactEditor.toDOMRange(editor, selection)
    let contents = domRange.cloneContents()

    e.preventDefault()

    const fragment = Editor.fragment(editor, selection)
    e.clipboardData.setData('text/html', serializeHTML({ children: fragment }))
    e.clipboardData.setData('text/plain', serializeText(fragment))
  })

  // Define a leaf rendering function that is memoized with `useCallback`.
  const renderLeaf = useCallback(props => {
    return <Leaf {...props} />
  }, [])

  const isMobile = () => {
    return window.django.is_mobile
  }

  const openLinkDropdown = () => {
    setShowLinkDropdown(true)
  }
 
  const closeLinkDropdown = () => {
    setShowLinkDropdown(false)
    clearAllBodyScrollLocks()
  } 

  const handleSlateChange = (value) => {
  	// console.log("change", value) 

    setValue(value)    
    // if (props.copyValue === true) {
    //   appContext.copyEditorValue(value)
    // }
  }

  const saveEditorValue = () => {
    if ((props.disableSave || props.userIsAuthor === false) && !props.isNewSpace) return

    if (value == lastSavedValue) {
      return
    }
    // console.log(value)
    setIsSaving(true)

    // remove empty hyperlinks 
    editor.selection = null

    const cleanedValue = value.map(el => {
      if (!el.children) return el

      const children = el.children.filter(child => {
        if (child.type === 'link' && child.children.length === 1 && child.children[0].text.trim() === '') {
          return false
        }
        return true
      })

      let obj = Object.assign({}, el)
      obj.children = children
      return obj
    })
    // setValue(cleanedValue)

    const body = { 
      text_body: serializeText(cleanedValue),
      json_body: cleanedValue,
      // parent_id: props.parent ? props.parent.id : null 
    }
    
    fetch(`/api/v1/spaces/${props.content.id}/`, {
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
      setLastSavedValue(data.json_body)
      setIsSaving(false)

      if (props.previewUrl) {
        // console.log('updating after patch',props.previewUrl , data, appContext.pagePreviews)
        appContext.updatePagePreviews(props.previewUrl, data)
      }

      if (props.updateSpace) {
        props.updateSpace(data)
      }

      if (props.updateTimestamp) {
        props.updateTimestamp(data)
      }
    })
    .catch(error => {
      console.log('error: ' + error)
    })
  }

  const handleEditorFocus = () => {
    // const timer = setInterval(saveEditorValue, 5000)
    // setSaveTimer(timer)
  }

  const handleEditorBlur = (e) => {
		clearInterval(saveTimer)
    saveEditorValue()

    if (props.getEditorValue) {
      props.getEditorValue(value)
    }
  }

  const handleKeyDown = (e) => {
    const key = e.key;

    if (e.key === 'Escape') {
      ReactEditor.blur(editor)

      if (showMentionMenu) {
        setShowMentionMenu(false)
      }
    }

    if (e.key === '@') {
      setPersistedSelection(editor.selection)
      const domSelection = window.getSelection && window.getSelection()
      
      if (domSelection && domSelection.rangeCount > 0) {
        const domRange = window.getSelection().getRangeAt(0)
        setDOMRange(domRange)
      }

      setShowMentionMenu(true)
    }

    // makes the logic easier
    if (e.key === 'ArrowLeft' && showMentionMenu) {
      e.preventDefault()
      setShowMentionMenu(false)
    }

    // link popup
    if (isHotkey('mod+k', e)) {
      e.preventDefault()

      const domSelection = window.getSelection && window.getSelection()
      if (domSelection && domSelection.rangeCount > 0) {
        const domRange = window.getSelection().getRangeAt(0)
        setDOMRange(domRange)
      }

      setPersistedSelection(editor.selection)
      openLinkDropdown()
    }

    if (isHotkey('mod+s', e)) {
      e.preventDefault()
      if (props.saveFullPageData) {
        props.saveFullPageData()
      }

      saveEditorValue()
    }

    if (e.key === '#' && editor.selection && Range.isCollapsed) {
      console.log('TODO - show hashtag dropdown')
      setIsTypingHashtag(true)
    }

    if (e.key === ' ' && isTypingHashtag) {
      console.log('captured hashtag')
      // TODO - capture what's been typed 

      const { anchor } = editor.selection
      const block = Editor.above(editor, {
        match: n => Editor.isBlock(editor, n),
      })
      const path = block ? block[1] : []
      const start = Editor.start(editor, path)
      const range = { anchor, focus: start }
      const beforeText = Editor.string(editor, range)

      setIsTypingHashtag(false)
    }

    if (e.key === 'Tab') {
    	e.preventDefault()

    	if (e.shiftKey) {
    		// unindentBlock(editor)
        removeTabInBlock(editor)
    	}
    	else {
    		// indentBlock(editor)
        prependTabToBlock(editor)
    	}
    	// FIXME - for accessibility: allow the user to Escape out of it
    }

    // check for commands to change block types
    // if (e.key === ' ') {
    // 	const [match] = Editor.nodes(editor, { match: n => n.text && n.text.slice(0, 1) === '-' })
    	
    // 	// command starting with "- "
    // 	if (!!match) {
    // 		addBullet(editor)
    // 		editor.deleteBackward({ unit: 'character', n: 2 }) // remove the initial "- "
    // 	}
    // }

   //  if (e.key === 'Backspace') {
   //  	const { anchor, focus } = editor.selection

   //  	// remove the bullet without deleting the block
			// if (anchor.offset === 0 && focus.offset === 0 && isBulletedBlock(editor)) {
			// 	e.preventDefault()
			// 	removeBullet(editor)
			// } 
   //  }

   //  if (e.key === 'Enter' && isBulletedBlock(editor)) {

   //  	const { anchor, focus } = editor.selection
   //  	// if previous bulleted block was blank, exit bullet list
			// if (anchor.offset === 0 && focus.offset === 0) {
			// 	// TODO - break out
			// 	exitBulletList(editor)
			// }
   //  }

    for (const hotkey in FORMAT_HOTKEYS) {
    	if (isHotkey(hotkey, e)) {
    		e.preventDefault()
    		const format = FORMAT_HOTKEYS[hotkey]
    		toggleMark(editor, format) 
    	}
    }

    if (e.ctrlKey) {
      switch (e.key) {
        // When "`" is pressed, keep our existing code block logic.
        case '`': {
          e.preventDefault()
          const [match] = Editor.nodes(editor, {
            match: n => n.type === 'code',
          })
          Transforms.setNodes(
            editor,
            { type: match ? 'paragraph' : 'code' },
            { match: n => Editor.isBlock(editor, n) }
          )
          break
        }
      }
    }

  }

  const updateDateStr = (node, str) => {
    const path = ReactEditor.findPath(editor, node)
    Transforms.insertText(editor, str, { at: path })
  }

  const updateDate = (node, newDate) => {
    const path = ReactEditor.findPath(editor, node)
    
    Transforms.setNodes(
      editor,
      { 
        dateISOString: newDate.toISOString(),
      },
      { at: path }
    )
    updateDateStr(node, friendlyDateStr(newDate))
  }

  const selectDate = (startPoint, endPoint, date) => {
    Transforms.select(editor, { anchor: startPoint, focus: endPoint })
    Transforms.delete(editor)

    const dateNode = {
      id: uuidv4(),
      type: 'date',
      dateISOString: date.toISOString(),
      children: [{ text: friendlyDateStr(date) }]
    }

    Transforms.insertNodes(editor, dateNode)
  }

  const linkTitle = (title) => {
    editor.selection = persistedSelection
    ReactEditor.focus(editor)

    fetch(`/api/v1/spaces/title/${encodeURIComponent(encodeURIComponent(title.trim()))}/?curr_id=${props.content.id}`, {
      method: 'GET',
      headers: {
        'Content-type': 'application/json'
      }
    })
    .then(res => {
      if (!res.ok) throw new Error(res.status)
      else return res.json()
    })
    .then(space => {
      const url = `/spaces/${space.id}`
      editor.selection = persistedSelection

      insertLink(editor, url, title)
      ReactEditor.focus(editor)
    })
    .catch(error => {
      console.log('error: ' + error)
    })
  }

  const linkUrl = (url, label) => {
    editor.selection = persistedSelection
    insertLink(editor, url, label)
    ReactEditor.focus(editor)
  }

  const unlinkUrl = (url) => {
     // FIXME - implement this
     // console.log('unlinking', url)   
     editor.selection = persistedSelection
     unwrapLink(editor)
  }

  const moveBlocksToSpace = (space, copy) => {
    editor.selection = persistedSelection
    const fragment = Editor.fragment(editor, persistedSelection)

    const body = {
      blocks: fragment
    }

    fetch(`/api/v1/spaces/${space.id}/append/`, {
      method: 'POST',
      headers: {
        'Content-type': 'application/json'
      },
      body: JSON.stringify(body)
    })
    .then(res => {
      if (!res.ok) {
        if (res.status === 401) {}
        throw new Error(res.status)
      } 
      else return res.json()
    })
    .then(data => {
      setShowContextMenu(false)

      Transforms.select(editor, persistedSelection)
      Transforms.delete(editor)
      // Editor.deleteFragment(editor)
      ReactEditor.focus(editor)
    })
    .catch(error => {
      console.log('error: ' + error)
    }) 
  }

  const turnIntoPage = () => {
    editor.selection = persistedSelection

    const fragment = Editor.fragment(editor, persistedSelection)

    const body = {
      title: '',
      json_body: fragment,
      text_body: serializeText(fragment),
      parent_id: props.content ? props.content.id : null
    }

    fetch(`/api/v1/spaces/`, {
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
      // delete fragment
      console.log('in turnIntoPage', data)

      // Transform.select(persistedSelection)
      Transforms.select(editor, persistedSelection)
      Transforms.delete(editor)
      // Editor.deleteFragment(editor)

      // then at the right spot, insertLink
      insertLink(editor, `/spaces/${data.id}`, data.title)
      ReactEditor.focus(editor)

      // TODO - create new text and link to it
    })
    .catch(error => {
      console.log('error: ' + error)
    })
  }

  const handleFormSaveClick = (e) => {
    const body = {
      title: '',
      json_body: value,
      text_body: serializeText(value)
    }
    
    fetch('/api/v1/spaces/', {
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
    .then(space => {
      // success
      // console.log(body, space)
      location.reload()
    })
    .catch(error => {
      console.log('error: ' + error)
    })
  }

  const getEditorSelectedText = (anchor, focus) => {
    return Editor.string(editor, { anchor: anchor, focus: focus })
  }

  const buildHashTagDropdown = () => {
    if (!isTypingHashtag) return ''

    return(
      <ClickHandler
        close={closeLinkDropdown}
      >
        <HashtagDropdown
        />
      </ClickHandler>
    );
  }

  const buildMentionDropdown = () => {
    if (!showMentionMenu) return ''

    return(
      <Portal>
        <ClickHandler
          close={() => setShowMentionMenu(false)}
        >
          <MentionDropdown
            domRange={domRange}
            closeDropdown={() => setShowMentionMenu(false)}
            startPoint={persistedSelection && persistedSelection.focus}
            currPoint={editor.selection && editor.selection.focus}
            getEditorSelectedText={getEditorSelectedText}
            selectDate={selectDate}
          />
        </ClickHandler>
      </Portal>
    );
  }

  const buildLinkDropdown = () => {
    if (!showLinkDropdown) return ''

    return(
      <Portal>
        <ClickHandler
          close={closeLinkDropdown}
        >
          <LinkDropdown
            space={props.content_type === 'Space' ? props.content : null} 
          	domRange={domRange}
            linkTitle={linkTitle}
            linkUrl={linkUrl}
            unlinkUrl={unlinkUrl}
            closeDropdown={closeLinkDropdown}
          />
        </ClickHandler>
      </Portal>
    );
  }

  const buildForm = () => {
    if (!props.showForm) return ''

    return(
      <EditorForm handleFormSaveClick={handleFormSaveClick} />
    )
  }

  const buildSavingIndicator = () => {
    if (props.showForm) return ''

    return(
      <div style={{height: '20px', color: '#777'}}>
        { isSaving ? 'Saving...' : '' } 
      </div>
    )
  }

  const buildContextMenu = () => {
    if (!showContextMenu) return ''

    return(
      <Portal>
        <ClickHandler
          close={() => setShowContextMenu(false)}
        >
          <EditorContextMenu
            {...props}
            closeDropdown={() => setShowContextMenu(false)} 
            clickCoords={{x: contextMenuX, y: contextMenuY}}
            turnIntoPage={turnIntoPage}
            moveBlocksToSpace={moveBlocksToSpace}
          />
        </ClickHandler>
      </Portal>
    )
  }
  
  return(
    <div className="block-edit-container">
      <Slate
        editor={editor}
        value={props.value && props.value.length > 0 && props.updateValue ? props.value : value}
        onChange={handleSlateChange}
      >
        { isMobile() ? '' : <HoveringToolbar openLinkDropdown={openLinkDropdown} setPersistedSelection={setPersistedSelection} setDOMRange={setDOMRange} /> }

        { buildMentionDropdown() }

        { buildContextMenu() }

        { buildLinkDropdown() }
        <Editable 
          renderElement={renderElement}
          readOnly={isMobile() || props.readOnly}
          placeholder={ props.placeholder || '✏️ Add notes, or link to existing thoughts' }
          spellCheck={false}
          // autoFocus={false}
          renderLeaf={renderLeaf}
          onKeyDown={handleKeyDown}
          onFocus={handleEditorFocus}
          onBlur={handleEditorBlur}
          onCopy={handleOnCopy}
          onContextMenu={handleContextMenu}
          // onClick={handleEditorClick}
        />
      </Slate>

      { buildForm() }
      { buildSavingIndicator() }
    </div>
  )
}

const withEmbeds = editor => {
  const { isVoid, insertData } = editor

  editor.isVoid = element => (element.type === 'video' ? true : isVoid(element))

  editor.insertData = data => {
    const textData = data.getData('text/plain')
    let url

    const { selection } = editor
    const { anchor } = selection
    const block = Editor.above(editor, {
      match: n => Editor.isBlock(editor, n),
    })
    const path = block ? block[1] : []
    const start = Editor.start(editor, path)
    const range = { anchor, focus: start }
    const beforeText = Editor.string(editor, range)

    url = textData.trim()
    if (textData.startsWith('https://www.youtube.com/embed')) {
      url = textData.trim()
    }

    if (textData.startsWith('https://www.youtube.com/watch')) {
      url = textData.trim().replace('watch?v=', 'embed/')
    }
    
    // console.log(textData.startsWith('https://www.youtube.com/embed'))
    // console.log('inserting video in withEmbeds', url)

    if (url.startsWith('https://www.youtube.com/embed')) {

      Transforms.select(editor, range)
      // Transforms.delete(editor)

      Transforms.insertNodes(editor, getBlankNode())

      Transforms.setNodes(
        editor,
        { type: 'video', url: url, children: [{text: ''}] },
        { match: n => Editor.isBlock(editor, n) }
      )

      Transforms.insertNodes(editor, getBlankNode())
      return
    }

    // if (url.includes('twitter.com/') && url.includes('/status/')) {
    //   Transforms.select(editor, range)
    //   // Transforms.delete(editor)

    //   Transforms.insertNodes(editor, getBlankNode())

    //   Transforms.setNodes(
    //     editor,
    //     { type: 'tweet', url: url, children: [{text: ''}] },
    //     { match: n => Editor.isBlock(editor, n) }
    //   )

    //   Transforms.insertNodes(editor, getBlankNode())
    //   return
    // }

    insertData(data)
  }

  return editor
}

const withUUID = editor => {
	const { insertData, insertText, insertNode, insertBreak } = editor

	editor.insertBreak = () => {
		insertBreak()

		const newBlockPath = editor.selection.anchor.path.slice(0, -1)
		const newBlockNode = Node.get(editor, newBlockPath)

		// console.log("break being inserted in editor", newBlockPath)
		// console.log("new node insertBreak", newBlockNode)

		const uuid = uuidv4()
		Transforms.setNodes(editor, 
			{	id: uuid },
	    { 
	    	// match: n => Editor.isBlock(editor, n),
	    	at: newBlockPath
	   	}
	  )
	}

	// FIXME - move to a separately plugin
	editor.insertData = data => {
    const html = data.getData('text/html')
    // console.log('data.types', data.types)


    
    if (data.getData('application/x-slate-fragment')) {
      insertData(data)
      return
    }

    if (html) {
      // console.log('html', html)

      const parsed = new DOMParser().parseFromString(html, 'text/html')

      console.log('deserialize HTML', deserialize(parsed.body))
      
      const fragment = deserialize(parsed.body)
      Transforms.insertFragment(editor, fragment)
      return
    }

    // split up into multiple paragraph nodes
    const textNodes = data.getData('text/plain').split('\n').map(text => {
      return({
        id: uuidv4(),
        type: 'paragraph',
        children: [{ text: text }]
      })
    })

    Transforms.insertNodes(editor, textNodes)
	}

	return editor
}

const withShortcuts = editor => {
  const { deleteBackward, insertText, insertBreak } = editor

  editor.insertText = text => {
    const { selection } = editor

    if (text === ' ' && selection && Range.isCollapsed(selection)) {

      const { anchor } = selection
      const block = Editor.above(editor, {
        match: n => Editor.isBlock(editor, n),
      })
      const path = block ? block[1] : []
      const start = Editor.start(editor, path)
      const range = { anchor, focus: start }
      const beforeText = Editor.string(editor, range)
      const type = SHORTCUTS[beforeText.trim()]

      if (type) {
        Transforms.select(editor, range)
        Transforms.delete(editor)
        Transforms.setNodes(
          editor,
          { type },
          { match: n => Editor.isBlock(editor, n) }
        )
        // if (type === 'list-item') {
        //   const list = { type: 'list-itemst', children: [] }
        //   Transforms.wrapNodes(editor, list, {
        //     match: n => n.type === 'list-item',
        //   })
        // }
        return
      }

      console.log('check before text ')
    }

    insertText(text)
  }

  editor.insertBreak = () => {
    const { selection } = editor

    if (selection && Range.isCollapsed(selection)) {
      const { anchor } = selection
      const block = Editor.above(editor, {
        match: n => Editor.isBlock(editor, n),
      })
      const path = block ? block[1] : []
      const start = Editor.start(editor, path)
      const range = { anchor, focus: start }
      const beforeText = Editor.string(editor, range)

      if (beforeText == '____') {
        // console.log('insert divider!')
        Transforms.select(editor, range)
        Transforms.delete(editor)
        Transforms.setNodes(
          editor,
          { type: 'divider' },
          { match: n => Editor.isBlock(editor, n), split: true },
        )

        // editor.removeMark('divider')
        // editor.addMark('paragraph')
        // TODO - this is a good place to parse the different sections in the page 
        return
      }

      if (beforeText == '```') {
        console.log('insert code block!')

        Transforms.select(editor, range)
        Transforms.delete(editor)
        // Transforms.setNodes(
        //   editor,
        //   { type: 'divider' },
        //   { match: n => Editor.isBlock(editor, n), split: true },
        // )
        Transforms.insertNodes(editor, { id: uuidv4(), type: 'code-block-start', children: [{text: '---'}] })

        Transforms.insertNodes(editor, { id: uuidv4(), type: 'plaintext', children: [{text: 'code'}] })

        Transforms.insertNodes(editor, { id: uuidv4(), type: 'code-block-end', children: [{text: '---'}] })

        // editor.removeMark('paragraph')
        // editor.addMark('plaintext')
        // TODO - this is a good place to parse the different sections in the page 
        return
      }


      // new line for a collapsed block
      const node = Node.get(editor, path)
      if (node.isShowing === false) {
        // TODO - 
        console.log('handle new line for collapsed toggle block')

        const toggleLevel = getLevel(node)
        let insertPath = path

        // navigate to the end of the nested blocks
        let endReached = false
        while (!endReached) {
          const nextPoint = Editor.next(editor, { at: insertPath })

          // end of document
          if (!nextPoint) {
            Transforms.insertNodes(editor, getBlankNode(), { at: insertPath })
            return
          }

          let currNode = Object.assign({}, nextPoint[0])
          const currLevel = getLevel(currNode)
          // end of nested elements
          if (currLevel <= toggleLevel) {

            endReached = true
            break
          }
          // update path for the next iteration
          insertPath = nextPoint[1]
        }

        const nextPoint = Editor.next(editor, { at: insertPath })
        Transforms.insertNodes(editor, getBlankNode(), { at: nextPoint[1] })
        Editor.setSelection(editor, {anchor:nextPoint, focus:nextPoint})
        return 
      }

      // console.log('node in insertBreak', node)
      if (node.type === 'plaintext') {
        insertBreak()
        return
      }
    }

    insertBreak()
    removeFormatting(editor)
  }

  editor.deleteBackward = (...args) => {
    const { selection } = editor

    if (selection && Range.isCollapsed(selection)) {
      // Remove formatting
      const match = Editor.above(editor, {
        match: n => Editor.isBlock(editor, n),
      })

      // check if previous block is hidden
      const prevPoint = Editor.before(editor, selection.anchor)
      const [prevBlock, _] = Editor.above(editor, {
        match: n => Editor.isBlock(editor, n),
        at: prevPoint
      })
      if (prevBlock.isVisible === false) {
        // keep going up    
        console.log('match in deleteBackward', match, prevBlock)
        console.log('TODO - delete up')
        return
      }

      if (match) {
        const [block, path] = match
        const start = Editor.start(editor, path)

        if (
          block.type !== 'paragraph' &&
          Point.equals(selection.anchor, start)
        ) {
          Transforms.setNodes(editor, { type: 'paragraph' })
          return
        }
      }

      deleteBackward(...args)
    }
  }

  return editor
}

const withImages = editor => {
  const { insertData, insertBreak, isVoid } = editor

  editor.isVoid = element => {
    return element.type === 'image' ? true : isVoid(element)
  }

  editor.insertData = data => {
    const text = data.getData('text/plain')
    const { files } = data

    if (files && files.length > 0) {
      for (const file of files) {
        const reader = new FileReader()
        const [mime] = file.type.split('/')

        if (mime === 'image') {
          reader.addEventListener('load', () => {
            const url = reader.result
            insertImage(editor, url)
          })

          reader.readAsDataURL(file)
        }
      }
    } else if (isImageUrl(text)) {
      insertImage(editor, text)
    } else {
      insertData(data)
    }
  }

  editor.insertBreak = () => {
    const { selection } = editor

    if (selection && Range.isCollapsed(selection)) {
      const { anchor } = selection
      const block = Editor.above(editor, {
        match: n => Editor.isBlock(editor, n),
      })
      
      if (block && block[0] && block[0].type === 'image') {

        // TODO - insert a new line after 
        // set selector to after the image block?
        // but what if there's no new line


        // Transforms.insertNodes(editor, [
        //     {type:'paragraph', children:[{text: 'some text', marks:[]}]},
        //   ],
        //   {at:[0]}
        // );
      }
    }

    insertBreak()
  }

  return editor
}

// Plugin for links
// Example: https://github.com/ianstormtaylor/slate/blob/master/site/examples/links.js
const withLinks = editor => {
  const { insertData, insertText, isInline } = editor

  editor.isInline = element => {
    return element.type === 'link' || element.type === 'date' ? true : isInline(element)
  }

  editor.insertText = text => {
    if (text && isUrl(text)) {
      wrapLink(editor, text)
    } else {
      insertText(text)
    }
  }

  editor.insertData = data => {
  	const text = data.getData('text/plain')

    if (text && isUrl(text)) {
      wrapLink(editor, text)
    } else {
      insertData(data)
    }
  }

  return editor
}

const insertImage = (editor, url) => {
  const text = { text: '' }
  const image = { type: 'image', url, children: [text] }
  Transforms.insertNodes(editor, image)
  Transforms.insertNodes(editor, { type: 'paragraph', children: [{text: ''}] })
}

const insertLink = (editor, url, label) => {
  if (editor.selection) {
    wrapLink(editor, url, label)
  }
}

const isLinkActive = editor => {
  const [link] = Editor.nodes(editor, { match: n => n.type === 'link' })
  return !!link
}

const unwrapLink = editor => {
  Transforms.unwrapNodes(editor, { match: n => n.type === 'link' })
}

const wrapLink = (editor, url, label) => {
  if (isLinkActive(editor)) {
    unwrapLink(editor)
  }

  const { selection } = editor
  const isCollapsed = selection && Range.isCollapsed(selection)

  let link
  if (isCollapsed) {
    link = {
      type: 'link',
      url,
      children: [{ text: `${label ? label : url} ` }]
    }

    Transforms.insertNodes(editor, link)
    return
  }
  else {
    link = {
      type: 'link',
      url,
      children: isCollapsed ? [{ text: url }] : [],
    }
    Transforms.wrapNodes(editor, link, { split: true })
    Transforms.collapse(editor, { edge: 'end' })
  }
}

const DividerElement = ({attributes, children, element}) => {
  return(
    <div className="divider" contentEditable={false}>
      { children }
    </div>
  )
}

const ImageElement = ({ attributes, children, element }) => {
  const selected = useSelected()
  const focused = useFocused()
  const editor = useSlate()

  const handleResizeStop = (e, dir, ref) => {
    const { width, height } = ref.getBoundingClientRect()
    console.log('handleResizeStop', width, height)
    // console.log(attributes, element)
    const path = ReactEditor.findPath(editor, element)
    
    // console.log('path of image node', path)
    let updatedImg = Object.assign({}, element)
    updatedImg.width = width
    updatedImg.height = height

    Transforms.setNodes(
      editor,
      updatedImg,
      { at: path }
    )
  }

  return (
    <div {...attributes}>
      <div contentEditable={false}>
        <Resizable
          // maxWidth={'100%'}
          enable={{ top:false, right:true, bottom:false, left:true, topRight:false, bottomRight:false, bottomLeft:false, topLeft:false }}
          lockAspectRatio={true}
          onResizeStop={handleResizeStop}
          size={element.height && element.width && { height: element.height, width: element.width }}
          style={{display: 'inline-block'}}
        >
          <img
              // max-height: 20em;
              // max-width: 100%;
            src={element.url}
            className={css`
              display: block;
              width: 100%;
              box-shadow: ${selected && focused ? '0 0 0 3px #B4D5FF' : 'none'};
            `}
          />
        </Resizable>
      </div>
      {children}
    </div>
  )
}

const isImageUrl = url => {
  if (!url) return false
  if (!isUrl(url)) return false
  const ext = new URL(url).pathname.split('.').pop()
  return imageExtensions.includes(ext)
}

const VideoElement = ({ attributes, children, element }) => {
  const editor = useSlate()
  const { url } = element

  return (
    <div {...attributes}>
      <div contentEditable={false}>
        <div
          style={{
            padding: '315px 0 0 0',
            position: 'relative',
            // maxWidth: '560px',
            // maxHeight: '315px' 
          }}
        >
          <iframe
            src={`${url}?title=0&byline=0&portrait=0`}
            frameBorder="0"
            style={{
              position: 'absolute',
              top: '0',
              left: '0',
              width: '100%',
              height: '100%',
              maxWidth: '560px',
              maxHeight: '315px'
            }}
          />
        </div>
      </div>
      {children}
    </div>
  )
}

const TweetElement = ({ attributes, children, element }) => {
  const editor = useSlate()
  const { url } = element

  return (
    <div {...attributes}>
      <div contentEditable={false}>
        <blockquote class="twitter-tweet"><a href={url}></a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
        <div
          style={{
            padding: '315px 0 0 0',
            position: 'relative',
            // maxWidth: '560px',
            // maxHeight: '315px' 
          }}
        >
          <iframe
            src={`${url}?title=0&byline=0&portrait=0`}
            frameBorder="0"
            style={{
              position: 'absolute',
              top: '0',
              left: '0',
              width: '100%',
              height: '100%',
              maxWidth: '560px',
              maxHeight: '315px'
            }}
          />
        </div>
      </div>
      {children}
    </div>
  )
}


// Define a React component renderer for our code blocks.
const CodeElement = props => {
  return (
    <pre {...props.attributes}>
      <code>{props.children}</code>
    </pre>
  )
}

const ChecklistItemElement = props => {
  const { attributes, children, element } = props
  const editor = useSlate()
  const readOnly = useReadOnly()
  const { checked } = element

  return (
    <div 
      className={cx(
        'checkbox-block',
        `level-${props.element.level || 1}`,
        css`
        display: flex;
        flex-direction: row;
        align-items: flex-start;
        & + & {
          margin-top: 0;
        }
      `)}
      {...props.attributes}
    >
      <span
        contentEditable={false}
        className={css`
          margin-right: 0.75em;
        `}
      >
        <label className="checkbox-container">
          <input
            type="checkbox"
            checked={checked}
            onChange={event => {
              const path = ReactEditor.findPath(editor, element)
              Transforms.setNodes(
                editor,
                { checked: event.target.checked },
                { at: path }
              )
            }}
          />
          <span className="checkmark"></span>
        </label>
      </span>
      <span
        contentEditable={!readOnly}
        suppressContentEditableWarning
        className={css`
          flex: 1;
          opacity: ${checked ? 0.666 : 1};
          text-decoration: ${checked ? 'line-through' : 'none'};
          &:focus {
            outline: none;
          }
        `}
      >
        {children}
      </span>
    </div>
  )
}

const BulletElement = props => {
  return (
    <div 
      className={`bullet-block level-${props.element.level || 1}`}
      {...props.attributes}
    >
      <div className="children">
        {props.children}
      </div>
    </div>
  )
}

const ControllableBlock = (props) => {
  const [showBlockControls, setShowBlockControls] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const [showContextMenu, setShowContextMenu] = useState(false)
  const [contextMenuX, setContextMenuX] = useState(0)
  const [contextMenuY, setContextMenuY] = useState(0)

  const handleContextMenu = (e) => {
    e.preventDefault()

    // setIsSelected(true)

    setContextMenuX(e.pageX)
    setContextMenuY(e.pageY)
    setShowContextMenu(true)

    return false
  }

  const handleToggleClick = () => {
    props.handleToggleClick(getElement())
  }

  const handleCopyLinkClick = () => {
    if (getElement()) {
      // if there is no ID, generate one
      if (!getElement().id) {
        let el = Object.assign({}, getElement())
        el.id = uuidv4()
        const path = ReactEditor.findPath(editor, el)
        Transforms.setNodes(editor, el, { at: path })
      }

      // update url
      location.hash = `#${getElement().id}`

      // copy to clipboard
      var dummy = document.createElement('input'),
          text = window.location.href;
      document.body.appendChild(dummy);
      dummy.value = text;
      dummy.select();
      document.execCommand('copy');
      document.body.removeChild(dummy);
    }
  }

  const buildBlockControls = () => { 
    return(
      <div 
        className="block-controls unselectable"
        contentEditable={false}
      >
        { buildHoverRegion() }
        { buildContextMenu() }
        { buildCopyLinkHandle() }
        { buildToggleBtn() }
      </div>
    )
  }

  const buildCopyLinkHandle = () => {
    if (!showBlockControls) return ''

    return(
      <div 
        contentEditable={false}
        className={`link-handle`} 
        onClick={handleCopyLinkClick}
        title="Copy link to this block"
      >
        <i className="fa fa-link"></i> 
      </div>
    )
        // <img src="https://storage.googleapis.com/rumin-gcs-bucket/icon-drag.png" />
  }

  const buildToggleBtn = () => {
    if (!showBlockControls) return ''

    if (isShowing()) {
      return(
        <div 
          contentEditable={false}
          className={`toggle-handle`}
          onClick={handleToggleClick}
        >
          <i className="fa fa-caret-down"></i>
        </div>
      )
    }

    return(
      <div 
        contentEditable={false}
        className={`toggle-handle`}
        onClick={handleToggleClick}
      >
        <i className="fa fa-caret-right"></i>
      </div>
    )
  }

  const getElement = () => {
    return props.children.props.element
  }

  const closeContextMenu = () => {
    setShowContextMenu(false)
    clearAllBodyScrollLocks()
  }

  const buildHoverRegion = () => {
    return(
      <div
        className="hover-region unselectable"
        onMouseEnter={handleMouseEnter}
      >&nbsp;
      </div>
    )
  }

  const buildContextMenu = () => {
    if (!showContextMenu) return ''

    return(
      <Portal>
        <ClickHandler
          close={closeContextMenu}
        >
          <BlockContextMenu
            content={props.content}
            closeDropdown={closeContextMenu} 
            clickCoords={{x: contextMenuX, y: contextMenuY}}
            handleToggleClick={handleToggleClick}
          />
        </ClickHandler>
      </Portal>
    )
  }

  const handleMouseEnter = (e) => {
    setShowBlockControls(true)
  }

  const handleMouseLeave = (e) => {
    setShowBlockControls(false) 
  }

  const buildHidingIndicator = () => {
    return(
      <span contentEditable={false} title="Expand to see hidden content">
        <i class="fa fa-ellipsis-h hidden-icon gray-text"></i>
      </span>
    )
  }

  const isVisible = () => {
    if (!getElement()) return true

    return !(getElement().isVisible === false)
  }

  // children collapsed
  const isShowing = () => {
    if (!getElement()) return true

    return !(getElement().isShowing === false)
  }

  const isPermalinked = () => {
    if (!getElement()) return false

    return location.hash.indexOf(getElement().id) > 0
  }

  if (!isVisible()) {
    return(
      <span>
      </span>
    )
  }

  const hiddenIndicator = isShowing() ? '' :  buildHidingIndicator()

  // console.log(Editor.isBlock(editor, ))

  return(
    <div
      className={`relative editor-block flex flex-center ${isPermalinked() ?  'permalinked' : '' }`} 
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      { buildBlockControls() }
      { props.children }
      { hiddenIndicator }
    </div>
  )
}

const DefaultElement = props => {
	const handleMouseOver = () => {
    // console.log('hovering over slate Block', props)
  }

  return(
    <div
      onMouseOver={handleMouseOver}
    >
      <p 
        {...props.attributes}>{props.children}
      </p>
    </div>
  )
}

const removeFormatting = (editor) => {
  // TODO - but we want blocks to continue!

  Transforms.setNodes(editor, { 
    bold: null,  
    italic: null,
    underline: null, 
    strikethrough: null, 
    // type: 'paragraph'
  },
  { match: n => Text.isText(n), split: true }
  )

  Transforms.setNodes(editor, { 
    type: 'paragraph',
    // isVisible: undefined,
    // isShowing: undefined
  },
  { match: n => Editor.isBlock(editor, n) && n.type !== 'list-item' && n.type !== 'checklist-item', split: true }
  )

  // uncheck the checkbox in the new line
  Transforms.setNodes(editor, { 
    checked: false
  },
  { match: n => Editor.isBlock(editor, n) && n.type === 'checklist-item', split: true }
  )
}

const toggleMark = (editor, format) => {
  const isActive = isFormatActive(editor, format)
  // const isList = LIST_TYPES.includes(format)

  Transforms.setNodes(editor, { 
  		[format]: isActive ? null : true 
  	},
    { match: Text.isText, split: true }
  )
}

const toggleBlock = (editor, format) => {
  const isActive = isBlockActive(editor, format)
  const isList = LIST_TYPES.includes(format)

  Transforms.unwrapNodes(editor, {
    match: n => LIST_TYPES.includes(n.type),
    split: true,
  })

  Transforms.setNodes(editor, {
    type: isActive ? 'paragraph' : format,
  })

  if (!isActive && isList) {
    const block = { type: format, children: [] }
    Transforms.wrapNodes(editor, block)
  }
}

const isBlockActive = (editor, format) => {
  const [match] = Editor.nodes(editor, {
    match: n => n.type === format,
  })

  return !!match
}

const isFormatActive = (editor, format) => {
  // console.log('in isFormatActive', Editor.string(editor, []))

  const [match] = Editor.nodes(editor, {
  	match: n => n[format] === true
  })
  return !!match
}

const isBulletedBlock = (editor) => {
	const [match] = Editor.nodes(editor, {
  	match: n => n.type === 'list-item'
  })
  return !!match
}

const addBullet = (editor) => {
	Transforms.setNodes(editor, {
			type: 'list-item'
  	},
  	{ match: n => Editor.isBlock(editor, n), split: true }
  )
}

const removeBullet = (editor) => {
	// Transforms.unwrapNodes(editor, {
	// 	match: n => n.type === 'bulleted-ul'
	// })

	Transforms.setNodes(editor, {
			type: 'paragraph' 
  	},
  	{ match: n => Editor.isBlock(editor, n), split: true }
  )

 //  const ulBlock = { type: 'bulleted-ul', children: [] }
 //  Transforms.wrapNodes(editor, ulBlock, { match: n => Editor.isBlock(editor, n), split: true 
	// })
}

const exitBulletList = (editor) => {
	// insert the current block as a new node, one level up the tree
	const { anchor, focus } = editor.selection

	// we can tell the nested depth from the length of the path
	// 

	// TODO - how to get current block?


	// there is also insertNodeByKey

	// and editor.insertNode()


	// removeNodeByKey


	// Transforms.unwrapNodes(editor, {
	// 	match: n => n.type === 'bulleted-ul'
	// })

	// Transforms.setNodes(editor, {
	// 		type: 'paragraph' 
 //  	},
 //  	{ match: n => Editor.isBlock(editor, n), split: true }
 //  )
}


const countTrailingZeros = (array) => {
	let zeroCount = 0
	const reversed = array.reverse()

	for (let i = 0; i < reversed.length; ++i) {
		if (reversed[i] !== 0) {
			break
		}
		zeroCount += 1
	}

	return zeroCount
}

const isList = (node) => { 
	return node.isList === true
}

const prependTabToBlock = (editor) => {
  const { selection } = editor
  const { anchor, focus } = selection
  const block = Editor.above(editor, {
    match: n => Editor.isBlock(editor, n),
  })

  // selection across blocks
  if (!block) {
    // TODO - extend selection to start of the first block
    // and end of the last block

    //console.log('prependTabToBlock', anchor, focus)

    let extendedSelection
    if (anchor.path[0] <= focus.path[0]) {
      extendedSelection = {
        anchor: {
          ...anchor,
          offset: 0
        },
        focus: focus
      }
    }


    const fragment = Editor.fragment(editor, extendedSelection)//selection)

    // console.log('fragment in prependTabToBlock', fragment)
    fragment.forEach(node => {

      const path = ReactEditor.findPath(editor, node)

      // console.log(path)

      if (node.type === 'list-item' || node.type === 'checklist-item') {
        const updatedBlock = {
          ...node,
          level: (node.level || 1) + 1
        }
        Transforms.setNodes(editor, updatedBlock, { at: path })        
      }
      else {
        const start = Editor.start(editor, path)
        Transforms.insertText(editor, '\u0009', { at: start })
      }
    })

    return
  }

  if (block[0].type === 'list-item' || block[0].type === 'checklist-item') {
    const updatedBlock = {
      ...block[0],
      level: (block[0].level || 1) + 1
    }
    Transforms.setNodes(editor, updatedBlock)
    return
  }

  const path = block ? block[1] : []
  const start = Editor.start(editor, path)
  Transforms.insertText(editor, '\u0009', { at: start })
}

const removeTabInBlock = (editor) => {
  const { selection } = editor
  const { anchor, focus } = selection
  const block = Editor.above(editor, {
    match: n => Editor.isBlock(editor, n),
  })

  if (!block) {
    let extendedSelection
    if (anchor.path[0] <= focus.path[0]) {
      extendedSelection = {
        anchor: {
          ...anchor,
          offset: 0
        },
        focus: focus
      }
    }

    const fragment = Editor.fragment(editor, extendedSelection)//selection)
    fragment.forEach(node => {

      const path = ReactEditor.findPath(editor, node)

      // console.log(path)

      if (node.type === 'list-item' || node.type === 'checklist-item') {
        if (node.level === 1 || !node.level) return

        const updatedBlock = {
          ...node,
          level: node.level - 1
        }
        Transforms.setNodes(editor, updatedBlock, { at: path })
        return        
      }
      else {
        // const start = Editor.start(editor, path)
        // Transforms.insertText(editor, '\u0009', { at: start })
        const start = Editor.start(editor, path)
        const end = Editor.end(editor, path)

        const range = { anchor: end, focus: start }
        const beforeText = Editor.string(editor, range)

        if (beforeText.startsWith('\u0009')) {
          Transforms.delete(editor, { at: start, unit: 'character' })
        }
      }
    })
    return
  }

  if (block[0].type === 'list-item' || block[0].type === 'checklist-item') {
    if (block[0].level === 1 || !block[0].level) return

    const updatedBlock = {
      ...block[0],
      level: block[0].level - 1
    }
    Transforms.setNodes(editor, updatedBlock)
    return
  }

  const path = block ? block[1] : []
  const start = Editor.start(editor, path)
  const end = Editor.end(editor, path)

  const range = { anchor: end, focus: start }
  const beforeText = Editor.string(editor, range)

  if (beforeText.startsWith('\u0009')) {
    Transforms.delete(editor, { at: start, unit: 'character' })
  }
}

const indentBlock = (editor) => {
	const { anchor, focus } = editor.selection
	const isFirstBlock = (anchor.path[0] === 0 && anchor.path.length === 1) || (focus.path[0] === 0 && focus.path.length === 1)
	
	if (isFirstBlock) {
		console.log("cannot indent the first block")
		return
	}

	// FIXME - first figure out which point is in front: anchor vs focus
	// for now, just (incorrectly) assuming 

	console.log( "countTrailingZeros", countTrailingZeros(anchor.path.slice(0,-1)) )

	const trailingZeros = countTrailingZeros(anchor.path.slice(0,-1)) 	// ommitting the last number in path, which is for text (and other leaf) elements inside the block
	const depthIndex = anchor.path.slice(0,-1).length - trailingZeros - 1	// -1 to adjust for length vs index

	const newParentPath = anchor.path.slice(0, depthIndex+1)
	
	if (newParentPath[depthIndex] > 0) {
		newParentPath[depthIndex] = newParentPath[depthIndex] - 1
	}

	console.log("anchor", anchor)
	console.log("depth index", depthIndex)
	console.log("newParentPath", newParentPath)

	// const currNode = Node.get(editor, anchor.path)
	const newParentNode = Node.get(editor, newParentPath)

	console.log("Node", Node)
	console.log("Editor", Editor)
	console.log("Node.get parent", newParentNode)
	console.log("Node.parent", Node.parent(editor, anchor.path))
	
	const destination = newParentNode
	let destPath = newParentPath

	const currNode = Node.get(editor, anchor.path.slice(0, -1))
	console.log("currNode", currNode)

	const currNodePath = anchor.path.slice(0, -1)

	if (!isList(destination)) {
		const existingContentRange = {
			anchor: { 
				path: destPath.concat([0]), offset: 0 
			}, 
			focus: { 
				path: destPath.concat([destination.children.length]), offset: 0 
			}
		}

		const block = { type: destination.type, children: [] }
		// create a wrap for the existing content
  	Transforms.wrapNodes(editor, block, 
  		{ at: existingContentRange }
  	)

		console.log("destPath", destPath)
  	// mark it as a list
		Transforms.setNodes(editor,
			{ 
				id: uuidv4(),
				isList: true 
			},
			{ 
				at: destPath
			}
		)

		Transforms.setNodes(editor,
			{ type: 'paragraph' },
			{ 
				match: n => Editor.isBlock(editor, n) && n.isList !== true,
				at: destPath
			 }
		)
	}

	const updatedDestNode = Node.get(editor, destPath)
	const lastIndex = updatedDestNode.children.length

	console.log("currNode", currNode, "currNodePath:", currNodePath)

	// if it represents the block
	if (currNodePath[currNodePath.length-1] === 0) {
		Transforms.moveNodes(editor, 
			{
				mode: 'all',
				to: destPath.concat([lastIndex]),
				at: currNodePath.slice(0, depthIndex+1)
			}
		)
	}
	else {
		Transforms.moveNodes(editor, 
			{
				mode: 'all',
				to: destPath.concat([lastIndex]),
				at: currNodePath
			}
		)
	}
}

const unindentBlock = (editor, format) => {
	const { anchor, focus } = editor.selection
	
	// TODO - check if top level
	const isTopLevel = anchor.path.length < 3 || focus.path.length < 3
	
	if (isTopLevel) {
		console.log("cannot unindent top level blocks")
		return
	}

	// FIXME - first figure out which point is in front: anchor vs focus
	// for now, just (incorrectly) assuming 

	const depthIndex = anchor.path.slice(0,-1).length - 2	// -1 to adjust for length vs index, -1 for the unindent

	const destPath = anchor.path.slice(0, depthIndex+1)
	

	console.log("anchor", anchor)
	console.log("depth index", depthIndex)
	console.log("destPath", destPath)

	const destination = Node.get(editor, destPath)

	Transforms.liftNodes(editor, 
		{
			mode: 'all',
			// to: destPath,
			at: anchor.path.slice(0,-1)
		}
	)
}

const matchPath = (editor, path) => {
  const [node] = Editor.node(editor, path)
  return n => n === node
}


function *makeIteratorFromArray (array) {
	for (let i = 0; i < array.length; i++) {
		yield array[i]
	}
}

// Define a React component to render leaves with bold text.
const Leaf = ({ attributes, children, leaf }) => {
  if (leaf.bold) {
    children = <strong>{children}</strong>
  }

  if (leaf.italic) {
    children = <em>{children}</em>
  }

  if (leaf.underline) {
    children = <u>{children}</u>
  }

  if (leaf.strikethrough) {
  	children = <strike>{children}</strike>
  }

  return <span {...attributes}>{children}</span>
}

const HoveringToolbar = (props) => {
  const appContext = useContext(AppContext)
  
  const ref = useRef()
  const editor = useSlate()

  useEffect(() => {
    const el = ref.current
    const { selection } = editor

    if (!el) {
      return
    }

    if (
      !selection ||
      !ReactEditor.isFocused(editor) ||
      Range.isCollapsed(selection) ||
      Editor.string(editor, selection) === ''
    ) {
      el.removeAttribute('style')
      return
    }

    const domSelection = window.getSelection() 
    const domRange = domSelection.getRangeAt(0)
    const rect = domRange.getBoundingClientRect()

    el.style.opacity = 1
    el.style.top = `${rect.top + window.pageYOffset - el.offsetHeight}px`
    el.style.left = `${rect.left +
      window.pageXOffset -
      el.offsetWidth / 2 +
      rect.width / 2}px`

    if (appContext.modalSpace) {
      el.style.zIndex = '6'
    }
  })

  return (
    <Portal>
      <Menu
        ref={ref}
        className={css`
          padding: 8px 7px 6px;
          position: absolute;
          z-index: 1;
          top: -10000px;
          left: -10000px;
          margin-top: -6px;
          opacity: 0;
          background-color: #222;
          border-radius: 4px;
          transition: opacity 0.75s;
        `}
      >
        <FormatButton format="bold" icon="fa-bold" />
        <FormatButton format="italic" icon="fa-italic" />
        <FormatButton format="underline" icon="fa-underline" />
        <FormatButton format="strikethrough" icon="fa-strikethrough" />
        <BlockButton format="heading-one" icon="H1" />
        <BlockButton format="heading-two" icon="H2" />
        <BlockButton format="heading-three" icon="H3" />
        <LinkButton
          format="link" 
          icon="fa-link" 
          openLinkDropdown={props.openLinkDropdown}
          setPersistedSelection={props.setPersistedSelection}
          setDOMRange={props.setDOMRange}
        />
      </Menu>
    </Portal>
  )
}

const Button = React.forwardRef(
  ({ className, active, reversed, ...props }, ref) => (
    <span
      {...props}
      ref={ref}
      className={cx(
        className,
        css`
          cursor: pointer;
          color: ${reversed
            ? active
              ? 'white'
              : '#aaa'
            : active
            ? 'black'
            : '#ccc'};
        `
      )}
    />
  )
)

const FormatButton = (props) => {
  const handleMouseDown = (e) => {
    e.preventDefault()
    toggleMark(editor, props.format)
  }

  const editor = useSlate()
  return (
    <Button
      reversed
      active={isFormatActive(editor, props.format)}
      onMouseDown={handleMouseDown}
    >
      <Icon faClassName={props.icon}></Icon>
    </Button>
  )
}

const BlockButton = ({ format, icon }) => {
  const editor = useSlate()
  return (
    <Button
      active={isBlockActive(editor, format)}
      onMouseDown={event => {
        event.preventDefault()
        toggleBlock(editor, format)
      }}
    >
      <Icon>{icon}</Icon>
    </Button>
  )
}

const LinkButton = (props) => {
  const editor = useSlate()
  
  const handleMouseDown = (e) => {
    e.preventDefault()
    
    props.setPersistedSelection(editor.selection)
    
    const domSelection = window.getSelection && window.getSelection()
    if (domSelection && domSelection.rangeCount > 0) {
      const domRange = window.getSelection().getRangeAt(0)
      props.setDOMRange(domRange)
    }

    props.openLinkDropdown()
  }


  return (
    <Button
      reversed
      active={isFormatActive(editor, props.format)}
      onMouseDown={handleMouseDown}
    >
      <Icon faClassName={props.icon}></Icon>
    </Button>
  )
}

const Icon = React.forwardRef(({ className, ...props }, ref) => (
  <span
    {...props}
    ref={ref}
    className={cx(
      'fa',
      className,
      props.faClassName,
      css`
        font-size: 18px;
        vertical-align: text-bottom;
      `
    )}
  />
))

const Menu = React.forwardRef(({ className, ...props }, ref) => (
  <div
    {...props}
    ref={ref}
    className={cx(
      className,
      css`
        & > * {
          display: inline-block;
        }
        & > * + * {
          margin-left: 15px;
        }
      `
    )}
  />
))

const EditorForm = (props) => {
  const handleSaveClick = () => {
    props.handleFormSaveClick()
  }

  return(
    <div className="controls" style={{display: 'flex', alignItems: 'center'}}>
      <div 
        className="save-btn"
        onClick={handleSaveClick}
      >
        Save
      </div>
    </div>
  )
}

const Portal = ({ children }) => {
  return ReactDOM.createPortal(children, document.body)
}
