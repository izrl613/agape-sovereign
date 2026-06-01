import { ConnectorConfig, DataConnect, OperationOptions, ExecuteOperationResponse } from 'firebase-admin/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;


export interface AddFindingData {
  finding_insert: Finding_Key;
}

export interface AddFindingVariables {
  vectorId: string;
  type: string;
  label: string;
  detail: string;
  action?: string | null;
  status?: string | null;
}

export interface AddMonitoredEmailData {
  monitoredEmail_insert: MonitoredEmail_Key;
}

export interface AddMonitoredEmailVariables {
  emailAddress: string;
}

export interface Finding_Key {
  id: UUIDString;
  __typename?: 'Finding_Key';
}

export interface GetFindingsData {
  findings: ({
    id: UUIDString;
    type: string;
    label: string;
    detail: string;
    createdAt: TimestampString;
    action?: string | null;
    status?: string | null;
  } & Finding_Key)[];
}

export interface GetFindingsVariables {
  vectorId: string;
}

export interface GetMonitoredEmailsData {
  monitoredEmails: ({
    id: UUIDString;
    emailAddress: string;
    status: string;
    createdAt: TimestampString;
    lastCheckedAt?: TimestampString | null;
  } & MonitoredEmail_Key)[];
}

export interface GetUserData {
  user?: {
    uid: string;
    name: string;
    email: string;
    provider?: string | null;
    sovereignScore?: number | null;
    lastLoginAt?: TimestampString | null;
  } & User_Key;
}

export interface GetUserVectorStatusesData {
  userVectorStatuses: ({
    identityVector: {
      id: string;
      name: string;
      icon: string;
      description?: string | null;
    } & IdentityVector_Key;
      sovereigntyScore: number;
      nukedCount: number;
      knoxedCount: number;
      monitoredCount: number;
      lastScanAt: TimestampString;
      statusNotes?: string | null;
  })[];
}

export interface IdentityVector_Key {
  id: string;
  __typename?: 'IdentityVector_Key';
}

export interface MonitoredEmail_Key {
  id: UUIDString;
  __typename?: 'MonitoredEmail_Key';
}

export interface RemoveMonitoredEmailData {
  monitoredEmail_delete?: MonitoredEmail_Key | null;
}

export interface RemoveMonitoredEmailVariables {
  id: UUIDString;
}

export interface UpdateSovereignScoreData {
  user_update?: User_Key | null;
}

export interface UpdateSovereignScoreVariables {
  score: number;
}

export interface UpsertUserData {
  user_upsert: User_Key;
}

export interface UpsertUserVariables {
  name: string;
  email: string;
  provider?: string | null;
}

export interface UpsertUserVectorStatusData {
  userVectorStatus_upsert: UserVectorStatus_Key;
}

export interface UpsertUserVectorStatusVariables {
  vectorId: string;
  sovereigntyScore: number;
  nukedCount: number;
  knoxedCount: number;
  monitoredCount: number;
  statusNotes?: string | null;
}

export interface UserVectorStatus_Key {
  userUid: string;
  identityVectorId: string;
  __typename?: 'UserVectorStatus_Key';
}

export interface User_Key {
  uid: string;
  __typename?: 'User_Key';
}

/** Generated Node Admin SDK operation action function for the 'UpsertUser' Mutation. Allow users to execute without passing in DataConnect. */
export function upsertUser(dc: DataConnect, vars: UpsertUserVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpsertUserData>>;
/** Generated Node Admin SDK operation action function for the 'UpsertUser' Mutation. Allow users to pass in custom DataConnect instances. */
export function upsertUser(vars: UpsertUserVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpsertUserData>>;

/** Generated Node Admin SDK operation action function for the 'UpdateSovereignScore' Mutation. Allow users to execute without passing in DataConnect. */
export function updateSovereignScore(dc: DataConnect, vars: UpdateSovereignScoreVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpdateSovereignScoreData>>;
/** Generated Node Admin SDK operation action function for the 'UpdateSovereignScore' Mutation. Allow users to pass in custom DataConnect instances. */
export function updateSovereignScore(vars: UpdateSovereignScoreVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpdateSovereignScoreData>>;

/** Generated Node Admin SDK operation action function for the 'UpsertUserVectorStatus' Mutation. Allow users to execute without passing in DataConnect. */
export function upsertUserVectorStatus(dc: DataConnect, vars: UpsertUserVectorStatusVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpsertUserVectorStatusData>>;
/** Generated Node Admin SDK operation action function for the 'UpsertUserVectorStatus' Mutation. Allow users to pass in custom DataConnect instances. */
export function upsertUserVectorStatus(vars: UpsertUserVectorStatusVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpsertUserVectorStatusData>>;

/** Generated Node Admin SDK operation action function for the 'AddFinding' Mutation. Allow users to execute without passing in DataConnect. */
export function addFinding(dc: DataConnect, vars: AddFindingVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<AddFindingData>>;
/** Generated Node Admin SDK operation action function for the 'AddFinding' Mutation. Allow users to pass in custom DataConnect instances. */
export function addFinding(vars: AddFindingVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<AddFindingData>>;

/** Generated Node Admin SDK operation action function for the 'AddMonitoredEmail' Mutation. Allow users to execute without passing in DataConnect. */
export function addMonitoredEmail(dc: DataConnect, vars: AddMonitoredEmailVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<AddMonitoredEmailData>>;
/** Generated Node Admin SDK operation action function for the 'AddMonitoredEmail' Mutation. Allow users to pass in custom DataConnect instances. */
export function addMonitoredEmail(vars: AddMonitoredEmailVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<AddMonitoredEmailData>>;

/** Generated Node Admin SDK operation action function for the 'RemoveMonitoredEmail' Mutation. Allow users to execute without passing in DataConnect. */
export function removeMonitoredEmail(dc: DataConnect, vars: RemoveMonitoredEmailVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<RemoveMonitoredEmailData>>;
/** Generated Node Admin SDK operation action function for the 'RemoveMonitoredEmail' Mutation. Allow users to pass in custom DataConnect instances. */
export function removeMonitoredEmail(vars: RemoveMonitoredEmailVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<RemoveMonitoredEmailData>>;

/** Generated Node Admin SDK operation action function for the 'GetUser' Query. Allow users to execute without passing in DataConnect. */
export function getUser(dc: DataConnect, options?: OperationOptions): Promise<ExecuteOperationResponse<GetUserData>>;
/** Generated Node Admin SDK operation action function for the 'GetUser' Query. Allow users to pass in custom DataConnect instances. */
export function getUser(options?: OperationOptions): Promise<ExecuteOperationResponse<GetUserData>>;

/** Generated Node Admin SDK operation action function for the 'GetUserVectorStatuses' Query. Allow users to execute without passing in DataConnect. */
export function getUserVectorStatuses(dc: DataConnect, options?: OperationOptions): Promise<ExecuteOperationResponse<GetUserVectorStatusesData>>;
/** Generated Node Admin SDK operation action function for the 'GetUserVectorStatuses' Query. Allow users to pass in custom DataConnect instances. */
export function getUserVectorStatuses(options?: OperationOptions): Promise<ExecuteOperationResponse<GetUserVectorStatusesData>>;

/** Generated Node Admin SDK operation action function for the 'GetFindings' Query. Allow users to execute without passing in DataConnect. */
export function getFindings(dc: DataConnect, vars: GetFindingsVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<GetFindingsData>>;
/** Generated Node Admin SDK operation action function for the 'GetFindings' Query. Allow users to pass in custom DataConnect instances. */
export function getFindings(vars: GetFindingsVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<GetFindingsData>>;

/** Generated Node Admin SDK operation action function for the 'GetMonitoredEmails' Query. Allow users to execute without passing in DataConnect. */
export function getMonitoredEmails(dc: DataConnect, options?: OperationOptions): Promise<ExecuteOperationResponse<GetMonitoredEmailsData>>;
/** Generated Node Admin SDK operation action function for the 'GetMonitoredEmails' Query. Allow users to pass in custom DataConnect instances. */
export function getMonitoredEmails(options?: OperationOptions): Promise<ExecuteOperationResponse<GetMonitoredEmailsData>>;

