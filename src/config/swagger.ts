import swaggerUi from 'swagger-ui-express';
import { env } from './env';

export const openApiDocument = {
  openapi: '3.1.0',
  info: {
    title: 'TreeO2 Backend API',
    version: '1.0.0',
    description: 'Starter OpenAPI spec for the TreeO2 backend scaffold.',
  },
  servers: [{ url: env.API_PREFIX }],
  tags: [
    { name: 'Health', description: 'Service health and readiness endpoints' },
    { name: 'Auth', description: 'Authentication and token lifecycle endpoints' },
    { name: 'Users', description: 'User management endpoints' },
    { name: 'Projects', description: 'Project management endpoints' },
    { name: 'Reports', description: 'Report generation and retrieval endpoints' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      ApiResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' },
          data: { type: 'object', nullable: true },
        },
        required: ['success'],
      },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        responses: {
          '200': {
            description: 'Service is healthy',
          },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login scaffold endpoint',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 8 },
                },
                required: ['email', 'password'],
              },
            },
          },
        },
        responses: {
          '501': {
            description: 'Login scaffolding exists but real credential verification is not implemented yet',
          },
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Return current authenticated user',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Authenticated user payload',
          },
          '401': {
            description: 'Authentication required',
          },
        },
      },
    },
    '/users': {
      get: {
        tags: ['Users'],
        summary: 'Users module placeholder route',
        responses: {
          '200': {
            description: 'Users module scaffold response',
          },
        },
      },
    },
    '/projects': {
      get: {
        tags: ['Projects'],
        summary: 'Projects module placeholder route',
        responses: {
          '200': {
            description: 'Projects module scaffold response',
          },
        },
      },
    },
    '/reports': {
      get: {
        tags: ['Reports'],
        summary: 'Reports module placeholder route',
        responses: {
          '200': {
            description: 'Reports module scaffold response',
          },
        },
      },
    },
  },
};

export const swaggerMiddleware = [swaggerUi.serve, swaggerUi.setup(openApiDocument)] as const;
