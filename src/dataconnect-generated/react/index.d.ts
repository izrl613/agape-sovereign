import { UpsertUserData, UpsertUserVariables, UpdateSovereignScoreData, UpdateSovereignScoreVariables, UpsertUserVectorStatusData, UpsertUserVectorStatusVariables, AddFindingData, AddFindingVariables, AddMonitoredEmailData, AddMonitoredEmailVariables, RemoveMonitoredEmailData, RemoveMonitoredEmailVariables, GetUserData, GetUserVectorStatusesData, GetFindingsData, GetFindingsVariables, GetMonitoredEmailsData } from '../';
import { UseDataConnectQueryResult, useDataConnectQueryOptions, UseDataConnectMutationResult, useDataConnectMutationOptions} from '@tanstack-query-firebase/react/data-connect';
import { UseQueryResult, UseMutationResult} from '@tanstack/react-query';
import { DataConnect } from 'firebase/data-connect';
import { FirebaseError } from 'firebase/app';


export function useUpsertUser(options?: useDataConnectMutationOptions<UpsertUserData, FirebaseError, UpsertUserVariables>): UseDataConnectMutationResult<UpsertUserData, UpsertUserVariables>;
export function useUpsertUser(dc: DataConnect, options?: useDataConnectMutationOptions<UpsertUserData, FirebaseError, UpsertUserVariables>): UseDataConnectMutationResult<UpsertUserData, UpsertUserVariables>;

export function useUpdateSovereignScore(options?: useDataConnectMutationOptions<UpdateSovereignScoreData, FirebaseError, UpdateSovereignScoreVariables>): UseDataConnectMutationResult<UpdateSovereignScoreData, UpdateSovereignScoreVariables>;
export function useUpdateSovereignScore(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateSovereignScoreData, FirebaseError, UpdateSovereignScoreVariables>): UseDataConnectMutationResult<UpdateSovereignScoreData, UpdateSovereignScoreVariables>;

export function useUpsertUserVectorStatus(options?: useDataConnectMutationOptions<UpsertUserVectorStatusData, FirebaseError, UpsertUserVectorStatusVariables>): UseDataConnectMutationResult<UpsertUserVectorStatusData, UpsertUserVectorStatusVariables>;
export function useUpsertUserVectorStatus(dc: DataConnect, options?: useDataConnectMutationOptions<UpsertUserVectorStatusData, FirebaseError, UpsertUserVectorStatusVariables>): UseDataConnectMutationResult<UpsertUserVectorStatusData, UpsertUserVectorStatusVariables>;

export function useAddFinding(options?: useDataConnectMutationOptions<AddFindingData, FirebaseError, AddFindingVariables>): UseDataConnectMutationResult<AddFindingData, AddFindingVariables>;
export function useAddFinding(dc: DataConnect, options?: useDataConnectMutationOptions<AddFindingData, FirebaseError, AddFindingVariables>): UseDataConnectMutationResult<AddFindingData, AddFindingVariables>;

export function useAddMonitoredEmail(options?: useDataConnectMutationOptions<AddMonitoredEmailData, FirebaseError, AddMonitoredEmailVariables>): UseDataConnectMutationResult<AddMonitoredEmailData, AddMonitoredEmailVariables>;
export function useAddMonitoredEmail(dc: DataConnect, options?: useDataConnectMutationOptions<AddMonitoredEmailData, FirebaseError, AddMonitoredEmailVariables>): UseDataConnectMutationResult<AddMonitoredEmailData, AddMonitoredEmailVariables>;

export function useRemoveMonitoredEmail(options?: useDataConnectMutationOptions<RemoveMonitoredEmailData, FirebaseError, RemoveMonitoredEmailVariables>): UseDataConnectMutationResult<RemoveMonitoredEmailData, RemoveMonitoredEmailVariables>;
export function useRemoveMonitoredEmail(dc: DataConnect, options?: useDataConnectMutationOptions<RemoveMonitoredEmailData, FirebaseError, RemoveMonitoredEmailVariables>): UseDataConnectMutationResult<RemoveMonitoredEmailData, RemoveMonitoredEmailVariables>;

export function useGetUser(options?: useDataConnectQueryOptions<GetUserData>): UseDataConnectQueryResult<GetUserData, undefined>;
export function useGetUser(dc: DataConnect, options?: useDataConnectQueryOptions<GetUserData>): UseDataConnectQueryResult<GetUserData, undefined>;

export function useGetUserVectorStatuses(options?: useDataConnectQueryOptions<GetUserVectorStatusesData>): UseDataConnectQueryResult<GetUserVectorStatusesData, undefined>;
export function useGetUserVectorStatuses(dc: DataConnect, options?: useDataConnectQueryOptions<GetUserVectorStatusesData>): UseDataConnectQueryResult<GetUserVectorStatusesData, undefined>;

export function useGetFindings(vars: GetFindingsVariables, options?: useDataConnectQueryOptions<GetFindingsData>): UseDataConnectQueryResult<GetFindingsData, GetFindingsVariables>;
export function useGetFindings(dc: DataConnect, vars: GetFindingsVariables, options?: useDataConnectQueryOptions<GetFindingsData>): UseDataConnectQueryResult<GetFindingsData, GetFindingsVariables>;

export function useGetMonitoredEmails(options?: useDataConnectQueryOptions<GetMonitoredEmailsData>): UseDataConnectQueryResult<GetMonitoredEmailsData, undefined>;
export function useGetMonitoredEmails(dc: DataConnect, options?: useDataConnectQueryOptions<GetMonitoredEmailsData>): UseDataConnectQueryResult<GetMonitoredEmailsData, undefined>;
