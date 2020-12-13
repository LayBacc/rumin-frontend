import React, { useState, useEffect, useContext } from "react"
import { ClickHandler } from './ClickHandler'
import uuidv4 from "uuid/v4";
import queryString from 'query-string'

import AppContext from './AppContext'

export const LeftPaneSlim = (props) => {
  const [favoriteSpaces, setFavoriteSpaces] = useState([])
  const [isFetchingFavoriteSpaces, setIsFetchingFavoriteSpaces] = useState(false)
  const [hasFetchedFavoriteSpaces, setHasFetchedFavoriteSpaces] = useState(false)
  
  const appContext = useContext(AppContext)

  const isMobile = () => {
    return window.django.is_mobile
  }

  const [isCollapsed, setIsCollapsed] = useState(isMobile())

  const handleClose = () => {
    if (!isMobile()) return

    setIsCollapsed(true)
  }

  const isHomePage = () => {
    return location.pathname === '/' && location.search === ''
  }

  const isCapturedContentPage = () => {
    return queryString.parse(location.search).content_type === 'Activity'
  }

  const userIsAuthenticated = () => {
    return window.django.user.is_authenticated
  }

  const getUserFirstName = () => {
    return window.django.user.first_name
  }

  const getUserInitial = () => {
    return getUserFirstName()[0]
  }

  const getStyle = () => {
    if (!isMobile()) return {}

    if (isCollapsed) {
      return({
        width: '0',
        display: 'none'
      })
    }
    else {
      return({
        width: '65%',
        boxShadow: '5px 0px 10px #ccc'
      }) 
    }
  }

  return(
    <div>
      <div 
         className="pane-menu"
         onClick={() => setIsCollapsed(!isCollapsed)}
         style={isMobile() ? {} : {display: 'none'}}
       >
        <i className="fa fa-bars"></i>
      </div>   
      <ClickHandler
        close={handleClose}
      >
      	<div className="left-pane-slim" style={getStyle()}>

          <div className="action-icon">
            <a href="/" className="mb-0" style={{color: '#2D6EAB', fontFamily: 'Varela Round, sans-serif', display: 'flex', 'alignItems': 'center'}}>
              <img src="https://storage.googleapis.com/rumin-gcs-bucket/logo-search2.png" className="logo-img" /> 
            </a>
          </div>
        </div>
      </ClickHandler>
    </div>
  );
}
