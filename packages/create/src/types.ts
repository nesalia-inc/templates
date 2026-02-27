/**
 * Template registry types and interfaces
 */

export interface NesaliaTemplateMeta {
  id: string;
  displayName: string;
  description: string;
  tags?: string[];
  features?: TemplateFeature[];
}

export interface TemplateFeature {
  id: string;
  prompt: string;
  default?: boolean;
}

export interface TemplatePackageJson {
  name: string;
  version: string;
  nesalia?: NesaliaTemplateMeta;
}

export interface DiscoveredTemplate {
  name: string;
  version: string;
  description: string;
  id: string;
  displayName: string;
  tags: string[];
}

export interface FetchedTemplate {
  directory: string;
  tempDirectory: string;
  manifest: TemplatePackageJson;
}
