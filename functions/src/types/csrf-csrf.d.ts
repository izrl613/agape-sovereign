declare module 'csrf-csrf' {
  interface DoubleCsrfOptions {
    getSecret: (req: any) => string;
    cookieOptions?: any;
    ignoreMethods?: string[];
    ignorePaths?: string[];
    customValidators?: any[];
    // add other options as needed
  }
  export function doubleCsrf(options: DoubleCsrfOptions): any;
}

