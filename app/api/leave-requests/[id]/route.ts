import { NextRequest, NextResponse } from 'next/server';
import { leaveRequestController } from '@/lib/controllers/leave-request.controller';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const leaveRequest = await leaveRequestController.getById(params.id);
    
    if (!leaveRequest) {
      return NextResponse.json(
        { error: 'Leave request not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(leaveRequest);
  } catch (error) {
    console.error('Error fetching leave request:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leave request' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const leaveRequest = await leaveRequestController.update(params.id, body);
    
    return NextResponse.json(leaveRequest);
  } catch (error) {
    console.error('Error updating leave request:', error);
    return NextResponse.json(
      { error: 'Failed to update leave request' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await leaveRequestController.delete(params.id);
    return NextResponse.json({ message: 'Leave request deleted successfully' });
  } catch (error) {
    console.error('Error deleting leave request:', error);
    return NextResponse.json(
      { error: 'Failed to delete leave request' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { action, remarks } = body;

    let leaveRequest;
    if (action === 'approve') {
      leaveRequest = await leaveRequestController.approve(params.id);
    } else if (action === 'reject') {
      leaveRequest = await leaveRequestController.reject(params.id, remarks);
    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

    return NextResponse.json(leaveRequest);
  } catch (error) {
    console.error('Error processing leave request action:', error);
    return NextResponse.json(
      { error: 'Failed to process leave request action' },
      { status: 500 }
    );
  }
}
