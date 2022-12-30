import { LinkStyled } from "./Link_Styled";

export const Navbar = () => {

  return (
    <div className="flex items-center justify-center h-20 mx-16 rounded-b-3xl text-lg text-white capitalize space-x-11 bg-black">
      <LinkStyled text="Home" href="/" />
      <LinkStyled text="Design" href="/design" />
      <LinkStyled text="Look for talent" href="/look-for-talent" />
    </div>
  )
}
