import { NextRequest, NextResponse } from 'next/server';

// God API key for demo purposes
const DEMO_API_KEY = '1234567890zxcvbmn';

// Hardcoded random device data with multiple users
const randomData = {
    twoFactorAuthentication: {
        users: [
            {
                userEmail: 'john.smith@company.com',
                status: {
                    enabled: true,
                    method: 'authenticator',
                    lastUsed: '2024-10-31T09:15:23Z',
                    lastSetup: '2024-01-10T14:30:00Z'
                }
            },
            {
                userEmail: 'sarah.johnson@company.com',
                status: {
                    enabled: true,
                    method: 'sms',
                    lastUsed: '2024-10-30T16:42:10Z',
                    lastSetup: '2024-03-15T11:20:00Z'
                }
            },
            {
                userEmail: 'michael.brown@company.com',
                status: {
                    enabled: false,
                    method: null,
                    lastUsed: null,
                    lastSetup: null
                }
            },
            {
                userEmail: 'emily.davis@company.com',
                status: {
                    enabled: true,
                    method: 'email',
                    lastUsed: '2024-10-31T08:30:45Z',
                    lastSetup: '2024-02-20T10:15:00Z'
                }
            },
            {
                userEmail: 'david.wilson@company.com',
                status: {
                    enabled: true,
                    method: 'authenticator',
                    lastUsed: '2024-10-29T14:20:33Z',
                    lastSetup: '2024-01-05T09:45:00Z'
                }
            }
        ]
    },
    alertsSummary: {
        critical: 3,
        warning: 8,
        info: 15,
    },
};

export async function GET(request: NextRequest) {
    // Check for API key in headers
    const apiKey = request.headers.get('x-api-key');

    if (!apiKey) {
        return NextResponse.json(
            { error: 'API key is required. Please provide x-api-key header.' },
            { status: 401 }
        );
    }

    if (apiKey !== DEMO_API_KEY) {
        return NextResponse.json(
            { error: 'Invalid API key' },
            { status: 403 }
        );
    }

    // Return the hardcoded random data
    return NextResponse.json({
        success: true,
        data: randomData,
        timestamp: new Date().toISOString(),
        message: 'Data retrieved successfully',
    });
}

