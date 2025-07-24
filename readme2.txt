/models/AssignmentInstance.ts

import { v4 as uuidv4 } from 'uuid';

interface PropertyDefinition {
  key: string;
}

export class AssignmentInstance {
  assignmentId: string;
  caseId: string;
  processId: string;
  assignmentKey: string;
  createdAt: Date;
  status: string;
  assignedTo: string;
  assignedToType: string;
  metadata: Record<string, any>;
  label:string;
  caseType:string

  constructor(caseId: string, processId: string, assignmentKey: string, schema: any, assignedTo?: string, assignedToType?:string) {
    this.assignmentId = `${assignmentKey}-${uuidv4()}`;
    this.caseId = caseId;
    const assignmentConfigs = schema.processes?.[processId]?.assignmentConfigs?.[assignmentKey];
    this.label = assignmentConfigs.label;
    // Determine assignment routing based on priority:
    // 1. If explicitly routed to current operator
    // 2. If explicit assignedTo and assignedToType are provided
    // 3. If schema defines routing type and destination
    // 4. Default fallback
    
    if (assignmentConfigs.routeTo === "current") {
      // Route to the current operator
      this.assignedToType = "Operator";
      this.assignedTo = assignedTo || "";
    }
    else if (assignedTo && assignedToType) {
      // Use explicitly provided assignment values
      this.assignedToType = assignedToType;
      this.assignedTo = assignedTo;
    }
    else if (assignmentConfigs.routeToType) {
      // Use schema-defined routing
      this.assignedToType = assignmentConfigs.routeToType;
      
      if (assignmentConfigs.routeToType === "WorkQueue") {
        // For WorkQueue, use the routeTo value from schema
        this.assignedTo = assignmentConfigs.routeTo || "Default";
      }
      else if (assignmentConfigs.routeToType === "Operator") {
        // For Operator, use the provided operator ID
        this.assignedTo = assignedTo || "";
      }
      else {
        // For any other type, use routeTo from schema or default
        this.assignedTo = assignmentConfigs.routeTo || "";
      }
    }
    else {
      // Default fallback when no routing is specified
      this.assignedToType = "WorkQueue";
      this.assignedTo = "Default";
    }
    this.caseType = schema.id;
    this.processId = processId;
    this.assignmentKey = assignmentKey;
    this.createdAt = new Date();
    this.metadata = {};
    this.status = schema.processes?.[processId]?.status;
    
    // Updated to use assignmentConfigs.properties based on the new schema structure
    const props = assignmentConfigs?.properties || [];
    props.forEach((prop: PropertyDefinition) => {
      this.metadata[prop.key] = prop;
    });
  }
}



models/CaseInstance.ts

import { v4 as uuidv4 } from 'uuid';
import { AssignmentInstance } from './AssignmentInstance.js';
import { getCaseTypeSchema } from '../utils/mockSchema.js';
import { saveAssignment } from '../services/assignmentService.js';

export class CaseInstance {
  caseId: string;
  caseTypeId: string;
  label: string;
  createdBy: string;
  updatedBy: string;
  updatedAt: Date;
  createdAt: Date;
  status: string
  currentAssignmentId: string;
  metadata: Record<string, any>;

  constructor(caseTypeId: string, userId: string) {
    const schema = getCaseTypeSchema(caseTypeId);
    if (!schema) throw new Error('Schema not found');
    this.caseTypeId = caseTypeId;
    this.label = schema.label;
    this.createdBy = userId;
    this.updatedBy = userId;
    this.updatedAt = new Date();
    this.createdAt = new Date();
    this.caseId = `${schema.rpl}-${uuidv4()}`;
    this.metadata = {};

    const firstProcess = Object.keys(schema.processes)[0];
    const firstAssignmentKey = schema.processes[firstProcess].assignments[0];
    const initialAssignment = new AssignmentInstance(this.caseId, firstProcess, firstAssignmentKey, schema, userId);
    this.status = initialAssignment.status;
    saveAssignment(initialAssignment);

    this.currentAssignmentId = initialAssignment.assignmentId;
  }
}


models/HistoryInstance.ts
import { v4 as uuidv4 } from 'uuid';

export class HistoryInstance {
  historyId: string;
  createdAt: Date;
  caseId: string;
  description: string;
  createdBy:string;

  constructor(caseId: string, description: string, createdBy:string) {
    this.historyId = uuidv4();
    this.createdAt = new Date();
    this.createdBy = createdBy;
    this.caseId = caseId;
    this.description = description;
  }
}

models/SessionInstance.ts
import { v4 as uuidv4 } from 'uuid';

export class HistoryInstance {
  historyId: string;
  createdAt: Date;
  caseId: string;
  description: string;
  createdBy:string;

  constructor(caseId: string, description: string, createdBy:string) {
    this.historyId = uuidv4();
    this.createdAt = new Date();
    this.createdBy = createdBy;
    this.caseId = caseId;
    this.description = description;
  }
}

/store/caseStore.ts
export const caseStore: Record<string, any> = {};
export const assignmentStore: Record<string, any> = {};
export const historyStore: Record<string, any> = {};
export const sessionStore: Record<string, any> = {};
export const credentialStore :Record<string, any> ={
     Kartik: {
        UserName: "Kartik Patel",
        WorkGroups: ["Commsec","CVC"],
        OperatorID: "Kartik",
        workQueues:["Default","Approval"],
        role: "User"
     },
     Manu:{
      UserName: "Manu",
      WorkGroups: ["Commsec"],
      OperatorID: "Manu",
      workQueues:["Default"],
      role: "User"
   },
   Agent:{
      UserName: "Agent",
      WorkGroups: ["Commsec"],
      OperatorID: "Agent",
      workQueues:["Default"],
      role:"User"
   },
   Admin:{
      UserName: "Admin",
      WorkGroups: ["Commsec"],
      OperatorID: "Admin",
      workQueues:["Default"],
      role:"Admin"
   }
}
export const workqueueStore :Record<string, any> ={
   Default: {
      label: "Default work queue",
      key: "Default",
      workGroup:""
   },
   Approval:{
      label: "Approval work queue",
      key: "Approval",
      workGroup : "Commsec"
 }
}

/types/fastify.d.ts
import 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    userId?: string;
  }
}

utils/idGenerator.ts
/**
 * Generates a unique ID string
 * @returns A unique ID string
 */
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

utils/mockSchema.ts
export const mockSchemas: Record<string, any> = {
  Commsec: {
    id:"Commsec",
    rpl: 'Commsec',
    resolvedStatus: 'Resolved',
    label: 'Commsec Conversions',
    processes: {
      process1: {
        assignments: ['A1', 'A2'],
        condition:"",
        assignmentConfigs:{
          A1:{
            routeTo : "current",
            routeToType : "Operator",
            label: "Capture buyer and seller",
            properties:[{ key: 'Buyer', label: "Buyer Account", type: "text", required: true }, { key: 'Seller', label: "Seller Account", type: "text", required: true }],
            condition:""
          },
          A2:{
            routeTo:"Default",
            routeToType : "WorkQueue",
            label:"Enter stock status",
            properties: [{ key: 'StockStatus', label: "Stock Status", value: "Pass", type: "text", required: true }],
            condition:""
          }
        },
        status: 'InProgress',
      },
      process2: {
        assignments: ['A3','A4'],
        condition:"",
        assignmentConfigs:{
          A3:{
            routeTo:"Approval",
            routeToType: "WorkQueue",
            properties: [{ key: 'ReviewComments', label: "Review Comments", type: "text", required: true }],
            condition:""
          },
          A4:{
            routeTo:"current",
            routeToType: "Operator",
            properties: [{ key: 'ClosureComments', label: "Closure Comments", type: "text", required: true }],
            condition:""
          }
        },
        status: "Review"
      }
    }
  },
  CVC: {
    id:"CVC",
    rpl: 'CVC',
    resolvedStatus: 'Resolved',
    label: 'Credit veriation Calculator',
    processes: {
      process1: {
        assignments: ['A1', 'A2'],
        condition:"",
        assignmentConfigs:{
          A1:{
            routeTo : "current",
            routeToType : "Operator",
            label: "Capture credit details",
            properties:[{ key: 'LoanNumber', label: "Loan Number", type: "number", required: true }, { key: 'SecurityID', label: "Security ID", type: "text", required: true }],
            condition:""
          },
          A2:{
            routeTo:"Default",
            routeToType : "WorkQueue",
            label:"Enter enquiry status",
            properties: [{ key: 'EnquiryStatus', label: "Enquiry Status", value: "", type: "text", required: true }],
            condition:""
          }
        },
        status: 'InProgress',
      },
      process2: {
        assignments: ['A3'],
        condition:"",
        assignmentConfigs:{
          A3:{
            routeTo:"Approval",
            routeToType: "WorkQueue",
            properties: [{ key: 'ReviewComments', label: "Review Comments", type: "text", required: true }]
          }
        },
        status: "Review"
      }
    }
  }
};

export const getCaseTypeSchema = (id: string) => mockSchemas[id];

export const updateCaseTypeSchema = (id: string, updatedSchema: any): boolean => {
  if (!mockSchemas[id]) {
    return false;
  }
  
  // Ensure the ID is preserved
  updatedSchema.id = id;
  
  // Update the schema
  mockSchemas[id] = updatedSchema;
  return true;
};

export const createCaseTypeSchema = (id: string, newSchema: any): boolean => {
  // Check if schema with this ID already exists
  if (mockSchemas[id]) {
    return false; // Schema already exists
  }
  
  // Ensure the ID is set
  newSchema.id = id;
  
  // Create the new schema
  mockSchemas[id] = newSchema;
  return true;
};

validators/assignmentValidators.ts
import { getOperatorById } from '../services/operatorServices.js';
import { getCaseSessions } from '../services/sessionService.js';

/**
 * Checks the status of an assignment to determine if a user can access it
 * @param assignment The assignment to check
 * @param userId The ID of the user trying to access the assignment
 * @returns An object with status information
 */
export const getAssignmentStatus = (assignment: any, userId: string): {
  canAccess: boolean;
  errorCode?: number;
  errorMessage?: string;
} => {
  // Check if assignment is assigned to a specific operator
  if (assignment.assignedToType === "Operator" && assignment.assignedTo !== "" && assignment.assignedTo !== userId) {
    return {
      canAccess: false,
      errorCode: 402,
      errorMessage: `Assignment is currently Assigned to ${assignment.assignedTo}`
    };
  }
  
  // Check if assignment is assigned to a work queue that the user doesn't have access to
  if (assignment.assignedToType === "WorkQueue" &&
      !getOperatorById(userId)?.workQueues.includes(assignment.assignedTo)) {
    return {
      canAccess: false,
      errorCode: 402,
      errorMessage: `Assignment is currently Assigned to ${assignment.assignedTo}`
    };
  }
  
  // Check if there are active sessions for this case
  const sessions = getCaseSessions(assignment.caseId);
  if (sessions.length > 0 && sessions[0].createdBy !== userId) {
    return {
      canAccess: false,
      errorCode: 402,
      errorMessage: `Case is currently worked on by ${sessions[0].createdBy}`
    };
  }
  
  // If all checks pass, the user can access the assignment
  return { canAccess: true };
};


app.ts
import cors from '@fastify/cors';
import Fastify from 'fastify';
import { assignmentRoutes } from './routes/assignmentRoutes.js';
import { caseRoutes } from './routes/caseRoutes.js';
import { historyRoutes } from './routes/historyRoutes.js';
import { operatorRoutes } from './routes/operatorRoutes.js';
import { sessionRoutes } from './routes/sessionRoutes.js';
import { getOperatorById } from './services/operatorServices.js';

const app = Fastify({ logger: false });

// Global hook to check for x-user-id header
app.addHook('onRequest', async (request, reply) => {
  // Skip header check for OPTIONS requests (for CORS)
  if (request.method === 'OPTIONS') {
    return;
  }
  
  const userIdHeader = request.headers['x-user-id'];
  if (!userIdHeader) {
    reply.status(401).send({ error: 'x-user-id header is required' });
    return reply;
  }
  
  // Handle case where header might be an array
  const userId = Array.isArray(userIdHeader) ? userIdHeader[0] : userIdHeader;
  const currentOperator = getOperatorById(userId);
  if(!currentOperator)  return reply.status(401).send({ error: 'Invalid User ID' });
  // Add userId to request for use in handlers
  request.userId = userId;
});

// Register CORS before routes
app.register(cors, {
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id']
});

app.register(caseRoutes);
app.register(assignmentRoutes);
app.register(operatorRoutes);
app.register(historyRoutes);
app.register(sessionRoutes);

app.listen({ port: 3000 }, (err, address) => {
  if (err) throw err;
  console.log(`Server running at ${address}`);
});

assignmnetHandlers.ts


import { FastifyReply, FastifyRequest } from 'fastify';
import { getAllAssignments, getAssignmentById, transferAssignment } from '../services/assignmentService.js';
import { createSession, getCaseSessions } from '../services/sessionService.js';
import { getOperatorById, getOperators, getWorkqueues } from '../services/operatorServices.js';
import { getAssignmentStatus } from '../validators/assignmentValidators.js';

export const getAssignmentHandler = async (req: FastifyRequest, reply: FastifyReply) => {
  const { assignmentId } = req.params as any;
  const assignment = getAssignmentById(assignmentId);
  
  if (!assignment) return reply.status(404).send({ error: 'Assignment not found' });
  
  // Check assignment status using the new service function
  const status = getAssignmentStatus(assignment, req.userId as string);
  
  if (!status.canAccess) {
    return reply.status(status.errorCode!).send({ error: status.errorMessage });
  }
  
  // If no active sessions exist, create one
  const sessions = getCaseSessions(assignment.caseId);
  if (sessions.length === 0) {
    createSession(assignment.caseId, req.userId as string);
  }
  
  reply.send(assignment);
};

export const transferAssignmentHandler = async (req: FastifyRequest, reply: FastifyReply) => {
  // Extract parameters from request
  const { assignmentId } = req.params as any;
  if (!assignmentId) {
    return reply.status(400).send({ error: 'assignmentId is required' });
  }
  
  // Extract and validate body parameters
  const { operatorId, routeToType } = req.body as any;
  
  // Validate required fields
  if (!operatorId) {
    return reply.status(400).send({ error: 'Operator ID is required' });
  }
  
  if (!routeToType) {
    return reply.status(400).send({ error: 'Route to type is required' });
  }
  
  // Validate route type and operator ID
  if (routeToType === "Operator") {
    const operator = await getOperatorById(operatorId);
    if(!operator) return reply.status(400).send({ error: 'Invalid Operator.' });
    // Validate operator ID against available operators
  } else if (routeToType === "WorkQueue") {
    // Validate work queue ID against available work queues
    const allWorkQueues = await getOperatorById(req.userId as string).workQueues;
    if (!allWorkQueues.includes(operatorId)) {
      return reply.status(400).send({ error: 'Invalid WorkQueue.' });
    }
  } else {
    // Invalid route type
    return reply.status(400).send({
      error: 'Route to type can either be Operator or WorkQueue'
    });
  }
  
  // Use the service function to handle the transfer
  const updatedAssignment = transferAssignment(
    assignmentId,
    operatorId,
    routeToType,
    req.userId as string
  );
  
  // Handle case where assignment is not found
  if (!updatedAssignment) {
    return reply.status(404).send({ error: 'Assignment not found' });
  }
  
  // Return the updated assignment
  reply.send(updatedAssignment);
}

export const getAssignmentsHandler = async (req: FastifyRequest, reply: FastifyReply) => {
  const assignments= getAllAssignments();
  const userAssignments = assignments.filter((assignment)=>req.userId===assignment.assignedTo);
  reply.send(userAssignments);
};


export const getWorkQueueAssignmentsHandler = async (req: FastifyRequest, reply: FastifyReply) => {
  const assignments= getAllAssignments();
  const { assignedTo } = req.params as any;
  const workQueueAssignments = assignments.filter((assignment)=>assignment.assignedTo===assignedTo && assignment.assignedToType == "WorkQueue");
  reply.send(workQueueAssignments);
};



caseHandlers.ts

import { FastifyReply, FastifyRequest } from 'fastify';
import { AssignmentInstance } from '../models/AssignmentInstance.js';
import { CaseInstance } from '../models/CaseInstance.js';
import { deleteAssignment, getAssignmentById, saveAssignment } from '../services/assignmentService.js';
import { getAssignmentStatus } from '../validators/assignmentValidators.js';
import { closeCase, createCaseSchema, getCaseById, getCases, getCaseTypeIDs, saveCase, updateCaseSchema } from '../services/caseService.js';
import { createHistory } from '../services/historyService.js';
import { getOperatorById, isOperatorAdmin } from '../services/operatorServices.js';
import { deleteSession, getCaseSessions } from '../services/sessionService.js';
import { getCaseTypeSchema } from '../utils/mockSchema.js';

export const createCaseHandler = async (req: FastifyRequest, reply: FastifyReply) => {
  const { caseTypeId } = req.body as any;
  const currentOperator = getOperatorById(req.userId as string);
  if(!currentOperator.WorkGroups.includes(caseTypeId))  return reply.status(400).send({ error: 'You is not allowed to create this case.' });

  if (!caseTypeId) {
    return reply.status(400).send({ error: 'caseTypeId is required' });
  }
  const userId = req.userId as string;
  const caseInstance = new CaseInstance(caseTypeId, userId);
  createHistory(caseInstance.caseId, `New case created by: ${req.userId}`, req.userId as string);
  
  saveCase(caseInstance);
  reply.send(caseInstance);
};

export const nextHandler = async (req: FastifyRequest, reply: FastifyReply) => {
  const caseId = (req.params as any).caseId;
  const updates = req.body as Record<string, any>;
  const currentCase = getCaseById(caseId);

  if (!currentCase) return reply.status(400).send({ error: 'Case not found' });

  const currentAssignment = getAssignmentById(currentCase.currentAssignmentId);
  if (!currentAssignment) return reply.status(400).send({ error: 'Assignment not found' });
  const status = getAssignmentStatus(currentAssignment, req.userId as string);
        
        if (!status.canAccess) {
            return reply.status(status.errorCode as number).send({ error: status.errorMessage });
        }
  Object.assign(currentCase.metadata, updates);
  const schema = getCaseTypeSchema(currentCase.caseTypeId);
  const { processId, assignmentKey } = currentAssignment;

  // Helper function to evaluate condition
  const evaluateCondition = (condition: string): boolean => {
    if (!condition) return true; // If no condition is specified, it's always true
    try {
      // Create a safe evaluation context with access to the currentCase
      const evalContext = { currentCase };
      // Use Function constructor to create a function that evaluates the condition
      // This is safer than using eval() directly
      const evalFunc = new Function('context', `with(context) { return ${condition}; }`);
      return evalFunc(evalContext);
    } catch (error) {
      console.error(`Error evaluating condition: ${condition}`, error);
      return false; // If there's an error evaluating, treat as false
    }
  };

  // Find next valid assignment in current process
  const processAssignments = schema.processes[processId]?.assignments || [];
  let nextIndex = processAssignments.indexOf(assignmentKey) + 1;
  let nextAssignmentKey = null;
  let nextProcessId = processId;

  // Check assignments in current process
  while (nextIndex < processAssignments.length) {
    const candidateAssignmentKey = processAssignments[nextIndex];
    const assignmentCondition = schema.processes[processId].assignmentConfigs[candidateAssignmentKey]?.condition;
    
    if (evaluateCondition(assignmentCondition)) {
      nextAssignmentKey = candidateAssignmentKey;
      break;
    }else{
      createHistory(currentCase.caseId, `Case assignment skipped: ${candidateAssignmentKey}`, req.userId as string);
    }
    nextIndex++;
  }

  // If no valid assignment found in current process, look for next valid process
  if (!nextAssignmentKey) {
    const processIds = Object.keys(schema.processes);
    let nextProcessIdx = processIds.indexOf(processId) + 1;
    
    while (nextProcessIdx < processIds.length) {
      const candidateProcessId = processIds[nextProcessIdx];
      const processCondition = schema.processes[candidateProcessId]?.condition;
      
      if (evaluateCondition(processCondition)) {
        nextProcessId = candidateProcessId;
        
        // Find first valid assignment in the next process
        const nextProcessAssignments = schema.processes[nextProcessId]?.assignments || [];
        let assignmentIdx = 0;
        
        while (assignmentIdx < nextProcessAssignments.length) {
          const candidateAssignmentKey = nextProcessAssignments[assignmentIdx];
          const assignmentCondition = schema.processes[nextProcessId].assignmentConfigs[candidateAssignmentKey]?.condition;
          
          if (evaluateCondition(assignmentCondition)) {
            nextAssignmentKey = candidateAssignmentKey;
            break;
          }else{
            createHistory(currentCase.caseId, `Case assignment skipped: ${candidateAssignmentKey}`, req.userId as string);
          }
          assignmentIdx++;
        }
        
        if (nextAssignmentKey) break; // Found valid assignment in this process
      }else{
        createHistory(currentCase.caseId, `Case process skipped: ${candidateProcessId}`, req.userId as string);
      }
      
      nextProcessIdx++;
    }
    
    // If no valid process/assignment found, case is resolved
    if (!nextAssignmentKey) {
      currentCase.currentAssignmentId = null;
      currentCase.status = schema.resolvedStatus;
      currentCase.updatedBy = req.userId as string;
      createHistory(currentCase.caseId, `Case resolved by: ${req.userId}`, req.userId as string);
    }
  }

  deleteAssignment(currentAssignment.assignmentId);
  if (nextAssignmentKey && nextProcessId) {
    // Pass "Operator" as the assignedToType parameter
    const newAssignment = new AssignmentInstance(currentCase.caseId, nextProcessId, nextAssignmentKey, schema, req.userId as string, "");
    saveAssignment(newAssignment);
    currentCase.status = newAssignment.status;
    currentCase.updatedAt = new Date();
    currentCase.updatedBy = req.userId as string;
    currentCase.currentAssignmentId = newAssignment.assignmentId;
    createHistory(currentCase.caseId, `Case moved forward by: ${req.userId}`, req.userId as string);
    // Save the updated case back to the store
    saveCase(currentCase);
  }
deleteSession(currentCase.caseId,req.userId as string);
reply.send(currentCase);
};

export const previousHandler = async (req: FastifyRequest, reply: FastifyReply) => {
  const caseId = (req.params as any).caseId;
  const currentCase = getCaseById(caseId);
  if (!currentCase) return reply.status(400).send({ error: 'Case not found' });

  const currentAssignment = getAssignmentById(currentCase.currentAssignmentId);

  if (!currentAssignment) return reply.status(400).send({ error: 'Assignment not found' });
  const status = getAssignmentStatus(currentAssignment, req.userId as string);
        
        if (!status.canAccess) {
            return reply.status(status.errorCode as number).send({ error: status.errorMessage });
        }

  const schema = getCaseTypeSchema(currentCase.caseTypeId);
  const { processId, assignmentKey } = currentAssignment;
  
  // Helper function to evaluate condition
  const evaluateCondition = (condition: string): boolean => {
    if (!condition) return true; // If no condition is specified, it's always true
    try {
      // Create a safe evaluation context with access to the currentCase
      const evalContext = { currentCase };
      // Use Function constructor to create a function that evaluates the condition
      // This is safer than using eval() directly
      const evalFunc = new Function('context', `with(context) { return ${condition}; }`);
      return evalFunc(evalContext);
    } catch (error) {
      console.error(`Error evaluating condition: ${condition}`, error);
      return false; // If there's an error evaluating, treat as false
    }
  };
  
  const processAssignments = schema.processes[processId]?.assignments || [];
  const currentIdx = processAssignments.indexOf(assignmentKey);
  
  // Find previous valid assignment in current process
  let previousIdx = currentIdx - 1;
  let previousAssignmentKey = null;
  let previousProcessId = processId;
  
  // Check assignments in current process
  while (previousIdx >= 0) {
    const candidateAssignmentKey = processAssignments[previousIdx];
    const assignmentCondition = schema.processes[processId].assignmentConfigs[candidateAssignmentKey]?.condition;
    
    if (evaluateCondition(assignmentCondition)) {
      previousAssignmentKey = candidateAssignmentKey;
      break;
    }else{
      createHistory(currentCase.caseId, `Case assignment skipped: ${candidateAssignmentKey}`, req.userId as string);
    }
    previousIdx--;
  }
  
  // If no valid assignment found in current process, look for previous valid process
  if (!previousAssignmentKey) {
    const processIds = Object.keys(schema.processes);
    let previousProcessIdx = processIds.indexOf(processId) - 1;
    
    while (previousProcessIdx >= 0) {
      const candidateProcessId = processIds[previousProcessIdx];
      const processCondition = schema.processes[candidateProcessId]?.condition;
      
      if (evaluateCondition(processCondition)) {
        previousProcessId = candidateProcessId;
        
        // Find last valid assignment in the previous process
        const prevProcessAssignments = schema.processes[previousProcessId]?.assignments || [];
        let assignmentIdx = prevProcessAssignments.length - 1;
        
        while (assignmentIdx >= 0) {
          const candidateAssignmentKey = prevProcessAssignments[assignmentIdx];
          const assignmentCondition = schema.processes[previousProcessId].assignmentConfigs[candidateAssignmentKey]?.condition;
          
          if (evaluateCondition(assignmentCondition)) {
            previousAssignmentKey = candidateAssignmentKey;
            break;
          }else{
            createHistory(currentCase.caseId, `Case assignment skipped: ${candidateAssignmentKey}`, req.userId as string);
          }
          assignmentIdx--;
        }
        
        if (previousAssignmentKey) break; // Found valid assignment in this process
      }else{
        createHistory(currentCase.caseId, `Case process skipped: ${candidateProcessId}`, req.userId as string);
      }
      
      previousProcessIdx--;
    }
  }

  if (previousAssignmentKey && previousProcessId) {
    // Pass "Operator" as the assignedToType parameter
    const newAssignment = new AssignmentInstance(currentCase.caseId, previousProcessId, previousAssignmentKey, schema, req.userId as string, "");
    saveAssignment(newAssignment);
    currentCase.status = newAssignment.status;
    currentCase.updatedAt = new Date();
    currentCase.updatedBy = req.userId as string;
    currentCase.currentAssignmentId = newAssignment.assignmentId;
    deleteAssignment(currentAssignment.assignmentId);
    createHistory(currentCase.caseId, `Case moved backward by: ${req.userId}`, req.userId as string);
    // Save the updated case back to the store
    saveCase(currentCase);
  }
  deleteSession(currentCase.caseId,req.userId as string);
  reply.send(currentCase);
};
export const getAllCasesHandler = async (req: FastifyRequest, reply: FastifyReply) => {
  const currentOperator = getOperatorById(req.userId as string);
  if(!currentOperator) return reply.status(400).send({ error: 'Invalid request operator.' });
  const cases = await getCases();
  const operatorCases = cases.filter(caseDetails =>
    currentOperator.WorkGroups.some((workGroup: string) => workGroup === caseDetails.caseTypeId)
  );
  reply.send(operatorCases);

};

export const saveHandler = async (req: FastifyRequest, reply: FastifyReply) => {
  const caseId = (req.params as any).caseId;
  const updates = req.body as Record<string, any>;
  const currentCase = getCaseById(caseId);
  if (!currentCase) return reply.status(400).send({ error: 'Case not found' });
  const currentAssignment = getAssignmentById(currentCase.currentAssignmentId);

  if (!currentAssignment) return reply.status(400).send({ error: 'Assignment not found' });
  const status = getAssignmentStatus(currentAssignment, req.userId as string);
        
        if (!status.canAccess) {
            return reply.status(status.errorCode as number).send({ error: status.errorMessage });
        }
  Object.assign(currentCase.metadata, updates);
  saveCase(currentCase);
  createHistory(currentCase.caseId, `Case details saved by: ${req.userId}`, req.userId as string);
  reply.send(currentCase);
}




export const getCaseHandler = async (req: FastifyRequest, reply: FastifyReply) => {
  const caseId = (req.params as any).caseId;
  if (!caseId) return reply.status(400).send({ error: 'caseId is required' });
  const caseDetails = getCaseById(caseId);
  if (!caseDetails) return reply.status(400).send({ error: 'Case not found!' });
  
  const currentOperator = getOperatorById(req.userId as string);
  if(!currentOperator.WorkGroups.includes(caseDetails.caseTypeId))  return reply.status(400).send({ error: 'You is not allowed to access this case.' });
  
  reply.send(getCaseById(caseId));
}

export const getCaseTypesHandler = async (req: FastifyRequest, reply: FastifyReply) => {
  const currentOperator = getOperatorById(req.userId as string);
  if(!currentOperator) return reply.status(400).send({ error: 'Invalid request operator.' });
  const allCasetypes = await getCaseTypeIDs();
  const operatorCaseTypes = allCasetypes.filter(caseType =>
    currentOperator.WorkGroups.some((workGroup: string) => workGroup === caseType));
  reply.send(operatorCaseTypes);
}

export const closeCaseHandler = async (req: FastifyRequest, reply: FastifyReply) => {
  const currentOperator = getOperatorById(req.userId as string);
  const {caseId} = req.body as any;
  
  // Check if there are any sessions for this case
  const sessions = getCaseSessions(caseId);
  
  if (sessions.length > 0) {
    // If there's an active session and it's not created by the current user, return an error
    if (sessions[0].createdBy !== req.userId) {
      return reply.status(402).send({ error: `Case is currently assigned to ${sessions[0].createdBy}` });
    }
  }
  
  // Delete the session
  const closedSession = closeCase(caseId, req.userId as string);
  
  reply.send({ status: closedSession });
}

export const getCaseTypeSchemaHandler = async (req: FastifyRequest, reply: FastifyReply) => {
  const schemaID = (req.params as any).schemaID;
  
  if (!schemaID) {
    return reply.status(400).send({ error: 'schemaID is required' });
  }
  
  const schema = getCaseTypeSchema(schemaID);
  
  if (!schema) {
    return reply.status(404).send({ error: 'Case type schema not found' });
  }
  
  reply.send(schema);
};

export const postCaseTypeSchemaHandler = async (req: FastifyRequest, reply: FastifyReply) => {
  if(!isOperatorAdmin(req.userId as string)) return reply.status(401).send({ error: 'Admin access is required.' });
  const schemaID = (req.params as any).schemaID;
  const schemaData = req.body as any;
  
  if (!schemaID) {
    return reply.status(400).send({ error: 'schemaID is required' });
  }
  
  if (!schemaData) {
    return reply.status(400).send({ error: 'Schema data is required' });
  }
  
  const success = updateCaseSchema(schemaID, schemaData);
  
  if (!success) {
    return reply.status(404).send({ error: 'Case type schema not found' });
  }
  
  // Return the updated schema
  const updatedSchema = getCaseTypeSchema(schemaID);
  reply.send(updatedSchema);
};

export const addCaseTypeSchemaHandler = async (req: FastifyRequest, reply: FastifyReply) => {
  if(!isOperatorAdmin(req.userId as string)) return reply.status(401).send({ error: 'Admin access is required.' });
  const schemaID = (req.body as any).id;
  const schemaData = req.body as any;
  
  if (!schemaID) {
    return reply.status(400).send({ error: 'schemaID is required' });
  }
  
  if (!schemaData) {
    return reply.status(400).send({ error: 'Schema data is required' });
  }
  
  // Check if schema already exists
  const existingSchema = getCaseTypeSchema(schemaID);
  if (existingSchema) {
    return reply.status(409).send({ error: 'Case type schema already exists' });
  }
  
  const success = createCaseSchema(schemaID, schemaData);
  
  if (!success) {
    return reply.status(500).send({ error: 'Failed to create case type schema' });
  }
  
  // Return the newly created schema
  const newSchema = getCaseTypeSchema(schemaID);
  reply.status(201).send(newSchema);
};

assignmentServices.ts

import { assignmentStore } from '../store/caseStore.js';
import { deleteSession } from './sessionService.js';
import { createHistory } from './historyService.js';

export const saveAssignment = (assignment: any) => assignmentStore[assignment.assignmentId] = assignment;
export const getAssignmentById = (id: string) => assignmentStore[id];
export const getAllAssignments = () => Object.values(assignmentStore).map(entry => entry);
export const deleteAssignment = (assignmentId: string) => delete assignmentStore[assignmentId];

export const transferAssignment = (assignmentId: string, operatorId: string, routeToType: string, userId: string): any => {
  const assignment = getAssignmentById(assignmentId);
  
  if (!assignment) {
    return null;
  }
  
  // Update assignment details
  assignment.assignedTo = operatorId;
  assignment.assignedToType = routeToType;
  
  // Create history record
  createHistory(assignment.caseId, `Case transferred to ${operatorId} by : ${userId}`, userId);
  
  // Save the updated assignment
  saveAssignment(assignment);
  
  // Delete the session
  deleteSession(assignment.caseId, userId);
  
  return assignment;
};

caseService.ts

import { caseStore } from '../store/caseStore.js';
import { mockSchemas, updateCaseTypeSchema, createCaseTypeSchema } from '../utils/mockSchema.js';
import { deleteSession } from './sessionService.js';
export const saveCase = (caseObj: any) => caseStore[caseObj.caseId] = caseObj;
export const getCaseById = (id: string) => caseStore[id];
export const getCases = () => Object.values(caseStore).map(entry => entry);
export const getCaseTypeIDs = (): string[] => Object.keys(mockSchemas);
export const closeCase = (caseId: string, userId: string): boolean => {
    return deleteSession(caseId, userId);
  };

export const updateCaseSchema = (schemaId: string, schemaData: any): boolean => {
  return updateCaseTypeSchema(schemaId, schemaData);
};

export const createCaseSchema = (schemaId: string, schemaData: any): boolean => {
  return createCaseTypeSchema(schemaId, schemaData);
};

SessionService.ts


import { sessionStore } from '../store/caseStore.js';
import { SessionInstance } from '../models/SessionInstance.js';

/**
 * Creates a new session record and saves it to the session store
 * @param caseId The ID of the case
 * @param createdBy Who created the session
 * @returns The created session instance
 */
export const createSession = (caseId: string, createdBy: string): SessionInstance => {
  // Check if a session already exists for this user and case
  const existingSessions = Object.values(sessionStore)
    .filter((session: any) => session.caseId === caseId && session.createdBy === createdBy);
  
  // If a session already exists, return the existing session
  if (existingSessions.length > 0) {
    return existingSessions[0] as SessionInstance;
  }
  
  // Otherwise, create a new session
  const sessionInstance = new SessionInstance(caseId, createdBy);
  sessionStore[sessionInstance.sessionId] = sessionInstance;
  return sessionInstance;
};

/**
 * Gets all session records for a specific case
 * @param caseId The ID of the case
 * @returns Array of session instances for the specified case
 */
export const getCaseSessions = (caseId: string): SessionInstance[] => {
  return Object.values(sessionStore)
    .filter((session: any) => session.caseId === caseId)
    .map((entry: any) => entry);
};

/**
 * Gets all session records created by a specific user
 * @param userId The ID of the user
 * @returns Array of session instances created by the specified user
 */
export const getUserSessions = (userId: string): SessionInstance[] => {
  return Object.values(sessionStore)
    .filter((session: any) => session.createdBy === userId)
    .map((entry: any) => entry);
};

/**
 * Deletes a session for a specific case and user
 * @param caseId The ID of the case
 * @param userId The ID of the user
 * @returns Boolean indicating whether the deletion was successful
 */
export const deleteSession = (caseId: string, userId: string): boolean => {
  const sessions = Object.entries(sessionStore)
    .filter(([_, session]: [string, any]) =>
      session.caseId === caseId && session.createdBy === userId);
  
  if (sessions.length === 0) {
    return false;
  }
  
  // Delete all matching sessions
  sessions.forEach(([sessionId, _]) => {
    delete sessionStore[sessionId];
  });
  
  return true;
};
