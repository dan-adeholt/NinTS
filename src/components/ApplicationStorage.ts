import React from 'react';

// For some reason eslint complains about import below, but works fine in the project.
// eslint-disable-next-line import/named
import { openDB, IDBPDatabase, DBSchema } from 'idb';

export type RomFilenameEntry = {
  sha: string
  filename: string;
}

export type RomEntry = RomFilenameEntry & {
  data: Uint8Array
}

interface NESDatabase extends DBSchema {
  roms: {
    key: string;
    value: RomEntry
  };
  romFilenames: {
    key: string;
    value: RomFilenameEntry
  },
  romSaveState: {
    value: {
      sha: string  
      index: number
      data: string
    },
    key: string
  };
} 


type AddRomRequest = {
  sha: string, data: Uint8Array, filename: string 
}

export default class ApplicationStorage {
  database: IDBPDatabase<NESDatabase>
  constructor(database: IDBPDatabase<NESDatabase>) {
    this.database = database;
  }

  saveEmulator = ({ sha, index, data } : {sha: string, index: number, data: string}) => {
    return this.database.put('romSaveState', {
      sha,
      index,
      data
    })
  }

  getRomData = (sha: string) => {
    return this.database.get('roms', sha);  
  }

  getRomSavegame = (sha: string) => {
    return this.database.get('romSaveState', sha);
  }

  clearRoms = () => {
    return Promise.allSettled([
      this.database.clear('roms'),
      this.database.clear('romSaveState'),
      this.database.clear('romFilenames')
    ] as const)  
  }

  getRomDataAndSavegame = (sha: string) => {  
    return Promise.allSettled([
      this.database.get('roms', sha),
      this.database.get('romSaveState', sha)  
    ] as const);
  }

  getRoms = () => {
    return this.database.getAll('roms');
  }

  getRomNames = () => {
    return this.database.getAll('romFilenames');
  }

  addRoms = (requests : AddRomRequest[]) => {
    return Promise.allSettled(
      requests.map(({ sha, data, filename }) => Promise.all([  
        this.database.put('roms', {
          sha,
          data,
          filename
        }),
        this.database.put('romFilenames', {
          sha,
          filename
        })
      ] as const))
    )
  }  
}

export class ApplicationStorageProvider {
  storage: ApplicationStorage | null = null;
  subscribers: Array<() => void> = []

  constructor() {
    openDB<NESDatabase>('nes-db', 1, {
      upgrade(db) {
        db.createObjectStore('roms', { keyPath: 'sha' });
        db.createObjectStore('romFilenames', { keyPath: 'filename' });
        db.createObjectStore('romSaveState', { keyPath: 'sha' });
      }
    }).then(db => {
      this.storage = new ApplicationStorage(db);
    
      for (const subscriber of this.subscribers) {
        subscriber();
      }
    });        
  }

  getSnapshot = () => {
    return this.storage;
  }

  subscribe = (subscriber: () => void) =>  {
    this.subscribers.push(subscriber)

    return () => {
      this.subscribers = this.subscribers.filter(l => l !== subscriber);
    };    
  }
}


export const ApplicationStorageContext = React.createContext<ApplicationStorage | null>(null);