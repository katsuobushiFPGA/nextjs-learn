import Link from 'next/link'

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
    </>
  );
}
