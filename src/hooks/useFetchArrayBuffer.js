import {useEffect, useState} from 'react';

export const useFetchArrayBuffer = (url, options) => {
  const [response, setResponse] = useState(null)
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    const {signal} = controller;
    const promise = fetch(url, {...options, signal});
    setIsLoading(true);

    promise
      .then(res => res.arrayBuffer())
      .then(arrayBuf => {
        setIsLoading(false);
        setResponse(new Uint8Array(arrayBuf));
      }).catch(e => {
      setError(e);
      setIsLoading(false);
    });

    return () => {
      setIsLoading(false)
      controller.abort();
    }
  }, [setIsLoading, setError, setResponse, options, url]);

  return [isLoading, response, error];
};
