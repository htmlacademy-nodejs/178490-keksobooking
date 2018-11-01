const express = require(`express`);
const imagesStore = require(`./offers/images-store`);
const offersStore = require(`./offers/store`);
const offersRouter = require(`./offers/route`)(offersStore, imagesStore);
const path = require(`path`);

const {DEFAULT_SERVER_HOST,
  DEFAULT_SERVER_PORT,
  ERROR_ADDRESS_IN_USE,
  StatusCodes} = require(`./server-settings`);

const {ERROR_CODE} = require(`../utils/util-constants`);

const {SERVER_PORT = DEFAULT_SERVER_PORT,
  SERVER_HOST = DEFAULT_SERVER_HOST} = process.env;

const STATIC_DIR = path.join(process.cwd(), `static`);

const NOT_FOUND_HANDLER = (req, res) => {
  res.status(StatusCodes.NOT_FOUND).send(`Page was not found`);
};

module.exports = class LocalServer {
  constructor(port = SERVER_PORT) {
    this._port = port;
    this._host = SERVER_HOST;
    this._app = express();
  }

  start() {
    this._setup();

    this._app.listen(this._port, this._host, () => {
      console.log(`Local server is running at http://${this._host}:${this._port}`);
    }).on(`error`, this._serverInUseErrorHandler);
  }

  _setup() {
    this._app.disable(`x-powered-by`);
    this._app.use(express.static(STATIC_DIR));
    this._app.use(`/api/offers`, offersRouter);
    this._app.use(NOT_FOUND_HANDLER);
  }

  _serverInUseErrorHandler(err) {
    if (err.code === ERROR_ADDRESS_IN_USE) {
      console.log(`Port ${err.port} is in use`);
      process.exit(ERROR_CODE);
    }
  }
};
