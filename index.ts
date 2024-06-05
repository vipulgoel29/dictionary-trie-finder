// Core imports
import { readFileSync, writeFileSync } from "fs";

/**
 * Options for initializing the dictionary.
 */
export interface Options<Type> {
  data?: Type[] | { [key: string]: Type };
  keys?: string[];
  sep?: string;
  inpFile?: string;
  dataHandler?: (key: string) => Type;
  keyHandler?: (key: string) => string;
}

/**
 * Output type for the dictionary traversal.
 */
export interface OutType<Type> {
  key: string;
  data?: Type;
}

/**
 * Trie (prefix tree) data structure class.
 */
class Dictionary<Type> {
  private pointers: { [key: string]: Dictionary<Type> } = {};
  private isWord: boolean = false;
  constructor(private readonly word: string, private readonly data?: Type) { }

  /**
   * Finds if a word exists in the dictionary.
   * @param word The word to find.
   * @param index Current index in the word being processed (Internal usage).
   * @returns True if the word exists, otherwise false.
   */
  find(word: string, index: number = 0): boolean {
    const char = word[index];

    if (this.pointers[char]) {
      if (index === word.length - 1) return this.pointers[char].isWord;
      return this.pointers[char].find(word, index + 1);
    }

    return false;
  }

  /**
   * Inserts a word into the dictionary with optional associated data.
   * @param word The word to insert.
   * @param data Optional data associated with the word.
   * @param index Current index in the word being processed.(Internal usage)
   */
  insert(word: string, data?: Type, index: number = 0): void {
    const char = word[index];

    if (!this.pointers[char])
      this.pointers[char] = new Dictionary(word[index], index === word.length - 1 ? data : undefined);

    if (index === word.length - 1) this.pointers[char].isWord = true;
    else this.pointers[char].insert(word, data, index + 1);
  }

  /**
   * Traverses the dictionary and collects words and their associated data.
   * @param word Current word being built during traversal.
   * @param out Array to collect the output.
   */
  #traverse(word: string, out: OutType<Type>[]): void {
    word = word + this.word;
    if (this.isWord) {
      const content: OutType<Type> = { key: word };
      if (this.data) content.data = this.data;
      out.push(content);
    }

    Object.values(this.pointers).forEach((pointer) => {
      if (pointer) pointer.#traverse(word, out);
    });
  }

  /**
   * Outputs the contents of the dictionary.
   * @param options Optional settings for output.
   * @returns Array of output type objects.
   */
  out(options?: { outFile?: string; sep?: string }): OutType<Type>[] {
    const data: OutType<Type>[] = [];
    this.#traverse("", data);

    if (options && options.outFile) {
      const content = data.map((entry) => entry.key).join(options.sep ? options.sep : "\n");
      writeFileSync(options.outFile, content, "utf-8");
    }
    return data;
  }
}

/**
 * Initializes the dictionary with the provided options.
 * @param options Options for initializing the dictionary.
 * @returns Initialized dictionary.
 */
export default function init<Type = any>(options: Options<Type>): Dictionary<Type> {
  const { data, keys, sep, inpFile, dataHandler, keyHandler } = options;

  const dict = new Dictionary<Type>("");

  let _keys = keys;

  if (inpFile) {
    _keys = readFileSync(inpFile, "utf-8").split(sep ? sep : "\n");
  }

  _keys?.forEach((key, index) =>
    dict.insert(
      keyHandler ? keyHandler(key) : key,
      data ? (data instanceof Array ? data[index] : data[key]) : dataHandler ? dataHandler(key) : undefined
    )
  );

  return dict;
}

