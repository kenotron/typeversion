export interface INonUserConstructible {
  new (): INonUserConstructible;
  a?: string;
}

export interface IWidened {
  new (): IWidened;
  readonly a: string | string[];
}

export interface INonUserConstructibleOptional {
  new (): INonUserConstructibleOptional;
  readonly a?: string;
}
