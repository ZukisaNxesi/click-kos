"use client"

import {compressToEncodedURIComponent, decompressFromEncodedURIComponent} from "lz-string";
// Authentication utility functions

export interface UserData {
  name: string;
  email: string;
  role: string;
}

export const AUTH_STORAGE_KEY = 'isAuthenticated';
export const USER_STORAGE_KEY = 'user';
export const TOKEN_STORAGE_KEY = 'access_token';

export const getAuthStatus = (): boolean => {
  if (typeof window === 'undefined') return false;
  //decode the auth status
  return decompressFromEncodedURIComponent(localStorage.getItem(AUTH_STORAGE_KEY)!) === 'true';
};

export const getUserData = (): UserData | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const userData = localStorage.getItem(USER_STORAGE_KEY);
    if(userData){
      //decode the user data
      return JSON.parse(decompressFromEncodedURIComponent(userData));
    }
    return null;
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
};

export const getAccessToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_STORAGE_KEY);
};

export const setAuthStatus = (isAuthenticated: boolean, userData?: UserData): void => {
  if (typeof window === 'undefined') return;
  
  if (isAuthenticated && userData) {
    localStorage.setItem(AUTH_STORAGE_KEY, compressToEncodedURIComponent('true'));
    //At least encode the user data
    let encodedData = compressToEncodedURIComponent(JSON.stringify(userData));
    localStorage.setItem(USER_STORAGE_KEY, encodedData);
  } else {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
  
  // Dispatch custom event to notify other components
  window.dispatchEvent(new CustomEvent('authStateChanged'));
};

export const clearAuth = (storage?:any): void => {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem(AUTH_STORAGE_KEY);
  localStorage.removeItem(USER_STORAGE_KEY);
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  
  // Dispatch custom event to notify other components
  window.dispatchEvent(new CustomEvent('authStateChanged'));
};

export const isAuthenticated = (): boolean => {
  return getAuthStatus() && getUserData() !== null && getAccessToken() !== null;
};
