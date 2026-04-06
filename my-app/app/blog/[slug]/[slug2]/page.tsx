export default async function Page(props: PageProps<'/blog/[slug]/[slug2]'>) {
  const { slug2 } = await props.params
  return <h1>Blog post:(slug2) {slug2}</h1>
}
