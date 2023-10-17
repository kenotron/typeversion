export interface IFace {
  a: string;
  b: number;
}

type MyString = string;

export interface IFaceNoChange {
  a: string;
  b: MyString;
}
