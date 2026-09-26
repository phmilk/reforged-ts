import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import type { SiteFields } from "@site/config";

/**
 * The Build the Typings support, as the configuration read it from their
 * `reforged.patch` field at build time.
 */
export default function SupportedPatch(): string {
  const { customFields } = useDocusaurusContext().siteConfig;
  return (customFields as SiteFields).supportedPatch;
}
