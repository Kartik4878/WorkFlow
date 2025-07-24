# WorkFlowCore Project Code

This file contains all the code from the WorkFlowCore project with file paths clearly commented.

## Routes

// ===== src/routes/assignmentRoutes.ts =====
import { FastifyPluginAsync } from 'fastify';
import { getAssignmentHandler, getAssignmentsHandler, getWorkQueueAssignmentsHandler, transferAssignmentHandler } from '../handlers/assignmentHandlers.js';

export const assignmentRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/assignments', getAssignmentsHandler);
  fastify.get('/assignments/workqueue/:assignedTo', getWorkQueueAssignmentsHandler);
  fastify.get('/assignments/:assignmentId', getAssignmentHandler);
  fastify.post('/assignments/:assignmentId/transfer', transferAssignmentHandler);
};

// ===== src/routes/caseRoutes.ts =====
import { FastifyPluginAsync } from 'fastify';
import {
    createCaseHandler,
    nextHandler,
    previousHandler,
    getAllCasesHandler,
    getCaseHandler,
    getCaseTypesHandler,
    saveHandler,
    closeCaseHandler,
    getCaseTypeSchemaHandler,
    postCaseTypeSchemaHandler,
    addCaseTypeSchemaHandler
} from '../handlers/caseHandlers.js';

export const caseRoutes: FastifyPluginAsync = async (fastify) => {
    // Case collection endpoints
    fastify.get('/cases', getAllCasesHandler);
    fastify.post('/cases', createCaseHandler);
    fastify.post('/cases/close', closeCaseHandler);
    
    // Case type endpoints
    fastify.get('/cases/types', getCaseTypesHandler);
    fastify.post('/cases/types', addCaseTypeSchemaHandler);
    fastify.get('/cases/types/:schemaID', getCaseTypeSchemaHandler);
    fastify.put('/cases/types/:schemaID', postCaseTypeSchemaHandler);
    
    // Individual case endpoints
    fastify.get('/cases/:caseId', getCaseHandler);
    fastify.post('/cases/:caseId/next', nextHandler);
    fastify.post('/cases/:caseId/previous', previousHandler);
    fastify.post('/cases/:caseId/save', saveHandler);
};

// ===== src/routes/historyRoutes.ts =====
import { FastifyPluginAsync } from 'fastify';
import {
    createHistoryHandler,
    getCaseHistoryHandler
} from '../handlers/historyHandlers.js';

export const historyRoutes: FastifyPluginAsync = async (fastify) => {
    // Create a new history record
    fastify.post('/history', createHistoryHandler);
    
    // Get history records for a specific case
    fastify.get('/history/:caseId', getCaseHistoryHandler);
};

// ===== src/routes/operatorRoutes.ts =====
import { FastifyPluginAsync } from 'fastify';
import {
    getAllOperatorsHandler,
    getAllWorkQueuesHandler,
    getOperatorHandler,
    updateOperatorHandler
} from '../handlers/operatorHandler.js';


export const operatorRoutes: FastifyPluginAsync = async (fastify) => {
    fastify.get('/operators', getAllOperatorsHandler);
    fastify.get('/operators/operator', getOperatorHandler);
    fastify.get('/operators/workqueues', getAllWorkQueuesHandler);
    fastify.put('/operators/:operatorId', updateOperatorHandler);
};

// ===== src/routes/sessionRoutes.ts =====
import { FastifyPluginAsync } from 'fastify';
import { getSessionsHandler } from '../handlers/sessionHandlers.js';

export const sessionRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/sessions', getSessionsHandler);
};

## Handlers

// ===== src/handlers/historyHandlers.ts =====
import { FastifyRequest, FastifyReply } from 'fastify';
import { createHistory, getCaseHistory } from '../services/historyService.js';

/**
 * Handler for creating a new history record
 * POST /history
 */
export const createHistoryHandler = async (req: FastifyRequest, reply: FastifyReply) => {
  const { caseId, description} = req.body as any;
  const createdBy = req.userId as string;
  // Validate required fields
  if (!caseId) {
    return reply.status(400).send({ error: 'caseId is required' });
  }
  
  if (!description) {
    return reply.status(400).send({ error: 'description is required' });
  }

  if (!createdBy) {
    return reply.status(400).send({ error: 'createdBy is required' });
  }

  // Create history record
  const historyInstance = createHistory(caseId, description, createdBy);
  
  reply.send(historyInstance);
};

/**
 * Handler for getting history records for a specific case
 * GET /history/:caseId
 */
export const getCaseHistoryHandler = async (req: FastifyRequest, reply: FastifyReply) => {
  const caseId = (req.params as any).caseId;
  
  if (!caseId) {
    return reply.status(400).send({ error: 'caseId is required' });
  }
  
  const historyItems = getCaseHistory(caseId);
  reply.send(historyItems);
};

// ===== src/handlers/operatorHandler.ts =====
import { FastifyReply, FastifyRequest } from "fastify";
import { getOperatorById, getOperators, getWorkqueues, isOperatorAdmin, updateOperator } from "../services/operatorServices.js";
import { getCaseTypeIDs } from "../services/caseService.js";

export const getOperatorHandler = async (req: FastifyRequest, reply: FastifyReply) => {
    const operatorId = req.userId as string;
    if (!operatorId) return reply.status(400).send({ error: 'Operator ID is required' });
    const operatorDetails = getOperatorById(operatorId);
    if (!operatorDetails) return reply.status(400).send({ error: 'Operator not found!' });
    reply.send(operatorDetails);
  }

export const getAllOperatorsHandler = async (req: FastifyRequest, reply: FastifyReply) => {
  const operators = await getOperators();
  reply.send(operators);
};

export const getAllWorkQueuesHandler = async (req: FastifyRequest, reply: FastifyReply) => {
  const workQueues = await getWorkqueues();
  reply.send(workQueues);
};

export const updateOperatorHandler = async (req: FastifyRequest, reply: FastifyReply) => {
  // Check if the user has admin privileges
  if (!isOperatorAdmin(req.userId as string)) {
    return reply.status(401).send({ error: 'Admin access is required.' });
  }

  // Extract parameters and body data
  const operatorId = (req.params as any).operatorId;
  const operatorData = req.body as any;
  
  // Validate required fields
  if (!operatorId) {
    return reply.status(400).send({ error: 'Operator ID is required' });
  }
  
  if (!operatorData) {
    return reply.status(400).send({ error: 'Operator data is required' });
  }
  
  // Ensure the OperatorID in the data matches the URL parameter
  if (operatorData.OperatorID !== operatorId) {
    return reply.status(400).send({ error: 'Operator ID in data does not match URL parameter' });
  }

  // Validate work queues
  if (operatorData.workQueues && Array.isArray(operatorData.workQueues)) {
    const workQueues = await getWorkqueues();
    
    // Check if all provided work queues are valid
    const invalidWorkQueue = operatorData.workQueues.find((queue: string) =>
      !workQueues.some(workQueue => workQueue.key === queue)
    );
    
    if (invalidWorkQueue) {
      return reply.status(404).send({
        error: `Invalid Work Queue: ${invalidWorkQueue}`
      });
    }
  }

  // Validate work groups
  if (operatorData.workGroups && Array.isArray(operatorData.workGroups)) {
    const workGroups = await getCaseTypeIDs();
    
    // Check if all provided work groups are valid
    const invalidWorkGroup = operatorData.workGroups.find((workGroup: string) =>
      !workGroups.includes(workGroup)
    );
    
    if (invalidWorkGroup) {
      return reply.status(404).send({
        error: `Invalid Work Group: ${invalidWorkGroup}`
      });
    }
  }

  // Update the operator
  const success = updateOperator(operatorId, operatorData);
  
  if (!success) {
    return reply.status(404).send({ error: 'Operator not found' });
  }
  
  // Return the updated operator
  const updatedOperator = getOperatorById(operatorId);
  reply.send(updatedOperator);
};

// ===== src/handlers/sessionHandlers.ts =====
import { FastifyRequest, FastifyReply } from 'fastify';
import { getUserSessions } from '../services/sessionService.js';

/**
 * Handler to get all sessions for the current user
 * @param req The Fastify request object
 * @param reply The Fastify reply object
 */
export const getSessionsHandler = async (req: FastifyRequest, reply: FastifyReply) => {
  const userId = req.userId as string;
  const sessions = getUserSessions(userId);
  reply.send(sessions);
};
