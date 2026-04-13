'use client'

import { createPost } from '@/actions'

export function Button() {
  return <button formAction={createPost}>Create</button>
}
