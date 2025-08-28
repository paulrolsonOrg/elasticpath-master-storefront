import { NextRequest, NextResponse } from 'next/server';
import { getServerSideImplicitClient } from '../../../lib/epcc-server-side-implicit-client';


export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/canvas-layouts - Starting request...');
    
    const body = await request.json();
    console.log('Request body received:', { jsonLength: body.json?.length, account_member_id: body.account_member_id, entry_id: body.entry_id });
    
    const { json, account_member_id, entry_id } = body;

    if (!json) {
      console.log('Missing required field: json');
      return NextResponse.json(
        { error: 'Missing required field: json is required' },
        { status: 400 }
      );
    }

    console.log('Getting ElasticPath client...');
    // Get ElasticPath client
    const client = getServerSideImplicitClient();
    
    console.log('Skipping extension check - extension manually created...');

    // Prepare request data with account_member_id if provided
    const requestData: any = {
      type: 'canvas_layout_ext',
      json,
    };
    
    if (account_member_id) {
      requestData.account_member_id = account_member_id;
      console.log('Including account_member_id:', account_member_id);
    }

    let existingCanvas = null;
    
    // If we have an entry_id, this is an update to an existing entry
    if (entry_id) {
      console.log('Updating existing canvas entry with ID:', entry_id);
      existingCanvas = { id: entry_id };
    } else {
      console.log('Creating new canvas entry');
      existingCanvas = null;
    }

    let result;
    
    if (existingCanvas) {
      // Update existing canvas entry
      console.log(`Updating existing canvas entry: ${existingCanvas.id}`);
      result = await client.request.send(
        `extensions/canvas-layouts/${existingCanvas.id}`,
        'PUT',
        requestData,
        undefined,
        client,
        undefined,
        'v2',
        {}
      );
    } else {
      // Create new canvas entry
      console.log('Creating new canvas entry');
      result = await client.request.send(
        'extensions/canvas-layouts',
        'POST',
        requestData,
        undefined,
        client,
        undefined,
        'v2',
        {}
      );
    }

    return NextResponse.json({
      success: true,
      entryId: result.data?.id,
      data: result.data,
      action: existingCanvas ? 'updated' : 'created',
    });

  } catch (error) {
    console.error('Error saving canvas layout:', error);
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      fullError: error
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to save canvas layout',
        details: error instanceof Error ? error.message : 'Unknown error',
        type: error instanceof Error ? error.name : 'Unknown',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get ElasticPath client
    const client = getServerSideImplicitClient();
    
    console.log('Skipping extension check for GET - extension manually created...');
    
    const { searchParams } = new URL(request.url);
    const entryId = searchParams.get('entryId');

    if (entryId) {
      // Get specific canvas by entry ID
      const response = await client.request.send(
        'extensions/canvas-layouts',
        'GET',
        undefined,
        undefined,
        client,
        undefined,
        'v2',
        {}
      );
      
      const canvas = response.data?.find((item: any) => 
        item.id === entryId
      );
      
      if (!canvas) {
        return NextResponse.json(
          { error: 'Canvas not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        success: true,
        data: canvas,
      });
    } else {
      // Get all canvases
      const response = await client.request.send(
        'extensions/canvas-layouts',
        'GET',
        undefined,
        undefined,
        client,
        undefined,
        'v2',
        {}
      );
      
      return NextResponse.json({
        success: true,
        data: response.data || [],
      });
    }

  } catch (error) {
    console.error('Error fetching canvas layouts:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch canvas layouts',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}