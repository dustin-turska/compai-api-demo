export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'done' | 'blocked';
  createdAt: string;
  updatedAt: string;
}

export interface Attachment {
  id: string;
  entityId: string;
  entityType: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  createdAt: string;
  createdBy: string;
  downloadUrl?: string;
}

export interface UploadAttachmentRequest {
  fileName: string;
  fileType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' | 'application/pdf' | 'text/plain' | 'application/msword' | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  fileData: string; // Base64 encoded
  description?: string;
  createdBy: string; // User ID for attribution - try createdBy field
}

export interface Comment {
  id: string;
  content: string;
  author: {
    id: string;
    name: string;
    email: string;
  };
  attachments: Array<{
    id: string;
    name: string;
    type: string;
    downloadUrl: string;
    createdAt: string; // ISO string from API
  }>;
  createdAt: string; // ISO string from API
}

export interface CreateCommentRequest {
  content: string;
  entityId: string;
  entityType: 'task' | 'vendor' | 'risk' | 'policy';
  attachments?: Array<{
    fileName: string;
    fileType: string;
    fileData: string; // base64
  }>;
}

export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
}

export interface Member {
  id: string;
  organizationId: string;
  userId: string;
  role: 'admin' | 'member' | 'viewer';
  createdAt: string;
  department?: string;
  isActive: boolean;
  fleetDmLabelId?: number;
  user: User;
}

export interface PeopleResponse {
  data: Member[];
  count: number;
  authType: 'api-key' | 'session';
  authenticatedUser: {
    id: string;
    email: string;
  };
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export interface ContextEntry {
  id: string;
  organizationId: string;
  question: string;
  answer: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ContextResponse {
  data: ContextEntry[];
  count: number;
  authType: 'api-key' | 'session';
}

export interface ApiError {
  message: string;
  status: number;
}

// OpenAI Assessment Types
export interface OpenAIAssessmentRequest {
  contextEntries: ContextEntry[];
  controls: Array<{
    controlNumber: string;
    title: string;
    objective: string;
  }>;
}

export interface OpenAIAssessmentResult {
  controlNumber: string;
  isRequired: boolean;
  reason?: string;
}

export interface OpenAIAssessmentResponse {
  results: OpenAIAssessmentResult[];
  totalProcessed: number;
  processingTime: number;
}
