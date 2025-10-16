import { Task, ApiResponse, Attachment, UploadAttachmentRequest, Comment, CreateCommentRequest, PeopleResponse, ContextResponse, ContextEntry } from './types';
import { maskHeaders, maskBody } from './utils';

const API_BASE_URL = process.env.NEXT_PUBLIC_COMPAI_API_URL || 'https://api.trycomp.ai/v1';
const API_KEY = process.env.NEXT_PUBLIC_COMPAI_API_KEY;
const ORGANIZATION_ID = process.env.NEXT_PUBLIC_COMPAI_ORGANIZATION_ID;

// Always use real API - no demo mode
const isDemoMode = false;

class CompAIClient {
  private baseUrl: string;
  private apiKey: string;
  private organizationId?: string;

  constructor(baseUrl: string = API_BASE_URL, apiKey?: string, organizationId?: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey || API_KEY || '';
    this.organizationId = organizationId || ORGANIZATION_ID;
  }

  private getHeaders(userId?: string): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'X-API-Key': this.apiKey,
    };

    if (this.organizationId) {
      headers['X-Organization-Id'] = this.organizationId;
    }

    // Try adding user ID as header if provided
    if (userId) {
      headers['X-User-Id'] = userId;
      headers['X-Author-Id'] = userId;
      headers['User-Id'] = userId;
    }

    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorJson.error || errorMessage;
      } catch {
        // If it's not JSON, use the text as the error message
        errorMessage = errorText || errorMessage;
      }

      return {
        error: errorMessage
      };
    }

    try {
      const data = await response.json();
      return { data };
    } catch {
      return {
        error: 'Failed to parse response JSON'
      };
    }
  }

  async getTasks(): Promise<ApiResponse<Task[]>> {
    try {
      const response = await fetch(`${this.baseUrl}/tasks`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      return await this.handleResponse<Task[]>(response);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Network error occurred'
      };
    }
  }

  async getTask(taskId: string): Promise<ApiResponse<Task>> {
    try {
      const response = await fetch(`${this.baseUrl}/tasks/${taskId}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      return await this.handleResponse<Task>(response);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Network error occurred'
      };
    }
  }

  async getTaskAttachments(taskId: string): Promise<ApiResponse<Attachment[]>> {
    try {
      const response = await fetch(`${this.baseUrl}/tasks/${taskId}/attachments`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      return await this.handleResponse<Attachment[]>(response);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Network error occurred'
      };
    }
  }

  async uploadTaskAttachment(taskId: string, attachment: UploadAttachmentRequest): Promise<ApiResponse<Attachment>> {
    try {
      console.log('🔄 Upload Task Attachment Request:');
      console.log('Task ID:', taskId);
      
      // Use standard headers only - custom user ID headers are blocked by CORS
      const headers = this.getHeaders();
      
      console.log('Headers:', maskHeaders(headers as Record<string, unknown>));
      
      // Try multiple field names for user ID in case API expects different format
      const requestBody = {
        ...attachment,
        // Try different possible field names
        userId: attachment.createdBy,
        authorId: attachment.createdBy,
        uploadedBy: attachment.createdBy,
        'user-id': attachment.createdBy,
      };
      
      console.log('Request Body:', JSON.stringify(maskBody(requestBody), null, 2));
      
      const response = await fetch(`${this.baseUrl}/tasks/${taskId}/attachments`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(requestBody),
      });

      console.log('📡 Upload Response Status:', response.status);
      console.log('📡 Upload Response Headers:', maskHeaders(Object.fromEntries(response.headers.entries())));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log('❌ Upload Error Response:', errorText);
        try {
          const errorJson = JSON.parse(errorText);
          console.log('❌ Parsed Error:', errorJson);
        } catch {
          console.log('❌ Raw Error Text:', errorText);
        }
        
        // Return error without calling handleResponse since we already read the body
        return {
          error: errorText
        };
      }

      return await this.handleResponse<Attachment>(response);
    } catch (error) {
      console.log('💥 Upload Exception:', error);
      return {
        error: error instanceof Error ? error.message : 'Network error occurred'
      };
    }
  }

  async deleteTaskAttachment(taskId: string, attachmentId: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${this.baseUrl}/tasks/${taskId}/attachments/${attachmentId}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });

      return await this.handleResponse<void>(response);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Network error occurred'
      };
    }
  }

  async getComments(entityId: string, entityType: string): Promise<ApiResponse<Comment[]>> {
    try {
      const response = await fetch(`${this.baseUrl}/comments?entityId=${entityId}&entityType=${entityType}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      return await this.handleResponse<Comment[]>(response);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Network error occurred'
      };
    }
  }

  async createComment(comment: CreateCommentRequest): Promise<ApiResponse<Comment>> {
    try {
      // Use standard headers only - no custom user ID header due to CORS
      const headers = this.getHeaders();
      
      // Use exact API format from documentation - no user ID needed
      const requestBody = {
        content: comment.content,
        entityId: comment.entityId,
        entityType: comment.entityType,
        // Include attachments if present
        ...(comment.attachments && { attachments: comment.attachments }),
      };
      
      console.log('💬 Create Comment Request:');
      console.log('Headers:', maskHeaders(headers as Record<string, unknown>));
      console.log('Request Body:', JSON.stringify(maskBody(requestBody), null, 2));
      
      const response = await fetch(`${this.baseUrl}/comments`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(requestBody),
      });

      console.log('📡 Comment Response Status:', response.status);
      console.log('📡 Comment Response Headers:', maskHeaders(Object.fromEntries(response.headers.entries())));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log('❌ Comment Error Response:', errorText);
        try {
          const errorJson = JSON.parse(errorText);
          console.log('❌ Parsed Comment Error:', errorJson);
        } catch {
          console.log('❌ Raw Comment Error Text:', errorText);
        }
        
        // Return error without calling handleResponse since we already read the body
        return {
          error: errorText
        };
      }

      return await this.handleResponse<Comment>(response);
    } catch (error) {
      console.log('💥 Comment Exception:', error);
      return {
        error: error instanceof Error ? error.message : 'Network error occurred'
      };
    }
  }

  async updateComment(commentId: string, content: string): Promise<ApiResponse<Comment>> {
    try {
      const response = await fetch(`${this.baseUrl}/comments/${commentId}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify({ content }),
      });

      return await this.handleResponse<Comment>(response);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Network error occurred'
      };
    }
  }

  async deleteComment(commentId: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${this.baseUrl}/comments/${commentId}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });

      return await this.handleResponse<void>(response);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Network error occurred'
      };
    }
  }

  async getPeople(): Promise<ApiResponse<PeopleResponse>> {
    try {
      const response = await fetch(`${this.baseUrl}/people`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      return await this.handleResponse<PeopleResponse>(response);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Network error occurred'
      };
    }
  }

  async getContextEntries(): Promise<ApiResponse<ContextResponse>> {
    try {
      console.log('🔄 Get Context Entries Request:');
      const headers = this.getHeaders();
      console.log('Headers:', maskHeaders(headers as Record<string, unknown>));
      
      const response = await fetch(`${this.baseUrl}/context`, {
        method: 'GET',
        headers: headers,
      });

      console.log('📡 Context Response Status:', response.status);
      console.log('📡 Context Response Headers:', maskHeaders(Object.fromEntries(response.headers.entries())));

      return await this.handleResponse<ContextResponse>(response);
    } catch (error) {
      console.log('💥 Context Exception:', error);
      return {
        error: error instanceof Error ? error.message : 'Network error occurred'
      };
    }
  }
}

// OpenAI Integration for ISO 27001 Assessment
// Interfaces moved to types.ts - keeping here for backward compatibility
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

export interface OrganizationalProfile {
  businessModel: string;
  technologyStack: string;
  organizationalSize: string;
  industryContext: string;
  securityPractices: string;
  keyCharacteristics: string[];
}

export interface OpenAIAssessmentResponse {
  results: OpenAIAssessmentResult[];
  organizationalProfile: OrganizationalProfile;
  totalProcessed: number;
  processingTime: number;
}

class OpenAIClient {
  private apiKey: string;
  private baseUrl: string = 'https://api.openai.com/v1';

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY || '';
  }

  private createContextAnalysisPrompt(): string {
    return `You are an expert organizational analyst conducting a comprehensive assessment of a company for ISO 27001 compliance.

Your task is to analyze the provided context entries and create a structured organizational profile.

ANALYSIS FRAMEWORK:
Extract and categorize information about the organization across these dimensions:

1. BUSINESS MODEL: What does the company do? How do they operate? What are their core activities?
2. TECHNOLOGY STACK: What technologies, systems, and infrastructure do they use?
3. ORGANIZATIONAL SIZE: How big is the organization? Team structure? Complexity level?
4. INDUSTRY CONTEXT: What industry are they in? What regulations apply? What are typical risks?
5. SECURITY PRACTICES: What security measures, policies, or practices are already in place?

OUTPUT FORMAT:
Provide a JSON response with this exact structure:

{
  "businessModel": "Brief description of what the company does and how they operate",
  "technologyStack": "Summary of key technologies, systems, and infrastructure mentioned",
  "organizationalSize": "Assessment of company size, structure, and complexity",
  "industryContext": "Industry sector, regulatory environment, and typical business risks",
  "securityPractices": "Current security measures, policies, and practices in place",
  "keyCharacteristics": ["List of 5-8 key organizational characteristics that would impact ISO 27001 control applicability"]
}

IMPORTANT:
- Be comprehensive but concise
- Focus on facts mentioned in the context entries
- Identify characteristics that would impact security control applicability
- Use clear, professional language
- Ensure the JSON is valid and parseable`;
  }

  private createContextAnalysisUserPrompt(contextEntries: ContextEntry[]): string {
    let prompt = `COMPANY CONTEXT ENTRIES TO ANALYZE:\n\n`;
    
    contextEntries.forEach((entry, index) => {
      prompt += `Context Entry ${index + 1}:\nQuestion: ${entry.question}\nAnswer: ${entry.answer}\n`;
      if (entry.tags && entry.tags.length > 0) {
        prompt += `Tags: ${entry.tags.join(', ')}\n`;
      }
      prompt += `\n`;
    });

    prompt += `\nPlease analyze the above context entries and provide the organizational profile in the specified JSON format.`;

    return prompt;
  }

  private createSystemPrompt(): string {
    return `You are an expert Chief Information Security Officer (CISO) conducting an ISO 27001 control applicability assessment.

You have been provided with a structured organizational profile extracted from the company's context entries. Use this profile to make precise, well-reasoned decisions about control applicability.

ASSESSMENT METHODOLOGY:
1. Review the organizational profile which summarizes key company characteristics
2. For each ISO 27001 control, systematically evaluate applicability against:
   - Business model and operational characteristics
   - Technology stack and infrastructure requirements
   - Organizational size and structural complexity
   - Industry context and regulatory environment
   - Current security practices and maturity
   - Key organizational characteristics that impact control relevance

DECISION CRITERIA:
- DEFAULT: Assume ALL controls are applicable unless there's clear evidence they don't apply
- MARK AS "No" ONLY when the organizational profile provides specific evidence that:
  * The control addresses risks/scenarios that don't exist in this organization
  * The company explicitly doesn't engage in activities covered by the control
  * The control is designed for different organizational structures/sizes/industries
  * Current organizational practices make the control redundant or inappropriate
- Use the structured profile to make consistent, evidence-based decisions

ANALYSIS QUALITY:
- Be thorough but concise in your reasoning
- Write justifications in first person from the organization's perspective
- Reference specific organizational characteristics from the profile
- Consider both direct and indirect applicability
- Err on the side of inclusion rather than exclusion
- Ensure consistency across similar controls

OUTPUT FORMAT:
For each control, provide exactly this format:

Control Objective: [Control Number] - [Control Title]
Is this control required?: Yes or No
Why is this not applicable?: [Only if "No" - write from organization's perspective, e.g., "Our organization does not..." or "We do not engage in..." or "This control is not relevant because we..."]

IMPORTANT: 
- Be consistent with this exact format as it will be parsed programmatically
- Write justifications in first person from the organization's perspective
- Base decisions on the organizational profile provided
- Focus on specific organizational characteristics that make controls non-applicable`;
  }

  private createControlAssessmentUserPrompt(organizationalProfile: OrganizationalProfile, controls: Array<{controlNumber: string; title: string; objective: string}>): string {
    let prompt = `ORGANIZATIONAL PROFILE:\n\n`;
    
    prompt += `Business Model: ${organizationalProfile.businessModel}\n\n`;
    prompt += `Technology Stack: ${organizationalProfile.technologyStack}\n\n`;
    prompt += `Organizational Size: ${organizationalProfile.organizationalSize}\n\n`;
    prompt += `Industry Context: ${organizationalProfile.industryContext}\n\n`;
    prompt += `Security Practices: ${organizationalProfile.securityPractices}\n\n`;
    prompt += `Key Characteristics:\n`;
    organizationalProfile.keyCharacteristics.forEach((char, index) => {
      prompt += `${index + 1}. ${char}\n`;
    });

    prompt += `\nISO 27001 CONTROLS TO ASSESS:\n\n`;
    
    controls.forEach((control, index) => {
      prompt += `Control ${index + 1}: ${control.controlNumber} - ${control.title}\n`;
      prompt += `Objective: ${control.objective}\n\n`;
    });

    prompt += `ASSESSMENT INSTRUCTIONS:
1. Use the organizational profile above to understand the company's characteristics
2. For each control, systematically evaluate if it applies based on the profile
3. Consider how each aspect of the organizational profile impacts control relevance
4. If marking as "No", write the justification from the organization's first-person perspective
5. Reference specific organizational characteristics that make controls non-applicable
6. Use phrases like "Our organization does not...", "We do not engage in...", "This is not applicable because we..."
7. Provide your assessment in the exact format specified in the system prompt

Begin your assessment now:`;

    return prompt;
  }

  async assessControls(request: OpenAIAssessmentRequest): Promise<OpenAIAssessmentResponse> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured. Please set NEXT_PUBLIC_OPENAI_API_KEY in your environment variables.');
    }

    const startTime = Date.now();

    try {
      console.log('🔄 Starting Phase 1: Context Analysis...');
      
      // Phase 1: Analyze context entries to create organizational profile
      const contextAnalysisResponse = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4-turbo',
          messages: [
            {
              role: 'system',
              content: this.createContextAnalysisPrompt()
            },
            {
              role: 'user',
              content: this.createContextAnalysisUserPrompt(request.contextEntries)
            }
          ],
          temperature: 0.1, // Very low temperature for structured analysis
          max_completion_tokens: 2000,
        }),
      });

      if (!contextAnalysisResponse.ok) {
        const errorData = await contextAnalysisResponse.json();
        throw new Error(`OpenAI Context Analysis error: ${errorData.error?.message || contextAnalysisResponse.statusText}`);
      }

      const contextData = await contextAnalysisResponse.json();
      const contextAnalysisResult = contextData.choices[0]?.message?.content || '';
      
      console.log('✅ Phase 1 Complete: Context Analysis');
      console.log('🔄 Starting Phase 2: Control Assessment...');

      // Parse the organizational profile
      let organizationalProfile: OrganizationalProfile;
      try {
        // Extract JSON from the response (in case there's extra text)
        const jsonMatch = contextAnalysisResult.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? jsonMatch[0] : contextAnalysisResult;
        organizationalProfile = JSON.parse(jsonStr);
      } catch {
        console.warn('Failed to parse organizational profile, using fallback');
        organizationalProfile = {
          businessModel: 'Unable to parse business model from context',
          technologyStack: 'Unable to parse technology stack from context',
          organizationalSize: 'Unable to parse organizational size from context',
          industryContext: 'Unable to parse industry context from context',
          securityPractices: 'Unable to parse security practices from context',
          keyCharacteristics: ['Analysis parsing failed - using default assessment approach']
        };
      }

      // Phase 2: Assess controls using the organizational profile
      const controlAssessmentResponse = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4-turbo',
          messages: [
            {
              role: 'system',
              content: this.createSystemPrompt()
            },
            {
              role: 'user',
              content: this.createControlAssessmentUserPrompt(organizationalProfile, request.controls)
            }
          ],
          temperature: 0.2, // Low temperature for consistent, analytical responses
          max_completion_tokens: 4000,
        }),
      });

      if (!controlAssessmentResponse.ok) {
        const errorData = await controlAssessmentResponse.json();
        throw new Error(`OpenAI Control Assessment error: ${errorData.error?.message || controlAssessmentResponse.statusText}`);
      }

      const assessmentData = await controlAssessmentResponse.json();
      const assessmentResult = assessmentData.choices[0]?.message?.content || '';

      console.log('✅ Phase 2 Complete: Control Assessment');

      // Parse the AI response to extract control assessments
      const results = this.parseAssessmentResponse(assessmentResult, request.controls);

      const processingTime = Date.now() - startTime;

      return {
        results,
        organizationalProfile,
        totalProcessed: results.length,
        processingTime
      };
    } catch (error) {
      console.error('OpenAI Assessment Error:', error);
      throw error;
    }
  }

  private parseAssessmentResponse(
    response: string, 
    controls: Array<{controlNumber: string; title: string; objective: string}>
  ): OpenAIAssessmentResult[] {
    const results: OpenAIAssessmentResult[] = [];
    
    // More flexible splitting that handles various formats
    const sections = response.split(/Control Objective:\s*(?:\d+\.\d+\s*-\s*|\[.*?\]\s*-\s*|Control\s+\d+:\s*)/i);
    
    // If the primary split didn't work, try alternative patterns
    if (sections.length <= 1) {
      // Try splitting by control numbers directly
      const altSections = response.split(/(?:^|\n)(?:Control\s+)?(\d+\.\d+|\[.*?\])/im);
      if (altSections.length > sections.length) {
        // Use the better split
        for (let i = 1; i < altSections.length; i += 2) {
          const controlRef = altSections[i];
          const content = altSections[i + 1] || '';
          
          // Find matching control
          const control = controls.find(c => 
            content.includes(c.controlNumber) || 
            content.includes(c.title) ||
            controlRef.includes(c.controlNumber)
          );
          
          if (control) {
            const analysis = this.parseControlSection(content, control);
            results.push(analysis);
          }
        }
      }
    } else {
      // Use original parsing method with improvements
      for (let i = 1; i < sections.length; i++) {
        const section = sections[i].trim();
        
        // Try to match control by number or title in the section
        const control = controls.find(c => 
          section.includes(c.controlNumber) || 
          section.includes(c.title)
        ) || controls[i - 1]; // Fallback to positional matching
        
        if (control) {
          const analysis = this.parseControlSection(section, control);
          results.push(analysis);
        }
      }
    }

    // Ensure we have results for all controls (fallback to applicable if parsing failed)
    controls.forEach(control => {
      if (!results.find(r => r.controlNumber === control.controlNumber)) {
        console.warn(`No assessment found for control ${control.controlNumber}, defaulting to applicable`);
        results.push({
          controlNumber: control.controlNumber,
          isRequired: true, // Default to applicable
          reason: undefined // No reason needed for applicable controls
        });
      }
    });

    return results;
  }

  private parseControlSection(section: string, control: {controlNumber: string; title: string; objective: string}): OpenAIAssessmentResult {
    // Extract "Is this control required?" answer with multiple patterns
    const requiredPatterns = [
      /Is this control required\?:\s*(Yes|No)/i,
      /Required\?:\s*(Yes|No)/i,
      /Applicable\?:\s*(Yes|No)/i,
      /Control required:\s*(Yes|No)/i
    ];
    
    let isRequired = true; // Default to required
    for (const pattern of requiredPatterns) {
      const match = section.match(pattern);
      if (match) {
        isRequired = match[1].toLowerCase() === 'yes';
        break;
      }
    }

    // Extract reason if not applicable
    let reason = '';
    if (!isRequired) {
      const reasonPatterns = [
        /Why is this not applicable\?:\s*([\s\S]+?)(?:\n\n|\n(?=Control)|$)/i,
        /Not applicable because:\s*([\s\S]+?)(?:\n\n|\n(?=Control)|$)/i,
        /Reason:\s*([\s\S]+?)(?:\n\n|\n(?=Control)|$)/i,
        /Justification:\s*([\s\S]+?)(?:\n\n|\n(?=Control)|$)/i
      ];
      
      for (const pattern of reasonPatterns) {
        const match = section.match(pattern);
        if (match) {
          reason = match[1].trim().replace(/\n/g, ' ');
          break;
        }
      }
      
      if (!reason) {
        reason = 'This control is not applicable to our organization (specific reasoning not parsed)';
      }
      
      // Clean up any references to context entries that might have slipped through
      reason = reason.replace(/Based on Context Entry \d+/gi, 'Our organization')
                   .replace(/Context Entry \d+ (?:shows|indicates|states)/gi, 'Our organization')
                   .replace(/According to Context Entry \d+/gi, 'Our organization');
    }

    return {
      controlNumber: control.controlNumber,
      isRequired,
      reason: reason || undefined
    };
  }

  async generateSystemsDescription(contextEntries: ContextEntry[]): Promise<string> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured. Please set NEXT_PUBLIC_OPENAI_API_KEY in your environment variables.');
    }

    const systemPrompt = `You are a senior platform architect. Generate a concise, professional systems description for an engineering due diligence document.

Requirements:
- Write 1-3 cohesive paragraphs in clear present tense.
- Prefer facts from the provided organization context.
- Use the following guideline/example as the target style and coverage, adapting to the org where sensible:

Example Style and Coverage:
"The platform is hosted on AWS infrastructure with data stored in Amazon RDS and file storage handled by Amazon S3. The application is built using Next.js with the T3 Stack (Prisma ORM, tRPC, and Auth.js for authentication), deployed using SST.dev for Infrastructure as Code. Content delivery is managed through Cloudflare CDN, with AWS GuardDuty providing threat detection and AWS Inspector handling security assessments. The system utilizes Inngest for background job processing, New Relic for observability and monitoring, and Resend for email communications. Version control is managed through GitHub, with additional integrations including Deepgram for speech-to-text transcription services and Gemini 2.5 Flash AI services via the AI SDK."

Instructions:
- If the context specifies technologies/vendors, reflect them accurately.
- If context is silent on a capability, assume modern cloud-native equivalents consistent with the example.
- Do not add overly specific details like exact VPC CIDRs, instance sizes, or repository names.
- Keep the tone objective, avoid marketing language.
`;

    let userPrompt = 'ORGANIZATION CONTEXT ENTRIES:\n\n';
    contextEntries.forEach((entry, index) => {
      userPrompt += `Context Entry ${index + 1}:\nQuestion: ${entry.question}\nAnswer: ${entry.answer}\n`;
      if (entry.tags && entry.tags.length > 0) {
        userPrompt += `Tags: ${entry.tags.join(', ')}\n`;
      }
      userPrompt += `\n`;
    });
    userPrompt += '\nGenerate the systems description now.';

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.2,
        max_completion_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => undefined);
      throw new Error(`OpenAI Systems Description error: ${errorData?.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim() || '';
    return content;
  }
}

// Create singleton instances
export const compAIClient = new CompAIClient();
export const openAIClient = new OpenAIClient();

// Export the classes for custom instances and demo mode status
export { CompAIClient, OpenAIClient, isDemoMode };
