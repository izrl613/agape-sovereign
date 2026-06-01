# Basic Usage

Always prioritize using a supported framework over using the generated SDK
directly. Supported frameworks simplify the developer experience and help ensure
best practices are followed.




### React
For each operation, there is a wrapper hook that can be used to call the operation.

Here are all of the hooks that get generated:
```ts
import { useUpsertUser, useUpdateSovereignScore, useUpsertUserVectorStatus, useAddFinding, useAddMonitoredEmail, useRemoveMonitoredEmail, useGetUser, useGetUserVectorStatuses, useGetFindings, useGetMonitoredEmails } from '@dataconnect/generated/react';
// The types of these hooks are available in react/index.d.ts

const { data, isPending, isSuccess, isError, error } = useUpsertUser(upsertUserVars);

const { data, isPending, isSuccess, isError, error } = useUpdateSovereignScore(updateSovereignScoreVars);

const { data, isPending, isSuccess, isError, error } = useUpsertUserVectorStatus(upsertUserVectorStatusVars);

const { data, isPending, isSuccess, isError, error } = useAddFinding(addFindingVars);

const { data, isPending, isSuccess, isError, error } = useAddMonitoredEmail(addMonitoredEmailVars);

const { data, isPending, isSuccess, isError, error } = useRemoveMonitoredEmail(removeMonitoredEmailVars);

const { data, isPending, isSuccess, isError, error } = useGetUser();

const { data, isPending, isSuccess, isError, error } = useGetUserVectorStatuses();

const { data, isPending, isSuccess, isError, error } = useGetFindings(getFindingsVars);

const { data, isPending, isSuccess, isError, error } = useGetMonitoredEmails();

```

Here's an example from a different generated SDK:

```ts
import { useListAllMovies } from '@dataconnect/generated/react';

function MyComponent() {
  const { isLoading, data, error } = useListAllMovies();
  if(isLoading) {
    return <div>Loading...</div>
  }
  if(error) {
    return <div> An Error Occurred: {error} </div>
  }
}

// App.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MyComponent from './my-component';

function App() {
  const queryClient = new QueryClient();
  return <QueryClientProvider client={queryClient}>
    <MyComponent />
  </QueryClientProvider>
}
```



## Advanced Usage
If a user is not using a supported framework, they can use the generated SDK directly.

Here's an example of how to use it with the first 5 operations:

```js
import { upsertUser, updateSovereignScore, upsertUserVectorStatus, addFinding, addMonitoredEmail, removeMonitoredEmail, getUser, getUserVectorStatuses, getFindings, getMonitoredEmails } from '@dataconnect/generated';


// Operation UpsertUser:  For variables, look at type UpsertUserVars in ../index.d.ts
const { data } = await UpsertUser(dataConnect, upsertUserVars);

// Operation UpdateSovereignScore:  For variables, look at type UpdateSovereignScoreVars in ../index.d.ts
const { data } = await UpdateSovereignScore(dataConnect, updateSovereignScoreVars);

// Operation UpsertUserVectorStatus:  For variables, look at type UpsertUserVectorStatusVars in ../index.d.ts
const { data } = await UpsertUserVectorStatus(dataConnect, upsertUserVectorStatusVars);

// Operation AddFinding:  For variables, look at type AddFindingVars in ../index.d.ts
const { data } = await AddFinding(dataConnect, addFindingVars);

// Operation AddMonitoredEmail:  For variables, look at type AddMonitoredEmailVars in ../index.d.ts
const { data } = await AddMonitoredEmail(dataConnect, addMonitoredEmailVars);

// Operation RemoveMonitoredEmail:  For variables, look at type RemoveMonitoredEmailVars in ../index.d.ts
const { data } = await RemoveMonitoredEmail(dataConnect, removeMonitoredEmailVars);

// Operation GetUser: 
const { data } = await GetUser(dataConnect);

// Operation GetUserVectorStatuses: 
const { data } = await GetUserVectorStatuses(dataConnect);

// Operation GetFindings:  For variables, look at type GetFindingsVars in ../index.d.ts
const { data } = await GetFindings(dataConnect, getFindingsVars);

// Operation GetMonitoredEmails: 
const { data } = await GetMonitoredEmails(dataConnect);


```