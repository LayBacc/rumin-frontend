import React, { useState } from 'react'
import { friendlyDateTimeStr } from '../utils/date_utils'
import { ClickHandler } from './ClickHandler'

import { Resizable, ResizeCallback } from 're-resizable'
import shortid from 'shortid'

export const CustomCollectionResults = (props) => {
	const getCollection = () => {
		return props.content.custom_fields[props.fieldName]
	}

	const buildComments = () => {
		return getCollection().map(result => {
			let url = ''
			let body = ''

			if (result.url) {
				url = (
					<div className="mb-1">
						<a href={ result.url } target="_blank">Open link <i className="fa fa-external-link small-icon"></i></a>
					</div>
				)
			}

			return(
				<div className="page-card">
					{ url }
					{ result.body || '' }
				</div>
			)
		})
	}

	const buildMessages = () => {
		return getCollection().map(result => {
			let url = ''
			let body = ''

			return(
				<div className="page-card">
					<div className="mb-1">
						From { result.sender_name } &middot; <a href={ result.message_link } target="_blank">
								Open link <i className="fa fa-external-link small-icon"></i>
							</a>
					</div>
					<div>
						{ result.message_text }
					</div>
				</div>
			)
		})	
	}

	const buildResults = () => {
		switch (props.fieldName) {
			case 'comments':
				return buildComments()
			case 'messages':
				return buildMessages()
			default:
				return ''
		}
	}

  return(
  	<div>
  		{ buildResults() }
  	</div>
  )
}

// const CommentCard = () => {

// }
