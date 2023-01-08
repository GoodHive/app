import { LinkStyled } from "./link-styled";

export const NavBar = () => {

  return (
    <div className="container bg-black rounded-b-3xl max-w-7xl mx-auto px-6 py-5 md:px-0">
      <div className="flex items-center justify-between text-lg text-white capitalize">
        <img className="ml-10" src="/img/goodhive_logo.png" alt="Goodhive" />
        <LinkStyled text="Home" href="/" />
        <LinkStyled text="Design" href="/design" />
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
