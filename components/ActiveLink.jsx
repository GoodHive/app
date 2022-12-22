import { useRouter } from 'next/router'
import Link from 'next/link'

export const ActiveLink = ({ text, href }) => {
  const { asPath } = useRouter()
  return (
    <Link
      className={[asPath === href ? 'text-[#FFB805] underline' : '']}
      href={href}
    >
      {text}
    </Link>
  )
}
