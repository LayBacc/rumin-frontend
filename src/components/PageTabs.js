import React, { useState, useContext, useEffect } from 'react'
import queryString from 'query-string'

export const PageTabs = (props) => {
  const buildTabContent = () => {
  	return ''
  }

  const buildTab = (tab) => {
    const icon = tab.iconUrl ? <div className="inline-block align-middle"><img src={tab.iconUrl} className="icon" /></div> : ''

    return(
      <div 
        className={`inline-block tab-btn mr-1 ${props.currTab === tab.name ? ' active' : ''}`} 
        role="tab"
        onClick={() => props.updateCurrTab(tab.name)}
        title={tab.description}
      >
        { icon }
        <div className="inline-block">{ tab.displayName }</div>
      </div>
    )
  }

  const buildTabs = () => {
    return props.tabs.map(tab => {
      return buildTab(tab)
    })
  }

	return(
    <div className="page-tabs mt-1 mb-1">
      <div className="tab-menu">
        { buildTabs() }
      </div>
    </div>
  ) 
//        <div 
//          className={`inline-block tab-btn mr-1 ${props.currTab === 'fields' ? ' active' : ''}`} 
//          role="tab"
//          onClick={() => props.updateCurrTab('fields')}
//        >
//          Properties
//        </div>
//        <div className="divider"></div>
}