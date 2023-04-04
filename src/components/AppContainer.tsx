import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { useSyncExternalStore } from 'react';
import App from './App';
import { ApplicationStorageProvider, ApplicationStorageContext } from './ApplicationStorage';

const appStorageProvider = new ApplicationStorageProvider();
const queryClient = new QueryClient()

const AppContainer = () => {
  const appStorage = useSyncExternalStore(appStorageProvider.subscribe, appStorageProvider.getSnapshot);

  return appStorage && (
    <QueryClientProvider client={queryClient}>
      <ApplicationStorageContext.Provider value={appStorage}>
        <App />
      </ApplicationStorageContext.Provider>
    </QueryClientProvider>
  );
};

export default React.memo(AppContainer);
