import { SignIn } from '@clerk/nextjs'
import React from 'react'

function signInPage() {
    return <SignIn path="/sign-in" />
}

export default signInPage