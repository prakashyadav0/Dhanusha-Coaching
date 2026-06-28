import { NextResponse } from 'next/server';
import dbConnect from '@/lib/Db';
import Order from '@/models/Order';
import { requireRole } from '@/lib/apiAuth';

// GET /api/admin/revenue-breakdown
// Returns revenue grouped by course, sorted by highest revenue first.
export async function GET() {
  const { error } = await requireRole('admin');
  if (error) return error;

  try {
    await dbConnect();

    const breakdown = await Order.aggregate([
      { $match: { status: 'paid' } },
      {
        $group: {
          _id:      '$course',
          revenue:  { $sum: '$amount' },
          orders:   { $sum: 1 },
        },
      },
      {
        $lookup: {
          from:         'courses',
          localField:   '_id',
          foreignField: '_id',
          as:           'course',
        },
      },
      { $unwind: { path: '$course', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id:      0,
          courseId: '$_id',
          title:    { $ifNull: ['$course.title', 'Deleted Course'] },
          revenue:  1,
          orders:   1,
        },
      },
      { $sort: { revenue: -1 } },
    ]);

    const total = breakdown.reduce((sum: number, c: any) => sum + c.revenue, 0);

    return NextResponse.json({ breakdown, total });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}