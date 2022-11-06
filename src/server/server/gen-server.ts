import * as express from 'express';
import * as bodyParser from 'body-parser';

import { Resource, PropertiesBase, def } from '@haydenon/gen';

interface ServerOptions {
  port?: number;
}

const defaultOptions: Required<ServerOptions> = {
  port: 8000,
};

interface StateItem {
  _type: string;
}

interface StateRequest {
  state: StateItem[];
}

const isValidItem = (item: any): item is StateItem =>
  typeof item === 'object' && typeof item._type === 'string';

const isValidBody = (body: any): body is StateRequest =>
  typeof body === 'object' &&
  body.state instanceof Array &&
  body.state.every(isValidItem);

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
    app.post('/v1/state', async (req, res) => {
      const body = req.body;
      if (!isValidBody(body)) {
        res.status(400);
        res.send({
          message: 'Invalid state body.',
        });
        return;
      }

      const types = body.state.map((s) => s._type);
      res.send({
        validResources: types.filter((t) =>
          this.resources.some((r) => r.constructor.name === t)
        ),
        invalidResources: types.filter((t) =>
          this.resources.every((r) => r.constructor.name !== t)
        ),
      });
    });
  }
}
