import { LinkStyled } from "./link-styled";

export const NavBar = () => {

  return (
    <div className="sticky top-0 w-full flex flex-wrap items-center justify-between bg-black px-5 py-2">
      <div className="container-fluid w-full flex flex-wrap items-center justify-between px-5 py-2 text-lg text-white capitalize">
        <img className="ml-2" src="/img/goodhive_light_logo.png" alt="Goodhive" />
        <LinkStyled text="Home" href="/" />
        <LinkStyled text="Design System" href="/design" />
        <LinkStyled text="Looking for talent" href="/looking-for-talent" />
        <span className="flex items-center space-x-2 mr-10">
          <img src="/img/user_icon.png" alt="user" />
          <p>John Doe</p>
          <img src="/img/notification_icon.png" alt="notification" />
          <img src="/img/metamask_icon.png" alt="metamask" />
        </span>
      </div>
    </div>
  )
}
