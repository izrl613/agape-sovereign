/**
 * Firebase Functions entry point.
 */
import { setGlobalOptions } from "firebase-functions";

setGlobalOptions({ maxInstances: 10 });

export {
  requestArchitectScan,
  askArchitectAI,
  requestDiffReport,
} from "./architect-ai-scaffold";
