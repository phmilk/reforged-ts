import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import { useVersions } from "@docusaurus/plugin-content-docs/client";
import type { ComponentProps, ReactNode } from "react";
import { docsVersionLabel } from "@site/src/docsVersionUrl";

/**
 * A link of the compatibility matrix. A row's docs link names the docs
 * version of its release, which the site keeps for the last three minors of
 * each major only: a version the site keeps is linked where the site serves
 * it, one it no longer keeps is its label as text. Any other link is left as
 * it is.
 */
export default function MatrixLink(props: ComponentProps<"a">): ReactNode {
  const { siteConfig } = useDocusaurusContext();
  const versions = useVersions(undefined);
  const label =
    props.href === undefined
      ? undefined
      : docsVersionLabel(props.href, siteConfig);
  if (label === undefined) return <Link {...props} />;
  const version = versions.find((each) => each.name === label);
  if (version === undefined) return props.children;
  return <Link to={version.path}>{props.children}</Link>;
}
