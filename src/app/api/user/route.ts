/* eslint-disable @typescript-eslint/no-unused-vars */
import { hash } from "bcrypt";
import { NextResponse } from "next/server";
import * as z from "zod";
import { db } from "../../../lib/db";

// Define a schema for input validation
const userSchema = z
    .object({
        username: z.string().min(1, 'Username is required').max(100),
        email: z.string().min(1, 'Email is required').email('Invalid email'),
        password: z
            .string()
            .min(1, 'Password is required')
            .min(8, 'Password must have than 8 characters'),
    })

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {email, username, password} = userSchema.parse(body);

        // check if email already exists
        const existingEmail = await db.user.findUnique({
            where: {email}
        });
        if (existingEmail) {
            return NextResponse.json({user: null, message: "Email already exists"}, {status: 400});
        }

        // check if username already exists
        const existingUsername = await db.user.findUnique({
            where: {username}
        });
        if (existingUsername) {
            return NextResponse.json({user: null, message: "Username already exists"}, {status: 400});
        }

        const hashedPassword = await hash(password, 10);
        const newUser = await db.user.create({
            data: {
                email,
                username,
                password : hashedPassword
            }
        });
        const {password: newUserPassword, ...rest} = newUser;
        
        return NextResponse.json({user: rest, message: "User created successfully"}, {status: 201});
    } catch (error) {
        return NextResponse.json({ message: "An error occurred"}, {status: 500});
    }
}