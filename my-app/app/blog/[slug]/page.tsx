import type { Metadata, ResolvingMetadata } from 'next'

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata(
  { params, searchParams }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const slug = (await params).slug

  // ブログ投稿情報を取得
  //const post = await fetch(`https://api.vercel.app/blog/${slug}`).then((res) =>
  //  res.json()
  //)
  const post = { title: 'test', description: 'desc' }

  return {
    title: post.title,
    description: post.description,
  }
}

export default async function Page({ params }: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  return (
    <h1> Blog!!! params: {slug}</h1>
  );
}
