import { useCallback } from 'react';

interface Config {
  method?: string;
  headers?: {
    Authorization: string;
    [key: string]: string;
  };
  body?: string;
}

class HttpError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
  }
}

const handleErrors = (response: Response) => {
  if (!response.ok) {
    throw new HttpError(response.statusText, response.status);
  }

  return response;
};

export const useFetch = () => {
  const doFetch = useCallback(<T>(url: string, config: Config): Promise<T> => {
    const predefinedHeaders: {[header: string]: string} =
      config.body !== undefined
        ? { 'Content-Type': 'application/json; charset=utf-8' }
        : {};
    const fetchConfig = {
      ...config,
      headers: { ...predefinedHeaders, ...(config.headers || {}) },
    };
    return fetch(url, fetchConfig)
      .then(handleErrors)
      .catch((err: HttpError) => {
        throw err;
      })
      .then((resp) =>
        !resp.headers.has('content-length') ||
        Number(resp.headers.get('content-length')) > 0
          ? (resp.json() as Promise<T>)
          : ({} as T)
      );
  }, []);

  return {
    fetch: doFetch,
  };
};
