import "archiver";
declare module "archiver" {
  export class ZipArchive extends Archiver {
    constructor(options?: ArchiverOptions);
  }
}
