import styles from './blog.module.css'
import Image from 'next/image'
import NextImage from '@/../assets/next.svg'

export default async function Page() {
  return (
    <>
      <h1> Blog!!!</h1>
      <main className={styles.blog}></main>
      <Image src="/file.svg" width={60} height={60} alt="ファイル" />
      <Image src={NextImage} alt="Next" />
    </>
  )
}
