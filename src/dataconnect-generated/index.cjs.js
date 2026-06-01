const { queryRef, executeQuery, validateArgsWithOptions, mutationRef, executeMutation, validateArgs, makeMemoryCacheProvider } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'example',
  service: 'idin',
  location: 'us-central1'
};
exports.connectorConfig = connectorConfig;
const dataConnectSettings = {
  cacheSettings: {
    cacheProvider: makeMemoryCacheProvider()
  }
};
exports.dataConnectSettings = dataConnectSettings;

const upsertUserRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpsertUser', inputVars);
}
upsertUserRef.operationName = 'UpsertUser';
exports.upsertUserRef = upsertUserRef;

exports.upsertUser = function upsertUser(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(upsertUserRef(dcInstance, inputVars));
}
;

const updateSovereignScoreRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateSovereignScore', inputVars);
}
updateSovereignScoreRef.operationName = 'UpdateSovereignScore';
exports.updateSovereignScoreRef = updateSovereignScoreRef;

exports.updateSovereignScore = function updateSovereignScore(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(updateSovereignScoreRef(dcInstance, inputVars));
}
;

const upsertUserVectorStatusRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpsertUserVectorStatus', inputVars);
}
upsertUserVectorStatusRef.operationName = 'UpsertUserVectorStatus';
exports.upsertUserVectorStatusRef = upsertUserVectorStatusRef;

exports.upsertUserVectorStatus = function upsertUserVectorStatus(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(upsertUserVectorStatusRef(dcInstance, inputVars));
}
;

const addFindingRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'AddFinding', inputVars);
}
addFindingRef.operationName = 'AddFinding';
exports.addFindingRef = addFindingRef;

exports.addFinding = function addFinding(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(addFindingRef(dcInstance, inputVars));
}
;

const addMonitoredEmailRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'AddMonitoredEmail', inputVars);
}
addMonitoredEmailRef.operationName = 'AddMonitoredEmail';
exports.addMonitoredEmailRef = addMonitoredEmailRef;

exports.addMonitoredEmail = function addMonitoredEmail(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(addMonitoredEmailRef(dcInstance, inputVars));
}
;

const removeMonitoredEmailRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'RemoveMonitoredEmail', inputVars);
}
removeMonitoredEmailRef.operationName = 'RemoveMonitoredEmail';
exports.removeMonitoredEmailRef = removeMonitoredEmailRef;

exports.removeMonitoredEmail = function removeMonitoredEmail(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(removeMonitoredEmailRef(dcInstance, inputVars));
}
;

const getUserRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetUser');
}
getUserRef.operationName = 'GetUser';
exports.getUserRef = getUserRef;

exports.getUser = function getUser(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(getUserRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}
;

const getUserVectorStatusesRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetUserVectorStatuses');
}
getUserVectorStatusesRef.operationName = 'GetUserVectorStatuses';
exports.getUserVectorStatusesRef = getUserVectorStatusesRef;

exports.getUserVectorStatuses = function getUserVectorStatuses(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(getUserVectorStatusesRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}
;

const getFindingsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetFindings', inputVars);
}
getFindingsRef.operationName = 'GetFindings';
exports.getFindingsRef = getFindingsRef;

exports.getFindings = function getFindings(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(getFindingsRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}
;

const getMonitoredEmailsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetMonitoredEmails');
}
getMonitoredEmailsRef.operationName = 'GetMonitoredEmails';
exports.getMonitoredEmailsRef = getMonitoredEmailsRef;

exports.getMonitoredEmails = function getMonitoredEmails(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(getMonitoredEmailsRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}
;
