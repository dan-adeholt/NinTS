import React, { useContext } from 'react';

export const useContextWithErrorIfNull = <ItemType>(context: React.Context<ItemType | null>): ItemType => {
  const contextValue = useContext(context);
  if (contextValue === null) {
    throw Error("Context has not been Provided!");
  }

  return contextValue;
}