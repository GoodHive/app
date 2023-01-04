import { FC } from "react";

import { useRouter } from "next/router";
import Link from "next/link";

interface Props {
  text: string
  href: string
}

export const LinkStyled: FC<Props> = ({ text, href }) => {
  const { asPath } = useRouter();
  const className = asPath === href ? 'text-[#FFB805] underline' : '';

  return (
    <Link className={className} href={href}>
      {text}
    </Link>
  )
}
