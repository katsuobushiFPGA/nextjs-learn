export const dynamic = 'force-static'

export async function GET(request: Request) {
  const res = await fetch('https://jsonplaceholder.typicode.com/posts/1', {
    headers: {
      'Content-Type': 'application/json'
    }
  })
  const data = await res.json()

  return Response.json({ data })
}
