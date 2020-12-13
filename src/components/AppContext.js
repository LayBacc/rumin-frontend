import React from 'react';

const AppContext = React.createContext({});

export const AppProvider = AppContext.Provider;
export const AppConsumer = AppContext.Consumer;
export default AppContext;
