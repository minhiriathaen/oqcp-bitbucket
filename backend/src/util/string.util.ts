// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { toString } from 'string-encode';

const OCTA_BYTES_REGEXP = /(\\\d{3}\\\d{3})/gm;
const OCTA_BYTE_SEPARATOR = ' ';

export default class StringUtil {
  static decodeFilePath(filePath: string): string {
    const octaBytesAsStrings = filePath.match(OCTA_BYTES_REGEXP);

    if (!octaBytesAsStrings) {
      return filePath;
    }
    const codeTable = octaBytesAsStrings.map((octBytes) => {
      const normalizedBytes = octBytes.replace(/\\/g, OCTA_BYTE_SEPARATOR).trim();

      return {
        key: octBytes,
        value: this.decode(normalizedBytes),
      };
    });

    console.log('Code tableName to decode special changes', codeTable);

    let result = filePath;
    codeTable.forEach((codeValue) => {
      result = result.replace(codeValue.key, codeValue.value);
    });

    return result;
  }

  static decode(octBytes: string): string {
    const octToDecBytes = this.octToDecBytes(octBytes.split(OCTA_BYTE_SEPARATOR));

    const buffer = Uint8Array.from(octToDecBytes);

    buffer.toString = toString;

    return buffer.toString();
  }

  private static octToDecBytes(octBytes: string[]): number[] {
    return octBytes.map((oct) => parseInt(oct, 8));
  }
}
