import { ActiveLink } from './ActiveLink'

export const Navbar = () => {
  return (
    <div className="flex items-center justify-center h-20 mx-16 rounded-b-3xl text-lg text-white capitalize space-x-11 bg-black">
      <ActiveLink text="Home" href="/" />
      <ActiveLink text="Design" href="/design" />
      <ActiveLink text="Look for talent" href="/look-for-talent" />
    </div>
  )
}
