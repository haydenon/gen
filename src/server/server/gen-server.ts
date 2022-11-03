import * as express from 'express';
import * as bodyParser from 'body-parser';

import { Resource, PropertiesBase, def } from '@haydenon/gen';

interface ServerOptions {
  port?: number;
}

const defaultOptions: Required<ServerOptions> = {
  port: 8000,
};

export class GenServer {
  private options: Required<ServerOptions>;

  constructor(
    private resources: Resource<PropertiesBase, PropertiesBase>[],
    serverOptions?: ServerOptions
  ) {
    this.options = { ...defaultOptions, ...(serverOptions || {}) };
  }

  run() {
    const app = express();
    app.use(bodyParser.json());

    const port = this.options.port;
    app.listen(port, () => {
      console.log('Running on port ' + port);
    });
  }
}
