import { useMutation, useQuery } from 'convex/react'
import React, { useEffect, useState } from 'react'
import { toast } from 'sonner'


//custom hook for query
export const useConvexQuery = (query, ...args) => {

    const result = useQuery(query, ...args) // query from convex

    const [data, setData] = useState([])
    const [isLoading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    // use effect to handle the result

    useEffect(() => {
        if (result === undefined) {
            setLoading(true)
        } else {
            try {
                setData(result)
                setError(null)
            } catch (err) {
                setError(err)
                toast.error(err.message);

            } finally {
                setLoading(false)
            }


        }

    }, [result]);
    // return the data, isLoading, error
    return { data, isLoading, error }


}

//custom hook for mutation
export const useConvexMutation = (mutation) => {
    // mutation from convex
    const mutationFn = useMutation(mutation)

    const [data, setData] = useState([])
    const [isLoading, setLoading] = useState(false)
    const [error, setError] = useState(null)


    // mutation function
    const mutate = async (...args) => {
        setLoading(true)
        setError(null)

        try {
            const response = await mutationFn(...args)
            setData(response)
            return response
        } catch (err) {
            setError(err)
            toast.error(err.message)
            throw err
        } finally {
            setLoading(false)
        }

    }



    return { mutate, data, isLoading, error }


}

