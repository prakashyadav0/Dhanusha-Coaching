import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

import dbConnect from '@/lib/Db';
import User from '@/models/User';

interface RegisterTokenPayload {
  name: string;
  email: string;
  number: string;
  password: string;
  role: 'admin' | 'team member' | 'user';
  isActive: boolean;
  otp: string;
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const { otp, token } = await req.json();

    if (!otp || !token) {
      return NextResponse.json(
        {
          message: 'OTP and token are required',
        },
        {
          status: 400,
        }
      );
    }

    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as RegisterTokenPayload;

    if (payload.otp !== otp) {
      return NextResponse.json(
        {
          message: 'Invalid OTP',
        },
        {
          status: 400,
        }
      );
    }

    const exists = await User.findOne({
      email: payload.email,
    });

    if (exists) {
      return NextResponse.json(
        {
          message: 'User already exists',
        },
        {
          status: 409,
        }
      );
    }

    const user = await User.create({
      name: payload.name,
      email: payload.email,
      number: payload.number, // ✅ Save mobile number
      password: payload.password,
      role: payload.role,
      isActive: payload.isActive,
    });

    return NextResponse.json({
      success: true,
      message: 'Registration successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        number: user.number,
      },
    });
  } catch (error) {
    console.error('Register verification error:', error);

    if (
      error instanceof jwt.TokenExpiredError
    ) {
      return NextResponse.json(
        {
          message: 'OTP expired',
        },
        {
          status: 400,
        }
      );
    }

    if (
      error instanceof jwt.JsonWebTokenError
    ) {
      return NextResponse.json(
        {
          message: 'Invalid token',
        },
        {
          status: 400,
        }
      );
    }

    return NextResponse.json(
      {
        message: 'Internal server error',
      },
      {
        status: 500,
      }
    );
  }
}