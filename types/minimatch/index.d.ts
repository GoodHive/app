declare module 'minimatch' {
  interface IOptions {
    debug?: boolean;
    nobrace?: boolean;
    noglobstar?: boolean;
    dot?: boolean;
    noext?: boolean;
    nocase?: boolean;
    nonull?: boolean;
    matchBase?: boolean;
    nocomment?: boolean;
    nonegate?: boolean;
    flipNegate?: boolean;
  }

  interface IMinimatch {
    options: IOptions;
    set: RegExp[][];
    pattern: string;
    regexp: RegExp | null;
    negate: boolean;
    comment: boolean;
    empty: boolean;
    makeRe(): RegExp;
    match(target: string): boolean;
  }

  function minimatch(target: string, pattern: string, options?: IOptions): boolean;

  namespace minimatch {
    function filter(pattern: string, options?: IOptions): (target: string) => boolean;
    function makeRe(pattern: string, options?: IOptions): RegExp;
    function braceExpand(pattern: string, options?: IOptions): string[];

    class Minimatch implements IMinimatch {
      constructor(pattern: string, options?: IOptions);
      options: IOptions;
      set: RegExp[][];
      pattern: string;
      regexp: RegExp | null;
      negate: boolean;
      comment: boolean;
      empty: boolean;
      makeRe(): RegExp;
      match(target: string): boolean;
    }
  }

  export = minimatch;
}
