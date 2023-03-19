import { LOCAL_STORAGE_KEY_AUTOLOAD } from './types';

export const localStorageAutoloadEnabled = () => {
  const autoload = localStorage.getItem(LOCAL_STORAGE_KEY_AUTOLOAD);
  return autoload != null && JSON.parse(autoload) === true;
}

export const setLocalStorageAutoloadEnabled = (enabled: boolean) => {
  localStorage.setItem(LOCAL_STORAGE_KEY_AUTOLOAD, JSON.stringify(enabled));
}
