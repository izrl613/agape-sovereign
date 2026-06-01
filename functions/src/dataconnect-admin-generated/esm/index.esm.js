import {validateAdminArgs} from "firebase-admin/data-connect";

export const connectorConfig = {
  connector: "example",
  serviceId: "idin",
  location: "us-central1",
};

export function upsertUser(dcOrVarsOrOptions, varsOrOptions, options) {
  const {dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation("UpsertUser", inputVars, inputOpts);
}

export function updateSovereignScore(dcOrVarsOrOptions, varsOrOptions, options) {
  const {dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation("UpdateSovereignScore", inputVars, inputOpts);
}

export function upsertUserVectorStatus(dcOrVarsOrOptions, varsOrOptions, options) {
  const {dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation("UpsertUserVectorStatus", inputVars, inputOpts);
}

export function addFinding(dcOrVarsOrOptions, varsOrOptions, options) {
  const {dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation("AddFinding", inputVars, inputOpts);
}

export function addMonitoredEmail(dcOrVarsOrOptions, varsOrOptions, options) {
  const {dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation("AddMonitoredEmail", inputVars, inputOpts);
}

export function removeMonitoredEmail(dcOrVarsOrOptions, varsOrOptions, options) {
  const {dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation("RemoveMonitoredEmail", inputVars, inputOpts);
}

export function getUser(dcOrOptions, options) {
  const {dc: dcInstance, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrOptions, options, undefined);
  dcInstance.useGen(true);
  return dcInstance.executeQuery("GetUser", undefined, inputOpts);
}

export function getUserVectorStatuses(dcOrOptions, options) {
  const {dc: dcInstance, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrOptions, options, undefined);
  dcInstance.useGen(true);
  return dcInstance.executeQuery("GetUserVectorStatuses", undefined, inputOpts);
}

export function getFindings(dcOrVarsOrOptions, varsOrOptions, options) {
  const {dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeQuery("GetFindings", inputVars, inputOpts);
}

export function getMonitoredEmails(dcOrOptions, options) {
  const {dc: dcInstance, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrOptions, options, undefined);
  dcInstance.useGen(true);
  return dcInstance.executeQuery("GetMonitoredEmails", undefined, inputOpts);
}

