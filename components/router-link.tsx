import { Link as ReactRouterLink, type LinkProps } from "react-router-dom";

type RouterLinkProps = Omit<LinkProps, "to"> & { href: string };

export function Link({ href, ...props }: RouterLinkProps) {
  return <ReactRouterLink to={href} {...props} />;
}
