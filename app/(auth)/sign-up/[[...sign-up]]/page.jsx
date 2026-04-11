import { SignUp } from '@clerk/nextjs'
import React from 'react'

function signUpPage() {
    return <SignUp path="/sign-up" />
}

export default signUpPage