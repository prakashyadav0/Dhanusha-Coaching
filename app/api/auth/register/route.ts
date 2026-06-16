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

    const name =
      body.name?.trim();

    const email =
      body.email
        ?.trim()
        .toLowerCase();

    const password =
      body.password;

    if (
      !name ||
      !email ||
      !password
    ) {
      return NextResponse.json(
        {
          message:
            'Name, email and password are required',
        },
        {
          status: 400,
        }
      );
    }

    if (
      password.length < 6
    ) {
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

    const existing =
      await User.findOne({
        email,
      });

    if (existing) {
      return NextResponse.json(
        {
          message:
            'Email already exists',
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

          password:
            hashed,

          role:
            'user',

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