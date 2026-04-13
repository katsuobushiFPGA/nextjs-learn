export async function createPost(formData: FormData) {
  'use server'
  const title = formData.get('title')
  const content = formData.get('content')

  // データを更新
  // キャッシュを再検証
}

export async function deletePost(formData: FormData) {
  'use server'
  const id = formData.get('id')

// データを更新
// キャッシュを再検証
}
