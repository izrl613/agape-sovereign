import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, ExecuteQueryOptions, MutationRef, MutationPromise, DataConnectSettings } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;
export const dataConnectSettings: DataConnectSettings;

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

interface UpsertUserRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpsertUserVariables): MutationRef<UpsertUserData, UpsertUserVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpsertUserVariables): MutationRef<UpsertUserData, UpsertUserVariables>;
  operationName: string;
}
export const upsertUserRef: UpsertUserRef;

export function upsertUser(vars: UpsertUserVariables): MutationPromise<UpsertUserData, UpsertUserVariables>;
export function upsertUser(dc: DataConnect, vars: UpsertUserVariables): MutationPromise<UpsertUserData, UpsertUserVariables>;

interface UpdateSovereignScoreRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateSovereignScoreVariables): MutationRef<UpdateSovereignScoreData, UpdateSovereignScoreVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateSovereignScoreVariables): MutationRef<UpdateSovereignScoreData, UpdateSovereignScoreVariables>;
  operationName: string;
}
export const updateSovereignScoreRef: UpdateSovereignScoreRef;

export function updateSovereignScore(vars: UpdateSovereignScoreVariables): MutationPromise<UpdateSovereignScoreData, UpdateSovereignScoreVariables>;
export function updateSovereignScore(dc: DataConnect, vars: UpdateSovereignScoreVariables): MutationPromise<UpdateSovereignScoreData, UpdateSovereignScoreVariables>;

interface UpsertUserVectorStatusRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpsertUserVectorStatusVariables): MutationRef<UpsertUserVectorStatusData, UpsertUserVectorStatusVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpsertUserVectorStatusVariables): MutationRef<UpsertUserVectorStatusData, UpsertUserVectorStatusVariables>;
  operationName: string;
}
export const upsertUserVectorStatusRef: UpsertUserVectorStatusRef;

export function upsertUserVectorStatus(vars: UpsertUserVectorStatusVariables): MutationPromise<UpsertUserVectorStatusData, UpsertUserVectorStatusVariables>;
export function upsertUserVectorStatus(dc: DataConnect, vars: UpsertUserVectorStatusVariables): MutationPromise<UpsertUserVectorStatusData, UpsertUserVectorStatusVariables>;

interface AddFindingRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: AddFindingVariables): MutationRef<AddFindingData, AddFindingVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: AddFindingVariables): MutationRef<AddFindingData, AddFindingVariables>;
  operationName: string;
}
export const addFindingRef: AddFindingRef;

export function addFinding(vars: AddFindingVariables): MutationPromise<AddFindingData, AddFindingVariables>;
export function addFinding(dc: DataConnect, vars: AddFindingVariables): MutationPromise<AddFindingData, AddFindingVariables>;

interface AddMonitoredEmailRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: AddMonitoredEmailVariables): MutationRef<AddMonitoredEmailData, AddMonitoredEmailVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: AddMonitoredEmailVariables): MutationRef<AddMonitoredEmailData, AddMonitoredEmailVariables>;
  operationName: string;
}
export const addMonitoredEmailRef: AddMonitoredEmailRef;

export function addMonitoredEmail(vars: AddMonitoredEmailVariables): MutationPromise<AddMonitoredEmailData, AddMonitoredEmailVariables>;
export function addMonitoredEmail(dc: DataConnect, vars: AddMonitoredEmailVariables): MutationPromise<AddMonitoredEmailData, AddMonitoredEmailVariables>;

interface RemoveMonitoredEmailRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: RemoveMonitoredEmailVariables): MutationRef<RemoveMonitoredEmailData, RemoveMonitoredEmailVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: RemoveMonitoredEmailVariables): MutationRef<RemoveMonitoredEmailData, RemoveMonitoredEmailVariables>;
  operationName: string;
}
export const removeMonitoredEmailRef: RemoveMonitoredEmailRef;

export function removeMonitoredEmail(vars: RemoveMonitoredEmailVariables): MutationPromise<RemoveMonitoredEmailData, RemoveMonitoredEmailVariables>;
export function removeMonitoredEmail(dc: DataConnect, vars: RemoveMonitoredEmailVariables): MutationPromise<RemoveMonitoredEmailData, RemoveMonitoredEmailVariables>;

interface GetUserRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetUserData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<GetUserData, undefined>;
  operationName: string;
}
export const getUserRef: GetUserRef;

export function getUser(options?: ExecuteQueryOptions): QueryPromise<GetUserData, undefined>;
export function getUser(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<GetUserData, undefined>;

interface GetUserVectorStatusesRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetUserVectorStatusesData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<GetUserVectorStatusesData, undefined>;
  operationName: string;
}
export const getUserVectorStatusesRef: GetUserVectorStatusesRef;

export function getUserVectorStatuses(options?: ExecuteQueryOptions): QueryPromise<GetUserVectorStatusesData, undefined>;
export function getUserVectorStatuses(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<GetUserVectorStatusesData, undefined>;

interface GetFindingsRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetFindingsVariables): QueryRef<GetFindingsData, GetFindingsVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetFindingsVariables): QueryRef<GetFindingsData, GetFindingsVariables>;
  operationName: string;
}
export const getFindingsRef: GetFindingsRef;

export function getFindings(vars: GetFindingsVariables, options?: ExecuteQueryOptions): QueryPromise<GetFindingsData, GetFindingsVariables>;
export function getFindings(dc: DataConnect, vars: GetFindingsVariables, options?: ExecuteQueryOptions): QueryPromise<GetFindingsData, GetFindingsVariables>;

interface GetMonitoredEmailsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetMonitoredEmailsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<GetMonitoredEmailsData, undefined>;
  operationName: string;
}
export const getMonitoredEmailsRef: GetMonitoredEmailsRef;

export function getMonitoredEmails(options?: ExecuteQueryOptions): QueryPromise<GetMonitoredEmailsData, undefined>;
export function getMonitoredEmails(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<GetMonitoredEmailsData, undefined>;

