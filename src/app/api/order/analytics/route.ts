import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/jwt';

// Types for raw query results
type WeeklyStats = { date: string; orders: bigint; revenue: number };
type MonthlyStats = { month: string; orders: bigint; revenue: number };

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const now       = new Date();
    const oneWeekAgo  = new Date(now);  oneWeekAgo.setDate(now.getDate() - 7);
    const oneMonthAgo = new Date(now);  oneMonthAgo.setMonth(now.getMonth() - 1);

    const [totalOrders, pendingOrders, deliveredOrders, returnedOrders, weeklyRaw, monthlyRaw] =
      await Promise.all([
        prisma.order.count(),
        prisma.order.count({ where: { status: 'pending' } }),
        prisma.order.count({ where: { status: 'delivered' } }),
        prisma.order.count({ where: { status: 'returned' } }),
        // weekly: group by day
        prisma.$queryRaw<WeeklyStats[]>`
          SELECT
            TO_CHAR("createdAt", 'YYYY-MM-DD') AS date,
            COUNT(*)::bigint AS orders,
            SUM(total) AS revenue
          FROM "Order"
          WHERE "createdAt" >= ${oneWeekAgo}
          GROUP BY date
          ORDER BY date ASC
        `,
        // monthly: group by month
        prisma.$queryRaw<MonthlyStats[]>`
          SELECT
            TO_CHAR("createdAt", 'YYYY-MM') AS month,
            COUNT(*)::bigint AS orders,
            SUM(total) AS revenue
          FROM "Order"
          WHERE "createdAt" >= ${oneMonthAgo}
          GROUP BY month
          ORDER BY month ASC
        `,
      ]);

    return NextResponse.json({
      success: true,
      statistics: {
        totalOrders,
        pendingOrders,
        deliveredOrders,
        returnedOrders,
        weeklyData:  weeklyRaw.map(r  => ({ date: r.date,   orders: Number(r.orders), revenue: r.revenue })),
        monthlyData: monthlyRaw.map(r => ({ month: r.month, orders: Number(r.orders), revenue: r.revenue })),
      },
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch order analytics' },
      { status: 500 }
    );
  }
}
