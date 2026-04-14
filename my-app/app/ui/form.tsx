'use client'
import { createPost2 } from '@/actions'
import { useActionState } from 'react'

const initialState = {
  message: '',
}

export function Form() {
  const [state, formAction, pending] = useActionState(createPost2, initialState)
  return (
    <form action={formAction}>
      <label htmlFor="title">Title</label>
      <input type="text" id="title" name="title" required />
      <label htmlFor="content">Content</label>
      <textarea id="content" name="content" required />
      {state?.message && <p aria-live="polite">{state.message}</p>}
      <button disabled={pending}>Create Post</button>
      { /*
      <input type="text" name="title" />
      <input type="text" name="content" />
      <button type="submit">Create</button>
      */ }
    </form>
  )
}
