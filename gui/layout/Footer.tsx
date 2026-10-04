import * as React from "react";
import { LiaDiscord, LiaGithub, LiaNpm, LiaReddit, LiaTelegramPlane } from "react-icons/lia";
import { FaSquareXTwitter } from "react-icons/fa6";
import { version as explorerVersion } from "../../package.json";

/*
  The wallet's footer (neurai-webwallet src/Footer.tsx): the release and the
  project's social links, with the same icons. The version comes from
  package.json, so a release bump can never leave it behind.
*/
const SOCIAL_LINKS: { href: string; label: string; title: string; Icon: React.ComponentType }[] = [
  {
    href: "https://twitter.com/neuraiproject",
    label: "Neurai on X (Twitter)",
    title: "X (Twitter)",
    Icon: FaSquareXTwitter,
  },
  {
    href: "https://t.me/neuraiproject",
    label: "Neurai on Telegram",
    title: "Telegram",
    Icon: LiaTelegramPlane,
  },
  {
    href: "https://discord.gg/neurai-project-1062678996208336896",
    label: "Neurai on Discord",
    title: "Discord",
    Icon: LiaDiscord,
  },
  {
    href: "https://www.reddit.com/r/neuraiproject",
    label: "Neurai on Reddit",
    title: "Reddit",
    Icon: LiaReddit,
  },
  {
    href: "https://github.com/neuraiproject",
    label: "Neurai on GitHub",
    title: "GitHub",
    Icon: LiaGithub,
  },
  {
    href: "https://www.npmjs.com/~neuraiproject",
    label: "Neurai on npm",
    title: "npm",
    Icon: LiaNpm,
  },
];

export function Footer() {
  return (
    <footer className="mt-auto border-t border-base-300/60 pt-8">
      <div className="mx-auto max-w-7xl text-center">
        <p className="m-0 text-sm font-semibold tracking-widest text-muted uppercase">
          Rebel Explorer {explorerVersion} &copy; {new Date().getFullYear()}
        </p>

        <nav className="mt-5 flex flex-wrap items-center justify-center gap-5 sm:flex-nowrap" aria-label="Neurai social links">
          {SOCIAL_LINKS.map(({ href, label, title, Icon }) => (
            <a
              key={href}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              title={title}
              className="inline-flex h-10 w-10 items-center justify-center text-muted no-underline transition-all hover:-translate-y-0.5 hover:text-link hover:no-underline [&_svg]:h-8 [&_svg]:w-8"
            >
              <Icon />
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
