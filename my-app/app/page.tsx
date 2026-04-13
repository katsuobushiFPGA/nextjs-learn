import { Suspense } from 'react'
import Link from 'next/link'
import Loading from '@/components/Loading'
import { Button } from '@/ui/button'
import ClientComponent from '@/client-component'
import { updateItem } from '@/actions'
import { Form } from '@/ui/form'

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const filters = (await searchParams).filters
  const param = (await searchParams).param
  const slug = "abcdefg"
  return (
    <>
      <h1>Top Page!</h1>
      <p>params: {param}</p>
      <p>searchParams: {filters}</p>
      <Link href={`/blog/${slug}`}>こちらへどうぞ!</Link>
      <Suspense fallback={<Loading />}>
        <div>Complete Loading!!!!</div>
      </Suspense>
      <Button />
      <ClientComponent updateItemAction={updateItem} />
      <Form />
    </>
  );
}
