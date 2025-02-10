export const getSessionStore = (key: string) => sessionStorage.getItem(key);

export const setSessionStore = (key: string, value: string) => sessionStorage.setItem(key, value);

export const removeSessionStore = (key: string) => sessionStorage.removeItem(key);
