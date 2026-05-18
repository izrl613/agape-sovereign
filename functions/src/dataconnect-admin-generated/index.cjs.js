const {validateAdminArgs} = require("firebase-admin/data-connect");

const connectorConfig = {
  connector: "example",
  serviceId: "idin",
  location: "us-central1",
};
exports.connectorConfig = connectorConfig;

function upsertUser(dcOrVarsOrOptions, varsOrOptions, options) {
  const {dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation("UpsertUser", inputVars, inputOpts);
}
exports.upsertUser = upsertUser;

function updateSovereignScore(dcOrVarsOrOptions, varsOrOptions, options) {
  const {dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation("UpdateSovereignScore", inputVars, inputOpts);
}
exports.updateSovereignScore = updateSovereignScore;

function upsertUserVectorStatus(dcOrVarsOrOptions, varsOrOptions, options) {
  const {dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation("UpsertUserVectorStatus", inputVars, inputOpts);
}
exports.upsertUserVectorStatus = upsertUserVectorStatus;

function addFinding(dcOrVarsOrOptions, varsOrOptions, options) {
  const {dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation("AddFinding", inputVars, inputOpts);
}
exports.addFinding = addFinding;

function addMonitoredEmail(dcOrVarsOrOptions, varsOrOptions, options) {
  const {dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation("AddMonitoredEmail", inputVars, inputOpts);
}
exports.addMonitoredEmail = addMonitoredEmail;

function removeMonitoredEmail(dcOrVarsOrOptions, varsOrOptions, options) {
  const {dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation("RemoveMonitoredEmail", inputVars, inputOpts);
}
exports.removeMonitoredEmail = removeMonitoredEmail;

function getUser(dcOrOptions, options) {
  const {dc: dcInstance, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrOptions, options, undefined);
  dcInstance.useGen(true);
  return dcInstance.executeQuery("GetUser", undefined, inputOpts);
}
exports.getUser = getUser;

function getUserVectorStatuses(dcOrOptions, options) {
  const {dc: dcInstance, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrOptions, options, undefined);
  dcInstance.useGen(true);
  return dcInstance.executeQuery("GetUserVectorStatuses", undefined, inputOpts);
}
exports.getUserVectorStatuses = getUserVectorStatuses;

function getFindings(dcOrVarsOrOptions, varsOrOptions, options) {
  const {dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeQuery("GetFindings", inputVars, inputOpts);
}
exports.getFindings = getFindings;

function getMonitoredEmails(dcOrOptions, options) {
  const {dc: dcInstance, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrOptions, options, undefined);
  dcInstance.useGen(true);
  return dcInstance.executeQuery("GetMonitoredEmails", undefined, inputOpts);
}
exports.getMonitoredEmails = getMonitoredEmails;

