declare module 'virtual:pwa-register/react' {
  export function useRegisterSW(): {
    needRefresh: [boolean, (value: boolean) => void];
    updateServiceWorker: (reloadPage?: boolean) => Promise<void>;
  };
}