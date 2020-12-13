import * as React from "react";
import Konva from "konva";
import { 
	Arrow,
	Circle,
	Image,
	Line,
	Stage, 
	Layer, 
	Rect, 
	Text, 
	Group,
	Transformer
} from "react-konva";
import useImage from 'use-image';

import * as uuid from 'uuid';
import * as queryString from 'query-string'
import { LeftPaneSlim } from './LeftPaneSlim'
import { TopBar } from './TopBar'
import { Resizable, ResizeCallback } from 're-resizable'
import { BlockEditorSlate, serializeText } from './BlockEditorSlate'
import { ContentASDropdown } from './ContentASDropdown'

import { GraphViewASDropdown } from './GraphViewASDropdown'
import { MoveToMenu } from './CardContextMenu'
import * as bodyScrollLock from 'body-scroll-lock';
import { ClickHandler } from './ClickHandler'

import { friendlyDateTimeStr } from '../utils/date_utils'

import AppContext from './AppContext'

const DEFAULT_NODE_WIDTH = 250 //170
const DEFAULT_NODE_HEIGHT = 65

const NODE_COLOR_CSS: any = {
	white: '#ffffff',
	red: '#EAB9BF',
	yellow: '#FBF9DA',
	green: '#B7D4CF',
	blue: '#eff7ff',
	purple: '#CCC0E6'
}

declare const window: any;

const NodeImage = (props: any) => {
	const [image] = useImage(props.imageUrl)

	return(
		<Image
			image={image}
			width={30}
			height={30}
			offsetX={-5}
			offsetY={-5}
		/>
	)
}

const ResizableNode = (props: any) => {
	// const appContext = useContext(AppContext)
	// somehow appContext is always empty
	const groupRef = React.useRef()
	const rectRef = React.useRef()
	const transformerRef: any = React.useRef()

	const [isHighlighted, setIsHighlighted] = React.useState(false)
	// const [scaleX, setScaleX] = React.useState(1)
	// const [scaleY, setScaleY] = React.useState(1)

	const isNodeSelected = () => {
		return props.selectedNodes[props.node.id] === true
	}

	React.useEffect(() => {
		if (isNodeSelected()) {
			// attach transformers
      transformerRef.current.nodes([rectRef.current]);
      transformerRef.current.getLayer().batchDraw();
		}
	}, [isNodeSelected()])
	
	const getNode = () => {
		return props.appContext.getGraphNodeById(props.node.id)
	}

	const nodeCenterX = () => {
		//@ts-ignore
		return groupRef.current.x() + DEFAULT_NODE_WIDTH/2 //rectRef.current.width()/2
	}

	const nodeCenterY = () => {
		//@ts-ignore
		return groupRef.current.y() + DEFAULT_NODE_HEIGHT/2 //rectRef.current.height()/2
	}

	const handleNodeClick = (e: any) => {
		if (e.evt.button !== 2) {
			props.selectNode(getNode())
		}
	}

	const handleNodeDblClick = () => {
		console.log('handleNodeDblClick')
		props.focusOnTitle()
	}

	const handleNodeDragStart = (e: any) => {
		const stage = e.target.getStage()
		// disable drag if shift is held down
		if (e.evt.shiftKey) {
			e.target.stopDrag()
			props.setIsDraggingLine(true)
			props.setEdgeStartX(nodeCenterX())	// midpoint
			props.setEdgeStartY(nodeCenterY())
			props.setEdgeStartNode(getNode())
			return false
		}

		// clear existing selection
		if (Object.keys(props.selectedNodes).length > 0 && !props.selectedNodes[props.node.id]) {
			props.setSelectedNodes({})
			props.setSelectedEdges({})
		}
	}

	const handleNodeDragMove = (e: any) => {
		// move multiple nodes at the same time, render on drag end
		if (Object.keys(props.selectedNodes).length > 1) {
			e.evt.preventDefault()
		}
	}

	const handleNodeDragEnd = (e: any) => {
		const stage = e.target.getStage()

		// move every selected node
		if (Object.keys(props.selectedNodes).length > 1) {
			const diffX = e.target.x() - getNode().x
			const diffY = e.target.y() - getNode().y
			
			Object.keys(props.selectedNodes).forEach((nodeId: string) => {
				if (nodeId !== props.node.id) {
					const selectedNode = props.appContext.getFetchedContentById(nodeId)
					const newX = selectedNode.x + diffX
					const newY = selectedNode.y + diffY

					const updatedNode = {
						...selectedNode,
						x: newX,
						y: newY,
						centerX: newX + DEFAULT_NODE_WIDTH/2,
						centerY: newY + DEFAULT_NODE_HEIGHT/2,
					}

					props.appContext.updateFetchedContentById(nodeId, updatedNode)
				}
			})
		}

		// move the current node
		const node = {
			...getNode(),
			x: e.target.x(),
			y: e.target.y(),
			centerX: e.target.x() + DEFAULT_NODE_WIDTH/2, //nodeCenterX(),	
			centerY: e.target.y() + DEFAULT_NODE_HEIGHT/2 //nodeCenterY()
		}

		// props.appContext.updateGraphNodeDisplayByNodeId(node.id, node)
		props.appContext.updateFetchedContentById(node.id, node)
	}

	const handleNodeMouseOver = (e: any) => {
		if (props.isDraggingLine) {
			setIsHighlighted(true)
			props.setEdgeEndNode(getNode())
		}
	}

	const handleNodeMouseLeave = (e: any) => {
		setIsHighlighted(false)
	}

	const handleNodeContextMenu = (e: any) => {
		// console.log('in handleNodeContextMenu', props.selectedNodes)
    if (Object.keys(props.selectedNodes).length > 1) {
			props.openCanvasContextMenu('multiple', e.evt.pageX, e.evt.pageY)
    }
    else {
    	props.selectNode(getNode())
    	props.openCanvasContextMenu('node', e.evt.pageX, e.evt.pageY)
    }
    
		e.evt.preventDefault()
    return false
	}

	const buildNodeTitle = () => {
		if (!getNode().title) {
			return 'Untitled page'
		}
		
		return getNode().title.slice(0, 80) + (getNode().title.length > 80 ? '...' : '')
	}

	const getNodeImageUrl = () => {
		let imageUrl = null
		if (getNode().icon) {
			imageUrl = getNode().icon
		}

		if (getNode().custom_fields && getNode().custom_fields.favicon_url) {
			imageUrl = getNode().custom_fields.favicon_url
		}

		return imageUrl
	}

	const getNodeFillHex = () => {
		return getNode().fill ?  NODE_COLOR_CSS[getNode().fill] : 'white'
	}

	const handleNodeTransformEnd = (e: any) => {
    const nodeEl: any = rectRef.current;

    // move the current node
    const scX = nodeEl.scaleX()
    const scY = nodeEl.scaleY()

    nodeEl.scaleX(1)
    nodeEl.scaleY(1)

    const newWidth = Math.max(5, nodeEl.width() * scX)
    const newHeight = Math.max(nodeEl.height() * scY)


		const node = {
			...getNode(),
			// x: getNode().x + nodeEl.x(),
			// y: getNode().y + nodeEl.y(),
			width: newWidth,
			height: newHeight,
			centerX: e.target.x() + newWidth/2, //nodeCenterX(),	
			centerY: e.target.y() + newHeight/2 //nodeCenterY()
		}
		props.appContext.updateFetchedContentById(node.id, node)
	}

	const buildNodeTextBody = () => {
		const titleHeight = 60
		if (getNode().height &&  (getNode().height - titleHeight > 13) && getNode().text_body && getNode().text_body.trim().length > 0) {
			const heightSurplus = getNode().height - titleHeight
			const numLines = heightSurplus / 13
			const numCharPerLine = getNode().width / 9	// each char is 9px wide

			// number of lines, including wrap
			let numLinesRendered = 0
			let truncatedText = ''
			getNode().text_body.split(/\r\n|\r|\n/).forEach((paragraph: string) => {
				const numChar = paragraph.length				
				// console.log(paragraph, )

				if (numLinesRendered > numLines) return

				const numLinesNeeded = Math.floor(numChar / numCharPerLine) + 1
				const numLinesRemaining = numLines - numLinesRendered
				if (numLinesNeeded > numLinesRemaining) {
					truncatedText += paragraph.slice(0, numLinesRemaining * numCharPerLine)
				}
				else {
					truncatedText += paragraph
				}
				numLinesRendered += numLinesNeeded
				
				truncatedText += '\n'
			})

			// const truncatedText = getNode().text_body.split(/\r\n|\r|\n/).slice(0, numLines+1).join('\n')
			// const maxCharLimit = (numLines-1) * (getNode().width / 5)
			// console.log(numLines, getNode().width / 5)

			return(
      	<Text
	      	text={ truncatedText }
	      	x={8}
      		y={titleHeight + 8}
      		width={(props.node.width || DEFAULT_NODE_WIDTH) - 20}
      		align="left"
      		fontSize={12}
      		fontFamily={'Open Sans'}
	      />
			)
		}

		return(
			<Text text="" />
		)
	}

	return(
		<React.Fragment>
			<Group
				key={`node_${props.node.id}`}
				ref={groupRef}
	  		draggable
		    x={getNode().x}
		    y={getNode().y}
		    onClick={handleNodeClick}
		    onDblclick={handleNodeDblClick}
		    onDragStart={handleNodeDragStart}
		    onDragEnd={handleNodeDragEnd}
		    onDragmove={handleNodeDragMove}
		    onMouseOver={handleNodeMouseOver}
		    onMouseLeave={handleNodeMouseLeave}
		    onContextMenu={handleNodeContextMenu}
	  	>
	      <Rect
	      	ref={rectRef}
			    width={props.node.width || DEFAULT_NODE_WIDTH}
			    height={props.node.height || DEFAULT_NODE_HEIGHT}
			    cornerRadius={10}
			    shadowOpacity={0.25}
			    fill={getNodeFillHex()}
			    shadowBlur={5}
			    onTransformEnd={handleNodeTransformEnd}
			    // strokeWidth={ isNodeSelected() || isHighlighted ? 3 : 0}
			    // stroke={'#0f8bff'}
			  />
	      <Text 
	      	text={ buildNodeTitle() }
	      	width={(props.node.width || DEFAULT_NODE_WIDTH) - 20}
	      	// width={DEFAULT_NODE_WIDTH-20}
	      	x={8}
	      	y={8}
	      	align="center"
	      	fontSize={16}
	      	fontFamily={'Open Sans'}
	      />
	      
	      { buildNodeTextBody() }

	      <NodeImage imageUrl={getNodeImageUrl()} />
	    </Group>
	    {isNodeSelected() && (
	    	<Transformer
          ref={transformerRef}
          rotateEnabled={false}
          enabledAnchors={['middle-left', 'middle-right', 'bottom-center', 'bottom-left', 'bottom-right']}
          boundBoxFunc={(oldBox, newBox) => {
            // limit resize
            if (newBox.width < 5 || newBox.height < 5) {
              return oldBox;
            }
            return newBox;
          }}
        />
	    )}
    </React.Fragment>
	)
}

const ExplorerEdgeSuggested = (props: any) => {
	const fromNode = props.appContext.getGraphNodeById(props.edge.source) //props.appContext.fetchedContent[props.edge.source]
	const toNode = props.appContext.getGraphNodeById(props.edge.target)  // props.appContext.fetchedContent[props.edge.target]

	const fromX = fromNode.x + DEFAULT_NODE_WIDTH/2
	const fromY = fromNode.y + DEFAULT_NODE_HEIGHT/2
	const toX = toNode.x + DEFAULT_NODE_WIDTH/2
	const toY = toNode.y + DEFAULT_NODE_HEIGHT/2

	const [isHighlighted, setIsHighlighted] = React.useState(false)

	const handleEdgeMouseOver = (e: any) => {
		setIsHighlighted(true)
	}

	const handleEdgeMouseLeave = (e: any) => {
		setIsHighlighted(false)
	}

	const handleEdgeClick = () => {
		props.selectEdge(props.edge)
	}

	const isEdgeSelected = () => {
		const key = `${props.edge.source}::${props.edge.target}`
		return props.selectedEdges[key] === true
	}

	const isConnectedNodeSelected = () => {
		return props.selectedNodes[props.edge.source] || props.selectedNodes[props.edge.target]
	}

	return(
		<Group
			onClick={handleEdgeClick}
		>
			<Line 
				points={[fromX, fromY, toX, toY]}
				strokeWidth={7}
				stroke={'#f1f3f4'}
				onMouseOver={handleEdgeMouseOver}
				onMouseLeave={handleEdgeMouseLeave}
			/>
			<Line
				points={[fromX, fromY, toX, toY]}
				strokeWidth={isHighlighted || isEdgeSelected() || isConnectedNodeSelected() ? 6 : 0}
				stroke={'#0f8bff'}
			/>
			<Line 
				points={[fromX, fromY, toX, toY]}
				strokeWidth={1}
				stroke={'#9CA3DB'}
				onMouseOver={handleEdgeMouseOver}
				onMouseLeave={handleEdgeMouseLeave}
				dash={[12, 10]}	// line segments with a length of 33px, gap of 10px
			/>
		</Group>
	)
}

const ExplorerEdgeUndirected = (props: any) => {
	// const appContext = useContext(AppContext)
	const fromNode = props.appContext.getGraphNodeById(props.edge.source) //props.appContext.fetchedContent[props.edge.source]
	const toNode = props.appContext.getGraphNodeById(props.edge.target)  // props.appContext.fetchedContent[props.edge.target]

	const fromX = fromNode.x + DEFAULT_NODE_WIDTH/2
	const fromY = fromNode.y + DEFAULT_NODE_HEIGHT/2
	const toX = toNode.x + DEFAULT_NODE_WIDTH/2
	const toY = toNode.y + DEFAULT_NODE_HEIGHT/2

	const [isHighlighted, setIsHighlighted] = React.useState(false)

	const handleEdgeMouseOver = (e: any) => {
		setIsHighlighted(true)
	}

	const handleEdgeMouseLeave = (e: any) => {
		setIsHighlighted(false)
	}

	const handleEdgeClick = () => {
		props.selectEdge(props.edge)
	}

	const isEdgeSelected = () => {
		const key = `${props.edge.source}::${props.edge.target}`
		return props.selectedEdges[key] === true
	}

	const isConnectedNodeSelected = () => {
		return props.selectedNodes[props.edge.source] || props.selectedNodes[props.edge.target]
	}

	return(
		<Group
			onClick={handleEdgeClick}
		>
			<Line 
				points={[fromX, fromY, toX, toY]}
				strokeWidth={7}
				stroke={'#f1f3f4'}
				onMouseOver={handleEdgeMouseOver}
				onMouseLeave={handleEdgeMouseLeave}
			/>
			<Line
				points={[fromX, fromY, toX, toY]}
				strokeWidth={isHighlighted || isEdgeSelected() || isConnectedNodeSelected() ? 6 : 0}
				stroke={'#0f8bff'}
			/>
			<Line 
				points={[fromX, fromY, toX, toY]}
				strokeWidth={0.8} //{3}
				stroke={'#9CA3DB'}
				onMouseOver={handleEdgeMouseOver}
				onMouseLeave={handleEdgeMouseLeave}
			/>
		</Group>
	)
}

const ExplorerEdgeDirected = (props: any) => {
	// const appContext = useContext(AppContext)
	const fromNode = props.appContext.getGraphNodeById(props.edge.source) //props.appContext.fetchedContent[props.edge.source]
	const toNode = props.appContext.getGraphNodeById(props.edge.target) //props.appContext.fetchedContent[props.edge.target]

	const fromX = fromNode.x + DEFAULT_NODE_WIDTH/2
	const fromY = fromNode.y + DEFAULT_NODE_HEIGHT/2
	const toCenterX = toNode.x + DEFAULT_NODE_WIDTH/2
	const toCenterY = toNode.y + DEFAULT_NODE_HEIGHT/2

	const [isHighlighted, setIsHighlighted] = React.useState(false)

	const handleEdgeClick = () => {
		props.selectEdge(props.edge)
	}

	const isEdgeSelected = () => {
		const key = `${props.edge.source}::${props.edge.target}`
		return props.selectedEdges[key] === true
	}

	const isConnectedNodeSelected = () => {
		return props.selectedNodes[props.edge.source] || props.selectedNodes[props.edge.target]
	}

	// point to the edge of the targetNode, as opposed to the center
	// TODO - generalize the logic for other quadrants
	const getTargetPoint = () => {
		const distX = Math.abs(toCenterX - fromX)
		const distY = Math.abs(toCenterY - fromY)
		
		let toX
		let toY
		// top-right quadrant
		if (toCenterX > fromX && toCenterY < fromY) {

			if (distX > distY) {
				if (Math.abs(distX - distY) < DEFAULT_NODE_WIDTH) {
					toY = toCenterY + DEFAULT_NODE_HEIGHT/2
					const distToY = Math.abs(toY - fromY)
					const distToX = Math.abs(distToY * distX / distY)
					toX = fromX + distToX
				}
				else {
					toX = toCenterX - DEFAULT_NODE_WIDTH/2
					const distToX = Math.abs(toX - fromX)
					const distToY = Math.abs(distToX * distY / distX)
					toY = fromY - distToY
				}
			}
			else {
				toY = toCenterY + DEFAULT_NODE_HEIGHT/2
				const distToY = Math.abs(toY - fromY)
				const distToX = Math.abs(distToY * distX / distY)
				toX = fromX + distToX
			}

			return { x: toX, y: toY }	
		}
		// bottom-right quadrant
		if (toCenterX > fromX && toCenterY > fromY) {
			if (distX > distY) {
				if (Math.abs(distX - distY) < DEFAULT_NODE_WIDTH) {
					toY = toCenterY - DEFAULT_NODE_HEIGHT/2
					const distToY = Math.abs(toY - fromY)
					const distToX = Math.abs(distToY * distX / distY)
					toX = fromX + distToX
				}
				else {
					toX = toCenterX - DEFAULT_NODE_WIDTH/2
					const distToX = Math.abs(toX - fromX)
					const distToY = Math.abs(distToX * distY / distX)
					toY = fromY + distToY
				}
			}
			else {
				toY = toCenterY - DEFAULT_NODE_HEIGHT/2
				const distToY = Math.abs(toY - fromY)
				const distToX = Math.abs(distToY * distX / distY)
				toX = fromX + distToX
			}

			return { x: toX, y: toY } 
		}
		// bottom-left quadrant
		if (toCenterX < fromX && toCenterY > fromY) {
			if (distX > distY) {
				if (Math.abs(distX - distY) < DEFAULT_NODE_WIDTH) {
					toY = toCenterY - DEFAULT_NODE_HEIGHT/2
					const distToY = Math.abs(toY - fromY)
					const distToX = Math.abs(distToY * distX / distY)
					toX = fromX - distToX
				}
				else {
					toX = toCenterX + DEFAULT_NODE_WIDTH/2
					const distToX = Math.abs(toX - fromX)
					const distToY = Math.abs(distToX * distY / distX)
					toY = fromY + distToY
				}
			}
			else {
				toY = toCenterY - DEFAULT_NODE_HEIGHT/2
				const distToY = Math.abs(toY - fromY)
				const distToX = Math.abs(distToY * distX / distY)
				toX = fromX - distToX
			}

			return { x: toX, y: toY }	
		}
		// top-left quadrant
		if (toCenterX < fromX && toCenterY < fromY) {
			if (distX > distY) {
				if (Math.abs(distX - distY) < DEFAULT_NODE_WIDTH) {
					toY = toCenterY + DEFAULT_NODE_HEIGHT/2
					const distToY = Math.abs(toY - fromY)
					const distToX = Math.abs(distToY * distX / distY)
					toX = fromX - distToX
				}
				else {
					toX = toCenterX + DEFAULT_NODE_WIDTH/2
					const distToX = Math.abs(toX - fromX)
					const distToY = Math.abs(distToX * distY / distX)
					toY = fromY - distToY
				}
			}
			else {
				toY = toCenterY + DEFAULT_NODE_HEIGHT/2
				const distToY = Math.abs(toY - fromY)
				const distToX = Math.abs(distToY * distX / distY)
				toX = fromX - distToX
			}

			return { x: toX, y: toY }	
		}

		return { x: toNode.x + DEFAULT_NODE_WIDTH/2, y: toNode.y + DEFAULT_NODE_HEIGHT/2 }
	}

	const handleEdgeMouseOver = (e: any) => {
		setIsHighlighted(true)
	}

	const handleEdgeMouseLeave = (e: any) => {
		setIsHighlighted(false)
	}

	return(
		<Group
			onClick={handleEdgeClick}
		>
			<Line 
				points={[fromX, fromY, getTargetPoint().x, getTargetPoint().y]}
				strokeWidth={7} 
				stroke={'#f1f3f4'}
				onMouseOver={handleEdgeMouseOver}
				onMouseLeave={handleEdgeMouseLeave}
			/>
			<Line
				points={[fromX, fromY, getTargetPoint().x, getTargetPoint().y]}
				strokeWidth={isHighlighted || isEdgeSelected() || isConnectedNodeSelected() ? 6 : 0}
				stroke={'#0f8bff'}
			/>
			<Arrow 
				points={[fromX, fromY, getTargetPoint().x, getTargetPoint().y]}
				strokeWidth={1}
				stroke={'#9CA3DB'}
				onMouseOver={handleEdgeMouseOver}
				onMouseLeave={handleEdgeMouseLeave}
			/>
		</Group>
	)
}

export const ExplorerCanvas = React.forwardRef((props: any,  ref: any) => {
	const appContext: any = React.useContext(AppContext)

	const stageRef = React.useRef()

	const [stageScale, setStageScale] = React.useState(1)
	const [stageX, setStageX] = React.useState(0)
	const [stageY, setStageY] = React.useState(0)

	// for dragging a line to connect nodes
	const [isDraggingLine, setIsDraggingLine] = React.useState(false)
	const [edgeStartX, setEdgeStartX] = React.useState(0)
	const [edgeStartY, setEdgeStartY] = React.useState(0)
	const [edgeEndX, setEdgeEndX] = React.useState(0)
	const [edgeEndY, setEdgeEndY] = React.useState(0)
	const [edgeStartNode, setEdgeStartNode] = React.useState(null)
	const [edgeEndNode, setEdgeEndNode] = React.useState(null)

	const [layerOffsetX, setLayerOffsetX] = React.useState(0)
	const [layerOffsetY, setLayerOffsetY] = React.useState(0)

	// multi-select by dragging
	const [isMultiSelecting, setIsMultiSelecting] = React.useState(false)
	const [multiSelectStartX, setMultiSelectStartX] = React.useState(0)
	const [multiSelectStartY, setMultiSelectStartY] = React.useState(0)
	const [multiSelectEndX, setMultiSelectEndX] = React.useState(0)
	const [multiSelectEndY, setMultiSelectEndY] = React.useState(0)

	// Context menu
	const [showCanvasContextMenu, setShowCanvasContextMenu] = React.useState(false)
	const [canvasContextMenuPosition, setCanvasContextMenuPosition] = React.useState({ x: 0, y: 0 })
	const [canvasContextMenuType, setCanvasContextMenuType] = React.useState('stage')

	// Node controls
	const [showAddNodeDropdown, setShowAddNodeDropdown] = React.useState(false)
	const [showAddNodeASDropdown, setShowAddNodeASDropdown] = React.useState(false)

	React.useImperativeHandle(ref, () => ({
		panToNode(node: any) {
			const targetPoint = {
	      x: (node.x + DEFAULT_NODE_WIDTH/2), 
	      y: (node.y + DEFAULT_NODE_HEIGHT/2) 
	    };

	    const stage: any = stageRef.current

	    let currOriginX = -stage.x() + getStageWidth()/2
	    let currOriginY = -stage.y() + getStageHeight()/2

	    let distX = targetPoint.x - currOriginX
	    let distY = targetPoint.y - currOriginY

	    setStageX(stage.x() - distX*stageScale)
	    setStageY(stage.y() - distY*stageScale)		
	    setStageScale(1)
	    selectNode(node)
		},
		getStage() {
			return stageRef.current
		},
		getStageDimensions() {
			return { width: getStageWidth(), height: getStageHeight() }
		}
	}))

	const getStageWidth = () => {
		return window.innerWidth
	}

	const getStageHeight = () => {
		return window.innerHeight-110//60
	}

	const getSelectedNodeId = () => {
		return Object.keys(props.selectedNodes)[0]
	}

	const getNodeById = (nodeId: any) => {
		return appContext.getGraphNodeById(nodeId) // appContext.fetchedContent[nodeId]
	}

	const getSelectedNode = () => {
		return getNodeById(getSelectedNodeId())
	}

	const getSelectedNodes = () => {
		return Object.keys(props.selectedNodes).map(nodeId => getNodeById(nodeId))
	}

	const numSelectedEdges = () => {
		return Object.keys(props.selectedEdges).length
	}

	const numSelectedNodes = () => {
		return Object.keys(props.selectedNodes).length
	}

	const insertNode = (node: any) => {
		const g = appContext.getCurrGraphData()

		appContext.updateGraphDataByTabId(appContext.currExplorerTab.id, { 
			nodes: [...g.nodes, node], 
			edges: g.edges 
		})
	}

	const insertEdge = (fromId: any, toId: any) => {
		const g = appContext.getCurrGraphData()

		appContext.updateGraphDataByTabId(appContext.currExplorerTab.id, { 
			nodes: g.nodes, 
			edges: [...g.edges, { source: fromId, target: toId }] 
		})

		saveGenericConnection(fromId, toId)
	}

	const selectNode = (node: any) => {
		if (showCanvasContextMenu === true && canvasContextMenuType === 'add-node-to') {
			const url = `/api/v1/spaces/${getSelectedNode().id}/move/` 
	    let body = { new_parent_id: node ? node.id : 'root', copy: true }

	    addToCollectionCallback(node)

	    fetch(url, {
	      method: 'POST',
	      headers: {
	        'Content-type': 'application/json'
	      },
	      body: JSON.stringify(body)
	    })
	    .then((res: any) => {
	      if (!res.ok) {
	        if (res.status === 401) {

	        }
	        throw new Error(res.status)
	      } 
	      else return res.json()
	    })
	    .then((data: any) => {
	    	// addToCollectionCallback(node)
	    })
	    .catch((error: any) => {
	      console.log('error: ' + error)
	    }) 
	    return
		}

		if (showCanvasContextMenu === true && canvasContextMenuType === 'add-nodes-to') {
			const url = `/api/v1/spaces/${node.id}/collection_data/`
	    let body = { space_ids: getSelectedNodes().map(s => s.id) }

	    addToCollectionCallback(node)

	    fetch(url, {
	      method: 'POST',
	      headers: {
	        'Content-type': 'application/json'
	      },
	      body: JSON.stringify(body)
	    })
	    .then((res: any) => {
	      if (!res.ok) {
	        if (res.status === 401) {

	        }
	        throw new Error(res.status)
	      } 
	      else return res.json()
	    })
	    .then((data: any) => {
	    	// addToCollectionCallback(node)
	    })
	    .catch((error: any) => {
	      console.log('error: ' + error)
	    }) 
	    return
		}

		props.setSelectedNodes({ [node.id]: true })
		props.setSelectedEdges({})
	}

	const selectEdge = (edge: any) => {
		const key = `${edge.source}::${edge.target}`
		props.setSelectedEdges({ [key]: true })
		props.setSelectedNodes({})
	}

	const multiSelectNodes = () => {
		const X = multiSelectStartX
		const Y = multiSelectStartY
		const A = multiSelectEndX
		const B = multiSelectEndY

		let newSelected: any = {}

		const nodes = appContext.getCurrGraphData().nodes
		nodes.forEach((n: any) => {
			const node = appContext.getFetchedContentById(n.id)

			const X1 = node.x
			const Y1 = node.y
			const A1 = node.x + DEFAULT_NODE_WIDTH
			const B1 = node.y + DEFAULT_NODE_HEIGHT

			// simple overlapping rect collision test
			// top-left to bottom-right 
			if (A > X && B > Y) {
				if (!(A < X1 || A1 < X || B < Y1 || B1 < Y)) {
					newSelected[node.id] = true
				}
			}
			// bottom-left to top-right
			else if (A > X && B < Y) {
				if (!(A < X1 || A1 < X || B1 < B || Y < Y1)) {
					newSelected[node.id] = true
				}
			}
			// top-right to bottom-left
			else if (A < X && B > Y) {
				if (!(A1 < A || X < X1 || B < Y1 || B1 < Y)) {
					newSelected[node.id] = true
				}
			}
			// bottom-right to top-left
			else if (A < X && B < Y) {
				if (!(A1 < A || X < X1|| B > B1 || X1 > X)) {
					newSelected[node.id] = true
				}
			}
		})
		props.setSelectedNodes(newSelected)
	}

	const getScaledPointer = (stage: any) => {
		return { x: stage.getPointerPosition().x / stageScale - stage.x() / stageScale, y: stage.getPointerPosition().y / stageScale - stage.y() / stageScale }
	}

	const initNodeData = (node: any) => {
		fetch(`/api/v1/spaces/`, {
      method: 'POST',
      headers: {
        'Content-type': 'application/json'
      },
      body: JSON.stringify({ id: node.id })
    })
    .then((res: any) => {
      if (!res.ok) {
        if (res.status === 401) {
        }
        throw new Error(res.status)
      } 
      else return res.json()
    })
    .then(() => {

    })
    .catch((error: any) => {
      console.log('error: ' + error)
    })
	}

	const saveSelectedNode = () => {
		// Save currently selected node
		if (!props.demo) {
			const nodeId = Object.keys(props.selectedNodes)[0]
			saveNodeContent(nodeId)
		}
	}

	const handleStageClick = (e: any) => {
		if (e.target.getType() !== 'Stage') return

		saveSelectedNode()
		setShowCanvasContextMenu(false)

		// clear selection
		props.setSelectedNodes({})
		props.setSelectedEdges({})
	}

	const handleStageDblClick = (e: any) => {
		if (e.target.getType() !== 'Stage') return

		e.evt.preventDefault()

		const stage = e.target.getStage()

		const node = {
			id: uuid.v4(),
			title: '',
			content_type: 'Space',
			x: getScaledPointer(stage).x,
			y: getScaledPointer(stage).y
		}

		// insert into graph
		insertNode({ id: node.id, content_type: node.content_type })

		// add to data
		appContext.updateFetchedContentById(node.id, node)

		initNodeData(node)
		// update nodeDispaly location
		// appContext.updateGraphNodeDisplayByNodeId(node.id, { x: getScaledPointer(stage).x, y: getScaledPointer(stage).y })
	}

	// handle zoom
	const handleStageWheel = (e: any) => {
		e.evt.preventDefault()

		const scaleBy = 1.02
		const stage = e.target.getStage()	
		const oldScale = stage.scaleX()
		const mousePointTo = {
      x: stage.getPointerPosition().x / oldScale - stage.x() / oldScale,
      y: stage.getPointerPosition().y / oldScale - stage.y() / oldScale
    };

    const newScale = e.evt.deltaY <= 0 ? oldScale * scaleBy : oldScale / scaleBy;

    setStageScale(newScale)
    setStageX(-(mousePointTo.x - stage.getPointerPosition().x / newScale) * newScale)
    setStageY(-(mousePointTo.y - stage.getPointerPosition().y / newScale) * newScale)
	}

	const handleStageContextMenu = (e: any) => {
		// TODO - implement logic
	}

	const handleStageDragStart = (e: any) => {
		if (e.evt.ctrlKey) {
			e.target.stopDrag()

			const stage = e.target.getStage()
			setMultiSelectStartX(getScaledPointer(stage).x) //(stage.getPointerPosition().x)
			setMultiSelectStartY(getScaledPointer(stage).y) //(stage.getPointerPosition().y)
			setIsMultiSelecting(true)
		}
	}

	const handleStageMouseMove = (e: any) => {
		const stage = e.target.getStage()

		// console.log('handleStageMouseMove', stage.getPointerPosition(), stage.x(), stage.y(), stageScale, getScaledPointer(stage), e.target.x(), e.target.y())

		if (isDraggingLine) {
			setEdgeEndX(getScaledPointer(stage).x)
			setEdgeEndY(getScaledPointer(stage).y)
		}

		if (isMultiSelecting) {
			setMultiSelectEndX(getScaledPointer(stage).x)
			setMultiSelectEndY(getScaledPointer(stage).y)
		}
	}

	const handleStageMouseUp = () => {
		if (isDraggingLine) {
			setIsDraggingLine(false)
			insertEdge(edgeStartNode.id, edgeEndNode.id)
		}

		if (isMultiSelecting) {
			setIsMultiSelecting(false)
			multiSelectNodes()
		}
	}

	const handleCanvasKeyDown = (e: any) => {
		// remove selected node(s) and edge(s)
		if (e.key === 'Delete') {
			const g = appContext.getCurrGraphData()
			const nodes = g.nodes.filter((n: any) => props.selectedNodes[n.id] !== true)

			let edgesToDelete: any = {}
			const edges = g.edges.filter((edge: any) => {
				const edgeKey = `${edge.source}::${edge.target}`
				if (props.selectedEdges[edgeKey]) {
					edgesToDelete[edge.source] = [...(edgesToDelete[edge.source] || []), edge.target]
				}

				return !props.selectedNodes[edge.source] && !props.selectedNodes[edge.target] && !props.selectedEdges[edgeKey]
			})

			appContext.updateGraphDataByTabId(appContext.currExplorerTab.id, {
				nodes: nodes,
				edges: edges
			})

			props.setSelectedNodes({})
			props.setSelectedEdges({})

			Object.keys(edgesToDelete).forEach((sourceId: string) => {
				deleteManyGenericConnection(sourceId, edgesToDelete[sourceId])
			})
		}

		if (e.key === 'f' && e.ctrlKey) {
			e.preventDefault()

			props.focusOnSearch()
		}

		// debug
		if (e.key === 'd' && e.ctrlKey) {
			console.log(appContext.getCurrFetchedContent())
			// console.log(appContext.getCurrGraphData())
			console.log(props.getGraphDataToSave())
		}

		if (e.key === 's' && e.ctrlKey) {
			e.preventDefault()
			// TODO - 
			// console.log(appContext.getCurrFetchedContent())

			props.saveTab()
		}

		if ((e.keyCode===90 && e.ctrlKey) || (e.keyCode===90 && e.metaKey) ) {
			console.log("undo triggered")
		}

		// TEST CODE
		if (e.key === 'p') {
			// panToNode(getSelectedNode())
		}
	}

	const saveGenericConnection = (fromId: any, toId: any) => {
		fetch(`/api/v1/spaces/${fromId}/connections/`, {
      method: 'POST',
      headers: {
        'Content-type': 'application/json'
      },
      body: JSON.stringify({ target_id: toId })
    })
    .then((res: any) => {
      if (!res.ok) {
        if (res.status === 401) {
        }
        throw new Error(res.status)
      } 
      else return res.json()
    })
    .then(() => {

    })
    .catch((error: any) => {
      console.log('error: ' + error)
    })
	}

	const deleteManyGenericConnection = (fromId: any, toIds: any) => {
		fetch(`/api/v1/spaces/${fromId}/connections/`, {
      method: 'DELETE',
      headers: {
        'Content-type': 'application/json'
      },
      body: JSON.stringify({ target_ids: toIds })
    })
    .then((res: any) => {
      if (!res.ok) {
        if (res.status === 401) {
        }
        throw new Error(res.status)
      } 
      else return res.json()
    })
    .then(() => {

    })
    .catch((error: any) => {
      console.log('error: ' + error)
    })
	}

	const deleteGenericConnection = (fromId: any, toId: any) => {
		fetch(`/api/v1/spaces/${fromId}/connections/`, {
      method: 'DELETE',
      headers: {
        'Content-type': 'application/json'
      },
      body: JSON.stringify({ target_id: toId })
    })
    .then((res: any) => {
      if (!res.ok) {
        if (res.status === 401) {
        }
        throw new Error(res.status)
      } 
      else return res.json()
    })
    .then(() => {

    })
    .catch((error: any) => {
      console.log('error: ' + error)
    })
	}

	const saveNodeContent = (nodeId: string) => {
		if (!nodeId) {
			return
		}
		// const nodeId = Object.keys(props.selectedNodes)[0]
		const node = appContext.getFetchedContentById(nodeId)

		const body = {
			title: node.title,
			json_body: node.json_body,
			text_body: node.text_body
		}

		fetch(`/api/v1/spaces/${nodeId}/`, {
      method: 'PATCH',
      headers: {
        'Content-type': 'application/json'
      },
      body: JSON.stringify(body)
    })
    .then((res: any) => {
      if (!res.ok) {
        if (res.status === 401) {
        }
        throw new Error(res.status)
      } 
      else return res.json()
    })
    .then(() => {
    })
    .catch((error: any) => {
      console.log('error: ' + error)
    })
	}

	const openCanvasContextMenu = (menuType: string, pageX: number, pageY: number) => {
		console.log('openCanvasContextMenu', menuType)

		setShowCanvasContextMenu(true)
		setCanvasContextMenuPosition({ x: pageX, y: pageY-60 })
		setCanvasContextMenuType(menuType)
	}

	// const panToNode = (node: any) => {
	// 	const targetPoint = {
 //      x: (node.x + DEFAULT_NODE_WIDTH/2), 
 //      y: (node.y + DEFAULT_NODE_HEIGHT/2) 
 //    };

 //    const stage: any = stageRef.current

 //    let currOriginX = -stage.x() + getStageWidth()/2
 //    let currOriginY = -stage.y() + getStageHeight()/2

 //    let distX = targetPoint.x - currOriginX
 //    let distY = targetPoint.y - currOriginY

 //    setStageX(stage.x() - distX*stageScale)
 //    setStageY(stage.y() - distY*stageScale)		
 //    setStageScale(1)
	// }

	const handleLineUpHorizontal = () => {
		const nodes = Object.keys(props.selectedNodes).map((nodeId: string) => {
			return appContext.getFetchedContentById(nodeId)
		})

		let sumY = 0
		let leftX: number
		let rightX: number
		nodes.forEach((n: any) => { 
			sumY += n.y 
			if (!leftX || n.x < leftX) {
				leftX = n.x
			}

			if (!rightX || n.x > rightX) {
				rightX = n.x
			}
		})

		const avgY = sumY / nodes.length

		const sortedNodesByX = nodes.sort((a: any, b: any) => {
			if (a.x < b.x) {
				return -1
			}
			else if (a.x > b.x) {
				return 1
			}
			else {
				return 0
			}
		})

		let newFetchedContent: any = {}
		let xInterval = (rightX - leftX) / (sortedNodesByX.length - 1)
		if (xInterval < 100) {
			xInterval = 150
		}

		sortedNodesByX.forEach((n: any, index: number) => {
			newFetchedContent[n.id] = {
				...n,
				x: leftX + xInterval * index,
				y: avgY
			}
		})

		appContext.updateFetchedContent(newFetchedContent)
		setShowCanvasContextMenu(false)
	}

	const handleLineUpVertical = () => {
		const nodes = Object.keys(props.selectedNodes).map((nodeId: string) => {
			return appContext.getFetchedContentById(nodeId)
		})

		let sumX = 0
		let topY: number
		let bottomY: number
		nodes.forEach((n: any) => { 
			sumX += n.x
			if (!topY || n.y < topY) {
				topY = n.y
			}

			if (!bottomY || n.y > bottomY) {
				bottomY = n.y
			}
		})

		const avgX = sumX / nodes.length

		const sortedNodesByY = nodes.sort((a: any, b: any) => {
			if (a.y < b.y) {
				return -1
			}
			else if (a.y > b.y) {
				return 1
			}
			else {
				return 0
			}
		})

		let newFetchedContent: any = {}
		let yInterval = (bottomY - topY) / (sortedNodesByY.length - 1)
		if (yInterval < 50) {
			yInterval = 75
		}

		sortedNodesByY.forEach((n: any, index: number) => {
			newFetchedContent[n.id] = {
				...n,
				x: avgX,
				y: topY + yInterval * index
			}
		})

		appContext.updateFetchedContent(newFetchedContent)
		setShowCanvasContextMenu(false)
	}

	const addToCollectionCallback = (space: any) => {
		// if the space is already in the current graph view, add the connections
		if (appContext.getFetchedContentById(space.id)) {
			if (numSelectedNodes() > 1) {
				// add edge to graphData
				const g = appContext.getCurrGraphData()
				const newEdges = getSelectedNodes().map(n => { return { source: space.id, target: n.id, type: 'directed' } })
				appContext.updateCurrGraphData({
					nodes: g.nodes,
					edges: [...new Set([...g.edges, ...newEdges])]
				})
			}
			else if (numSelectedNodes() === 1) {
				// add edge to graphData
				const g = appContext.getCurrGraphData()
				const newEdge = { source: space.id, target: getSelectedNodeId(), type: 'directed' }

				appContext.updateCurrGraphData({
					nodes: g.nodes,
					edges: [...new Set([...g.edges, newEdge])]
				})
			}
		}

		setShowCanvasContextMenu(false)
	}

	const handleSaveBtnClick = () => {
		saveSelectedNode()
		props.saveTab()
	}

	const handleAddBtnClick = () => {
		setShowAddNodeDropdown(true)
	}

	const buildNodes = () => {
		// console.log('buildNodes in ExplorerCanvas', appContext.getCurrGraphData())
		return appContext.getCurrGraphData().nodes.map((n: any) => {
			const node = appContext.getFetchedContentById(n.id)

			return(
				<ResizableNode 
					{...props}
					node={node} 
					appContext={appContext} 	// workaround, somehow appContext was empty inside ExplorerNode
					focusOnTitle={props.focusOnTitle}
					selectNode={selectNode}
					// for drawing connections
					isDraggingLine={isDraggingLine}
					setIsDraggingLine={setIsDraggingLine}
					setEdgeStartX={setEdgeStartX}
					setEdgeStartY={setEdgeStartY}
					setEdgeEndX={setEdgeEndX}
					setEdgeEndY={setEdgeEndY}
					setEdgeStartNode={setEdgeStartNode}
					setEdgeEndNode={setEdgeEndNode}
					getScaledPointer={getScaledPointer}
					setSelectedNodes={props.setSelectedNodes}
					openCanvasContextMenu={openCanvasContextMenu}
				/>
			)
		})
	}

	const buildEdges = () => {
		return appContext.getCurrGraphData().edges.map((edge: any) => {
			if (edge.type === 'directed') {
				return(
					<ExplorerEdgeDirected
						{...props}
						selectEdge={selectEdge}
						edge={edge} 
						appContext={appContext}
					/>
				)
			}

			if (edge.type === 'suggested') {
				return(
					<ExplorerEdgeSuggested
						{...props}
						selectEdge={selectEdge}
						edge={edge} 
						appContext={appContext} 
					/>
				)
			}

			// default to undirected edges
			return(
				<ExplorerEdgeUndirected
					{...props}
					selectEdge={selectEdge}
					edge={edge} 
					appContext={appContext} 
				/>
			)
		})
	}

	const buildNewEdge = () => {
		if (!isDraggingLine) {
			// show nothing
			return(
				<Circle radius={0} />
			)
		}

		return(
			<Line 
				points={[edgeStartX, edgeStartY, edgeEndX, edgeEndY]}
				strokeWidth={2}
				stroke={'#9CA3DB'}
			/>
		)
	}

	const buildMultiSelectRect = () => {
		if (!isMultiSelecting) {
			// show nothing
			return <Circle radius={0} />
		}

		return(
			<Rect
				x={multiSelectStartX}
				y={multiSelectStartY}
				width={multiSelectEndX - multiSelectStartX}
				height={multiSelectEndY - multiSelectStartY}
				fill={'#eff7ff'}
				stroke={'#0f8bff'}
				strokeWidth={1}
				opacity={0.25}
			/>
		)
	}

	const buildSaveBtn = () => {
		// disable save for demo
		if (props.demo === true || props.isPublicGraph()) return ''

		if (appContext.isSavingExplorerTab()) {
			return(
				<div 
					className="save-btn inline-block"
					style={{ background: 'none', color: '#777' }}
				>
					Saving...
				</div>
			)
		}

		return(
			<div
				className="save-btn inline-block btn"
				onClick={handleSaveBtnClick}
			>
				Save
	    </div>
		)
	}

	const buildAddBtn = () => {
		return(
			<div 
        className="inline-block"
        style={{marginRight: '0.5em'}}
      >
        <button 
        	onClick={handleAddBtnClick}
          className="graph-action-btn"
          style={{display: 'block'}}
          title="Add a node to this graph"
        >
          <i className="fa fa-plus"></i>
        </button>
        { buildAddNodeDropdown() }
				{ buildAddNodeASDropdown() }
      </div>
		)
	}

	const handleNewNodeClick = () => {
		const node = {
			id: uuid.v4(),
			title: '',
			content_type: 'Space'
		}

		props.insertNode(node)
		setShowAddNodeDropdown(false)
	}

	const handleAddExistingNodeClick = () => {
		setShowAddNodeASDropdown(true)
		setShowAddNodeDropdown(false)
	}

	const handleAddNodeASResultClick = (node: any) => {
		props.insertNode(node)
		setShowAddNodeDropdown(false)
	}

	const buildAddNodeDropdown = () => {
		if (!showAddNodeDropdown) return ''

		return(
			<ClickHandler
				close={() => setShowAddNodeDropdown(false)}
			>
				<div className="dropdown dropdown-narrow">
					<div 
						className="dropdown-action"
						onClick={handleNewNodeClick}
					>
						Create a new node
					</div>
					<div 
						className="dropdown-action"
						onClick={handleAddExistingNodeClick}
					>
						Add an existing node
					</div>
				</div>
			</ClickHandler>
		)
	}

	const buildAddNodeASDropdown = () => {
		if (!showAddNodeASDropdown) return ''

		return(
			<ClickHandler
				close={() => setShowAddNodeASDropdown(false)}
			>
				<ContentASDropdown 
					closeDropdown={() => setShowAddNodeASDropdown(false)}
					selectContent={handleAddNodeASResultClick}
				/>
			</ClickHandler>
		)
	}

	const buildGraphControls = () => {
		return (
			<div className="graph-controls">
				{ buildSaveBtn() }
		    { buildAddBtn() }
			</div>
		)
	}



	const buildCanvasContextMenu = () => {
		if (!showCanvasContextMenu) {
			return ''
		}

		if (canvasContextMenuType === 'multiple') {
			return(
				<ClickHandler
					close={() => setShowCanvasContextMenu(false)}
				>
					<div 
						className="dropdown context-menu-dropdown"
						style={{
							left: canvasContextMenuPosition.x,
							top: canvasContextMenuPosition.y
						}}
					>
						<div 
							className="dropdown-action"
							onClick={() => setCanvasContextMenuType('add-nodes-to')}
						>
							<i className="fa fa-tags icon"></i>
							Add to collection
						</div>
						<div 
							className="dropdown-action"
							onClick={() => setCanvasContextMenuType('layout')}
						>
							Layout
						</div>
					</div>
				</ClickHandler>
			)
		}

		if (canvasContextMenuType === 'node') {
			return(
				<ClickHandler
					close={() => setShowCanvasContextMenu(false)}
				>
					<div 
						className="dropdown context-menu-dropdown"
						style={{
							left: canvasContextMenuPosition.x,
							top: canvasContextMenuPosition.y
						}}
					>
						<div 
							className="dropdown-action"
							onClick={() => setCanvasContextMenuType('add-node-to')}
						>
							<i className="fa fa-tags icon"></i> Add to collection
						</div>
					</div>
				</ClickHandler>
			)
		}

		if (canvasContextMenuType === 'add-node-to') {
			return(
				<ClickHandler
					close={() => {}}//setShowCanvasContextMenu(false)}
				>
		      <MoveToMenu
		      	disableTopLevel={true}
		        placeholder="Add to..."
		        content={getSelectedNode()}	// 
		        copy={true}
	    			dropdownLeft={canvasContextMenuPosition.x}
		        dropdownTop={canvasContextMenuPosition.y}
		        closeDropdown={() => bodyScrollLock.clearAllBodyScrollLocks()}
		        onSuccess={addToCollectionCallback}
		      />
		    </ClickHandler>
	    )
		}

		if (canvasContextMenuType === 'add-nodes-to') {
			return(
				<ClickHandler
					close={() => {}}//setShowCanvasContextMenu(false)}
				>
		      <MoveToMenu
		      	disableTopLevel={true}
		        many={true}
		        placeholder="Add to..."
		        content={getSelectedNodes()}	// TODO - fix this
		        copy={true}
	    			dropdownLeft={canvasContextMenuPosition.x}
		        dropdownTop={canvasContextMenuPosition.y}
		        closeDropdown={() => bodyScrollLock.clearAllBodyScrollLocks()}
		        onSuccess={addToCollectionCallback}
		      />
		    </ClickHandler>
	    )
		}

		if (canvasContextMenuType === 'layout') {
			return(
				<ClickHandler
					close={() => setShowCanvasContextMenu(false)}
				>
					<div 
						className="dropdown context-menu-dropdown"
						style={{
							left: canvasContextMenuPosition.x,
							top: canvasContextMenuPosition.y
						}}
					>
						<div 
							className="dropdown-action"
							onClick={handleLineUpHorizontal}
						>
							<i className="fa fa-ellipsis-h icon"></i> Line up horizontally
						</div>
						<div 
							className="dropdown-action"
							onClick={handleLineUpVertical}
						>
							<i className="fa fa-ellipsis-v icon"></i> Line up vertically
						</div>
					</div>
				</ClickHandler>
			)
		}
	}

	if (props.isFetchingTabData) {
		return(
			<div 
				className="canvas-container"
				// style={{width: window.innerWidth, height: window.innerHeight-110, padding: '1em'}}
			>
				<div style={{position: 'absolute', left: '1em', top: '1em'}}>
					Fetching data...
				</div>
				<Stage
					width={getStageWidth()} 
					height={getStageHeight()}
				>
				</Stage>
			</div>
		)
	}

	return(
		<div 
			tabIndex={0}
			onKeyDown={handleCanvasKeyDown}
			className="canvas-container"
		>
			<Stage 
				ref={stageRef}
				draggable={true}
				scaleX={stageScale}
				scaleY={stageScale}
				x={stageX}
				y={stageY}
				width={getStageWidth()} 
				height={getStageHeight()}
				onWheel={handleStageWheel}
				onDragStart={handleStageDragStart}
				onClick={handleStageClick}
				onDblclick={handleStageDblClick}
				onContextMenu={handleStageContextMenu}
				onMouseMove={handleStageMouseMove}
				onMouseUp={handleStageMouseUp}
			>
			  <Layer
			  	offsetX={layerOffsetX}
			  	offsetY={layerOffsetY}
			  >
	      	{ buildEdges() }
	      	{ buildNodes() }
	      	{ buildNewEdge() }
	      	{ buildMultiSelectRect() }
	      </Layer>
	    </Stage>

	    { buildGraphControls() }
	    
	    { buildCanvasContextMenu() }
    </div>
	)
})

const ExplorerTab = (props: any) => {
	const appContext: any = React.useContext(AppContext)

	const [isEditingTab, setIsEditingTab] = React.useState(false)
	const [tabTitle, setTabTitle] = React.useState(props.tab.title)
	const [showTabContextMenu, setShowTabContextMenu] = React.useState(false)
	const [tabContextMenuType, setTabContextMenuType] = React.useState('default')

	const urlRef: any = React.useRef()
	
	const getUpdatedTab = () => {
		return({
			...props.tab,
			title: tabTitle
		})
	}

	const updateTab = () => {
		// console.log('ExplorerTab updateTab')

		setIsEditingTab(false)
		props.updateTab(getUpdatedTab())
	}

	const handleTabClick = (tab: any) => {
		appContext.updateCurrExplorerTab(tab)
	}

	const handleTabDblClick = () => {
		setIsEditingTab(true)
	}

	const handleRenameTabClick = () => {
		setIsEditingTab(true)
	}

	const handleTabContextMenu = (e: any) => {
		setShowTabContextMenu(true)
		setTabContextMenuType('default')
		
		e.preventDefault()
    return false
	}

	const handleInputKeyDown = (e: any) => {
		if (e.key === 'Enter') {
			updateTab()
		}
	}

	const handleHideTabClick = (e: any) => {
		e.preventDefault()
		setShowTabContextMenu(false)

		// remove from tabs
		const tabs = appContext.explorerTabs.filter((tab: any) => tab.id !== props.tab.id)
		appContext.updateExplorerTabs(tabs)
	}

	const handleCopyLinkClick = () => {
		setTabContextMenuType('copy-link')
		urlRef.current.select()
  	document.execCommand('copy')
	}

	const buildTabContextMenu = () => {
		if (!showTabContextMenu) return ''

		if (tabContextMenuType === 'copy-link') {
			return(
				<ClickHandler
					close={() => setShowTabContextMenu(false)}
				>
					<div className="dropdown context-menu-dropdown">
						<input 
							ref={urlRef}
							value={`https://getrumin.com/explorer?viewId=${props.tab.id}&viewTitle=${props.tab.title}`}
							style={{width: '100%'}}
						/>
					</div>
				</ClickHandler>
			)
		}

		return(
			<ClickHandler
				close={() => setShowTabContextMenu(false)}
			>
				<div className="dropdown context-menu-dropdown explorer-tab-dropdown">
					<div 
						className="dropdown-action"
						onClick={handleHideTabClick}
					>
						<i className="fa fa-eye-slash icon"></i> Hide
					</div>
					<div 
						className="dropdown-action"
						onClick={handleCopyLinkClick}
					>
						<i className="fa fa-link icon"></i> Copy link
					</div>
					<div 
						className="dropdown-action"
						onClick={handleRenameTabClick}
					>
						Rename
					</div>
				</div>
			</ClickHandler>
		)
	}

	if (isEditingTab) {
		return(
			<div 
	  		className={`tab clickable clickable-blue  gray-text small-text ${appContext.currExplorerTab.id === props.tab.id ? ' active' : ''}`}
	  		onClick={() => handleTabClick(props.tab)}
	  	>
	  		<input
	  			className="edit-title"
	  			value={tabTitle}
	  			onChange={(e: any) => setTabTitle(e.target.value)}
	  			onBlur={updateTab}
	  			onKeyDown={handleInputKeyDown}
	  			placeholder="Untitled"
	  		/>
	  	</div>
		)
	}

	return(
		<div>
			<div 
	  		className={`tab clickable clickable-blue  gray-text small-text ${appContext.currExplorerTab.id === props.tab.id ? ' active' : ''}`}
	  		onClick={() => handleTabClick(props.tab)}
	  		onDoubleClick={handleTabDblClick}
	  		onContextMenu={handleTabContextMenu}
	  		title={ props.tab.title || 'Untitled' }
	  	>
	  		{ props.tab.title || 'Untitled' }
	  	</div>
	  	{ buildTabContextMenu() }
	  </div>
	)
}

export const ExplorerTabs = (props: any) => {
	const appContext: any = React.useContext(AppContext)
	const [showMenuDropdown, setShowMenuDropdown] = React.useState(false)
	const [showASDropdown, setShowASDropdown] = React.useState(false)

	const handleNewTabClick = () => {
		setShowMenuDropdown(true)
	}

	const handleExistingTabClick = () => {
		setShowMenuDropdown(false)
		setShowASDropdown(true)
	}

	const handleGraphViewResultclick = (graphView: any) => {
		const explorerTabIds: string[] = appContext.explorerTabs.map((t: any) => t.id)

		// tab is already in workspace, switch to tab
		if (explorerTabIds.indexOf(graphView.id) !== -1) {
			appContext.updateCurrExplorerTab(graphView)
		}
		else {
			appContext.updateExplorerTabs([...appContext.explorerTabs, graphView])
			appContext.updateCurrExplorerTab(graphView)
		}

		setShowMenuDropdown(false)
		setShowASDropdown(false)
	}

	const addNewTab = () => {
		props.addNewTab()
		setShowMenuDropdown(false)
	}

	const buildTab = (tab: any) => {
    const icon = tab.iconUrl ? <div className="inline-block align-middle"><img src={tab.iconUrl} className="icon" /></div> : ''

    return(
    	<ExplorerTab 
    		{...props} 
    		tab={tab}
    	/>
    )
  }

  const buildTabs = () => {
    return appContext.explorerTabs.map((tab: any) => {
      return buildTab(tab)
    })
  }

  const buildMenuDropdown = () => {
		if (!showMenuDropdown) return ''

		return(
			<ClickHandler
				close={() => setShowMenuDropdown(false)}
			>
				<div
					className="dropdown new-exp-tab-dropdown"
				>
					<div 
						className="dropdown-action"
						onClick={() => addNewTab()}
					>
						Create a new Canvas
					</div>
					<div 
						className="dropdown-action"
						onClick={handleExistingTabClick}
					>
						Open an existing Canvas
					</div>
				</div>
			</ClickHandler>
		)
	}

	const buildASDropdown = () => {
		if (!showASDropdown) return ''

		return(
			<ClickHandler
				close={() => setShowASDropdown(false)}
			>
				<GraphViewASDropdown 
					closeDropdown={() => setShowASDropdown(false)}
					selectGraphView={handleGraphViewResultclick}
				/>
			</ClickHandler>
		)
	}

	return(
		<div 
			className="flex explorer-tabs"
			style={{paddingLeft: '1em'}}
		>
			{ buildTabs() }

			<div 
				className="clickable relative"
				style={{padding: '0.75em'}}
				onClick={handleNewTabClick}
				title="New tab"
			>
				<i className="fa fa-plus-circle small-text"></i>
				{ buildMenuDropdown() }
				{ buildASDropdown() }
			</div>

		</div>
	)
}

export const ExplorerRightPane = (props: any) => {
	const appContext: any = React.useContext(AppContext)
	
	const INIT_SNIPPET_LENGTH = 5

	const [isFetchingNodeSubpages, setIsFetchingNodeSubpages] = React.useState(false)
	const [isFetchingNodeMentions, setIsFetchingNodeMentions] = React.useState(false)
	const [isFetchingNodeSuggestions, setIsFetchingNodeSuggestions] = React.useState(false)
	const [isFetchingNodeRelated, setIsFetchingNodeRelated] =React.useState(false)

	const [hasFetchedNodeSubpages, setHasFetchedNodeSubpages] = React.useState(false)
	const [hasFetchedNodeMentions, setHasFetchedNodeMentions] = React.useState(false)
	const [hasFetchedNodeSuggestions, setHasFetchedNodeSuggestions] = React.useState(false)
	const [hasFetchedNodeRelated, setHasFetchedNodeRelated] =React.useState(false)


	const [isBodyTruncated, setIsBodyTruncated] = React.useState(false)

	const [isNodeChanged, setIsNodeChanged] = React.useState(false)
	const [isSavingNodeData, setIsSavingNodeData] = React.useState(false)

	React.useEffect(() => {
		setIsBodyTruncated(true)	// reset
		
		// reset state 
		setIsFetchingNodeSubpages(false)
		setIsFetchingNodeMentions(false)
		setIsFetchingNodeSuggestions(false)
		setIsFetchingNodeRelated(false)
		setHasFetchedNodeSubpages(false)
		setHasFetchedNodeMentions(false)
		setHasFetchedNodeSuggestions(false)
		setHasFetchedNodeRelated(false)

		if (getSelectedNodeId() && !hasFetchedAllConnectedContent()) {
			fetchNodeConnectedContent()
		}

	}, [props.selectedNodes])

	const getSelectedNodeId = () => {
		return Object.keys(props.selectedNodes)[0]
	}

	const hasFetchedAllConnectedContent = () => {
		return (getIsConnectedContentTypeChecked('subpages') && getIsConnectedContentTypeChecked('mentions') && getIsConnectedContentTypeChecked('related')) || (hasFetchedNodeSubpages && hasFetchedNodeMentions && hasFetchedNodeRelated)
	}

	const hasFetchedSuggestions = () => {
		return getIsConnectedContentTypeChecked('suggestions') || hasFetchedNodeSuggestions
	}

	const getNodeById = (nodeId: string) => {
		return appContext.getGraphNodeById(nodeId) //appContext.fetchedContent[nodeId]
	}

	const getSelectedNode = () => {
		return getNodeById(getSelectedNodeId())
	}

	const getSelectedNodes = () => {
		return Object.keys(props.selectedNodes).map(nodeId => getNodeById(nodeId))
	}

	const getSelectedEdge = () => {
		const edgeKey = Object.keys(props.selectedEdges)[0]
		const edgeSource = edgeKey.split('::')[0]
		const edgeTarget = edgeKey.split('::')[1]
		return { source: edgeSource, target: edgeTarget }
	}

	const getSelectedNodeTitle = () => {
		return getSelectedNode() ? getSelectedNode().title : ''
	}

	const getEditorValue = (value: any) => {
		// console.log('getEditorValue', value)
	}

	const fetchNodeConnectedContent = () => {
		const node = getSelectedNode()
		// console.log('fetchNodeConnectedContent', node)
		if (!node.id) return

		fetchSubpagesForNode(node, false)
		fetchMentionsForNode(node, false)
		fetchRelatedForNode(node, false)
	}

	const parseCollectionData = (currNode: any, results: any) => {
		let newFetchedContent: any = {}
		let newNodes: any[] = []

		results.forEach((content: any) => {
			let newNode = appContext.nodeFromContent(content)
	  	newNode.x = currNode.x + (Math.round(Math.random())*2 - 1) * (Math.random() * 150 + 50),	// random sign, random number that is at least 200 in magnitude
	    newNode.y = currNode.y + (Math.round(Math.random())*2 - 1) * (Math.random() * 150 + 50)

	    // if there is no existing node object 
	    if (Object.keys(appContext.getFetchedContentById(content.id)).length === 0) {
	    	newNode.display = false 	// hide by default
	    	newFetchedContent[content.id] = newNode
			}

	    newNodes.push({
	    	id: content.id,
	    	content_type: content.content_type
	    })
		})

		return { newNodes: newNodes, newFetchedContent: newFetchedContent }
	}

	const selectFetchedContent = (collectionData: any) => {
		let newSelectedNodes: any = {}
		collectionData.forEach((c: any) => newSelectedNodes[c.id] = true)

		console.log('selectFetchedContent', newSelectedNodes)		
		props.setSelectedNodes(newSelectedNodes)
	}

	const fetchSubpagesForNode = (node: any, insertInGraph: boolean=true) => {
		setIsFetchingNodeSubpages(true)
 
		fetch(`/api/v1/spaces/${getSelectedNode().id}/collection_data/`, {
      method: 'GET',
      headers: {
        'Content-type': 'application/json'
      }
    })
    .then((res: any) => {
      if (!res.ok) {
      	setIsFetchingNodeSubpages(false)
      	setHasFetchedNodeSubpages(true)

        if (res.status === 401) {
        }
        throw new Error(res.status)
      } 
      else return res.json()
    })
    .then((collectionData: any) => {
    	setIsFetchingNodeSubpages(false)
    	setHasFetchedNodeSubpages(true)

    	// console.log('fetchSubpagesForNode results', collectionData)

    	// append to the set of connected data 
    	appContext.updateConnectedDataById(getSelectedNodeId(), collectionData)

    	const parsedData: any = parseCollectionData(node, collectionData)
    	const newFetchedContent: any = parsedData.newFetchedContent
    	const newNodes: any = parsedData.newNodes

			// updateFetchedContent
			// console.log('newFetchedContent in fetchSubpagesForNode', newFetchedContent)
			appContext.updateFetchedContent(newFetchedContent)

			// insert to graphData
			const g = appContext.getCurrGraphData()
			const updatedNodes = [...new Set([...g.nodes, ...newNodes])]
			const newEdges = newNodes.map((n: any) => {
				return { source: node.id, target: n.id, type: 'directed' }
			})

			// console.log('insertInGraph', insertInGraph)

			if (insertInGraph) {
    		appContext.updateCurrGraphData({
					nodes: updatedNodes,
					edges: [...new Set([...g.edges, ...newEdges])]
				})
				selectFetchedContent(collectionData)
    	}
    	else {
    		markConnectedContentAsFetched('subpages')
    	}

    })
    .catch((error: any) => {
      console.log('error: ' + error)
    }) 
	}

	// TODO - refactor with the above
	const fetchMentionsForNode = (node: any, insertInGraph: boolean=true) => {
		setIsFetchingNodeMentions(true)
 
		const url = `/api/v1/spaces/${node.id}/references/?explorer=true` //node.content_type === 'Activity' ? `/api/v1/activities/${node.id}/references/?explorer=true` : `/api/v1/spaces/${node.id}/references/?explorer=true`

		fetch(url, {
      method: 'GET',
      headers: {
        'Content-type': 'application/json'
      }
    })
    .then((res: any) => {
      if (!res.ok) {
      	setIsFetchingNodeMentions(false)
      	setHasFetchedNodeMentions(true)
        if (res.status === 401) {
        }
        throw new Error(res.status)
      } 
      else return res.json()
    })
    .then((collectionData: any) => {
    	setIsFetchingNodeMentions(false)
    	setHasFetchedNodeMentions(true)

    	// append to the set of connected data 
    	appContext.updateConnectedDataById(getSelectedNodeId(), collectionData)

    	const parsedData: any = parseCollectionData(node, collectionData)
    	const newFetchedContent: any = parsedData.newFetchedContent
    	const newNodes: any = parsedData.newNodes

			// updateFetchedContent
			// console.log('newFetchedContent in fetchMentionsForNode', newFetchedContent)
			appContext.updateFetchedContent(newFetchedContent)

			// insert to graphData
			const g = appContext.getCurrGraphData()
			const updatedNodes = [...new Set([...g.nodes, ...newNodes])]
			const newEdges = newNodes.map((n: any) => {
				return { source: n.id, target: node.id, type: 'directed' }
			})

			console.log('insertInGraph', insertInGraph)

			if (insertInGraph) {
				appContext.updateCurrGraphData({
					nodes: updatedNodes,
					edges: [...new Set([...g.edges, ...newEdges])]
				})
				selectFetchedContent(collectionData)
    	}
    	else {
    		markConnectedContentAsFetched('mentions')
    	}

    })
    .catch((error: any) => {
      console.log('error: ' + error)
    }) 
	}

	const fetchSuggestionsForNode = (node: any, insertInGraph: boolean=true) => {
		setIsFetchingNodeSuggestions(true)

		fetch(`/api/v1/spaces/${node.id}/suggestions`, {
      method: 'GET',
      headers: {
        'Content-type': 'application/json'
      }
    })
    .then((res: any) => {
      if (!res.ok) {
      	setIsFetchingNodeSuggestions(false)
      	setHasFetchedNodeSuggestions(true)
        if (res.status === 401) {
        }
        throw new Error(res.status)
      } 
      else return res.json()
    })
    .then((suggestions: any) => {
    	setIsFetchingNodeSuggestions(false)
    	setHasFetchedNodeSuggestions(true)

    	const collectionData = suggestions.filter((s: any) => s.accepted === 0).map((s: any) => s.suggested_obj)

    	// append to the set of connected data 
    	appContext.updateConnectedDataById(getSelectedNodeId(), collectionData)

    	const parsedData: any = parseCollectionData(node, collectionData)
    	const newFetchedContent: any = parsedData.newFetchedContent
    	const newNodes: any = parsedData.newNodes

			// updateFetchedContent
			appContext.updateFetchedContent(newFetchedContent)

			// insert to graphData
			const g = appContext.getCurrGraphData()
			const updatedNodes = [...new Set([...g.nodes, ...newNodes])]
			const newEdges = newNodes.map((n: any) => {
				return { source: n.id, target: node.id, type: 'suggested' }
			})

			// console.log('insertInGraph', insertInGraph)

			if (insertInGraph) {
				appContext.updateCurrGraphData({
					nodes: updatedNodes,
					edges: [...new Set([...g.edges, ...newEdges])]
				})
				selectFetchedContent(collectionData)
    	}
    	else {
    		markConnectedContentAsFetched('suggestions')
    	}

    })
    .catch((error: any) => {
      console.log('error: ' + error)
    }) 
	}

	const fetchRelatedForNode = (node: any,insertInGraph: boolean=true) => {
		setIsFetchingNodeRelated(true)
 
		fetch(`/api/v1/spaces/${node.id}/connections/`, {
      method: 'GET',
      headers: {
        'Content-type': 'application/json'
      }
    })
    .then((res: any) => {
      if (!res.ok) {
      	setIsFetchingNodeRelated(false)
      	setHasFetchedNodeRelated(true)

        if (res.status === 401) {
        }
        throw new Error(res.status)
      } 
      else return res.json()
    })
    .then((connections: any) => {
    	setIsFetchingNodeRelated(false)
    	setHasFetchedNodeRelated(true)


    	const connectedContent = [...connections.inbound, ...connections.outbound]

    	// append to the set of connected data 
    	// console.log('in fetchRelatedForNode', connectedContent, connectedContent.map((n: any) => n.id))
    	appContext.updateConnectedDataById(getSelectedNodeId(), connectedContent)

    	const parsedData: any = parseCollectionData(node, connectedContent)
    	const newFetchedContent: any = parsedData.newFetchedContent
    	const newNodes: any = parsedData.newNodes

			// updateFetchedContent
			appContext.updateFetchedContent(newFetchedContent)

			// insert to graphData
			const g = appContext.getCurrGraphData()
			const updatedNodes = [...new Set([...g.nodes, ...newNodes])]
			const newInboundEdges = connections.inbound.map((n: any) => {
				return { source: n.id, target: node.id, type: 'undirected' }
			})

			const newOutboundEdges = connections.outbound.map((n: any) => {
				return { source: node.id, target: n.id, type: 'undirected' }
			})

			// console.log('insertInGraph', insertInGraph)

			if (insertInGraph) {
				appContext.updateCurrGraphData({
					nodes: updatedNodes,
					edges: [...new Set([...g.edges, ...newInboundEdges, ...newOutboundEdges])]
				})
				selectFetchedContent(connectedContent)
    	}
    	else {
    		markConnectedContentAsFetched('related')
    	}

    })
    .catch((error: any) => {
      console.log('error: ' + error)
    }) 
	}

	const numSelectedEdges = () => {
		return Object.keys(props.selectedEdges).length
	}

	const numSelectedNodes = () => {
		return Object.keys(props.selectedNodes).length
	}

	const hasSelectedNode = () => {
		return numSelectedNodes() > 0
	}

	const hasSelectedEdge = () => {
		return numSelectedEdges() > 0
	}

	const handleNodeTitleChange = (e: any) => {
		const node = {
			...appContext.getFetchedContentById(getSelectedNodeId()),
			title: e.target.value
		}
		appContext.updateFetchedContentById(node.id, node)

		setIsNodeChanged(true)
	}

	const handleNodeTitleKeydown = (e: any) => {		
		if (e.ctrlKey && e.key === 's') {
			e.preventDefault()
			saveNodeContent()
		}
	}

	const handleNodeBodyChange = (value: any) => {
		const node = {
			...appContext.getFetchedContentById(getSelectedNodeId()),
			json_body: value,
			text_body: serializeText(value)
		}
		appContext.updateFetchedContentById(node.id, node)

		setIsNodeChanged(true)
	}

	const handleNodeDataSave = () => {
		saveNodeContent()
	}

	const handleNodeColorChange = (fillColor: string) => {
		const node = {
			...appContext.getFetchedContentById(getSelectedNodeId()),
			fill: fillColor
		}
		appContext.updateFetchedContentById(node.id, node)
	}

	const handleManyNodesColorChange = (fillColor: string) => {
		let updatedContent: any = {}
		getSelectedNodes().forEach(n => {
			updatedContent[n.id] = {
				...n,
				fill: fillColor
			}
		})
		appContext.updateFetchedContent(updatedContent)
	}

	const markConnectedContentAsFetched = (fieldName: string) => {
		const display = appContext.getConnectedContentDisplayById(getSelectedNodeId())
		const updatedDisplay = {
			...display,
			[fieldName]: true
		}
		appContext.updateConnectedContentDisplayById(getSelectedNodeId(), updatedDisplay)
	}

	const handleConnectedContentDisplayChange = (fieldName: string, checked: boolean) => {
		const display = appContext.getConnectedContentDisplayById(getSelectedNodeId())
		const updatedDisplay = {
			...display,
			[fieldName]: checked
		}
		appContext.updateConnectedContentDisplayById(getSelectedNodeId(), updatedDisplay)

		if (!checked) return

		const node = getSelectedNode()
		const g = appContext.getCurrGraphData()

		if (fieldName === 'subpages') {
			fetchSubpagesForNode(node)
		} 

		if (fieldName === 'mentions') {
			fetchMentionsForNode(node)
		} 

		if (fieldName === 'suggestions') {
			fetchSuggestionsForNode(node)
		}

		if (fieldName === 'related') {
			fetchRelatedForNode(node)
		}
	}

	const getIsConnectedContentTypeChecked = (fieldName: string) => {
		const display = appContext.getConnectedContentDisplayById(getSelectedNodeId())
		return display[fieldName]
	}

	const buildNodeUrlField = () => {
		const node = getSelectedNode()

		if (!node.url) return ''

		return(
			<div className="field" style={{marginBottom: '0.5em'}}>
        <span 
        	className="inline-block align-top" 
        	style={{fontWeight: 600, marginRight: '0.5em'} as React.CSSProperties}
        ><i className="fa fa-globe"></i></span>
        <span 
        	className="inline-block"
        	style={{ width: '80%', whiteSpace: 'nowrap' } as React.CSSProperties}
        >
        	<a
        		href={node.url}
        		className="inline-block"
        		style={{ maxWidth: '100%', overflowX: 'hidden'} as React.CSSProperties}
        		target="_blank"
        	>{ node.url }</a>
        	<i className="fa fa-external-link small-icon align-top" style={{ marginLeft: '0.5em' }}></i>
        </span>
      </div>
		)
	}

	const buildNodeCustomFields = () => {
		const node = getSelectedNode()
		if (!node.custom_fields) return ''

		const singularFields = Object.keys(node.custom_fields).filter((fieldName: any) => {
      return !Array.isArray(node.custom_fields[fieldName])
    })

		const fieldElements = singularFields.map((fieldName: any) => {
			if (node.custom_fields[fieldName].startsWith('https://')) {
				return(
					<div className="field" style={{marginBottom: '0.5em'}}>
	          <span style={{fontWeight: 600} as React.CSSProperties}>{ fieldName }: </span>
	          <span><a href={ node.custom_fields[fieldName] } target="_blank">{ node.custom_fields[fieldName] } <i className="fa fa-external-link small-text"></i></a></span>
	        </div>
				)
			}

			return(
				<div className="field" style={{marginBottom: '0.5em'}}>
          <span style={{fontWeight: 600} as React.CSSProperties}>{ fieldName }: </span>
          <span>{ node.custom_fields[fieldName] }</span>
        </div>
			)
		})

		return(
			<div>
				{ buildNodeUrlField() }

				{ fieldElements }
			</div>
		)
	}

	const saveNodeContent = () => {
		setIsSavingNodeData(true)

		const nodeId = getSelectedNodeId()
		const node = appContext.getFetchedContentById(nodeId)

		const body = {
			title: node.title,
			json_body: node.json_body
		}

		fetch(`/api/v1/spaces/${nodeId}/`, {
      method: 'PATCH',
      headers: {
        'Content-type': 'application/json'
      },
      body: JSON.stringify(body)
    })
    .then((res: any) => {
      if (!res.ok) {
        if (res.status === 401) {
        }
        throw new Error(res.status)
      } 
      else return res.json()
    })
    .then(() => {
    	setIsSavingNodeData(false)
    	setIsNodeChanged(false)
    })
    .catch((error: any) => {
      console.log('error: ' + error)
    })
	}

	const buildNodeIcon = () => {
		const node = getSelectedNode()

		if (node.favicon_url) {
			return(
				<div>
					<img src={ node.favicon_url } className="icon" />
				</div>
			)
		}

		if (node.icon) {
			return(
				<div className="space-icon-container">
					<img src={ node.icon } className="space-icon" />
				</div>
			)
		}

		return ''
	}

	const buildNodeSelection = () => {
		const node = getSelectedNode()

		if (!node.selection) return ''

		return(
			<div
				style={{backgroundColor: '#FBF9DA', padding: '0.5em', maxWidth: '100%'}}
				className="mb-1 gray-text"
			>
				{ node.selection }
			</div>
		)
	}

	const buildNodeScreenshot = () => {
		const node = getSelectedNode()

		if (!node.screenshot) return ''

		return(
			<div className="mb-1">
				<img 
					src={node.screenshot} style={{maxWidth: '100%'}} />
			</div>
		)
	}

	const buildNodeBody = () => {
		const node = getSelectedNode()

		if (node.json_body > INIT_SNIPPET_LENGTH && node.json_body.length > INIT_SNIPPET_LENGTH && isBodyTruncated) {
			return(
				<div className="">
					<BlockEditorSlate 
						disableSave={true}
						disableBlockControls={true}
						content={node}
						getEditorValue={handleNodeBodyChange}
						saveFullPageData={handleNodeDataSave}
						value={node.json_body.slice(0, INIT_SNIPPET_LENGTH) || []}
						placeholder="Add a description"
					/>

					<div
						onClick={() => setIsBodyTruncated(false)}
						className="mb-1"
					>
						<a href="#" role="button">More <i className="fa fa-caret-down small-icon"></i></a>
					</div>
				</div>
			)
		}

		return(
			<div>
				<BlockEditorSlate 
					disableSave={true}
					content={node}
					getEditorValue={handleNodeBodyChange}
					saveFullPageData={handleNodeDataSave}
					value={node.json_body || []}
					placeholder="Add a description"
				/>
			</div>
		)
	}

	const buildNodeDataSaveBtn = () => {
		if (props.demo || props.isPublicGraph()) {
			return ''
		}

		if (isSavingNodeData) {
			return(
				<div className="inline-block">
					Saving...
				</div>
			)
		}
		// if (!isNodeChanged) return ''

		return(
			<div 
				className="clickable inline-block mr-sm" //""
				onClick={() => saveNodeContent() }
			>
				<i className="fa fa-floppy-o gray-text"></i>
			</div>
		)
	}

	const buildNodeDataSection = () => {
		const node = getSelectedNode()
		const detailsUrl = `/spaces/${node.id}` //node.content_type === 'Activity' ? `/activities/${node.id}` : `/spaces/${node.id}`

		return(
			<div>
				<div className="flex flex-center mb-1">
					<div className="right-side">
						{ buildNodeDataSaveBtn() }
						{ !props.isPublicGraph() &&
							<div className="inline-block">
								<a href={detailsUrl} target="_blank"><i className="fa fa-external-link"></i></a>
							</div>
						}
					</div>
				</div>

				{ buildNodeIcon() }
				
				<div className="flex flex-center">
					<textarea 
						ref={props.titleRef}
						className="node-title"
						value={getSelectedNodeTitle()}
						placeholder="Untitled page"
						onChange={handleNodeTitleChange}
						onKeyDown={handleNodeTitleKeydown}
					></textarea>

				</div>
				
				<div className="mb-1">
					<div className="page-timestamp small-text gray-text">
            created { friendlyDateTimeStr(node.created_at) } 
          </div>
        </div>

				{ buildNodeSelection() }

				{ buildNodeScreenshot() }
				{ buildNodeBody() }
				
				<div>
					{ buildNodeCustomFields() }
				</div>
			</div>
		)
	}

	const buildEdgeData = () => {
		const edge = getSelectedEdge()
		const sourceNode = getNodeById(edge.source)
		const targetNode = getNodeById(edge.target)

		return(
			<div>
				<p><strong>From</strong>: { sourceNode.title || 'Untitled' }</p>
				<p><strong>To</strong>: { targetNode.title || 'Untitled' }</p>
			</div>
		)
	}

	const buildPaneContent = () => {
		// nothing is selected
		if (!hasSelectedNode() && !hasSelectedEdge()) {
			return(
				<ExplorerInstructionPane {...props} />
			)
		}

		// Multiple nodes
		if (numSelectedNodes() > 1) {
			return(
				<div className="explorer-right-pane">
					<p>Multiple nodes selected.</p>
					<div className="divider"></div>
					<p><strong>Drag</strong> to move them at the same time.</p>
					<p><strong>Right click</strong> on of the selected nodes to bring up the context menu.</p>

					<div className="divider"></div>

					<h4>Display</h4>
					<span className="align-middle mr-1">Color</span>
					<span>
						<NodeColorPicker 
							node={getSelectedNode()}
							handleNodeColorChange={handleManyNodesColorChange}
						/>
					</span>
				</div>
			)
		}

		// only edges are selected
		if (hasSelectedEdge() && !hasSelectedNode()) {
			return(
				<div className="explorer-right-pane">
					<h4>Selected link</h4>

					{ buildEdgeData() }

					<p>Press 'Delete' to remove from this Explorer view.</p>
				</div>
			)
		}

		// single node
		return(
			<div className="explorer-right-pane">
				{ buildNodeDataSection() }

				<div className="divider"></div>

				<ConnectedContentSection 
					{...props}
					getNodeById={getNodeById}
					getSelectedNode={getSelectedNode}
					getIsConnectedContentTypeChecked={getIsConnectedContentTypeChecked}
					handleConnectedContentDisplayChange={handleConnectedContentDisplayChange}
					isFetchingNodeSubpages={isFetchingNodeSubpages}
					isFetchingNodeMentions={isFetchingNodeMentions}
					isFetchingNodeSuggestions={isFetchingNodeSuggestions}
					isFetchingNodeRelated={isFetchingNodeRelated}

					hasFetchedAllConnectedContent={hasFetchedAllConnectedContent}
					selectFetchedContent={selectFetchedContent}
					refreshConnectedContent={fetchNodeConnectedContent}

					// suggestions
					fetchSuggestionsForNode={fetchSuggestionsForNode}
					hasFetchedSuggestions={hasFetchedSuggestions}
				/>

				<div className="divider"></div>

				<h5 className="pane-section-header">Display</h5>
				<span className="align-middle mr-1">Color</span>
				<span>
					<NodeColorPicker 
						node={getSelectedNode()}
						handleNodeColorChange={handleNodeColorChange}
					/>
				</span>

				<div className="divider"></div>
				<div style={{paddingBottom: '5em'}}></div>
			</div>
		)
	}

	return(
		<div className="explorer-right-pane-container">	
			<Resizable
        enable={{ top:false, right:false, bottom:false, left:true, topRight:false, bottomRight:false, bottomLeft:false, topLeft:false }}
        lockAspectRatio={false}
        defaultSize={{ height: '100%', width: 300 }}
      >
	      { buildPaneContent() }
			</Resizable>
		</div>
	)
}

const ConnectedContentSection = (props: any) => {
	const appContext: any = React.useContext(AppContext)
	// const [showMoreConnectionTypes, setShowMoreConnectionTypes] = React.useState(false)
	const [filterQuery, setFilterQuery] = React.useState('')
	const [isRefetching, setIsRefetching] = React.useState(false)

	const handleFilterQuery = (e: any) => {
		setFilterQuery(e.target.value)
	}

	// single page for now, can be extended later
	const addPageToCanvas = (page: any) => {
		const g = appContext.getCurrGraphData()
		const updatedNodes = [...new Set([...g.nodes, page])]

		const newEdges = [{ source: props.getSelectedNode().id, target: page.id, type: 'undirected' }] 

		appContext.updateCurrGraphData({
			nodes: updatedNodes,
			edges: [...new Set([...g.edges, ...newEdges])]
		})
		// props.selectFetchedContent([page])

		// update the flag
		appContext.updateFetchedContentById(page.id, { ...page, display: true })
	}

	const dismissConnectedPage = (page: any) => {
		// set a 'dismissed' flag
		const updatedData = appContext.getConnectedDataById(props.getSelectedNode().id).map((c: any) => {
			if (c.id === page.id) {
				return({
					...c,
					dismissed: true
				})
			}
			return c
		})

		appContext.updateConnectedDataById(props.getSelectedNode().id, updatedData)
	}

	const getFilteredConnectedData = () => {
		// console.log('in getFilteredConnectedData', appContext.getConnectedDataById(props.getSelectedNode().id))

		return appContext.getConnectedDataById(props.getSelectedNode().id).filter((c: any) => {
			// not already in the canvas
			const node = appContext.getGraphNodeById(c.id)
			
			// console.log(node, node.x, node.y)

			return c.title.toLowerCase().includes(filterQuery.toLowerCase()) && c.dismissed !== true && node.display === false
		})
	}

	const buildConnectedContent = () => {
		if (!props.hasFetchedAllConnectedContent()) { // || isRefetching) {
			return(
				<div>
					<span className="gray-text small-text">Fetching...</span>
				</div>
			)
		}

		// console.log('buildConnectedContent', appContext.getConnectedDataById(props.getSelectedNode().id))

		const connectedCards = getFilteredConnectedData().map((c: any) => {
			const page = appContext.getFetchedContentById(c.id)

			// console.log('page in connectedCards', page)

			return(
				<div className="page-card">
					<div className="mb-1">
						<a href={`/spaces/${ page.id }`} target="_blank">{ page.title }</a>
					</div>
					<div className="mb-1">
						<div className="page-timestamp small-text gray-text">
	            created { friendlyDateTimeStr(page.created_at) } 
	          </div>
	        </div>
					<div className="controls">
						<div className="control">
				      <div
				        className="icon-container"
				        title="Add to canvas"
				        onClick={() => addPageToCanvas(page)}
				      >
				        <i className="fa fa-plus-circle"></i>
				      </div>
				    </div>
						<div className="control">
				      <div
				        className="icon-container"
				        title="Dismiss"
				        onClick={() => dismissConnectedPage(page)}
				      >
				        <i className="fa fa-times"></i>
				      </div>
				    </div>
				  </div>
				</div>
			)
		})

		// getConnectedDataById

		return(
			<div className="pane-cards-container">
				{ connectedCards }
			</div>
		)
	}

	const buildSuggestionsBtn = () => {
		if (!props.hasFetchedAllConnectedContent()) { // || isRefetching) {
			return ''
		}

		if (props.isFetchingNodeSuggestions && !props.hasFetchedSuggestions()) {
			return <div className="mt-1 gray-text small-text">Fetching suggestions...</div>
		}

		if (!props.hasFetchedSuggestions()) {
			return(
				<div 
					className="mt-1 clickable inline-block gray-text"
					onClick={() => props.fetchSuggestionsForNode(props.getSelectedNode(), false)}
				>
					<i className="fa fa-lightbulb-o"></i> Fetch suggestions
				</div>
			)
		}
	}

	return(
		<div>
			<div className="flex mb-1">
				<div>
					<h5 className="inline-block pane-section-header" style={{margin: '0 0.5em 0 0'}}>Related content </h5> <i className="fa fa-question-circle-o small-icon" title="Other pages in your knowledge base that are related to this node"></i>
					</div>

				<div 
					className="right-side clickable"
					onClick={props.refreshConnectedContent}
					title="Refresh connected content"
				>
					<i className="fa fa-refresh"></i>
				</div>
			</div>
				
			{ props.hasFetchedAllConnectedContent() ? <div><input 
				value={filterQuery}
				onChange={handleFilterQuery}
				placeholder="Type to filter"
				className="collection-filter mb-1"
			/></div> : '' }

			{ buildConnectedContent() }

			{ buildSuggestionsBtn() }
		</div>
	)
}

const ExplorerInstructionPane = (props: any) => {
	const [showFullInstruction, setShowFullInstruction] = React.useState(false)

	const buildInstructions = () => {
		if (!showFullInstruction) {
			return(
				<span className="clickable link" onClick={() => setShowFullInstruction(true)}>See instructions</span>
			)
		}

		return (
			<div>
				<p>Click to select a page.</p>
				<p><strong>Double click</strong> to create a page for each new thought or idea.</p>
				<p className="gray-text">Scroll to zoom.</p>
				<p className="gray-text">Hold <strong>"Shift" and drag</strong> to connect one page to another.</p>
				<p className="gray-text">Hold <strong>"Ctrl / Cmd" and drag</strong> to select multiple pages.</p>
			</div>
		);
	}

	return(
		<div className="explorer-right-pane">
			{ props.isMobile() ? <p>Note: view on desktop for the best experience.</p> : '' }
			<p>Use this canvas to flesh out your thoughts and generate ideas.</p>
			
			{ buildInstructions() }

			<p><a href="/expdemo" target="_blank">See more examples</a></p>
			<div className="divider"></div>
		</div>
	)
}

const NodeColorPicker = (props: any) => {
	const [showColorDropdown, setShowColorDropdown] = React.useState(false)
	const [currColor, setCurrColor] = React.useState(props.node.fill || 'white')

	const getHexCodeByName = (color: string) => {
		return(
			NODE_COLOR_CSS[color]
		)
	}

	const selectColor = (color: string) => {
		setCurrColor(color)
		props.handleNodeColorChange(color)
		setShowColorDropdown(false)
	}

	const buildColorDropdown = () => {
		if (!showColorDropdown) return ''

		return(
			<ClickHandler
				close={() => setShowColorDropdown(false)}
			>
				<div 
					className="color-picker-dropdown dropdown dropdown-narrow"
				>
					<div 
						className="dropdown-action" 
						onClick={() => selectColor('white')}
					>
						white
					</div>
					<div 
						className="dropdown-action"
						onClick={() => selectColor('red')}
					>red</div>
					<div 
						className="dropdown-action"
						onClick={() => selectColor('yellow')}
					>yellow</div>
					<div 
						className="dropdown-action"
						onClick={() => selectColor('green')}
					>green</div>
					<div 
						className="dropdown-action"
						onClick={() => selectColor('blue')}
					>blue</div>
					<div 
						className="dropdown-action"
						onClick={() => selectColor('purple')}
					>purple</div>
				</div>
			</ClickHandler>
		)
	}

	return(
		<div className="node-color-picker inline-block align-middle"
		>
			<div 
				className="curr-color-container inline-block clickable"
				onClick={() => setShowColorDropdown(true)}
			>
				<div 
					className="curr-color"
					style={{ backgroundColor: getHexCodeByName(currColor) }}
				></div>
			</div>

			{ buildColorDropdown() }
		</div>
	)
} 

export const ExplorerPage = (props: any) => {

	const appContext: any = React.useContext(AppContext)
	const canvasRef: any = React.useRef()
	const searchRef: any = React.useRef()
	const titleRef: any = React.useRef()

	const [selectedNodes, setSelectedNodes] = React.useState({})
	const [selectedEdges, setSelectedEdges] = React.useState({})

	const [isFetchingTabData, setIsFetchingTabData] = React.useState(false)

	// const controllerRef = React.useRef()
	let controller: any //= new AbortController()
  
	React.useEffect(() => {
		// initialize the explorer tabs
		if (props.demo === true) {
			const demoTabs = [
				{
					id: 'e565b994-7177-47d6-a9b6-22692383d0e6',
					title: 'No Code ecosystem',
				},
				{
					id: 'a07ccb04-ebb0-4307-833a-b2fa1e56fba1',
					title: 'Rumin tutorial'
				},
				{
					id: '2ffaef68-a22b-4168-a7f5-85664a26f148',
					title: 'Making sense of Physics',
				},
				// {
				// 	id: '2c8d8d1d-9e81-4b08-94bd-0dd0e2c31899',
				// 	title: 'BJJ notes'
				// },
				{
					id: '43cbe2e2-fdee-40d1-b2e8-86c1ee0e924b',
					title: 'Understanding DeFi'
				}
			]
			appContext.updateExplorerTabs(demoTabs)
			appContext.updateCurrExplorerTab(demoTabs[0])

			return
		}


		const tabs: any[] = JSON.parse(localStorage.getItem('explorerTabs')) || []
		// TODO - handle viewId params
		const params = queryString.parse(location.search)
		if (params.viewId) {
			const viewId: any = params.viewId
			const explorerTabIds: string[] = tabs.map((t: any) => t.id) //appContext.explorerTabs.map((t: any) => t.id)

			const tabIndex = explorerTabIds.indexOf(viewId)
			
			// console.log('viewId params', tabs, tabIndex)
			if (tabIndex !== -1) {
				appContext.updateExplorerTabs(tabs)
				appContext.updateCurrExplorerTab(tabs[tabIndex])//(appContext.explorerTabs[tabIndex])
			}
			else {
				const newTab = { id: viewId, title: params.viewTitle }
				appContext.updateExplorerTabs([...tabs, newTab]) //([...appContext.explorerTabs, newTab])
				appContext.updateCurrExplorerTab(newTab)
			}
			return	
		}

		if (params.newTab) {
			const newTab = { id: uuid.v4(), title: '' }
			appContext.updateExplorerTabs([newTab, ...tabs]) 
			appContext.updateCurrExplorerTab(newTab)
			return	
		}

		if (tabs.length > 0) {
			appContext.updateExplorerTabs(tabs)
			appContext.updateCurrExplorerTab(tabs[0])
		}
	}, [])

	// When the tab titles are updated
	React.useEffect(() => {
		saveTabTitle()
	}, [appContext.explorerTabs])

	React.useEffect(() => {
		const params = queryString.parse(location.search)

		if (params.spaceId) {
				// TODO - fetch
				const spaceId: any = params.spaceId
				fetchSpaceDataForTab(params.spaceId)
				return
		}

		// populate demo data
		if (props.demo === true && isGraphEmpty()) {
			// appContext.updateCurrGraphData(getDemoGraphData()[appContext.currExplorerTab.id])
			// appContext.updateFetchedContent(getDemoFetchedContent()[appContext.currExplorerTab.id])
			fetchTabData()
			return
		}

		if (isGraphEmpty()) {
			fetchTabData()
		}
	}, [appContext.currExplorerTab])

	const isGraphEmpty = () => {
		return appContext.getCurrGraphData().nodes.length === 0
	}

	const fetchTabData = () => {
		const tabId = appContext.currExplorerTab.id

		// data already fetched
		if (!isGraphEmpty()) {
			setIsFetchingTabData(false)
			return
		}

		// controller = new AbortController()
		// controllerRef.current = new AbortController()

		setIsFetchingTabData(true)

		fetch(`/api/v1/graph_views/${appContext.getCurrExplorerTabId()}/`, {
      method: 'GET',
      headers: {
        'Content-type': 'application/json'
      },
      // signal: controller.signal
    })
    .then((res: any) => {
      if (!res.ok) {
        if (res.status === 404) {
        	setIsFetchingTabData(false)
        	appContext.updateGraphDataByTabId(appContext.getCurrExplorerTabId(), appContext.initGraphData())

					console.log('handling 404', appContext.getCurrExplorerTabId())        	
        }
        throw new Error(res.status)
      } 
      else return res.json()
    })
    .then((graphView: any) => {
    	setIsFetchingTabData(false)

    	// console.log('fetched graphView data', graphView, tabId)
    	appContext.updateGraphDataByTabId(tabId, graphView.graph)
    	const { graph, graphData, ...graphMetadata } = graphView
    	appContext.updateCurrGraphMetadata(graphMetadata)

    	let fetchedContent: any = {}
    	graphView.graph_data.nodes.forEach((n: any) => {
    		fetchedContent[n.id] = { ...n, text_body: serializeText(n.json_body) }
    	})
    	appContext.updateFetchedContentByTabId(tabId, fetchedContent)
    })
    .catch((error: any) => {
      console.log('error: ' + error)
    }) 
	}

	const fetchSpaceDataForTab = (spaceId: any) => {
		const tabId = appContext.currExplorerTab.id

		setIsFetchingTabData(true)

		fetch(`/api/v1/spaces/${spaceId}?explorer_node=true`, {
      method: 'GET',
      headers: {
        'Content-type': 'application/json'
      },
      // signal: controller.signal
    })
    .then((res: any) => {
      if (!res.ok) {
        if (res.status === 404) {
        	setIsFetchingTabData(false)
        	appContext.updateGraphDataByTabId(appContext.getCurrExplorerTabId(), appContext.initGraphData())

					console.log('handling 404', appContext.getCurrExplorerTabId())        	
        }
        throw new Error(res.status)
      } 
      else return res.json()
    })
    .then((space: any) => {
    	setIsFetchingTabData(false)

    	const node = {
    		...space,
    		x: 0,
    		y: 0
    	}

    	appContext.updateGraphDataByTabId(tabId, { nodes: [node], edges: [] })
    	appContext.updateFetchedContentByTabId(tabId, { [node.id]: node })
    })
    .catch((error: any) => {
      console.log('error: ' + error)
    }) 
	}

	const isPublicGraph = () => {
		const g = appContext.getCurrGraphMetadata()
		return g.is_public === true
	}

	const handlePanToExistingNode = (node: any) => {
		canvasRef.current.panToNode(node)
	}

	const handleInsertNode = (node: any) => {

		console.log('handleInsertNode', node)

		// TODO - get the right point to insert at 
		const canvas: any = canvasRef.current
		const stage: any = canvas.getStage()

    node.x = -stage.x() + canvas.getStageDimensions().width/2
    node.y = -stage.y() + canvas.getStageDimensions().height/2

		// Add to graph data
    const g = appContext.getCurrGraphData()
    appContext.updateCurrGraphData({ 
      nodes: [...g.nodes, node], 
      edges: g.edges 
    })

    // Add to fetchedContent
    if (node.json_body) {
	    node.text_body = serializeText(node.json_body)
    }
    appContext.updateFetchedContentById(node.id, node)

    // select the inserted node
    setSelectedNodes({[node.id]: true})
	}

	const focusOnSearch = () => {
		searchRef.current.focusOnInput()
	}

	const focusOnTitle = () => {
		console.log('focusOnTitle')
		titleRef.current.focus()
	}

	// turn the graphData into the format to be persisted
	const getGraphDataToSave = () => {
		const nodes = appContext.getCurrGraphData().nodes.map((n: any) => {
			const node = appContext.getFetchedContentById(n.id)

			return (({ id, content_type, x, y, width, height, fill }) => ({ id, content_type, x, y, width, height, fill }))(node)
		})

		return({
			nodes: nodes,
			edges: appContext.getCurrGraphData().edges
		})
	}

	const getNewTab = () => {
		return({ id: uuid.v4(), title: '' })
	}

	const addNewTab = () => {
		const newTab = getNewTab()
		appContext.updateExplorerTabs([...appContext.explorerTabs, newTab])
		appContext.updateCurrExplorerTab(newTab)
	}

	const saveTabTitle = () => {
		const body = {
			title: appContext.currExplorerTab.title,
		}

		fetch(`/api/v1/graph_views/${appContext.getCurrExplorerTabId()}/`, {
      method: 'PATCH',
      headers: {
        'Content-type': 'application/json'
      },
      body: JSON.stringify(body)
    })
    .then((res: any) => {
      if (!res.ok) {
        if (res.status === 401) {
        }
        throw new Error(res.status)
      } 
      else return res.json()
    })
	}

	const saveTab = () => {
		// if there is a selected node, save it
		// if (Object.keys(selectedNodes) === 0) {

		// }

		appContext.setIsSavingExplorerTab(true)

		const body = {
			title: appContext.currExplorerTab.title,
			graph: getGraphDataToSave()
		}

		// console.log('body in saveTab', body, appContext.currExplorerTab)

		fetch(`/api/v1/graph_views/${appContext.getCurrExplorerTabId()}/`, {
      method: 'PATCH',
      headers: {
        'Content-type': 'application/json'
      },
      body: JSON.stringify(body)
    })
    .then((res: any) => {
      if (!res.ok) {
        if (res.status === 401) {
        }
        throw new Error(res.status)
      } 
      else return res.json()
    })
    .then(() => {
    	appContext.setIsSavingExplorerTab(false)
    	// TODO - set last saved
    })
    .catch((error: any) => {
      console.log('error: ' + error)
    })
	}

	const updateTab = (tab: any) => {
		const updatedTabs = appContext.explorerTabs.map((t: any) => {
			return t.id === tab.id ? tab : t
		})
		appContext.updateExplorerTabs(updatedTabs)
		appContext.updateCurrExplorerTab(tab)
	}

	const removeTab = (tab: any) => {

	}

	const topBarProps = {
		demo: props.demo,
		panToExistingNode: handlePanToExistingNode,
		insertNode: handleInsertNode,
		isMobile: props.isMobile
	}

			// <LeftPaneSlim />

	return(
		<div>

			<div style={{overflow: 'hidden'}}>
				<TopBar 
					ref={searchRef}
					{...topBarProps}
					// panToExistingNode={handlePanToExistingNode}
				/>			

				<div 
					className="relative canvas-background"
				>
					<ExplorerCanvas 
						ref={canvasRef}
						{...props}
						isPublicGraph={isPublicGraph}
						insertNode={handleInsertNode}
						focusOnSearch={focusOnSearch}
						focusOnTitle={focusOnTitle}
						saveTab={saveTab}
						getGraphDataToSave={getGraphDataToSave}  // to debug graph data
						isFetchingTabData={isFetchingTabData}
						selectedNodes={selectedNodes}
						selectedEdges={selectedEdges}
						setSelectedNodes={setSelectedNodes}
						setSelectedEdges={setSelectedEdges}
					/>
					<ExplorerRightPane 
						{...props}
						isPublicGraph={isPublicGraph}
						demo={props.demo}
						titleRef={titleRef}
						selectedNodes={selectedNodes} 
						selectedEdges={selectedEdges}
						setSelectedNodes={setSelectedNodes}
					/>

				</div>


				<ExplorerTabs 
					addNewTab={addNewTab}
					removeTab={removeTab}
					updateTab={updateTab}
				/>
			</div>
		</div>
	)
}
