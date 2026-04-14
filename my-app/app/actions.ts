'use server'

const ERROR_API_URL = 'https://api.vercel.app/posts';
const OK_API_URL = 'https://jsonplaceholder.typicode.com/posts';

export async function createPost(formData: FormData) {
  const title = formData.get('title')
  const content = formData.get('content')
  console.log(title)
  console.log(content)
}

export async function createPost2(prevState: any, formData: FormData) {
  const title = formData.get('title')
  const content = formData.get('content')

  const res = await fetch(ERROR_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title, content }),
  })
  const json = await res.json()

  if (!res.ok) {
    return { message: 'Failed to create post' }
  }
}

export async function updateItem(formData: FormData) { }

export async function incrementLike() { return 1 }

import { cookies } from 'next/headers'

export async function exampleAction() {
  const cookieStore = await cookies()

  // cookieを取得
  cookieStore.get('name')?.value

  // cookieを設定
  cookieStore.set('name', 'Delba')

  // cookieを削除
  cookieStore.delete('name')
}
