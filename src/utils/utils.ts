/**
 * Helper method to concatenate multiple Uint8Arrays into a single Uint8Array
 * @param arrays An array of Uint8Arrays or ArrayLike<number> to concatenate
 * @returns A single Uint8Array containing all the input arrays
 */
// export function concatArrays(...arrays: (Uint8Array | ArrayLike<number>)[]): Uint8Array {
//   const totalLength = arrays.reduce((acc, arr) => acc + arr.length, 0);
//   const result = new Uint8Array(totalLength);
//   let offset = 0;
//   for (const arr of arrays) {
//     result.set(arr, offset);
//     offset += arr.length;
//   }
//   return result;
  
// }

export function concatArrays(...arrs: ArrayLike<number>[]) {
    const size = arrs.reduce((sum, arr) => sum + arr.length, 0);
    const c = new Uint8Array(size);
  
    let offset = 0;
    for (let i = 0; i < arrs.length; i++) {
      c.set(arrs[i], offset);
      offset += arrs[i].length;
    }
  
    return c;
  }