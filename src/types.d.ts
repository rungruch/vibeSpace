// Global type declarations - accepts any type to avoid TypeScript errors

declare module "*.png" {
  const value: any;
  export = value;
}

declare module "*.jpg" {
  const value: any;
  export = value;
}

declare module "*.jpeg" {
  const value: any;
  export = value;
}

declare module "*.gif" {
  const value: any;
  export = value;
}

declare module "*.svg" {
  const value: any;
  export = value;
}

declare module "*.ico" {
  const value: any;
  export = value;
}

declare module "*.webp" {
  const value: any;
  export = value;
}

declare module "*.scss" {
  const content: any;
  export = content;
}

declare module "*.module.scss" {
  const classes: any;
  export = classes;
}

declare module "*.css" {
  const content: any;
  export = content;
}

declare module "*.module.css" {
  const classes: any;
  export = classes;
}

declare module "*.woff" {
  const value: any;
  export = value;
}

declare module "*.woff2" {
  const value: any;
  export = value;
}

// Global window extensions
declare global {
  interface Window {
    toggleMobileDrawer?: any;
  }
}
