/// <reference types="vite/client" />

// 🎨 Custom Designer Global Interface
interface CustomDesignerAPI {
  addImage: (imageUrl: string) => void;
  exportImage: () => void;
}

declare global {
  interface Window {
    customDesigner?: CustomDesignerAPI | undefined;
  }
}

export {};
