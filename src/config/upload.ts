import multer from 'multer';
import crypto from 'crypto';
import { resolve } from 'path';

const path = resolve(__dirname, '..', '..', 'tmp');

export default {
  directory: path,
  storage: multer.diskStorage({
    destination: path,
    filename(request, file, callback) {
      const fileHash = crypto.randomBytes(10).toString('hex');
      const fileName = `${fileHash}-${file.originalname}`;

      return callback(null, fileName);
    },
  }),
};
