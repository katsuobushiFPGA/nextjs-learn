'use server'

export async function createPost(formData: FormData) {
  const title = formData.get('title')
  const content = formData.get('content')
  console.log(title)
  console.log(content)
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
