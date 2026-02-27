/**
 * Template registry types
 */

export type NesaliaTemplateMeta = {
  id: string;
  displayName: string;
  description: string;
  tags?: string[];
  features?: TemplateFeature[];
};

export type TemplateFeature = {
  id: string;
  prompt: string;
  default?: boolean;
};

export type TemplatePackageJson = {
  name: string;
  version: string;
  nesalia?: NesaliaTemplateMeta;
};

export type DiscoveredTemplate = {
  name: string;
  version: string;
  description: string;
  id: string;
  displayName: string;
  tags: string[];
};

export type FetchedTemplate = {
  directory: string;
  tempDirectory: string;
  manifest: TemplatePackageJson;
};
