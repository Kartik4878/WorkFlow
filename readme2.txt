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

