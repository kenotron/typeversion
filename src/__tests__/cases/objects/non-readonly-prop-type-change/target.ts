export interface IFace {
  a: string;
  b: number;
}

type MyString = string;

export interface IFaceNoChange {
  a: string;
  b: MyString;
}

export interface IWidened {
  a: string | number;
  b: string;
}

export class IClassWidened {
  a: string | string[];
  b: string;
}
