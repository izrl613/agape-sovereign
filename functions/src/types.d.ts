// Custom Type Declarations for modules without TypeScript definitions

declare module "csrf-csrf" {
  export const doubleCsrf: any;
}

declare module "jspdf" {
  const JsPDF: any;
  export default JsPDF;
}

declare module "@simplewebauthn/server" {
  export const generateAuthenticationOptions: any;
  export const verifyAuthenticationResponse: any;
  export const generateRegistrationOptions: any;
  export const verifyRegistrationResponse: any;
  // Additional exports can be added as needed
  export type AuthenticatorTransportFuture = any;
  export type RegistrationResponseJSON = any;
  export type AuthenticationResponseJSON = any;
}

declare module "vitest" {
  export const describe: any;
  export const it: any;
  export const expect: any;
  export const vi: any;
}

declare module "@google-cloud/error-reporting" {
  export class ErrorReporting {
    constructor(opts?: any);
    report: any;
  }
}

declare module "@google-cloud/bigquery" {
  export class BigQuery {
    constructor(opts?: any);
    query(options: { query: string; location?: string }): Promise<any>;
  }
}
