import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Debo ERP API",
      version: "1.0.0",
      description: "API documentation for Debo ERP backend",
    },
    servers: [
      {
        url: "http://localhost:5000/api", // change in production
        description: "Local server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      
    },
    schemas: {
        AttendanceStatus: {
          type: 'string',
          enum: ['PRESENT', 'LATE', 'PERMISSION', 'LEAVE', 'ABSENT'],
          default: 'ABSENT'
        },
        Attendance: {
          type: 'object',
          properties: {
            id: { type: 'string', readOnly: true },
            userId: { type: 'string', nullable: true },
            employeeId: { type: 'string', nullable: true },
            timestamp: { type: 'string', format: 'date-time' },
            status: { $ref: '#/components/schemas/AttendanceStatus' },
            gps_latitude: { type: 'number', format: 'float', nullable: true },
            // ... all other fields
          }
        }
      
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  // Tell swagger-jsdoc where to look for API docs
  apis: ["./src/routes/*.js"], // this will scan all your route files
};

export const swaggerSpec = swaggerJSDoc(options);
export { swaggerUi };
