import { LinkStyled } from "./link-styled";

export const NavBar = () => {

  return (
    <div className="container bg-black rounded-b-3xl max-w-7xl mx-auto px-6 py-5 md:px-0">
    <div className="flex items-center justify-between text-lg text-white capitalize">
      <LinkStyled text="Home" href="/" />
      <LinkStyled text="Design" href="/design" />
      <LinkStyled text="Looking for talent" href="/looking-for-talent" />
    </div>
    </div>
  )
}
