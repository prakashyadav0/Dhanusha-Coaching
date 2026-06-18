import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import dbConnect from '@/lib/Db';
import User from '@/models/User';
import { sendOTPEmail } from '@/lib/mail';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const body = await req.json();

    const name = body.name?.trim();

    const email = body.email
      ?.trim()
      .toLowerCase();

    const number = body.number?.trim();

    const password = body.password;

    // optional role
    const role =
      body.role === 'team member'
        ? 'team member'
        : 'user';

    if (
      !name ||
      !email ||
      !number ||
      !password
    ) {
      return NextResponse.json(
        {
          message:
            'Name, email, mobile number and password are required',
        },
        {
          status: 400,
        }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        {
          message:
            'Password must be at least 6 characters',
        },
        {
          status: 400,
        }
      );
    }

    // Nepal phone validation (adjust if needed)
    if (!/^[0-9]{10}$/.test(number)) {
      return NextResponse.json(
        {
          message:
            'Enter a valid mobile number',
        },
        {
          status: 400,
        }
      );
    }

    const existing =
      await User.findOne({
        $or: [
          { email },
          { number },
        ],
      });

    if (existing) {
      return NextResponse.json(
        {
          message:
            existing.email === email
              ? 'Email already exists'
              : 'Mobile number already exists',
        },
        {
          status: 409,
        }
      );
    }

    const hashed =
      await bcrypt.hash(
        password,
        12
      );

    const otp =
      Math.floor(
        100000 +
          Math.random() *
            900000
      ).toString();

    await sendOTPEmail(
      email,
      otp
    );

    const registerToken =
      jwt.sign(
        {
          name,
          email,
          number,
          password:
            hashed,

          role,

          isActive:
            true,

          otp,
        },

        process.env
          .JWT_SECRET!,

        {
          expiresIn:
            '10m',
        }
      );

    return NextResponse.json({
      success: true,
      message:
        'OTP sent',
      token:
        registerToken,
    });
  } catch (error) {
    console.log(error);

    return NextResponse.json(
      {
        message:
          'Internal server error',
      },
      {
        status:
          500,
      }
    );
  }
}