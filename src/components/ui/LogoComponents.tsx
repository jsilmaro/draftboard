import React from "react";
import Logo from "../Logo";

interface LogoIconProps {
  className?: string;
}

export const LogoIcon = ({ className }: LogoIconProps) => {
  return (
    <a
      href="#"
      className={`relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-black dark:text-white ${className}`}
    >
      <div className="h-5 w-6 shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-black dark:bg-white" />
    </a>
  );
};

export const SidebarLogo = () => {
  return (
    <div className="flex items-center py-1 text-sm font-normal">
      <Logo size="md" className="drop-shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
    </div>
  );
};
