import { Suspense } from 'react'
import Link from 'next/link'
import Loading from '@/components/Loading'

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const filters = (await searchParams).filters
  const slug = "abcdefg"
  return (
    <>
      <h1>Top Page!</h1>
      <p>searchParams: {filters}</p>
      <Link href={`/blog/${slug}`}>こちらへどうぞ!</Link>
      <Suspense fallback={<Loading />}>
        <div>Complete Loading!!!!</div>
      </Suspense>
    </>
  );
}
