import React from "react";

export default function MyProfileLayout({
  children,
}: React.PropsWithChildren) {
  return (
    <main className="bg-grey-300">
      

      {children}
    </main>
  );
}
