import React, {useEffect} from 'react';
import loader from './loader.gif';
import './App.css';
import { useFetchArrayBuffer } from './hooks/useFetchArrayBuffer';
import { parseROM } from './emulator/parseROM';

function App() {
  const [isLoading, response, error] = useFetchArrayBuffer("/tests/nestest.nes");


  useEffect(() => {
    if (response) {
      console.log(response);
      const rom = parseROM(response);
      console.log(rom);
    }
  }, [response]);

  return (
    <div className="App">
      { isLoading && <img src={loader}/> }
      { error && <span>Unknown error occured.</span>}
    </div>
  );
}

export default App;
