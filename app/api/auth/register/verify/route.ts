import {
  NextRequest,
  NextResponse,
} from 'next/server';

import jwt from 'jsonwebtoken';

import dbConnect from '@/lib/Db';

import User from '@/models/User';

export async function POST(
  req: NextRequest
) {

  try {

    await dbConnect();

    const {
      otp,
      token,
    } =
      await req.json();

    const payload =
      jwt.verify(
        token,
        process.env
          .JWT_SECRET!
      ) as any;

    if (
      payload.otp !==
      otp
    ) {
      return NextResponse.json(
        {
          message:
            'Invalid OTP',
        },
        {
          status:
            400,
        }
      );
    }

    const exists =
      await User.findOne({
        email:
          payload.email,
      });

    if (
      exists
    ) {
      return NextResponse.json(
        {
          message:
            'User already exists',
        },
        {
          status:
            409,
        }
      );
    }

    const user =
      await User.create({
        name:
          payload.name,

        email:
          payload.email,

        password:
          payload.password,

        role:
          payload.role,

        isActive:
          payload.isActive,
      });

    return NextResponse.json({
      success:
        true,

      user: {
        id:
          user._id,
      },
    });

  } catch {

    return NextResponse.json(
      {
        message:
          'OTP expired',
      },

      {
        status:
          400,
      }
    );
  }
}