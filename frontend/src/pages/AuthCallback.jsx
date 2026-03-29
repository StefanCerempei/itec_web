import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, hasSupabaseClientConfig } from '../lib/supabaseClient'

const AuthCallback = () => {
    const navigate = useNavigate()
    const [errorMessage, setErrorMessage] = useState('')

    useEffect(() => {
        let isMounted = true

        const completeOAuthFlow = async () => {
            try {
                if (!hasSupabaseClientConfig || !supabase) {
                    throw new Error('Missing Supabase client configuration.')
                }

                const { data, error } = await supabase.auth.getSession()
                if (error) {
                    throw error
                }

                let session = data?.session

                if (!session) {
                    const hashParams = new URLSearchParams((window.location.hash || '').replace(/^#/, ''))
                    const accessToken = hashParams.get('access_token')

                    if (accessToken) {
                        localStorage.setItem('authToken', accessToken)

                        const { data: userData } = await supabase.auth.getUser(accessToken)
                        if (userData?.user) {
                            localStorage.setItem('authUser', JSON.stringify(userData.user))
                        }

                        navigate('/collab', { replace: true })
                        return
                    }

                    throw new Error('No active session found after OAuth callback.')
                }

                localStorage.setItem('authToken', session.access_token)
                localStorage.setItem('authUser', JSON.stringify(session.user))
                navigate('/collab', { replace: true })
            } catch (error) {
                if (!isMounted) return
                setErrorMessage(error?.message || 'Authentication callback failed.')
                navigate('/signin', { replace: true })
            }
        }

        completeOAuthFlow()

        return () => {
            isMounted = false
        }
    }, [navigate])

    return (
        <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#0b1020', color: '#f8fafc' }}>
            <div style={{ textAlign: 'center' }}>
                <h1 style={{ marginBottom: '12px' }}>Completing sign in...</h1>
                <p style={{ opacity: 0.8 }}>
                    {errorMessage || 'Please wait while we redirect you to your collaboration hub.'}
                </p>
            </div>
        </div>
    )
}

export default AuthCallback
