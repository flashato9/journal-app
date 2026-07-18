// The kinds of media a memory can hold. Images and videos follow StorageMode
// (gallery in prod, local in dev); audio is always app-private. Kept in a
// zero-dependency file so it can be imported from services/database/tables/
// (bundled standalone by drizzle-kit's esbuild loader, which chokes on
// react-native's Flow syntax if any RN-dependent module is pulled in).
export type MediaType = "image" | "video" | "audio";
