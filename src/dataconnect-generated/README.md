# Generated TypeScript README
This README will guide you through the process of using the generated JavaScript SDK package for the connector `example`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

**If you're looking for the `React README`, you can find it at [`dataconnect-generated/react/README.md`](./react/README.md)**

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

# Table of Contents
- [**Overview**](#generated-javascript-readme)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*GetUser*](#getuser)
  - [*GetUserVectorStatuses*](#getuservectorstatuses)
  - [*GetFindings*](#getfindings)
  - [*GetMonitoredEmails*](#getmonitoredemails)
- [**Mutations**](#mutations)
  - [*UpsertUser*](#upsertuser)
  - [*UpdateSovereignScore*](#updatesovereignscore)
  - [*UpsertUserVectorStatus*](#upsertuservectorstatus)
  - [*AddFinding*](#addfinding)
  - [*AddMonitoredEmail*](#addmonitoredemail)
  - [*RemoveMonitoredEmail*](#removemonitoredemail)

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `example`. You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

You can use this generated SDK by importing from the package `@dataconnect/generated` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#set-client).

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#instrument-clients).

```typescript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
connectDataConnectEmulator(dataConnect, 'localhost', 9399);
```

After it's initialized, you can call your Data Connect [queries](#queries) and [mutations](#mutations) from your generated SDK.

# Queries

There are two ways to execute a Data Connect Query using the generated Web SDK:
- Using a Query Reference function, which returns a `QueryRef`
  - The `QueryRef` can be used as an argument to `executeQuery()`, which will execute the Query and return a `QueryPromise`
- Using an action shortcut function, which returns a `QueryPromise`
  - Calling the action shortcut function will execute the Query and return a `QueryPromise`

The following is true for both the action shortcut function and the `QueryRef` function:
- The `QueryPromise` returned will resolve to the result of the Query once it has finished executing
- If the Query accepts arguments, both the action shortcut function and the `QueryRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Query
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-queries).

## GetUser
You can execute the `GetUser` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getUser(options?: ExecuteQueryOptions): QueryPromise<GetUserData, undefined>;

interface GetUserRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetUserData, undefined>;
}
export const getUserRef: GetUserRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getUser(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<GetUserData, undefined>;

interface GetUserRef {
  ...
  (dc: DataConnect): QueryRef<GetUserData, undefined>;
}
export const getUserRef: GetUserRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getUserRef:
```typescript
const name = getUserRef.operationName;
console.log(name);
```

### Variables
The `GetUser` query has no variables.
### Return Type
Recall that executing the `GetUser` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetUserData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `GetUser`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getUser } from '@dataconnect/generated';


// Call the `getUser()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getUser();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getUser(dataConnect);

console.log(data.user);

// Or, you can use the `Promise` API.
getUser().then((response) => {
  const data = response.data;
  console.log(data.user);
});
```

### Using `GetUser`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getUserRef } from '@dataconnect/generated';


// Call the `getUserRef()` function to get a reference to the query.
const ref = getUserRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getUserRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.user);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.user);
});
```

## GetUserVectorStatuses
You can execute the `GetUserVectorStatuses` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getUserVectorStatuses(options?: ExecuteQueryOptions): QueryPromise<GetUserVectorStatusesData, undefined>;

interface GetUserVectorStatusesRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetUserVectorStatusesData, undefined>;
}
export const getUserVectorStatusesRef: GetUserVectorStatusesRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getUserVectorStatuses(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<GetUserVectorStatusesData, undefined>;

interface GetUserVectorStatusesRef {
  ...
  (dc: DataConnect): QueryRef<GetUserVectorStatusesData, undefined>;
}
export const getUserVectorStatusesRef: GetUserVectorStatusesRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getUserVectorStatusesRef:
```typescript
const name = getUserVectorStatusesRef.operationName;
console.log(name);
```

### Variables
The `GetUserVectorStatuses` query has no variables.
### Return Type
Recall that executing the `GetUserVectorStatuses` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetUserVectorStatusesData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `GetUserVectorStatuses`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getUserVectorStatuses } from '@dataconnect/generated';


// Call the `getUserVectorStatuses()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getUserVectorStatuses();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getUserVectorStatuses(dataConnect);

console.log(data.userVectorStatuses);

// Or, you can use the `Promise` API.
getUserVectorStatuses().then((response) => {
  const data = response.data;
  console.log(data.userVectorStatuses);
});
```

### Using `GetUserVectorStatuses`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getUserVectorStatusesRef } from '@dataconnect/generated';


// Call the `getUserVectorStatusesRef()` function to get a reference to the query.
const ref = getUserVectorStatusesRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getUserVectorStatusesRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.userVectorStatuses);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.userVectorStatuses);
});
```

## GetFindings
You can execute the `GetFindings` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getFindings(vars: GetFindingsVariables, options?: ExecuteQueryOptions): QueryPromise<GetFindingsData, GetFindingsVariables>;

interface GetFindingsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetFindingsVariables): QueryRef<GetFindingsData, GetFindingsVariables>;
}
export const getFindingsRef: GetFindingsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getFindings(dc: DataConnect, vars: GetFindingsVariables, options?: ExecuteQueryOptions): QueryPromise<GetFindingsData, GetFindingsVariables>;

interface GetFindingsRef {
  ...
  (dc: DataConnect, vars: GetFindingsVariables): QueryRef<GetFindingsData, GetFindingsVariables>;
}
export const getFindingsRef: GetFindingsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getFindingsRef:
```typescript
const name = getFindingsRef.operationName;
console.log(name);
```

### Variables
The `GetFindings` query requires an argument of type `GetFindingsVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetFindingsVariables {
  vectorId: string;
}
```
### Return Type
Recall that executing the `GetFindings` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetFindingsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `GetFindings`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getFindings, GetFindingsVariables } from '@dataconnect/generated';

// The `GetFindings` query requires an argument of type `GetFindingsVariables`:
const getFindingsVars: GetFindingsVariables = {
  vectorId: ..., 
};

// Call the `getFindings()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getFindings(getFindingsVars);
// Variables can be defined inline as well.
const { data } = await getFindings({ vectorId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getFindings(dataConnect, getFindingsVars);

console.log(data.findings);

// Or, you can use the `Promise` API.
getFindings(getFindingsVars).then((response) => {
  const data = response.data;
  console.log(data.findings);
});
```

### Using `GetFindings`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getFindingsRef, GetFindingsVariables } from '@dataconnect/generated';

// The `GetFindings` query requires an argument of type `GetFindingsVariables`:
const getFindingsVars: GetFindingsVariables = {
  vectorId: ..., 
};

// Call the `getFindingsRef()` function to get a reference to the query.
const ref = getFindingsRef(getFindingsVars);
// Variables can be defined inline as well.
const ref = getFindingsRef({ vectorId: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getFindingsRef(dataConnect, getFindingsVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.findings);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.findings);
});
```

## GetMonitoredEmails
You can execute the `GetMonitoredEmails` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getMonitoredEmails(options?: ExecuteQueryOptions): QueryPromise<GetMonitoredEmailsData, undefined>;

interface GetMonitoredEmailsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetMonitoredEmailsData, undefined>;
}
export const getMonitoredEmailsRef: GetMonitoredEmailsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getMonitoredEmails(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<GetMonitoredEmailsData, undefined>;

interface GetMonitoredEmailsRef {
  ...
  (dc: DataConnect): QueryRef<GetMonitoredEmailsData, undefined>;
}
export const getMonitoredEmailsRef: GetMonitoredEmailsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getMonitoredEmailsRef:
```typescript
const name = getMonitoredEmailsRef.operationName;
console.log(name);
```

### Variables
The `GetMonitoredEmails` query has no variables.
### Return Type
Recall that executing the `GetMonitoredEmails` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetMonitoredEmailsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetMonitoredEmailsData {
  monitoredEmails: ({
    id: UUIDString;
    emailAddress: string;
    status: string;
    createdAt: TimestampString;
    lastCheckedAt?: TimestampString | null;
  } & MonitoredEmail_Key)[];
}
```
### Using `GetMonitoredEmails`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getMonitoredEmails } from '@dataconnect/generated';


// Call the `getMonitoredEmails()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getMonitoredEmails();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getMonitoredEmails(dataConnect);

console.log(data.monitoredEmails);

// Or, you can use the `Promise` API.
getMonitoredEmails().then((response) => {
  const data = response.data;
  console.log(data.monitoredEmails);
});
```

### Using `GetMonitoredEmails`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getMonitoredEmailsRef } from '@dataconnect/generated';


// Call the `getMonitoredEmailsRef()` function to get a reference to the query.
const ref = getMonitoredEmailsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getMonitoredEmailsRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.monitoredEmails);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.monitoredEmails);
});
```

# Mutations

There are two ways to execute a Data Connect Mutation using the generated Web SDK:
- Using a Mutation Reference function, which returns a `MutationRef`
  - The `MutationRef` can be used as an argument to `executeMutation()`, which will execute the Mutation and return a `MutationPromise`
- Using an action shortcut function, which returns a `MutationPromise`
  - Calling the action shortcut function will execute the Mutation and return a `MutationPromise`

The following is true for both the action shortcut function and the `MutationRef` function:
- The `MutationPromise` returned will resolve to the result of the Mutation once it has finished executing
- If the Mutation accepts arguments, both the action shortcut function and the `MutationRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Mutation
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-mutations).

## UpsertUser
You can execute the `UpsertUser` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
upsertUser(vars: UpsertUserVariables): MutationPromise<UpsertUserData, UpsertUserVariables>;

interface UpsertUserRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpsertUserVariables): MutationRef<UpsertUserData, UpsertUserVariables>;
}
export const upsertUserRef: UpsertUserRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
upsertUser(dc: DataConnect, vars: UpsertUserVariables): MutationPromise<UpsertUserData, UpsertUserVariables>;

interface UpsertUserRef {
  ...
  (dc: DataConnect, vars: UpsertUserVariables): MutationRef<UpsertUserData, UpsertUserVariables>;
}
export const upsertUserRef: UpsertUserRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the upsertUserRef:
```typescript
const name = upsertUserRef.operationName;
console.log(name);
```

### Variables
The `UpsertUser` mutation requires an argument of type `UpsertUserVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpsertUserVariables {
  name: string;
  email: string;
  provider?: string | null;
}
```
### Return Type
Recall that executing the `UpsertUser` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpsertUserData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpsertUserData {
  user_upsert: User_Key;
}
```
### Using `UpsertUser`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, upsertUser, UpsertUserVariables } from '@dataconnect/generated';

// The `UpsertUser` mutation requires an argument of type `UpsertUserVariables`:
const upsertUserVars: UpsertUserVariables = {
  name: ..., 
  email: ..., 
  provider: ..., // optional
};

// Call the `upsertUser()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await upsertUser(upsertUserVars);
// Variables can be defined inline as well.
const { data } = await upsertUser({ name: ..., email: ..., provider: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await upsertUser(dataConnect, upsertUserVars);

console.log(data.user_upsert);

// Or, you can use the `Promise` API.
upsertUser(upsertUserVars).then((response) => {
  const data = response.data;
  console.log(data.user_upsert);
});
```

### Using `UpsertUser`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, upsertUserRef, UpsertUserVariables } from '@dataconnect/generated';

// The `UpsertUser` mutation requires an argument of type `UpsertUserVariables`:
const upsertUserVars: UpsertUserVariables = {
  name: ..., 
  email: ..., 
  provider: ..., // optional
};

// Call the `upsertUserRef()` function to get a reference to the mutation.
const ref = upsertUserRef(upsertUserVars);
// Variables can be defined inline as well.
const ref = upsertUserRef({ name: ..., email: ..., provider: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = upsertUserRef(dataConnect, upsertUserVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.user_upsert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.user_upsert);
});
```

## UpdateSovereignScore
You can execute the `UpdateSovereignScore` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
updateSovereignScore(vars: UpdateSovereignScoreVariables): MutationPromise<UpdateSovereignScoreData, UpdateSovereignScoreVariables>;

interface UpdateSovereignScoreRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateSovereignScoreVariables): MutationRef<UpdateSovereignScoreData, UpdateSovereignScoreVariables>;
}
export const updateSovereignScoreRef: UpdateSovereignScoreRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateSovereignScore(dc: DataConnect, vars: UpdateSovereignScoreVariables): MutationPromise<UpdateSovereignScoreData, UpdateSovereignScoreVariables>;

interface UpdateSovereignScoreRef {
  ...
  (dc: DataConnect, vars: UpdateSovereignScoreVariables): MutationRef<UpdateSovereignScoreData, UpdateSovereignScoreVariables>;
}
export const updateSovereignScoreRef: UpdateSovereignScoreRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateSovereignScoreRef:
```typescript
const name = updateSovereignScoreRef.operationName;
console.log(name);
```

### Variables
The `UpdateSovereignScore` mutation requires an argument of type `UpdateSovereignScoreVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpdateSovereignScoreVariables {
  score: number;
}
```
### Return Type
Recall that executing the `UpdateSovereignScore` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateSovereignScoreData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateSovereignScoreData {
  user_update?: User_Key | null;
}
```
### Using `UpdateSovereignScore`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateSovereignScore, UpdateSovereignScoreVariables } from '@dataconnect/generated';

// The `UpdateSovereignScore` mutation requires an argument of type `UpdateSovereignScoreVariables`:
const updateSovereignScoreVars: UpdateSovereignScoreVariables = {
  score: ..., 
};

// Call the `updateSovereignScore()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateSovereignScore(updateSovereignScoreVars);
// Variables can be defined inline as well.
const { data } = await updateSovereignScore({ score: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateSovereignScore(dataConnect, updateSovereignScoreVars);

console.log(data.user_update);

// Or, you can use the `Promise` API.
updateSovereignScore(updateSovereignScoreVars).then((response) => {
  const data = response.data;
  console.log(data.user_update);
});
```

### Using `UpdateSovereignScore`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateSovereignScoreRef, UpdateSovereignScoreVariables } from '@dataconnect/generated';

// The `UpdateSovereignScore` mutation requires an argument of type `UpdateSovereignScoreVariables`:
const updateSovereignScoreVars: UpdateSovereignScoreVariables = {
  score: ..., 
};

// Call the `updateSovereignScoreRef()` function to get a reference to the mutation.
const ref = updateSovereignScoreRef(updateSovereignScoreVars);
// Variables can be defined inline as well.
const ref = updateSovereignScoreRef({ score: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateSovereignScoreRef(dataConnect, updateSovereignScoreVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.user_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.user_update);
});
```

## UpsertUserVectorStatus
You can execute the `UpsertUserVectorStatus` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
upsertUserVectorStatus(vars: UpsertUserVectorStatusVariables): MutationPromise<UpsertUserVectorStatusData, UpsertUserVectorStatusVariables>;

interface UpsertUserVectorStatusRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpsertUserVectorStatusVariables): MutationRef<UpsertUserVectorStatusData, UpsertUserVectorStatusVariables>;
}
export const upsertUserVectorStatusRef: UpsertUserVectorStatusRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
upsertUserVectorStatus(dc: DataConnect, vars: UpsertUserVectorStatusVariables): MutationPromise<UpsertUserVectorStatusData, UpsertUserVectorStatusVariables>;

interface UpsertUserVectorStatusRef {
  ...
  (dc: DataConnect, vars: UpsertUserVectorStatusVariables): MutationRef<UpsertUserVectorStatusData, UpsertUserVectorStatusVariables>;
}
export const upsertUserVectorStatusRef: UpsertUserVectorStatusRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the upsertUserVectorStatusRef:
```typescript
const name = upsertUserVectorStatusRef.operationName;
console.log(name);
```

### Variables
The `UpsertUserVectorStatus` mutation requires an argument of type `UpsertUserVectorStatusVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpsertUserVectorStatusVariables {
  vectorId: string;
  sovereigntyScore: number;
  nukedCount: number;
  knoxedCount: number;
  monitoredCount: number;
  statusNotes?: string | null;
}
```
### Return Type
Recall that executing the `UpsertUserVectorStatus` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpsertUserVectorStatusData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpsertUserVectorStatusData {
  userVectorStatus_upsert: UserVectorStatus_Key;
}
```
### Using `UpsertUserVectorStatus`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, upsertUserVectorStatus, UpsertUserVectorStatusVariables } from '@dataconnect/generated';

// The `UpsertUserVectorStatus` mutation requires an argument of type `UpsertUserVectorStatusVariables`:
const upsertUserVectorStatusVars: UpsertUserVectorStatusVariables = {
  vectorId: ..., 
  sovereigntyScore: ..., 
  nukedCount: ..., 
  knoxedCount: ..., 
  monitoredCount: ..., 
  statusNotes: ..., // optional
};

// Call the `upsertUserVectorStatus()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await upsertUserVectorStatus(upsertUserVectorStatusVars);
// Variables can be defined inline as well.
const { data } = await upsertUserVectorStatus({ vectorId: ..., sovereigntyScore: ..., nukedCount: ..., knoxedCount: ..., monitoredCount: ..., statusNotes: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await upsertUserVectorStatus(dataConnect, upsertUserVectorStatusVars);

console.log(data.userVectorStatus_upsert);

// Or, you can use the `Promise` API.
upsertUserVectorStatus(upsertUserVectorStatusVars).then((response) => {
  const data = response.data;
  console.log(data.userVectorStatus_upsert);
});
```

### Using `UpsertUserVectorStatus`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, upsertUserVectorStatusRef, UpsertUserVectorStatusVariables } from '@dataconnect/generated';

// The `UpsertUserVectorStatus` mutation requires an argument of type `UpsertUserVectorStatusVariables`:
const upsertUserVectorStatusVars: UpsertUserVectorStatusVariables = {
  vectorId: ..., 
  sovereigntyScore: ..., 
  nukedCount: ..., 
  knoxedCount: ..., 
  monitoredCount: ..., 
  statusNotes: ..., // optional
};

// Call the `upsertUserVectorStatusRef()` function to get a reference to the mutation.
const ref = upsertUserVectorStatusRef(upsertUserVectorStatusVars);
// Variables can be defined inline as well.
const ref = upsertUserVectorStatusRef({ vectorId: ..., sovereigntyScore: ..., nukedCount: ..., knoxedCount: ..., monitoredCount: ..., statusNotes: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = upsertUserVectorStatusRef(dataConnect, upsertUserVectorStatusVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.userVectorStatus_upsert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.userVectorStatus_upsert);
});
```

## AddFinding
You can execute the `AddFinding` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
addFinding(vars: AddFindingVariables): MutationPromise<AddFindingData, AddFindingVariables>;

interface AddFindingRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: AddFindingVariables): MutationRef<AddFindingData, AddFindingVariables>;
}
export const addFindingRef: AddFindingRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
addFinding(dc: DataConnect, vars: AddFindingVariables): MutationPromise<AddFindingData, AddFindingVariables>;

interface AddFindingRef {
  ...
  (dc: DataConnect, vars: AddFindingVariables): MutationRef<AddFindingData, AddFindingVariables>;
}
export const addFindingRef: AddFindingRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the addFindingRef:
```typescript
const name = addFindingRef.operationName;
console.log(name);
```

### Variables
The `AddFinding` mutation requires an argument of type `AddFindingVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface AddFindingVariables {
  vectorId: string;
  type: string;
  label: string;
  detail: string;
  action?: string | null;
  status?: string | null;
}
```
### Return Type
Recall that executing the `AddFinding` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `AddFindingData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface AddFindingData {
  finding_insert: Finding_Key;
}
```
### Using `AddFinding`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, addFinding, AddFindingVariables } from '@dataconnect/generated';

// The `AddFinding` mutation requires an argument of type `AddFindingVariables`:
const addFindingVars: AddFindingVariables = {
  vectorId: ..., 
  type: ..., 
  label: ..., 
  detail: ..., 
  action: ..., // optional
  status: ..., // optional
};

// Call the `addFinding()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await addFinding(addFindingVars);
// Variables can be defined inline as well.
const { data } = await addFinding({ vectorId: ..., type: ..., label: ..., detail: ..., action: ..., status: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await addFinding(dataConnect, addFindingVars);

console.log(data.finding_insert);

// Or, you can use the `Promise` API.
addFinding(addFindingVars).then((response) => {
  const data = response.data;
  console.log(data.finding_insert);
});
```

### Using `AddFinding`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, addFindingRef, AddFindingVariables } from '@dataconnect/generated';

// The `AddFinding` mutation requires an argument of type `AddFindingVariables`:
const addFindingVars: AddFindingVariables = {
  vectorId: ..., 
  type: ..., 
  label: ..., 
  detail: ..., 
  action: ..., // optional
  status: ..., // optional
};

// Call the `addFindingRef()` function to get a reference to the mutation.
const ref = addFindingRef(addFindingVars);
// Variables can be defined inline as well.
const ref = addFindingRef({ vectorId: ..., type: ..., label: ..., detail: ..., action: ..., status: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = addFindingRef(dataConnect, addFindingVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.finding_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.finding_insert);
});
```

## AddMonitoredEmail
You can execute the `AddMonitoredEmail` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
addMonitoredEmail(vars: AddMonitoredEmailVariables): MutationPromise<AddMonitoredEmailData, AddMonitoredEmailVariables>;

interface AddMonitoredEmailRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: AddMonitoredEmailVariables): MutationRef<AddMonitoredEmailData, AddMonitoredEmailVariables>;
}
export const addMonitoredEmailRef: AddMonitoredEmailRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
addMonitoredEmail(dc: DataConnect, vars: AddMonitoredEmailVariables): MutationPromise<AddMonitoredEmailData, AddMonitoredEmailVariables>;

interface AddMonitoredEmailRef {
  ...
  (dc: DataConnect, vars: AddMonitoredEmailVariables): MutationRef<AddMonitoredEmailData, AddMonitoredEmailVariables>;
}
export const addMonitoredEmailRef: AddMonitoredEmailRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the addMonitoredEmailRef:
```typescript
const name = addMonitoredEmailRef.operationName;
console.log(name);
```

### Variables
The `AddMonitoredEmail` mutation requires an argument of type `AddMonitoredEmailVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface AddMonitoredEmailVariables {
  emailAddress: string;
}
```
### Return Type
Recall that executing the `AddMonitoredEmail` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `AddMonitoredEmailData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface AddMonitoredEmailData {
  monitoredEmail_insert: MonitoredEmail_Key;
}
```
### Using `AddMonitoredEmail`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, addMonitoredEmail, AddMonitoredEmailVariables } from '@dataconnect/generated';

// The `AddMonitoredEmail` mutation requires an argument of type `AddMonitoredEmailVariables`:
const addMonitoredEmailVars: AddMonitoredEmailVariables = {
  emailAddress: ..., 
};

// Call the `addMonitoredEmail()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await addMonitoredEmail(addMonitoredEmailVars);
// Variables can be defined inline as well.
const { data } = await addMonitoredEmail({ emailAddress: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await addMonitoredEmail(dataConnect, addMonitoredEmailVars);

console.log(data.monitoredEmail_insert);

// Or, you can use the `Promise` API.
addMonitoredEmail(addMonitoredEmailVars).then((response) => {
  const data = response.data;
  console.log(data.monitoredEmail_insert);
});
```

### Using `AddMonitoredEmail`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, addMonitoredEmailRef, AddMonitoredEmailVariables } from '@dataconnect/generated';

// The `AddMonitoredEmail` mutation requires an argument of type `AddMonitoredEmailVariables`:
const addMonitoredEmailVars: AddMonitoredEmailVariables = {
  emailAddress: ..., 
};

// Call the `addMonitoredEmailRef()` function to get a reference to the mutation.
const ref = addMonitoredEmailRef(addMonitoredEmailVars);
// Variables can be defined inline as well.
const ref = addMonitoredEmailRef({ emailAddress: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = addMonitoredEmailRef(dataConnect, addMonitoredEmailVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.monitoredEmail_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.monitoredEmail_insert);
});
```

## RemoveMonitoredEmail
You can execute the `RemoveMonitoredEmail` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
removeMonitoredEmail(vars: RemoveMonitoredEmailVariables): MutationPromise<RemoveMonitoredEmailData, RemoveMonitoredEmailVariables>;

interface RemoveMonitoredEmailRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: RemoveMonitoredEmailVariables): MutationRef<RemoveMonitoredEmailData, RemoveMonitoredEmailVariables>;
}
export const removeMonitoredEmailRef: RemoveMonitoredEmailRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
removeMonitoredEmail(dc: DataConnect, vars: RemoveMonitoredEmailVariables): MutationPromise<RemoveMonitoredEmailData, RemoveMonitoredEmailVariables>;

interface RemoveMonitoredEmailRef {
  ...
  (dc: DataConnect, vars: RemoveMonitoredEmailVariables): MutationRef<RemoveMonitoredEmailData, RemoveMonitoredEmailVariables>;
}
export const removeMonitoredEmailRef: RemoveMonitoredEmailRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the removeMonitoredEmailRef:
```typescript
const name = removeMonitoredEmailRef.operationName;
console.log(name);
```

### Variables
The `RemoveMonitoredEmail` mutation requires an argument of type `RemoveMonitoredEmailVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface RemoveMonitoredEmailVariables {
  id: UUIDString;
}
```
### Return Type
Recall that executing the `RemoveMonitoredEmail` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `RemoveMonitoredEmailData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface RemoveMonitoredEmailData {
  monitoredEmail_delete?: MonitoredEmail_Key | null;
}
```
### Using `RemoveMonitoredEmail`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, removeMonitoredEmail, RemoveMonitoredEmailVariables } from '@dataconnect/generated';

// The `RemoveMonitoredEmail` mutation requires an argument of type `RemoveMonitoredEmailVariables`:
const removeMonitoredEmailVars: RemoveMonitoredEmailVariables = {
  id: ..., 
};

// Call the `removeMonitoredEmail()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await removeMonitoredEmail(removeMonitoredEmailVars);
// Variables can be defined inline as well.
const { data } = await removeMonitoredEmail({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await removeMonitoredEmail(dataConnect, removeMonitoredEmailVars);

console.log(data.monitoredEmail_delete);

// Or, you can use the `Promise` API.
removeMonitoredEmail(removeMonitoredEmailVars).then((response) => {
  const data = response.data;
  console.log(data.monitoredEmail_delete);
});
```

### Using `RemoveMonitoredEmail`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, removeMonitoredEmailRef, RemoveMonitoredEmailVariables } from '@dataconnect/generated';

// The `RemoveMonitoredEmail` mutation requires an argument of type `RemoveMonitoredEmailVariables`:
const removeMonitoredEmailVars: RemoveMonitoredEmailVariables = {
  id: ..., 
};

// Call the `removeMonitoredEmailRef()` function to get a reference to the mutation.
const ref = removeMonitoredEmailRef(removeMonitoredEmailVars);
// Variables can be defined inline as well.
const ref = removeMonitoredEmailRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = removeMonitoredEmailRef(dataConnect, removeMonitoredEmailVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.monitoredEmail_delete);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.monitoredEmail_delete);
});
```

